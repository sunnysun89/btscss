/* ==========================================================================
   modulos.js — lo que phpBB no da y hay que ir a buscarlo

   Para pegar en overall_footer_end, debajo de avatar-ultimo.js si lo hay.

   ------------------------------------------------------------------------
   QUE HACE, Y POR QUE HACE FALTA

   La tabla de noticias del indice la monta la plantilla, con variables de
   phpBB. Pero hay bloques que los tres foros de referencia traen y que en
   phpBB no existen como variable: la tira de retratos con los miembros, o las
   fichas de personaje. No hay ninguna `{NEWEST_MEMBERS}` ni nada parecido en
   el indice de phpBB.

   La unica forma de conseguirlos sin tocar el panel es ir a por ellos: se pide
   memberlist.php, que es la misma pagina que el boton "Miembros" del menu, se
   lee con DOMParser y se pinta aqui.

   ------------------------------------------------------------------------
   POR QUE memberlist.php Y NO viewonline.php

   Los dos sirven y los dos se han probado a mano. Se usa memberlist porque da
   la lista de miembros, que es lo que se quiere en una tira de retratos, y no
   solo quien esta conectado ahora mismo. viewonline.php se queda para cuando
   se quiera el "quien esta en linea" con su ultima hora.

   ------------------------------------------------------------------------
   POR QUE DOMParser Y NO innerHTML

   Meter el HTML con innerHTML en un div cualquiera hace que se ejecute lo que
   venga dentro —scripts y todo— y ademas las rutas relativas se rompen. Con
   DOMParser el documento se analiza sin ejecutarse nada, y solo se copian al
   final los datos que interesan, que son texto y un atributo src.

   ------------------------------------------------------------------------
   POR QUE NO HAY ERRORES VISIBLES

   Si memberlist.php no contesta, o viene vacio, o el foro no lo tiene
   abierto, el modulo no pinta nada y se queda callado. No se enseña un
   "error" en el indice de un foro que funciona: eso se nota mucho mas que un
   hueco. Solo se avisa por consola, que es donde se mira cuando algo no
   sale.
   ========================================================================== */

(function () {
  "use strict";

  var MARCA = "bts-modulos";
  var MAX = 12;          /* cuantos retratos a la vez */

  /* --- no repetirlo, y no depender del orden de los scripts ---------- */
  if (window[MARCA]) return;
  window[MARCA] = true;
  function decir(t) { try { console.warn("[" + MARCA + "] " + t); } catch (e) { } }

  /* --- donde va la tira --------------------------------------------
     Justo debajo de la tabla de noticias. Si no esta, debajo de la ultima
     categoria, que es el segundo sitio donde encaja. Si tampoco, al final del
     cuerpo y ya esta. */
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

  /* --- sacar los miembros de la pagina de memberlist ----------------- */

  function leer(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var cuerpo = doc.querySelector("#page-body") || doc.body;
    var vistos = {};
    var salida = [];

    /* phpBB pone el perfil en /uNN. Es lo unico de la fila que identifica a
       una persona de forma fiable, y no depende de como este pintado el
       texto: el nombre puede ir en un <a>, en un <span> o con una insignia de
       grupo metida dentro. */
    var enlaces = cuerpo.querySelectorAll('a[href*="/u"]');

    for (var i = 0; i < enlaces.length && salida.length < MAX; i++) {
      var a = enlaces[i];
      var nombre = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!nombre || nombre.length > 24) continue;

      var clave = nombre.toLowerCase();
      if (vistos[clave]) continue;
      vistos[clave] = true;

      /* El identificador va en el href, que es /u1 o /u1-mod. */
      var m = a.getAttribute("href").match(/\/u(\d+)/);
      if (!m) continue;

      /* El avatar: se mira en la fila entera de la tabla, no solo dentro del
         enlace, porque segun como este phpBB lo pone al lado y no dentro. */
      var fila = a.closest ? a.closest("tr") : null;
      var avatar = null;
      if (fila) {
        var imgs = fila.querySelectorAll("img");
        for (var j = 0; j < imgs.length; j++) {
          var src = imgs[j].getAttribute("src") || "";
          /* De fuera los iconos de la propia pagina, que son de 2img.net y no
             son avatares. */
          if (!/2img\.net|\/i\/empty\.gif|sprite-icon/.test(src)) { avatar = src; break; }
        }
      }

      /* El color del grupo, si phpBB lo ha puesto en linea. */
      var color = "";
      var insignia = fila ? fila.querySelector(".usr_grp_clr") : null;
      if (insignia) {
        var st = insignia.getAttribute("style") || "";
        var mc = st.match(/color\s*:\s*(#[0-9a-fA-F]{3,8})/);
        if (mc) color = mc[1];
      }

      salida.push({ nombre: nombre, id: m[1], avatar: avatar, color: color });
    }
    return salida;
  }

  /* --- pintar -------------------------------------------------------- */

  function inicial(nombre) {
    return (nombre || "?").trim().charAt(0).toUpperCase();
  }

  function pintar(miembros) {
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

      /* El retrato. Si phpBB no trae avatar, sale una ficha con la inicial:
         un hueco vacío se lee como que ha fallado algo, y una inicial se lee
         como una ficha. */
      var cara;
      if (m.avatar) {
        cara = document.createElement("img");
        cara.className = "bts-miembro-cara";
        cara.src = m.avatar;
        cara.alt = m.nombre;
        cara.loading = "lazy";
        /* Si el avatar falla, la inicial debajo. */
        cara.addEventListener("error", function () {
          this.style.display = "none";
        });
      } else {
        cara = document.createElement("span");
        cara.className = "bts-miembro-inicial";
        cara.textContent = inicial(m.nombre);
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

    return caja;
  }

  /* --- fuera -------------------------------------------------------- */

  fetch("/memberlist.php", { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("memberlist.php ha contestado " + r.status);
      return r.text();
    })
    .then(leer)
    .then(function (miembros) {
      if (!miembros || !miembros.length) {
        decir("memberlist.php no ha devuelto miembros. No se pinta nada.");
        return;
      }
      pintar(miembros);
      decir("pintados " + miembros.length + " miembros");
    })
    .catch(function (err) {
      decir("no se ha podido montar la tira de miembros: " + err.message);
    });
})();

/* ==========================================================================
   El personal (staff)

   Segunda mitad del mismo fichero: la "ventana de personal" que pide el modelo
   de NBorn y que phpBB no da como variable en el indice.

   Lee /g1-administradores —el grupo AUTHORITY, que es administracion, PNJ y
   narradores— y pinta sus miembros dentro de [data-bts-staff], que vive en
   plantillas/bloque-database.html. Misma tecnica que la tira de miembros:
   DOMParser, sin errores visibles, aviso solo por consola.

   Si el bloque no esta en la pagina (porque la plantilla aun no se ha pegado),
   no se pide nada: para que pedir el grupo si no hay donde pintarlo.
   ========================================================================== */

(function () {
  "use strict";

  var MARCA = "bts-staff";
  var MAX = 8;

  if (window[MARCA]) return;
  window[MARCA] = true;

  function decir(t) { try { console.warn("[" + MARCA + "] " + t); } catch (e) { } }

  var hueco = document.querySelector("[data-bts-staff]");
  if (!hueco) return;

  function leer(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var cuerpo = doc.querySelector("#page-body") || doc.body;
    var vistos = {};
    var salida = [];
    var enlaces = cuerpo.querySelectorAll('a[href*="/u"]');
    for (var i = 0; i < enlaces.length && salida.length < MAX; i++) {
      var a = enlaces[i];
      var nombre = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (!nombre || nombre.length > 24) continue;
      var clave = nombre.toLowerCase();
      if (vistos[clave]) continue;
      vistos[clave] = true;
      var m = (a.getAttribute("href") || "").match(/\/u(\d+)/);
      if (!m) continue;
      var color = "";
      var fila = a.closest ? a.closest("tr") : null;
      var insignia = fila ? fila.querySelector(".usr_grp_clr") : null;
      if (!insignia) insignia = a.querySelector(".usr_grp_clr") || a;
      var st = (insignia && insignia.getAttribute) ? (insignia.getAttribute("style") || "") : "";
      var mc = st.match(/color\s*:\s*(#[0-9a-fA-F]{3,8})/);
      if (mc) color = mc[1];
      salida.push({ nombre: nombre, id: m[1], color: color });
    }
    return salida;
  }

  function pintar(miembros) {
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

  setTimeout(function () {
    fetch("/g1-administradores", { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("g1 ha contestado " + r.status);
        return r.text();
      })
      .then(leer)
      .then(function (miembros) {
        if (!miembros.length) { decir("g1 sin miembros. No se pinta nada."); return; }
        decir("pintados " + pintar(miembros) + " del personal");
      })
      .catch(function (err) { decir("personal: " + err.message); });
  }, 900);
})();
