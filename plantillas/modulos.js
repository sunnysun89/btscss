/* ==========================================================================
   modulos.js (reinicio) — tira de miembros + personal. En overall_footer_end.

   phpBB no da ni miembros ni staff como variables del índice: se piden las
   páginas (memberlist.php, /g1-administradores) y se leen con DOMParser, que
   analiza sin ejecutar nada. Sin errores visibles: si falla, no se pinta nada
   y solo se avisa por consola. El personal solo se pide si [data-bts-staff]
   está en la página.
   ========================================================================== */

(function () {
  "use strict";

  var MARCA = "bts-modulos";
  var MAX = 12;

  if (window[MARCA]) return;
  window[MARCA] = true;

  function decir(t) { try { console.warn("[" + MARCA + "] " + t); } catch (e) { } }

  function dondeVa() {
    var noticia = document.querySelector(".bts-noticia");
    if (noticia && noticia.parentNode) return noticia.parentNode;
    var cats = document.querySelectorAll(".forabg");
    if (cats.length) {
      var ultimo = cats[cats.length - 1];
      if (ultimo.parentNode) return ultimo.parentNode;
    }
    return document.getElementById("page-body") || document.body;
  }

  /* /uN es lo único fiable de una fila (el nombre cambia de markup). */
  function leerMiembros(html, max) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var cuerpo = doc.querySelector("#page-body") || doc.body;
    var vistos = {};
    var salida = [];
    var enlaces = cuerpo.querySelectorAll('a[href*="/u"]');
    for (var i = 0; i < enlaces.length && salida.length < max; i++) {
      var a = enlaces[i];
      var nombre = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!nombre || nombre.length > 24) continue;
      var clave = nombre.toLowerCase();
      if (vistos[clave]) continue;
      vistos[clave] = true;
      var m = (a.getAttribute("href") || "").match(/\/u(\d+)/);
      if (!m) continue;
      var avatar = null;
      var fila = a.closest ? a.closest("tr") : null;
      if (fila) {
        var imgs = fila.querySelectorAll("img");
        for (var j = 0; j < imgs.length; j++) {
          var src = imgs[j].getAttribute("src") || "";
          if (!/2img\.net|\/i\/empty\.gif|sprite-icon/.test(src)) { avatar = src; break; }
        }
      }
      var color = "";
      var insignia = fila ? fila.querySelector(".usr_grp_clr") : null;
      if (insignia) {
        var mc = (insignia.getAttribute("style") || "").match(/color\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (mc) color = mc[1];
      }
      salida.push({ nombre: nombre, id: m[1], avatar: avatar, color: color });
    }
    return salida;
  }

  function pintarMiembros(miembros) {
    var caja = document.createElement("section");
    caja.className = "bts-miembros";
    caja.id = "bts-miembros";
    var cabeza = document.createElement("h3");
    cabeza.className = "bts-miembros-titulo";
    cabeza.textContent = "Los miembros del foro";
    caja.appendChild(cabeza);
    var tira = document.createElement("ul");
    tira.className = "bts-miembros-tira";
    for (var i = 0; i < miembros.length; i++) {
      var m = miembros[i];
      var li = document.createElement("li");
      li.className = "bts-miembro";
      var enlace = document.createElement("a");
      enlace.className = "bts-miembro-enlace";
      enlace.href = "/u" + m.id;
      if (m.color) enlace.style.setProperty("--miembro-color", m.color);
      var cara;
      if (m.avatar) {
        cara = document.createElement("img");
        cara.className = "bts-miembro-cara";
        cara.src = m.avatar;
        cara.alt = m.nombre;
        cara.loading = "lazy";
        cara.addEventListener("error", function () { this.style.display = "none"; });
      } else {
        cara = document.createElement("span");
        cara.className = "bts-miembro-inicial";
        cara.textContent = (m.nombre || "?").trim().charAt(0).toUpperCase();
      }
      enlace.appendChild(cara);
      var nombre = document.createElement("span");
      nombre.className = "bts-miembro-nombre";
      nombre.textContent = m.nombre;
      enlace.appendChild(nombre);
      li.appendChild(enlace);
      tira.appendChild(li);
    }
    caja.appendChild(tira);
    var sitio = dondeVa();
    if (sitio.parentNode) sitio.parentNode.insertBefore(caja, sitio.nextSibling);
    else sitio.appendChild(caja);
  }

  function pintarStaff(miembros, hueco) {
    var ul = document.createElement("ul");
    ul.className = "bts-staff-lista";
    for (var i = 0; i < miembros.length; i++) {
      var m = miembros[i];
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "/u" + m.id;
      a.textContent = m.nombre;
      if (m.color) a.style.setProperty("--miembro-color", m.color);
      li.appendChild(a);
      ul.appendChild(li);
    }
    hueco.textContent = "";
    hueco.appendChild(ul);
    return miembros.length;
  }

  fetch("/memberlist.php", { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("memberlist.php: " + r.status);
      return r.text();
    })
    .then(function (html) { return leerMiembros(html, MAX); })
    .then(function (miembros) {
      if (!miembros.length) { decir("sin miembros. No se pinta nada."); return; }
      pintarMiembros(miembros);
      decir("pintados " + miembros.length + " miembros");
    })
    .catch(function (err) { decir("miembros: " + err.message); });

  var staff = document.querySelector("[data-bts-staff]");
  if (staff) {
    setTimeout(function () {
      fetch("/g1-administradores", { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("g1: " + r.status);
          return r.text();
        })
        .then(function (html) { return leerMiembros(html, 8); })
        .then(function (miembros) {
          if (!miembros.length) { decir("g1 sin miembros."); return; }
          decir("pintados " + pintarStaff(miembros, staff) + " del personal");
        })
        .catch(function (err) { decir("personal: " + err.message); });
    }, 900);
  }
})();
