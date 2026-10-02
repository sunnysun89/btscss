/*
   El avatar del ultimo usuario registrado.

   POR QUE HACE FALTA ESTO: phpBB no pasa ningun avatar al indice. En la variable
   NEWEST_USER solo va el nombre con un enlace ("<a href="/u1">Faceless</a>"), sin
   foto. Para ponerla hay que mirar el perfil de ese usuario, y la unica variable
   que hay es el enlace.

   COMO FUNCIONA:
     1. Lee el enlace del ultimo usuario del bloque de estadisticas.
     2. Si el avatar ya esta en sessionStorage, lo pinta y se acaba.
     3. Si no, pide ese perfil, busca el <img> del avatar, y guarda la URL.
     4. Lo pinta como fondo del hueco.

   Con sesionStorage se pide una sola vez por pestana. Si el perfil no tiene
   avatar, o si el foro no responde, el hueco se queda vacio y se ve solo el
   nombre: que es lo que habia antes.

   No es nada critico: si este modulo no se carga, el bloque de estadisticas
   sigue funcionando igual. Por eso se carga al final y con un pequeno retraso,
   para no retrasar el dibujado del indice.

   Este modulo NO va en GitHub Pages. Va pegado en overall_footer_end, en el
   panel, o en un modulo JS del foro. Ver DEPLOY.md.
*/

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

  /* lo que ya estaba en cache */
  try {
    var guardado = sessionStorage.getItem(CLAVE);
    if (guardado) { pintar(guardado); return; }
  } catch (e) { /* sin storage: se pide siempre */ }

  /* un poco de margen, para no competir con el pintado del indice */
  setTimeout(function () {
    fetch(perfil, { credentials: "include" })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var d = new DOMParser().parseFromString(html, "text/html");

        /* el avatar de phpBB esta dentro de dl.postprofile o de .avatar, con una
           clase que lo dice; se busca por las tres vias */
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
      .catch(function () { /* sin avatar: se queda solo el nombre */ });
  }, 700);

  function pintar(src) {
    ranura.style.backgroundImage = "url('" + src + "')";
    ranura.setAttribute("data-bts-avatar-puesto", "1");
    ranura.setAttribute("title", "Avatar");
  }
})();