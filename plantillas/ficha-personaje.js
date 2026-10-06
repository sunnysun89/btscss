/* ==========================================================================
   ficha-personaje.js — la ficha del autor en cada post

   Para pegar en overall_footer_end, debajo de modulos.js.

   ------------------------------------------------------------------------
   QUE HACE

   En la captura modelo cada post lleva a la izquierda una ficha de personaje:
   retrato alto, nombre, insignia de grupo, linea de POWER, pildoras de
   cifras (MSGS / WON) y barras de medidor (FAME, TRUST). phpBB no pinta nada
   de eso en el post: el .postprofile solo trae avatar, rango, Mensajes y
   Fecha. Los campos de personaje (Nivel de poder, Poderes, Rango, Estatus)
   viven en la pagina de perfil (/uN), en dls con id field_id-N.

   Este modulo, por cada post de la pagina del tema:
     1. saca el id del autor del enlace del nombre (/uN),
     2. pide su perfil UNA vez (cache en sessionStorage, como avatar-ultimo.js),
     3. lee los campos por su ETIQUETA (no por id, que cambia por foro),
     4. inyecta en la ficha la linea de poder y, si el campo trae numero,
        una barra de medidor.

   ------------------------------------------------------------------------
   POR QUE POR ETIQUETA Y NO POR ID

   Los ids field_id-N los asigna el panel al crear cada campo, asi que en otro
   foro serian otros numeros. Las etiquetas ("Nivel de poder", "Poderes") son
   las que puso el admin y no cambian. Se comparan en minusculas y por
   contenido, para que "Nivel de Poder" y "nivel de poder" valgan igual.

   ------------------------------------------------------------------------
   POR QUE NO HAY ERRORES VISIBLES

   Como en modulos.js: si el perfil no contesta, no tiene campos rellenos o el
   foro no los muestra, no se pinta nada y la ficha queda como la pinta el CSS.
   Solo se avisa por consola. Un post con un hueco de "error" se nota mas que
   un post sin linea de poder.

   Se piden como maximo 10 perfiles por pagina, y con 700 ms entre el pintado
   y la primera peticion para no competir con el dibujado.
   ========================================================================== */

(function () {
  "use strict";

  var MARCA = "bts-ficha";
  var MAX = 10;

  if (window[MARCA]) return;
  window[MARCA] = true;

  function decir(t) { try { console.warn("[" + MARCA + "] " + t); } catch (e) { } }

  /* Solo en paginas de tema: es donde hay .post con .postprofile. */
  var posts = document.querySelectorAll(".post .postprofile");
  if (!posts.length) return;

  /* --- que campos se buscan, y como se pintan --------------------------
     Cada entrada: que textos de etiqueta valen, y con que titulo sale. */
  var CAMPOS = [
    { claves: ["nivel de poder", "nivel"], titulo: "Nivel", medidor: true },
    { claves: ["poderes", "poder"], titulo: "Power", medidor: false },
    { claves: ["rango"], titulo: "Rango", medidor: false },
    { claves: ["estatus", "status"], titulo: "Estatus", medidor: false }
  ];

  /* Niveles Alpha->Zeta a porcentaje, para la barra. Si el campo trae un
     numero ya ("Fama: 40"), se usa el numero. */
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
    var puestos = 0;
    var dl = ficha.querySelector("dl");
    if (!dl) return 0;

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
        /* Poderes va destacado como la linea POWER de la referencia. */
        dd.className = def.titulo === "Power" ? "bts-power" : "";
        dd.textContent = (def.titulo === "Power" ? "\u2605 " : "") + def.titulo + ": " + valor;
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
    /* si el mismo autor tiene varios posts, se pintan todos con lo mismo */
    for (var q = p + 1; q < posts.length; q++) {
      if (idDe(posts[q]) === id) cola[cola.length - 1].fichas.push(posts[q]);
    }
    if (cola.length >= MAX) break;
  }
  if (!cola.length) return;

  setTimeout(function () {
    cola.forEach(function (item) {
      var CLAVE = "bts-ficha:/u" + item.id;
      var servidas = item.fichas;

      function aplicar(campos) {
        var n = 0;
        for (var i = 0; i < servidas.length; i++) n += pintar(servidas[i], campos);
        return n;
      }

      try {
        var guardado = sessionStorage.getItem(CLAVE);
        if (guardado) {
          var n2 = aplicar(JSON.parse(guardado));
          decir("u" + item.id + ": " + n2 + " campos desde cache");
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
          var n3 = aplicar(campos);
          decir("u" + item.id + ": " + n3 + " campos pintados");
        })
        .catch(function (err) {
          decir("u" + item.id + ": " + err.message);
        });
    });
  }, 700);
})();
