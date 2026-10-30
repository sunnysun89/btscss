/* Perfil: solo la página de perfil (la que lleva #rperfil).
   Reparte los campos del perfil en la ficha según el NOMBRE del campo
   (sin mayúsculas ni tildes), monta los huecos de inventario y medallero con
   marcadores vacíos, y convierte el campo "Música" en un reproductor.

   Música: [u]TÍTULO[/u][b]Artista[/b][i]https://youtu.be/ID[/i]
   El audio sale de un iframe de YouTube diminuto que solo se crea al pulsar
   el botón; nada suena sin que el visitante lo pida. */
(function () {
  /* ---- Perfil nativo ------------------------------------------------------
     Si la plantilla profile_view_body NO está instalada (o no se aplica), se
     lee el perfil que pinta Foroactivo (pares "Etiqueta : valor") y se monta
     la ficha encima; lo nativo queda oculto, no borrado. */
  var MARCADO = "<div class=\"rperfil\" id=\"rperfil\"> <div class=\"rperfil__top\"> <span class=\"rperfil__clock\" aria-hidden=\"true\"></span> <span class=\"rperfil__last\">Última conexión: <b><span data-bind=\"ultima\"></span></b></span> <span class=\"rperfil__online\"><span data-bind=\"estatus\"></span></span> </div> <div class=\"rperfil__cols\"> <div class=\"rperfil__avatar\"> <div class=\"rperfil__avatarimg\"><span data-bind=\"avatar\"></span></div> <div class=\"rperfil__rank\"> <span class=\"rperfil__rankname\"><span data-bind=\"rangonativo\"></span></span> <span class=\"rperfil__rankimg\"></span> </div> </div> <div class=\"rperfil__main\"> <div class=\"rperfil__id\"> <div class=\"rperfil__idicon\" aria-hidden=\"true\"></div> <div class=\"rperfil__idtxt\"> <h1 class=\"rperfil__alias\" data-slot=\"alias\"><span data-bind=\"usuario\"></span></h1> </div> </div> <div class=\"rperfil__nicks\" data-slot=\"apodos\" data-label=\"Apodos\"></div> <div class=\"rperfil__tiles\"> <div class=\"rtile\" data-slot=\"edad\" data-label=\"Edad\"></div> <div class=\"rtile\" data-slot=\"orientacion\" data-label=\"Orientación\"></div> <div class=\"rtile\" data-slot=\"sentimental\" data-label=\"Estado sentimental\"></div> <div class=\"rtile\" data-slot=\"ocupacion\" data-label=\"Ocupación\"></div> <div class=\"rtile\" data-slot=\"faccion\" data-label=\"Facción\"></div> <div class=\"rtile\" data-slot=\"alianza\" data-label=\"Alianza\"></div> <div class=\"rtile rtile--wide\" data-slot=\"ubicacion\" data-label=\"Ubicación\"></div> </div> <div class=\"rperfil__stats\"> <div class=\"rstat rstat--power\" data-slot=\"nivel\" data-label=\"Nivel de poder\"></div> <div class=\"rstat\" data-slot=\"rango\" data-label=\"Rango\"></div> <div class=\"rstat\" data-slot=\"creditos\" data-label=\"Créditos\"></div> </div> <div class=\"rperfil__powers-wrap\"> <h3>Poderes</h3> <div class=\"rperfil__powers\" data-slot=\"poderes\"></div> </div> <blockquote class=\"rperfil__quote\" data-slot=\"frase\"></blockquote> </div> <div class=\"rperfil__side\"> <div class=\"rperfil__now\" data-slot=\"musica\"> <span class=\"rperfil__chip\">Reproduciendo</span> <span class=\"rperfil__song\"></span> <span class=\"rperfil__artist\"></span> <button type=\"button\" class=\"rperfil__play\" aria-label=\"Reproducir\" aria-pressed=\"false\"></button> </div> <div class=\"rperfil__banner\" data-slot=\"banner\"></div> <div class=\"rperfil__actions\"> <a href=\"#BUSCAR#\" title=\"Buscar sus mensajes\">Mensajes</a> <a href=\"#EDITAR#\" title=\"Editar perfil\">Editar</a> <button type=\"button\" class=\"rdate rdate--cake\" data-slot=\"nacimiento\" data-label=\"Fecha de nacimiento\" data-short=\"Nacimiento · \"><span class=\"rdate__ico\"></span><span class=\"rdate__tip\"></span></button> <button type=\"button\" class=\"rdate rdate--cal\" data-slot=\"inscripcion\" data-label=\"Fecha de inscripción\" data-short=\"Inscripción · \" data-fallback=\"#INSCRIPCION#\"><span class=\"rdate__ico\"></span><span class=\"rdate__tip\"></span></button> <span class=\"rperfil__contact\"><a href=\"#MP#\" title=\"Mensaje privado\">MP</a></span> </div> </div> </div> <div class=\"rperfil__foot\"> <span class=\"rperfil__stat\"><b><span data-bind=\"mensajes\"></span></b> mensajes escritos</span> </div> <div class=\"rinv\"> <div class=\"rinv__head\">Inventario y medallero</div> <div class=\"rinv__cols\"> <section class=\"rinv__box rinv__box--imp\"> <h3>Implantes</h3> <div class=\"rinv__implants\"> <div class=\"rimp\" data-slot=\"implante1\" data-label=\"Implante 01\"></div> <div class=\"rimp\" data-slot=\"implante2\" data-label=\"Implante 02\"></div> </div> </section> <section class=\"rinv__box\"> <h3>Inventario</h3> <div class=\"rinv__grid\" data-slot=\"inventario\" data-min=\"12\"></div> </section> <section class=\"rinv__box\"> <h3>Medallero</h3> <div class=\"rinv__grid\" data-slot=\"medallero\" data-min=\"12\"></div> </section> </div> </div> <div class=\"rperfil__extra\" id=\"rperfil-extra\"></div> <div id=\"rperfil-campos\" hidden></div> </div>";

  function nativo() {
    var main = document.getElementById("main-content") || document.getElementById("content") || document.body;
    var mu = location.pathname.match(/^\/u(\d+)/);
    if (!mu || !main || main.querySelector("#rperfil")) return null;

    /* Foroactivo guarda dos versiones de cada valor: .field_uneditable (el texto)
       y .field_editable (el formulario oculto de edición). Solo vale la primera. */
    var valor = function (el) { return el.querySelector(".field_uneditable") || el; };
    var pares = [];
    var tomar = function (lab, val, caja) {
      var l = (lab.textContent || "").replace(/\s*:\s*$/, "").replace(/\s+/g, " ").trim();
      if (!l || l.length > 60) return;
      pares.push({ raw: l, el: val, caja: caja });
    };
    main.querySelectorAll("dl").forEach(function (dl) {
      var dts = dl.querySelectorAll(":scope > dt");
      dts.forEach(function (dt) {
        var dd = dt.nextElementSibling;
        if (dd && dd.tagName === "DD") tomar(dt, dd, dl);
      });
    });
    if (pares.length < 2) {
      main.querySelectorAll("tr").forEach(function (tr) {
        var td = tr.children;
        if (td.length === 2) tomar(td[0], td[1], tr);
      });
    }
    var claves = ["edad", "alias", "medallero", "inventario", "poderes", "facción", "ocupación", "ubicación"];
    var vistos = 0;
    pares.forEach(function (p) { if (claves.indexOf(p.raw.toLowerCase()) > -1) vistos++; });
    if (vistos < 2) return null;

    /* contenedor nativo a ocultar: el hijo directo de main que contiene los pares */
    var primero = pares[0].caja, envoltorio = primero;
    while (envoltorio.parentNode && envoltorio.parentNode !== main) envoltorio = envoltorio.parentNode;
    if (envoltorio.parentNode !== main) return null;

    var id = mu[1];
    var titulo = (main.querySelector("h1") || document.querySelector("h1") || {}).textContent || "";
    var nombre = (titulo.split("::")[1] || "").replace(/\(.*\)/, "").trim();
    if (!nombre) {
      var m1 = main.textContent.match(/Todo sobre\s+([^\n\r]+?)\s{2,}/);
      nombre = m1 ? m1[1].trim() : "";
    }
    var enlinea = /\(\s*en l[ií]nea\s*\)/i.test(main.textContent);

    var cont = document.createElement("div");
    var html = MARCADO.replace("#BUSCAR#", "/search?search_author=" + encodeURIComponent(nombre) + "&show_results=posts")
      .replace("#EDITAR#", "/profile?mode=editprofile&u=" + id)
      .replace("#MP#", "/privmsg?mode=post&u=" + id)
      .replace("#INSCRIPCION#", "");
    cont.innerHTML = html;
    var root = cont.firstElementChild;

    var dato = function (re) {
      for (var i = 0; i < pares.length; i++) if (re.test(pares[i].raw.toLowerCase())) return valor(pares[i].el);
      return null;
    };
    var ligar = function (nom, fn) { root.querySelectorAll('[data-bind="' + nom + '"]').forEach(fn); };

    ligar("usuario", function (e) { e.textContent = nombre; });
    ligar("estatus", function (e) { e.textContent = enlinea ? "● En línea" : ""; });

    /* avatar: la primera imagen grande que no sea contenido de un campo */
    var av = main.querySelector("#profile-advanced-right .module img:not([src*='empty.gif'])");
    main.querySelectorAll("img").forEach(function (im) {
      if (av) return;
      for (var i = 0; i < pares.length; i++) if (pares[i].el.contains(im)) return;
      var w = im.width || im.offsetWidth || parseInt(im.getAttribute("width"), 10) || 0;
      if (w >= 80) av = im;
    });
    ligar("avatar", function (e) {
      if (!av) return;
      var im = new Image();
      im.alt = av.alt || "";
      im.src = av.getAttribute("data-src") || av.currentSrc || av.src;
      e.appendChild(im);
    });

    /* rango nativo: texto "Rango: X" de la zona del avatar (no el campo Rango) */
    var rn = "";
    if (av) {
      var z = av.parentNode;
      while (z.parentNode && z.parentNode !== main && !z.parentNode.contains(pares[0].caja)) z = z.parentNode;
      var tw = document.createTreeWalker(z, NodeFilter.SHOW_TEXT, null), nodo;
      while (!rn && (nodo = tw.nextNode())) {
        var m = (nodo.nodeValue || "").trim().match(/^Rango\s*:\s*(.+)$/i);
        if (m) rn = m[1].trim();
      }
    }
    ligar("rangonativo", function (e) { e.textContent = rn; });

    var ult = dato(/^(última|ultima) (visita|conexión|conexion)/);
    /* "Última conexión": el valor sale de "Tu última visita fue: ..." (el <p> de
       la parte alta de la página); si no existe, del campo "Última visita". */
    var visita = null;
    main.querySelectorAll("p").forEach(function (q) {
      if (!visita && /^\s*Tu .ltima visita/i.test(q.textContent)) visita = q;
    });
    var fecha = "";
    if (visita) fecha = visita.textContent.replace(/\s+/g, " ").replace(/^\s*Tu .ltima visita fue\s*:?\s*/i, "").trim();
    else if (ult) fecha = ult.textContent.trim();
    ligar("ultima", function (e) {
      if (fecha) e.textContent = fecha; else if (e.parentNode) e.parentNode.style.display = "none";
    });
    if (visita) visita.style.display = "none";

    /* los pares pasan al volcado genérico; Estatus y Mensajes ya se usaron */
    var vol = root.querySelector("#rperfil-campos");
    pares.forEach(function (p) {
      var k = p.raw.toLowerCase();
      if (/^(mensajes|estatus|última visita|ultima visita)$/.test(k)) return;
      var f = document.createElement("div"); f.className = "rpf";
      var l = document.createElement("span"); l.className = "rpf-l"; l.textContent = p.raw;
      var c = document.createElement("div"); c.className = "rpf-c"; c.innerHTML = valor(p.el).innerHTML;
      f.appendChild(l); f.appendChild(c); vol.appendChild(f);
    });

    /* enlaces de administración ("Administrar el usuario : Perfil") a los botones */
    var acciones = root.querySelector(".rperfil__actions");
    main.querySelectorAll("a[href]").forEach(function (a) {
      var tx = (a.parentNode && a.parentNode.textContent || "").trim();
      if (/^Administrar/i.test(tx) && !envoltorio.isSameNode(a) && acciones) {
        var b = a.cloneNode(true); b.textContent = "Admin"; b.title = tx; acciones.insertBefore(b, acciones.firstChild);
      }
    });

    envoltorio.parentNode.insertBefore(root, envoltorio);
    envoltorio.setAttribute("data-bts-oculto", "1");
    envoltorio.style.display = "none";
    var derecha = document.getElementById("profile-advanced-right");
    if (derecha) { derecha.setAttribute("data-bts-oculto", "1"); derecha.style.display = "none"; }
    return root;
  }

  function run() {
    var root = document.getElementById("rperfil") || nativo();
    if (!root || root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");

    var norm = function (s) {
      return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    };

    /* Qué nombres de campo van a cada hueco (ya normalizados). */
    var SINONIMOS = {
      apodos: ["apodos", "apodo", "nicknames", "nickname"],
      alias: ["alias", "alter ego", "alias superheroe", "superheroe", "alias de superheroe", "alias de superheroe alter ego", "alias superheroe alter ego"],
      edad: ["edad"],
      orientacion: ["orientacion", "orientacion sexual"],
      sentimental: ["estado sentimental", "sentimental", "estado civil"],
      ocupacion: ["ocupacion", "profesion", "trabajo"],
      faccion: ["faccion", "equipo", "grupo", "faccion equipo grupo", "faccion equipo o grupo"],
      alianza: ["alianza", "duo", "dupla", "pareja", "alianza duo dupla pareja", "alianza duo dupla o pareja"],
      ubicacion: ["ubicacion", "residencia", "lugar"],
      frase: ["frase", "cita", "lema"],
      banner: ["banner", "banner imagen", "banner pequeno", "cabecera"],
      musica: ["musica", "cancion", "tema musical"],
      nivel: ["nivel de poder", "nivel poder", "poder nivel", "nivel"],
      poderes: ["poder perfil", "poderes", "poder", "habilidades"],
      rango: ["rango"],
      creditos: ["creditos", "credito"],
      nacimiento: ["fecha de nacimiento", "fecha nacimiento", "nacimiento", "cumpleanos"],
      inscripcion: ["fecha de inscripcion", "fecha inscripcion", "inscripcion", "fecha de registro"],
      implante1: ["implante 1", "implante 01", "implante i", "implante uno"],
      implante2: ["implante 2", "implante 02", "implante ii", "implante dos"],
      inventario: ["inventario"],
      medallero: ["medallero", "medallas"]
    };

    /* 1. Leer los campos volcados por la plantilla */
    var campos = [];
    root.querySelectorAll("#rperfil-campos .rpf").forEach(function (f) {
      var l = f.querySelector(".rpf-l"), c = f.querySelector(".rpf-c");
      if (!l || !c) return;
      campos.push({ raw: l.textContent.replace(/\s*:\s*$/, "").trim(), key: norm(l.textContent), el: c, used: false });
    });

    /* Respaldo por parte del nombre (tolera erratas: "inscriptión", "nacimento"...) */
    var PARCIAL = { banner: /^banner/, nacimiento: /nacim|cumple/, inscripcion: /inscri|registro/, nivel: /^nivel/, creditos: /credit/ };
    function buscar(slot) {
      var syn = SINONIMOS[slot] || [slot], i;
      for (i = 0; i < campos.length; i++) {
        if (campos[i].used) continue;
        if (syn.indexOf(campos[i].key) > -1) { campos[i].used = true; return campos[i]; }
      }
      if (PARCIAL[slot]) {
        for (i = 0; i < campos.length; i++) {
          if (!campos[i].used && PARCIAL[slot].test(campos[i].key)) { campos[i].used = true; return campos[i]; }
        }
      }
      return null;
    }
    var vacio = function (el) {
      return !el || (!el.querySelector("img") && !el.textContent.replace(/[\s -]+/g, "").length);
    };

    /* 2. Huecos de texto: apodos, alias, tiles y frase */
    root.querySelectorAll("[data-slot]").forEach(function (hueco) {
      var slot = hueco.getAttribute("data-slot");
      if (/^(musica|banner|implante1|implante2|inventario|medallero|poderes|nacimiento|inscripcion)$/.test(slot)) return;
      var c = buscar(slot);
      var tiene = c && !vacio(c.el);
      if (slot === "alias") { if (tiene) hueco.innerHTML = c.el.innerHTML; return; }
      if (slot === "apodos") {
        if (!tiene) { hueco.classList.add("is-empty"); return; }
        var partes = c.el.textContent.split(/[,;\/|·•\n]+/).map(function (s) { return s.trim(); }).filter(Boolean);
        hueco.innerHTML = "";
        partes.forEach(function (p) { var s = document.createElement("span"); s.textContent = p; hueco.appendChild(s); });
        return;
      }
      if (slot === "frase") {
        if (tiene) hueco.innerHTML = c.el.innerHTML; else hueco.classList.add("is-empty");
        return;
      }
      /* tile: etiqueta + valor */
      var etiqueta = hueco.getAttribute("data-label") || slot;
      var l = document.createElement("span"); l.className = "rtile__l"; l.textContent = etiqueta;
      var v = document.createElement("span"); v.className = "rtile__v";
      if (tiene) v.innerHTML = c.el.innerHTML; else { v.textContent = "—"; hueco.classList.add("is-empty"); }
      hueco.innerHTML = "";
      hueco.appendChild(v); hueco.appendChild(l);
    });

    /* 2b. Poderes: una etiqueta por poder (separados por coma, punto y coma,
       barra, salto de línea o viñeta) */
    var hp = root.querySelector('[data-slot="poderes"]');
    if (hp) {
      var cp = buscar("poderes");
      if (cp && !vacio(cp.el)) {
        var tmp = cp.el.cloneNode(true);
        tmp.querySelectorAll("br").forEach(function (b) { b.replaceWith(document.createTextNode("\n")); });
        var lista = tmp.textContent.split(/[,;\/|·•\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
        hp.innerHTML = "";
        lista.forEach(function (x) { var e = document.createElement("span"); e.textContent = x; hp.appendChild(e); });
      } else hp.classList.add("is-empty");
    }

    /* 2c. Fechas: solo se ven al pasar el ratón (o enfocar con teclado) por el botón */
    ["nacimiento", "inscripcion"].forEach(function (slot) {
      var bt = root.querySelector('[data-slot="' + slot + '"]');
      if (!bt) return;
      var cf = buscar(slot);
      var txt = cf && !vacio(cf.el) ? cf.el.textContent.replace(/\s+/g, " ").trim() : (bt.getAttribute("data-fallback") || "").replace(/^\{.*\}$/, "").trim();
      var tip = bt.querySelector(".rdate__tip");
      if (tip) tip.textContent = (bt.getAttribute("data-short") || "") + (txt || "Sin fecha");
      bt.setAttribute("aria-label", (bt.getAttribute("data-label") || slot) + ": " + (txt || "sin fecha"));
      if (!txt) bt.classList.add("is-empty");
    });

    /* 3. Banner pequeño: imagen del campo, o una URL escrita a mano */
    var hb = root.querySelector('[data-slot="banner"]');
    if (hb) {
      var cb = buscar("banner");
      var src = "";
      if (cb) {
        var im = cb.el.querySelector("img");
        if (im) src = im.getAttribute("src");
        else { var m = cb.el.textContent.match(/https?:\/\/\S+/); if (m) src = m[0]; }
      }
      if (src) { hb.style.backgroundImage = 'url("' + src.replace(/"/g, "%22") + '")'; hb.classList.add("has-img"); }
      else hb.classList.add("is-empty");
    }

    /* 4. Implantes: icono + nombre/descripción, o hueco vacío */
    ["implante1", "implante2"].forEach(function (slot) {
      var h = root.querySelector('[data-slot="' + slot + '"]');
      if (!h) return;
      var c = buscar(slot);
      var etiqueta = h.getAttribute("data-label") || "Implante";
      h.innerHTML = "";
      var ico = document.createElement("div"); ico.className = "rimp__ico";
      var txt = document.createElement("div"); txt.className = "rimp__txt";
      var n = document.createElement("span"); n.className = "rimp__n"; n.textContent = etiqueta;
      txt.appendChild(n);
      if (c && !vacio(c.el)) {
        var im2 = c.el.querySelector("img");
        if (im2) ico.appendChild(im2.cloneNode(true)); else ico.classList.add("is-blank");
        var resto = c.el.cloneNode(true);
        resto.querySelectorAll("img").forEach(function (x) { x.remove(); });
        var d = document.createElement("span"); d.className = "rimp__d";
        d.innerHTML = resto.innerHTML.trim() || "Instalado";
        txt.appendChild(d);
        h.classList.add("is-on");
      } else {
        ico.classList.add("is-blank");
        var d2 = document.createElement("span"); d2.className = "rimp__d"; d2.textContent = "Sin implante";
        txt.appendChild(d2);
      }
      h.appendChild(ico); h.appendChild(txt);
    });

    /* 5. Inventario y medallero: una casilla por imagen + marcadores vacíos */
    ["inventario", "medallero"].forEach(function (slot) {
      var h = root.querySelector('[data-slot="' + slot + '"]');
      if (!h) return;
      var c = buscar(slot);
      var min = parseInt(h.getAttribute("data-min"), 10) || 12;
      h.innerHTML = "";
      var n = 0;
      if (c) {
        /* [img]url[/img] Nombre -> el texto tras cada imagen es su nombre (tooltip) */
        var noms = [], act = null;
        (function rec(nd) {
          Array.prototype.forEach.call(nd.childNodes, function (x) {
            if (x.nodeType === 3) { if (act) act.t += x.nodeValue; }
            else if (x.nodeType === 1) {
              if (x.tagName === "BR") act = null;
              else if (x.tagName === "IMG") { act = { img: x, t: "" }; noms.push(act); }
              else if (x.querySelector && x.querySelector("img")) {
                if (x.tagName === "A") { act = { img: x.querySelector("img"), t: "" }; noms.push(act); } else rec(x);
              } else if (act) act.t += x.textContent;
            }
          });
        })(c.el);
        c.el.querySelectorAll("img").forEach(function (img) {
          var cas = document.createElement("div"); cas.className = "rslot is-on";
          var a = img.closest("a");
          cas.appendChild((a && c.el.contains(a) ? a : img).cloneNode(true));
          var o = noms.filter(function (q) { return q.img === img; })[0];
          var t = o ? o.t.replace(/\s+/g, " ").trim() : "";
          if (t) { cas.title = t; cas.setAttribute("data-nombre", t); }
          h.appendChild(cas); n++;
        });
      }
      var total = Math.max(min, Math.ceil(n / 6) * 6);
      for (var i = n; i < total; i++) {
        var e = document.createElement("div"); e.className = "rslot"; e.setAttribute("aria-hidden", "true"); h.appendChild(e);
      }
    });

    /* 6. Música
       Formato del campo:  [u]TÍTULO[/u][b]Artista[/b][i]https://youtu.be/ID[/i]
       Sirve tanto si el campo interpreta el BBCode (llega como <u>/<strong>/<em>)
       como si lo deja en texto crudo (los campos de una línea no lo interpretan). */
    var hm = root.querySelector('[data-slot="musica"]');
    if (hm) {
      var cm = buscar("musica");
      var titulo = "", artista = "", url = "", id = "";
      if (cm && !vacio(cm.el)) {
        var crudo = cm.el.textContent.replace(/ /g, " ");
        var bb = function (t) { var m = crudo.match(new RegExp("\\[" + t + "\\]([\\s\\S]*?)\\[/" + t + "\\]", "i")); return m ? m[1].trim() : ""; };
        var u = cm.el.querySelector("u, [style*='underline']");
        var b = cm.el.querySelector("strong, b");
        titulo = bb("u") || (u ? u.textContent.trim() : "");
        artista = bb("b") || (b ? b.textContent.trim() : "");
        var a2 = cm.el.querySelector("a[href]");
        url = (a2 && a2.getAttribute("href")) || crudo;
        var m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s\]\)]*&)?v=|embed\/|shorts\/|live\/)|[?&]v=)([\w-]{11})/) ||
                crudo.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s\]\)]*&)?v=|embed\/|shorts\/|live\/)|[?&]v=)([\w-]{11})/);
        id = m ? m[1] : "";
      }
      if (!id) {
        hm.classList.add("is-empty");
      } else {
        hm.querySelector(".rperfil__song").textContent = titulo || "Sin título";
        hm.querySelector(".rperfil__artist").textContent = artista;
        var btn = hm.querySelector(".rperfil__play");
        var jug = null, listo = false, quiere = false;
        var estado = function (suena) {
          btn.setAttribute("aria-pressed", suena ? "true" : "false");
          btn.setAttribute("aria-label", suena ? "Pausar" : "Reproducir");
          hm.classList.toggle("is-playing", !!suena);
        };

        /* Hueco del reproductor: 200x200 fuera de pantalla (YouTube no reproduce
           si el reproductor es diminuto u oculto con display/visibility). */
        var hueco = document.createElement("div");
        hueco.className = "rperfil__yt";
        var diana = document.createElement("div");
        hueco.appendChild(diana);
        hm.appendChild(hueco);

        var crear = function () {
          if (jug || !window.YT || !YT.Player) return;
          jug = new YT.Player(diana, {
            width: 200, height: 200, videoId: id,
            playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1, loop: 1, playlist: id, origin: location.origin },
            events: {
              onReady: function () { listo = true; if (quiere) { jug.playVideo(); } },
              onStateChange: function (e) {
                if (e.data === 1) estado(true);
                else if (e.data === 2 || e.data === 0 || e.data === 5) estado(false);
              },
              onError: function () {
                hm.classList.add("is-error");
                hm.querySelector(".rperfil__artist").textContent = "No se reproduce aquí · pulsa para abrir en YouTube";
                estado(false);
              }
            }
          });
        };
        /* La API de YouTube se carga una sola vez, aunque haya varios reproductores */
        if (window.YT && YT.Player) crear();
        else {
          var previo = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = function () { if (previo) { try { previo(); } catch (e) {} } crear(); };
          if (!document.getElementById("bts-yt-api")) {
            var sc = document.createElement("script");
            sc.id = "bts-yt-api"; sc.src = "https://www.youtube.com/iframe_api"; sc.async = true;
            document.head.appendChild(sc);
          }
        }

        btn.addEventListener("click", function () {
          if (hm.classList.contains("is-error")) { window.open("https://youtu.be/" + id, "_blank", "noopener"); return; }
          if (!jug || !listo) { quiere = true; estado(true); return; }   /* aún cargando: sonará al estar listo */
          var st = jug.getPlayerState();
          if (st === 1 || st === 3) { quiere = false; jug.pauseVideo(); estado(false); }
          else { quiere = true; jug.playVideo(); estado(true); }
        });
      }
    }

    /* 7. Los campos sin hueco (enlaces, barras, poderes) se colocan bajo el avatar: lo hace js-post.js */
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
