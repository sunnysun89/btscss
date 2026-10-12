/* --- js-limpieza.js --- */
/* Quita el texto por defecto de Foroactivo: "Tu última visita fue…", "Fecha y hora actual…"
   y la tira de enlaces (mensajes desde la última visita, tus mensajes, sin respuesta,
   marcar foros como leídos). Espera al DOM porque el script va en <head>. */
(function () {
  function limpiar() {
    var main = document.getElementById("main-content") || document.body;
    var hide = function (el) { if (el && el.style) el.style.display = "none"; };

    /* 1. Párrafos de texto suelto */
    main.querySelectorAll("p").forEach(function (p) {
      if (p.closest("#rperfil")) return;
      var t = p.textContent.replace(/\s+/g, " ").trim();
      if (/^Tu .ltima visita fue/i.test(t) || /^Fecha y hora actual/i.test(t)) hide(p);
    });

    /* 2. Tira de enlaces: se oculta el contenedor más alto que solo contenga esos enlaces */
    var SEL = 'a[href*="search_id=newposts"], a[href*="search_id=egosearch"], a[href*="search_id=unanswered"], a[href*="mark=forums"]';
    var enlaces = main.querySelectorAll(SEL);
    if (!enlaces.length) return;
    var esDelSet = function (a) { return a.matches(SEL); };
    var soloEnlaces = function (el) {
      var as = el.querySelectorAll("a");
      for (var i = 0; i < as.length; i++) if (!esDelSet(as[i])) return false;
      var resto = el.cloneNode(true);
      resto.querySelectorAll("a").forEach(function (a) { a.remove(); });
      return !resto.textContent.replace(/[\s|·•\-–—:,]+/g, "").length && !resto.querySelector("img, form, input");
    };
    enlaces.forEach(function (a) {
      if (a.closest("#rperfil, .rdb, #cp-main")) return;
      var el = a;
      while (el.parentElement && el.parentElement !== main && soloEnlaces(el.parentElement)) el = el.parentElement;
      hide(el);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", limpiar);
  else limpiar();
})();

