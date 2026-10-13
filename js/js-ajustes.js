/* --- js-ajustes.js --- */
/* 1) Índice: la ventana Estadísticas (.rforumstats) va ARRIBA de Database.
   2) Perfil: la ficha se reparte en tres pestañas; el inventario y medallero
      (.rinv) se quedan fuera de las pestañas, siempre visibles.
   Ambos esperan a que el resto de scripts hayan pintado su parte. */
(function () {
  function esperar(fn, intentos) {
    if (fn()) return;
    if (intentos > 0) setTimeout(function () { esperar(fn, intentos - 1); }, 100);
  }

  /* 1. Solo la ventana "Estadísticas" (mensajes, miembros, récord) va ARRIBA de Database;
        último usuario, conectados y afiliados se quedan donde estaban. */
  function ordenarIndice() {
    var st = document.querySelector("#rstatscontainer .rforumstats");
    if (!st) return !document.getElementById("rstatscontainer");   /* no es el índice */
    var rdb = document.querySelector(".rdb");
    if (!rdb) return false;                     /* Database aún no existe */
    st.classList.add("rforumstats--arriba");
    rdb.parentNode.insertBefore(st, rdb);
    return true;
  }

  /* 2. Pestañas del perfil. Cambia aquí los nombres. */
  var PESTANAS = ["Perfil", "Pestaña 2", "Pestaña 3"];
  function pestanasPerfil() {
    var root = document.getElementById("rperfil");
    if (!root) return true;                     /* no es un perfil */
    var cols = root.querySelector(".rperfil__cols");
    var top = root.querySelector(".rperfil__top");
    if (!cols || !top) return false;
    if (root.querySelector(".rperfil__tabs")) return true;

    var foot = root.querySelector(".rperfil__foot");
    var extra = document.getElementById("rperfil-extra");

    var bar = document.createElement("div");
    bar.className = "rperfil__tabs";
    bar.setAttribute("role", "tablist");

    var paneles = PESTANAS.map(function (n, i) {
      var p = document.createElement("div");
      p.className = "rperfil__panel" + (i ? " rperfil__panel--vacio" : "");
      p.setAttribute("role", "tabpanel");
      p.hidden = !!i;
      return p;
    });
    /* pestaña 1 = lo que ya había (columnas + pie + "Otros datos") */
    cols.parentNode.insertBefore(paneles[0], cols);
    paneles[0].appendChild(cols);
    if (foot) paneles[0].appendChild(foot);
    if (extra) paneles[0].appendChild(extra);
    var ref = paneles[0];
    for (var k = 1; k < paneles.length; k++) { ref.after(paneles[k]); ref = paneles[k]; }

    var botones = PESTANAS.map(function (n, i) {
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "tab");
      b.textContent = n;
      b.className = "rperfil__tab" + (i ? "" : " is-on");
      b.setAttribute("aria-selected", i ? "false" : "true");
      b.addEventListener("click", function () {
        botones.forEach(function (x, j) {
          x.classList.toggle("is-on", j === i);
          x.setAttribute("aria-selected", j === i ? "true" : "false");
          paneles[j].hidden = j !== i;
        });
      });
      bar.appendChild(b);
      return b;
    });
    top.after(bar);
    return true;
  }

  function arrancar() { esperar(ordenarIndice, 80); esperar(pestanasPerfil, 80); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();

