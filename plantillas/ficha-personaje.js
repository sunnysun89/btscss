/* ==========================================================================
   ficha-personaje.js (reinicio) — ficha del autor en cada post. En
   overall_footer_end, después de avatar-ultimo.js.

   El .postprofile solo trae avatar, rango, Mensajes y Fecha. Los campos de
   personaje (Nivel de poder, Poderes, Rango, Estatus) viven en la página de
   perfil (/uN) como dl#field_id-N. Este módulo, por cada post: saca el id del
   autor, pide su perfil UNA vez (caché en sessionStorage), lee los campos por
   su ETIQUETA (los ids los asigna el panel y cambian) e inyecta la línea de
   poder y las barras de medidor en la ficha.

   Niveles Alpha->Zeta a porcentaje; si el campo trae número, se usa el número.
   Sin campos rellenos: no se pinta nada, solo aviso por consola. Máximo 10
   perfiles por página, primera petición a los 700 ms para no competir con el
   dibujado.
   ========================================================================== */

(function () {
  "use strict";

  var MARCA = "bts-ficha";
  var MAX = 10;

  if (window[MARCA]) return;
  window[MARCA] = true;

  function decir(t) { try { console.warn("[" + MARCA + "] " + t); } catch (e) { } }

  var posts = document.querySelectorAll(".post .postprofile");
  if (!posts.length) return;

  var CAMPOS = [
    { claves: ["nivel de poder", "nivel"], titulo: "Nivel", medidor: true },
    { claves: ["poderes", "poder"], titulo: "Power", medidor: false },
    { claves: ["rango"], titulo: "Rango", medidor: false },
    { claves: ["estatus", "status"], titulo: "Estatus", medidor: false }
  ];

  var NIVELES = { alpha: 90, beta: 70, gamma: 50, delta: 35, epsilon: 20, zeta: 8 };

  function leerCampos(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var zona = doc.querySelector("#profile-tab-field-profil") || doc;
    var dls = zona.querySelectorAll('dl[id^="field_id-"]');
    var salida = [];
    for (var i = 0; i < dls.length; i++) {
      var dt = dls[i].querySelector("dt");
      var dd = dls[i].querySelector("dd");
      if (!dt || !dd) continue;
      var etiqueta = (dt.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      var valor = (dd.textContent || "").replace(/\s+/g, " ").trim();
      if (!valor || valor === "-" || valor.length > 80) continue;
      salida.push({ etiqueta: etiqueta, valor: valor });
    }
    return salida;
  }

  function encaja(etiqueta, claves) {
    for (var i = 0; i < claves.length; i++) {
      if (etiqueta.indexOf(claves[i]) >= 0) return true;
    }
    return false;
  }

  function nivelDe(valor) {
    var num = valor.match(/(\d{1,3})\s*(?:\/\s*100|%)?/);
    if (num) {
      var n = parseInt(num[1], 10);
      if (n >= 0 && n <= 100) return n;
    }
    var bajo = valor.toLowerCase();
    for (var k in NIVELES) {
      if (bajo.indexOf(k) >= 0) return NIVELES[k];
    }
    return -1;
  }

  function pintar(ficha, campos) {
    var dl = ficha.querySelector("dl");
    if (!dl) return 0;
    var puestos = 0;
    for (var c = 0; c < CAMPOS.length; c++) {
      var def = CAMPOS[c];
      var valor = "";
      for (var i = 0; i < campos.length; i++) {
        if (encaja(campos[i].etiqueta, def.claves)) { valor = campos[i].valor; break; }
      }
      if (!valor) continue;
      var dd = document.createElement("dd");
      if (def.medidor) {
        var nv = nivelDe(valor);
        if (nv < 0) {
          dd.className = "bts-power";
          dd.textContent = def.titulo + ": " + valor;
        } else {
          dd.className = "bts-medidor";
          var etiqueta = document.createElement("span");
          etiqueta.textContent = def.titulo + ": " + valor;
          var barra = document.createElement("i");
          barra.style.setProperty("--bts-nivel", nv + "%");
          dd.appendChild(etiqueta);
          dd.appendChild(barra);
        }
      } else {
        if (def.titulo === "Power") {
          dd.className = "bts-power";
          dd.textContent = "★ " + def.titulo + ": " + valor;
        } else {
          dd.textContent = def.titulo + ": " + valor;
        }
      }
      dl.appendChild(dd);
      puestos++;
    }
    return puestos;
  }

  function idDe(ficha) {
    var a = ficha.querySelector('dt a[href*="/u"]');
    if (!a) return "";
    var m = (a.getAttribute("href") || "").match(/\/u(\d+)/);
    return m ? m[1] : "";
  }

  var vistos = {};
  var cola = [];
  for (var p = 0; p < posts.length; p++) {
    var id = idDe(posts[p]);
    if (!id || vistos[id]) continue;
    vistos[id] = true;
    cola.push({ id: id, fichas: [posts[p]] });
    for (var q = p + 1; q < posts.length; q++) {
      if (idDe(posts[q]) === id) cola[cola.length - 1].fichas.push(posts[q]);
    }
    if (cola.length >= MAX) break;
  }
  if (!cola.length) return;

  setTimeout(function () {
    cola.forEach(function (item) {
      var CLAVE = "bts-ficha:/u" + item.id;

      function aplicar(campos) {
        var n = 0;
        for (var i = 0; i < item.fichas.length; i++) n += pintar(item.fichas[i], campos);
        return n;
      }

      try {
        var guardado = sessionStorage.getItem(CLAVE);
        if (guardado) {
          decir("u" + item.id + ": " + aplicar(JSON.parse(guardado)) + " campos desde caché");
          return;
        }
      } catch (e) { /* sin storage: se pide siempre */ }

      fetch("/u" + item.id, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("perfil u" + item.id + ": " + r.status);
          return r.text();
        })
        .then(leerCampos)
        .then(function (campos) {
          try { sessionStorage.setItem(CLAVE, JSON.stringify(campos)); } catch (e2) {}
          decir("u" + item.id + ": " + aplicar(campos) + " campos pintados");
        })
        .catch(function (err) { decir("u" + item.id + ": " + err.message); });
    });
  }, 700);
})();
