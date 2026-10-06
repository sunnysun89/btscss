/* ==========================================================================
   avatar-ultimo.js (reinicio) — avatar del miembro más nuevo. En
   overall_footer_end, después de modulos.js.

   phpBB no pasa ningún avatar al índice: en {NEWEST_USER} solo va el nombre
   con su enlace. Este módulo lee ese enlace del hueco [data-bts-avatar],
   pide el perfil una vez, saca el avatar y lo guarda en sessionStorage para
   no volver a pedirlo en cada visita.

   Sin avatar (o sin perfil, o sin red): el hueco se queda con el círculo
   vacío y el nombre, que es lo que había. Sin errores visibles.
   ========================================================================== */

(function () {
  "use strict";

  var hueco = document.querySelector("[data-bts-avatar]");
  if (!hueco) return;

  var ranura = hueco.querySelector("[data-bts-avatar-slot]");
  if (!ranura) return;

  var enlace = hueco.querySelector("a");
  if (!enlace) return;
  var perfil = enlace.getAttribute("href") || "";
  if (perfil.charAt(0) !== "/") return;

  var CLAVE = "bts-avatar:" + perfil;

  function pintar(src) {
    ranura.style.backgroundImage = "url('" + src + "')";
    ranura.setAttribute("data-bts-avatar-puesto", "1");
    ranura.setAttribute("title", "Avatar");
  }

  try {
    var guardado = sessionStorage.getItem(CLAVE);
    if (guardado) { pintar(guardado); return; }
  } catch (e) { /* sin storage: se pide siempre */ }

  setTimeout(function () {
    fetch(perfil, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("perfil: " + r.status);
        return r.text();
      })
      .then(function (html) {
        var d = new DOMParser().parseFromString(html, "text/html");
        var foto = d.querySelector(".postprofile dt img")
                || d.querySelector(".avatar img")
                || d.querySelector("dl.postprofile img");
        if (!foto) return;
        var src = foto.getAttribute("src") || "";
        if (!src || src.indexOf("empty.gif") >= 0) return;
        if (src.charAt(0) === "/") src = location.origin + src;
        try { sessionStorage.setItem(CLAVE, src); } catch (e2) {}
        pintar(src);
      })
      .catch(function () { /* sin avatar: solo el nombre */ });
  }, 700);
})();
