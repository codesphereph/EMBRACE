/* EMBRACE Portal — local storage (IndexedDB, AES-GCM encrypted with the user's PIN) + server API + sync */
(function (G) {
  'use strict';

  /* ---------------------------------------------------------- IndexedDB key/value */
  var DB_NAME = 'grow-db', STORE = 'kv';
  var memFallback = {};
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try {
        var r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function idbGet(k) {
    return db().then(function (d) {
      if (!d) return memFallback[k];
      return new Promise(function (res) {
        var tx = d.transaction(STORE, 'readonly').objectStore(STORE).get(k);
        tx.onsuccess = function () { res(tx.result); };
        tx.onerror = function () { res(undefined); };
      });
    });
  }
  function idbSet(k, v) {
    return db().then(function (d) {
      if (!d) { memFallback[k] = v; return; }
      return new Promise(function (res, rej) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(v, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function idbDel(k) {
    return db().then(function (d) {
      if (!d) { delete memFallback[k]; return; }
      return new Promise(function (res) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { res(); };
      });
    });
  }
  function idbClear() {
    return db().then(function (d) {
      memFallback = {};
      if (!d) return;
      return new Promise(function (res) {
        var tx = d.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { res(); };
      });
    });
  }

  /* ---------------------------------------------------------- crypto */
  var subtle = (G.crypto && G.crypto.subtle) || null;
  var KEY = null; // CryptoKey in memory only
  var enc = new TextEncoder(), dec = new TextDecoder();
  function b64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
  function deriveKey(pin, salt) {
    return subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encrypt(obj) {
    var text = JSON.stringify(obj);
    if (!KEY) return Promise.resolve({ plain: text });
    var iv = G.crypto.getRandomValues(new Uint8Array(12));
    return subtle.encrypt({ name: 'AES-GCM', iv: iv }, KEY, enc.encode(text)).then(function (ct) { return { iv: b64(iv), ct: b64(ct) }; });
  }
  function decrypt(rec) {
    if (!rec) return Promise.resolve(null);
    if (rec.plain != null) return Promise.resolve(JSON.parse(rec.plain));
    if (!KEY) return Promise.reject(new Error('locked'));
    return subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, KEY, unb64(rec.ct)).then(function (pt) { return JSON.parse(dec.decode(pt)); });
  }

  var Store = {
    cryptoAvailable: !!subtle,
    /** returns {hasPin, hasData} */
    status: function () {
      return Promise.all([idbGet('lock'), idbGet('profile')]).then(function (r) {
        return { hasPin: !!r[0], hasData: !!r[1], cryptoAvailable: !!subtle };
      });
    },
    createPin: function (pin) {
      if (!subtle) { return idbSet('lock', { none: true }); }
      var salt = G.crypto.getRandomValues(new Uint8Array(16));
      return deriveKey(pin, salt).then(function (k) {
        KEY = k;
        return encrypt({ check: 'grow' });
      }).then(function (check) { return idbSet('lock', { salt: b64(salt), check: check }); });
    },
    unlock: function (pin) {
      return idbGet('lock').then(function (lock) {
        if (!lock) throw new Error('No PIN set');
        if (lock.none) return true;
        return deriveKey(pin, unb64(lock.salt)).then(function (k) {
          KEY = k;
          return decrypt(lock.check).then(function (c) {
            if (!c || c.check !== 'grow') throw new Error('bad');
            return true;
          }).catch(function () { KEY = null; throw new Error('Wrong PIN'); });
        });
      });
    },
    changePin: function (newPin) {
      // re-encrypt everything with a new key
      var self = this;
      return Promise.all([self.getProfile(), self.listFileIds(), self.getSecure('session')]).then(function (r) {
        var profile = r[0], ids = r[1], session = r[2];
        return Promise.all(ids.map(function (id) { return self.getFile(id).then(function (f) { return [id, f]; }); })).then(function (files) {
          return self.createPin(newPin).then(function () {
            return Promise.all([profile ? self.saveProfile(profile) : null, self.setSecure('session', session)]);
          }).then(function () {
            return Promise.all(files.map(function (p) { return p[1] ? self.putFile(p[0], p[1]) : null; }));
          });
        });
      });
    },
    isUnlocked: function () { return !!KEY || !subtle; },
    lock: function () { KEY = null; },
    getProfile: function () { return idbGet('profile').then(decrypt); },
    saveProfile: function (p) { return encrypt(p).then(function (rec) { return idbSet('profile', rec); }); },
    getSecure: function (k) { return idbGet('sec:' + k).then(function (r) { return r ? decrypt(r) : null; }); },
    setSecure: function (k, v) { return v == null ? idbDel('sec:' + k) : encrypt(v).then(function (rec) { return idbSet('sec:' + k, rec); }); },
    getMeta: function (k) { return idbGet('meta:' + k); },
    setMeta: function (k, v) { return idbSet('meta:' + k, v); },
    putFile: function (id, data) {
      return encrypt(data).then(function (rec) { return idbSet('file:' + id, rec); }).then(function () {
        return idbGet('fileIndex').then(function (ix) { ix = ix || []; if (ix.indexOf(id) < 0) ix.push(id); return idbSet('fileIndex', ix); });
      });
    },
    getFile: function (id) { return idbGet('file:' + id).then(function (r) { return r ? decrypt(r) : null; }); },
    delFile: function (id) {
      return idbDel('file:' + id).then(function () {
        return idbGet('fileIndex').then(function (ix) { ix = (ix || []).filter(function (x) { return x !== id; }); return idbSet('fileIndex', ix); });
      });
    },
    listFileIds: function () { return idbGet('fileIndex').then(function (ix) { return ix || []; }); },
    wipe: function () { KEY = null; return idbClear(); }
  };

  /* ---------------------------------------------------------- server API (Apps Script JSON, same pattern as SMILE) */
  const API_URL = () => ((G.GROW_CONFIG && G.GROW_CONFIG.API_URL) || '').trim();
  function done(r) { return r.json().then(function (j) { if (!j.ok) throw Object.assign(new Error(j.error || 'Error'), { data: j }); return j; }); }
  var API = {
    isGas: function () { return false; },
    configured: function () { return !!API_URL(); },
    /* GET ?action=…  (public reads: ping, programs) */
    get: function (params) {
      if (!API.configured()) return Promise.reject(new Error('Online server is not configured (config.js).'));
      return fetch(API_URL() + '?' + new URLSearchParams(params), { redirect: 'follow' }).then(done);
    },
    /* POST {action, …}  — text/plain avoids a CORS preflight on Apps Script */
    call: function (body) {
      if (!API.configured()) return Promise.reject(new Error('Online server is not configured yet (config.js).'));
      if (!navigator.onLine) return Promise.reject(new Error('You are offline.'));
      return fetch(API_URL(), { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(done);
    }
  };

  G.GrowStore = Store;
  G.GrowAPI = API;
})(window);
