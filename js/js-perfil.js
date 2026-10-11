/* Perfil: solo la página de perfil (la que lleva #rperfil).
   Reparte los campos del perfil en la ficha según el NOMBRE del campo
   (sin mayúsculas ni tildes), monta los huecos de inventario y medallero con
   marcadores vacíos, y convierte el campo "Música" en un reproductor.

   Música: [u]TÍTULO[/u][b]Artista[/b][i]https://youtu.be/ID[/i]
   El audio sale de un iframe de YouTube diminuto que solo se crea al pulsar
   el botón; nada suena sin que el visitante lo pida. */
(function () {
  function run() {
    var root = document.getElementById("rperfil");
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
      banner: ["banner", "banner pequeno", "cabecera"],
      musica: ["musica", "cancion", "tema musical"],
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

    function buscar(slot) {
      var syn = SINONIMOS[slot] || [slot];
      for (var i = 0; i < campos.length; i++) {
        if (campos[i].used) continue;
        if (syn.indexOf(campos[i].key) > -1) { campos[i].used = true; return campos[i]; }
      }
      return null;
    }
    var vacio = function (el) {
      return !el || (!el.querySelector("img") && !el.textContent.replace(/[\s -]+/g, "").length);
    };

    /* 2. Huecos de texto: apodos, alias, tiles y frase */
    root.querySelectorAll("[data-slot]").forEach(function (hueco) {
      var slot = hueco.getAttribute("data-slot");
      if (/^(musica|banner|implante1|implante2|inventario|medallero)$/.test(slot)) return;
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
        c.el.querySelectorAll("img").forEach(function (img) {
          var cas = document.createElement("div"); cas.className = "rslot is-on";
          var a = img.closest("a");
          cas.appendChild((a && c.el.contains(a) ? a : img).cloneNode(true));
          h.appendChild(cas); n++;
        });
      }
      var total = Math.max(min, Math.ceil(n / 6) * 6);
      for (var i = n; i < total; i++) {
        var e = document.createElement("div"); e.className = "rslot"; e.setAttribute("aria-hidden", "true"); h.appendChild(e);
      }
    });

    /* 6. Música */
    var hm = root.querySelector('[data-slot="musica"]');
    if (hm) {
      var cm = buscar("musica");
      var titulo = "", artista = "", url = "";
      if (cm && !vacio(cm.el)) {
        var u = cm.el.querySelector("u, [style*='underline']");
        var b = cm.el.querySelector("strong, b");
        var i = cm.el.querySelector("em, i");
        var a2 = cm.el.querySelector("a[href]");
        titulo = u ? u.textContent.trim() : "";
        artista = b ? b.textContent.trim() : "";
        url = (a2 && a2.getAttribute("href")) || (i ? i.textContent.trim() : "") || cm.el.textContent;
      }
      var id = (url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/) || [])[1];
      if (!id) {
        hm.classList.add("is-empty");
      } else {
        hm.querySelector(".rperfil__song").textContent = titulo || "Sin título";
        hm.querySelector(".rperfil__artist").textContent = artista;
        var btn = hm.querySelector(".rperfil__play");
        var marco = null;
        var cmd = function (f) {
          if (marco && marco.contentWindow)
            marco.contentWindow.postMessage(JSON.stringify({ event: "command", func: f, args: "" }), "*");
        };
        btn.addEventListener("click", function () {
          var suena = btn.getAttribute("aria-pressed") === "true";
          if (!marco) {
            marco = document.createElement("iframe");
            marco.className = "rperfil__yt";
            marco.setAttribute("allow", "autoplay; encrypted-media");
            marco.setAttribute("title", "Música: " + titulo);
            marco.src = "https://www.youtube-nocookie.com/embed/" + id +
              "?autoplay=1&controls=0&enablejsapi=1&playsinline=1&loop=1&playlist=" + id;
            hm.appendChild(marco);
            btn.setAttribute("aria-pressed", "true"); hm.classList.add("is-playing");
            btn.setAttribute("aria-label", "Pausar");
            return;
          }
          cmd(suena ? "pauseVideo" : "playVideo");
          btn.setAttribute("aria-pressed", suena ? "false" : "true");
          btn.setAttribute("aria-label", suena ? "Reproducir" : "Pausar");
          hm.classList.toggle("is-playing", !suena);
        });
      }
    }

    /* 7. Lo que no tiene hueco va al final, como "Otros datos" */
    var extra = document.getElementById("rperfil-extra");
    var otros = campos.filter(function (c) { return !c.used && !vacio(c.el); });
    if (extra && otros.length) {
      var t = document.createElement("div"); t.className = "rinv__head"; t.textContent = "Otros datos";
      extra.appendChild(t);
      var dl = document.createElement("dl"); dl.className = "rperfil__otros";
      otros.forEach(function (c) {
        var dt = document.createElement("dt"); dt.textContent = c.raw;
        var dd = document.createElement("dd"); dd.innerHTML = c.el.innerHTML;
        dl.appendChild(dt); dl.appendChild(dd);
      });
      extra.appendChild(dl);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
