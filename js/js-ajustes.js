/* --- js-ajustes.js --- */
/* 1) Índice: reordena el footer (estadísticas, conectados, bienvenida con avatar, grupos con iconos).
   2) Perfil: la ficha se reparte en tres pestañas; el inventario y medallero
      (.rinv) se quedan fuera de las pestañas, siempre visibles.
   Ambos esperan a que el resto de scripts hayan pintado su parte. */
(function () {
  function esperar(fn, intentos) {
    if (fn()) return;
    if (intentos > 0) setTimeout(function () { esperar(fn, intentos - 1); }, 100);
  }

  /* 1. Índice: orden del footer según el esquema
        Estadísticas · [conectados + 48 h | bienvenida] · grupos · créditos · afiliados
     Todo lo de #rstatscontainer se coloca con CSS (grid); aquí solo se mete Database
     dentro del contenedor y se sube "Estadísticas" encima. */
  var ICONOS = {
    /* Cada grupo: SVG propio (currentColor) o, si empieza por http, la URL de una
       imagen (p. ej. un icono de Flaticon subido a imgur). La clave es el nombre
       del grupo en minúsculas y sin acentos. */
    divine:    '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    infamous:  '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.2 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    notable:   '<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4v1a3 3 0 0 0 4 2.8M16 6h4v1a3 3 0 0 1-4 2.8M12 13v4M10 17h4v3h-4zM8.5 20h7"/>',
    underdogs: '<path d="M6 17l6-6 6 6M6 11l6-6 6 6"/>',
    unknown:   '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 17h.01"/>',
    ordinary:  '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
    authority: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM9 12l2.2 2.2L15.5 10"/>',
    missing:   '<g stroke-dasharray="2.6 2.6"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></g>'
  };
  var norm = function (t) {
    return (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  };

  function iconosGrupos(rdb) {
    rdb.querySelectorAll(".rdb__g").forEach(function (g) {
      if (g.querySelector(".rdb__gico")) return;
      var nom = g.querySelector(".rdb__gname");
      var key = norm(nom ? nom.textContent : "");
      var ico = document.createElement("span");
      ico.className = "rdb__gico";
      var def = ICONOS[key];
      if (def && /^https?:/i.test(def)) ico.innerHTML = '<img alt="" src="' + def + '">';
      else ico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        (def || '<circle cx="12" cy="12" r="8"/>') + '</svg>';
      g.insertBefore(ico, g.firstChild);
      g.setAttribute("aria-label", nom ? nom.textContent : "");
    });
  }

  /* avatar del último usuario registrado: se lee de su perfil (misma web, sin permisos) */
  function avatarNuevo() {
    var nu = document.querySelector("#rstatscontainer .rnewestuser");
    if (!nu || nu.querySelector(".rnewest__avatar")) return;
    var a = nu.querySelector("a[href]");
    if (!a) return;
    var href = a.getAttribute("href"), clave = "bts-avatar:" + href;
    var poner = function (src) {
      if (!src || nu.querySelector(".rnewest__avatar")) return;
      var im = new Image();
      im.className = "rnewest__avatar"; im.alt = ""; im.src = src;
      nu.appendChild(im);
    };
    try { var guardado = sessionStorage.getItem(clave); if (guardado) { poner(guardado); return; } } catch (e) {}
    fetch(href, { credentials: "same-origin" }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var im = doc.querySelector("#profile-advanced-right .module img, #profile-advanced-right img, .rperfil__avatarimg img");
      var src = im && (im.getAttribute("src") || im.getAttribute("data-src"));
      if (src) { try { sessionStorage.setItem(clave, src); } catch (e) {} poner(src); }
    }).catch(function () {});
  }

  /* Ventana "Conectados en las últimas 48h": lee la lista de miembros ordenada por
     última visita y se queda con quienes entraron en las últimas 48 horas (incluye
     a los que están conectados ahora). Si la plantilla ya trae esa lista, usa esa. */
  var MESES = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11 };
  function fechaDe(txt) {
    var m = (txt || "").match(/(\d{1,2})\s+([A-Za-zñÑ]{3})\.?\s+(\d{4})\s*[-–,]?\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    var mes = MESES[norm(m[2]).slice(0, 3)];
    return mes === undefined ? null : new Date(+m[3], mes, +m[1], +m[4], +m[5]);
  }
  function ahoraDelForo() {
    var el = document.querySelector(".rcurrtime");
    return (el && fechaDe(el.textContent)) || new Date();
  }
  function leerMiembros(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var out = [], idx = -1;
      var filas = doc.querySelectorAll("tr");
      for (var i = 0; i < filas.length && idx < 0; i++) {
        var hs = filas[i].querySelectorAll("th, td");
        for (var c = 0; c < hs.length; c++) if (/visita|conect|activ/i.test(hs[c].textContent) && !hs[c].querySelector("a[href*='/u']")) { idx = c; break; }
      }
      if (idx < 0) return null;
      filas.forEach(function (tr) {
        var celdas = tr.children, a = tr.querySelector("a[href]");
        var link = Array.prototype.filter.call(tr.querySelectorAll("a[href]"), function (x) { return /\/u\d+/.test(x.getAttribute("href")); })[0] || a;
        if (!link || celdas.length <= idx) return;
        var f = fechaDe(celdas[idx].textContent);
        if (!f) return;
        var col = link.style.color || ((link.querySelector("[style*='color']") || {}).style || {}).color || "";
        out.push({ nombre: link.textContent.trim(), href: link.getAttribute("href"), fecha: f, color: col });
      });
      return out;
    });
  }
  function conectados48() {
    var cont = document.getElementById("rstatscontainer");
    if (!cont) return;
    var box = cont.querySelector(".ronlineuserslist");
    if (!box) {
      box = document.createElement("div"); box.className = "ronlineuserslist";
      var lg = cont.querySelector(".rlogged");
      if (lg) lg.after(box); else cont.appendChild(box);
    }
    if (box.querySelector(".r48__title")) return;
    var nativo = box.textContent.replace(/\s+/g, " ").trim();
    box.innerHTML = '<div class="r48__title">Conectados en las últimas 48h</div><div class="r48__list"></div>';
    var lista = box.querySelector(".r48__list");
    var pintar = function (usuarios) {
      lista.innerHTML = "";
      if (!usuarios || !usuarios.length) { lista.innerHTML = '<span class="r48__vacio">Nadie se ha conectado en las últimas 48 horas.</span>'; return; }
      usuarios.forEach(function (u) {
        var a = document.createElement("a");
        a.className = "r48__u"; a.href = u.href; a.textContent = u.nombre;
        if (u.color) a.style.color = u.color;
        lista.appendChild(a);
      });
    };
    var ahora = ahoraDelForo(), limite = ahora.getTime() - 48 * 3600 * 1000;
    var clave = "bts-48h", guardado = null;
    try { guardado = JSON.parse(sessionStorage.getItem(clave) || "null"); } catch (e) {}
    if (guardado && Date.now() - guardado.t < 300000) { pintar(guardado.u); return; }
    var urls = ["/memberlist?mode=lastvisit&order=DESC", "/memberlist?mode=lastvisit", "/memberlist"];
    var intentar = function (i) {
      if (i >= urls.length) {
        if (nativo) lista.textContent = nativo;
        else lista.innerHTML = '<span class="r48__vacio">No se pudo leer la última visita de los miembros.</span>';
        if (window.console) console.info("[BTS] 48h: la lista de miembros no trae columna de última visita.");
        return;
      }
      leerMiembros(urls[i]).then(function (m) {
        if (!m) { intentar(i + 1); return; }
        var activos = m.filter(function (u) { return u.fecha.getTime() >= limite; })
          .sort(function (a, b) { return b.fecha - a.fecha; });
        var vistos = {}, unicos = activos.filter(function (u) { if (vistos[u.nombre]) return false; vistos[u.nombre] = 1; return true; }).slice(0, 80);
        try { sessionStorage.setItem(clave, JSON.stringify({ t: Date.now(), u: unicos.map(function (u) { return { nombre: u.nombre, href: u.href, color: u.color }; }) })); } catch (e) {}
        pintar(unicos);
      }).catch(function () { intentar(i + 1); });
    };
    intentar(0);
  }

  function ordenarIndice() {
    var cont = document.getElementById("rstatscontainer");
    if (!cont) return true;                       /* no es el índice */
    var rdb = document.querySelector(".rdb");
    if (!rdb) return false;                       /* Database aún no existe */
    var st = document.querySelector(".rforumstats");
    if (st && st.parentNode === cont) {
      st.classList.add("rforumstats--arriba");
      cont.parentNode.insertBefore(st, cont);
    }
    if (rdb.parentNode !== cont) cont.appendChild(rdb);
    iconosGrupos(rdb);
    avatarNuevo();
    conectados48();
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

