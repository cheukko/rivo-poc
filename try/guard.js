/* RIVO /try/ demo-only wrapper. Deploy-side only; app code unchanged.
   1) Namespaced localStorage: /try/ never reads or writes the real "rivo.*" keys.
   2) WebAuthn disabled: navigator.credentials.get/create always reject.
   3) Real-wallet entries hidden and blocked; auto-enters the demo after the intro.
   Fails closed: app.js is loaded only if 1) and 2) are verified. */
(function () {
  "use strict";
  var NS = "rivo-try:";
  var real = window.localStorage;
  var mem = {};
  function k(x) { return NS + String(x); }
  function own() { var a = []; try { for (var i = 0; i < real.length; i++) { var n = real.key(i); if (n && n.indexOf(NS) === 0) a.push(n); } } catch (e) {} return a; }
  var shim = {
    getItem: function (x) { try { return real.getItem(k(x)); } catch (e) { return Object.prototype.hasOwnProperty.call(mem, x) ? mem[x] : null; } },
    setItem: function (x, v) { try { real.setItem(k(x), String(v)); } catch (e) { mem[x] = String(v); } },
    removeItem: function (x) { try { real.removeItem(k(x)); } catch (e) { delete mem[x]; } },
    clear: function () { own().forEach(function (n) { try { real.removeItem(n); } catch (e) {} }); mem = {}; },
    key: function (i) { var n = own()[i]; return n ? n.slice(NS.length) : null; },
    get length() { return own().length; }
  };
  var ok = true;
  try { Object.defineProperty(window, "localStorage", { configurable: true, get: function () { return shim; } }); } catch (e) { ok = false; }
  if (window.localStorage !== shim) ok = false;
  try { Object.defineProperty(window, "sessionStorage", { configurable: true, get: function () { return shim; } }); } catch (e) {}

  function deny() { return Promise.reject(new DOMException("Disabled on the demo-only link", "NotAllowedError")); }
  try {
    if (navigator.credentials) {
      Object.defineProperty(navigator.credentials, "get", { configurable: true, value: deny });
      Object.defineProperty(navigator.credentials, "create", { configurable: true, value: deny });
      if (navigator.credentials.get !== deny || navigator.credentials.create !== deny) ok = false;
    }
    if (window.PublicKeyCredential) Object.defineProperty(window, "PublicKeyCredential", { configurable: true, value: undefined });
  } catch (e) { ok = false; }

  if (!ok) {
    document.addEventListener("DOMContentLoaded", function () {
      document.getElementById("main").innerHTML = '<div style="padding:40px 24px;text-align:center">このブラウザではデモを開けません。<br><small>Demo unavailable in this browser.</small></div>';
    });
    return;
  }

  var BLOCK = { "real":1, "have-wallet":1, "sign-in":1, "sign-in-hanko":1, "unlock-go":1, "create-go":1, "agree-next":1,
    "backup-now":1, "backup-later":1, "pick-hanko":1, "pick-device":1, "pick-fido":1, "hanko-go":1, "end-demo":1, "end-demo-yes":1,
    "sign-out":1, "open-keys":1 };
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest && e.target.closest("[data-action]");
    if (t && BLOCK[t.dataset.action]) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  var st = document.createElement("style");
  st.textContent = '[data-action="real"],[data-action="have-wallet"],[data-action="sign-in"],[data-action="sign-in-hanko"],[data-action="end-demo"],[data-action="sign-out"],[data-action="open-keys"],.have{display:none!important}' +
    '.try-hide{display:none!important}';
  document.documentElement.appendChild(st);

  function fix() {
    // The post-demo "Create wallet" step becomes "Home" (logo-home returns to demo home in demo mode).
    document.querySelectorAll('[data-action="to-terms"]').forEach(function (b) {
      b.dataset.action = "logo-home";
      b.innerHTML = 'ホームへ<small style="display:block;font-size:12px;font-weight:500">Home</small>';
      var n = b.nextElementSibling; if (n) n.classList.add("try-hide");
    });
    // Auto-enter the demo once the intro is gone.
    var d = document.querySelector('[data-action="demo"]');
    if (d && !document.querySelector(".i-scene") && !document.body.classList.contains("intro-on")) d.click();
  }
  new MutationObserver(fix).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

  var s = document.createElement("script");
  s.type = "module"; s.src = "app.js";
  document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(s); fix(); });
})();
