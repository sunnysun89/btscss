/* ==========================================================================
   BTS todo-en-uno — pegar UNA vez en el gestor de Javascript, "En todas
   las páginas". Cada bloque lleva su propio guardián: solo corre donde
   tiene que correr. Editar los ficheros sueltos de skin/js/ y regenerar
   este paquete (mismo orden que aquí).
   Orden: botones, banner, índice, temas, subforos, categorías, perfil, switcheroo.
   ========================================================================== */

if (window.console) console.log("[BTS] bts.js cargado v1.9");
/* Arranque de banner + índice: Foroactivo ejecuta este script en <head>, antes
   de que existan <body>, #left y jQuery. No se arranca hasta que haya DOM y
   jQuery (espera hasta ~10 s). Los demás bloques traen su propia espera. */
(function () {
  function run() {
    var $ = window.jQuery;
    if (window.console) {
      var cs = getComputedStyle(document.documentElement);
      console.info("[BTS] CSS: " + (cs.getPropertyValue("--burnthesky-css").trim() || "SIN MARCA (el navegador tiene un CSS viejo en caché)") + " · hover (--burnthesky-ease) = " + cs.getPropertyValue("--burnthesky-ease").trim());
    }
/* --- js-banner.js --- */
(function(){
/* --- banner: solo si hay mural que mover --- */
if (!document.querySelector('#left #startindex')) return;
/* Banner: todas las páginas.
   Mueve el widget Banner (#startindex) a #rheader, rellena la ventana de
   Recent topics con los últimos temas, pone el nombre en la bienvenida, el
   copyright a icono y construye la lista de más activos.
   Requiere el widget "Banner" (plantillas/widget-mural.html) y el widget
   estándar de últimos temas dentro de #left.
   Cada bloque va en safe(): si uno falla, los demás siguen funcionando. */
jQuery(document).ready(function(){

  function safe(nombre, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn("[BTS banner] " + nombre, e); }
  }

  safe("mover banner", function () {
    $("#rheader").replaceWith($("#left #startindex"));
  });

  /* ---- Recent topics ----------------------------------------------------
     Antes se buscaba SOLO #comments_scroll_div, y si el widget no tenía ese
     id la ventana quedaba vacía. Ahora se busca por id, por título del
     módulo ("Últimos temas", "Recent topics"...) o, como último recurso, por
     cualquier módulo de #left que contenga enlaces a temas. */
  safe("recent topics", function () {
    var $slot = $("#mural .rsubsrecent").first();
    if (!$slot.length) return;

    var esTema = function (a) {
      var h = a.getAttribute("href") || "";
      return /\/t\d+[^\/]*(#\d+)?$/.test(h) && !$(a).closest(".h3").length;
    };

    var $src = $("#left #comments_scroll_div, #comments_scroll_div").not("#mural *").first();

    if (!$src.length) {
      $("#left .module").each(function () {
        var titulo = $(this).find(".h3").first().text().toLowerCase();
        if (/últimos temas|ultimos temas|últimos mensajes|ultimos mensajes|recent topics|latest topics|recent posts|latest posts/.test(titulo)) {
          $src = $(this);
          return false;
        }
      });
    }
    if (!$src.length) {
      $("#left .module").each(function () {
        if ($(this).find("a").filter(function () { return esTema(this); }).length >= 2) {
          $src = $(this);
          return false;
        }
      });
    }

    var items = [];
    if ($src.length) {
      $src.find("a").each(function () {
        if (!esTema(this) || items.length >= 8) return;
        var a = this, meta = "", n = a.nextSibling;

        while (n) {
          if (n.nodeType === 1 && (esTema(n) || (n.querySelector && $(n).find("a").filter(function () { return esTema(this); }).length))) break;
          meta += n.textContent || "";
          n = n.nextSibling;
        }
        if (!meta.replace(/\s+/g, "")) {
          var p = a.parentNode;
          if (p && $(p).find("a").filter(function () { return esTema(this); }).length === 1) {
            meta = (p.textContent || "").replace(a.textContent, "");
          }
        }
        meta = meta.replace(/\s+/g, " ").replace(/^[\s»>]+/, "").replace(/[\s»>]+$/, "").trim();

        var fecha = meta, autor = "";
        var m = meta.match(/^(.*)\s+por\s+(.+)$/i);
        if (m) { fecha = m[1].trim(); autor = m[2].trim(); }

        var titulo = (a.textContent || "").replace(/^[\s»>]+/, "").trim();
        if (/(\.\.\.|…)$/.test(titulo) && a.getAttribute("title")) titulo = a.getAttribute("title");

        items.push({ href: a.getAttribute("href"), titulo: titulo, fecha: fecha, autor: autor });
      });
    }

    if (window.console) console.info("[BTS] recent topics: módulo " + ($src.length ? "encontrado" : "NO encontrado") + ", " + items.length + " temas");
    var $lista = $('<div class="rsubsrecent rrecent"></div>');
    if (!items.length) {
      $lista.append($('<p class="rrecent__empty"></p>').text("Aún no hay temas recientes."));
    }
    $.each(items, function (i, it) {
      var $a = $('<a class="rrecent__item"></a>').attr("href", it.href);
      $a.append($('<span class="rrecent__title"></span>').text(it.titulo));
      var $meta = $('<span class="rrecent__meta"></span>');
      if (it.autor) $meta.append($("<b></b>").text(it.autor)).append(document.createTextNode(" · "));
      $meta.append(document.createTextNode(it.fecha));
      $a.append($meta);
      $lista.append($a);
    });
    $slot.replaceWith($lista);

    /* ---- Scroll automático ----------------------------------------------
       SPEED = píxeles por segundo (menor = más lento). Solo se mueve si la
       lista no cabe entera en la ventana (alto = max-height de .rrecent).
       Usa la Web Animations API: no depende de la hoja de estilos (ni de su
       caché) y "reducir movimiento" no la desactiva. Pausa con el ratón. */
    var SPEED = 28;
    var $pista = $('<div class="rrecent__track"></div>').append($lista.children());
    $lista.empty().append($pista);
    $lista.css({ maxHeight: "340px", overflow: "hidden" });
    var originales = $pista.children().length;
    var anim = null;

    function medir() {
      if (anim) { anim.cancel(); anim = null; }
      $pista.children().slice(originales).remove();
      $lista.removeClass("rrecent--on").off(".rscroll");
      var alto = $pista.outerHeight(), ventana = $lista.innerHeight();
      var mover = originales && alto > ventana + 1;
      if (window.console) console.info("[BTS] scroll recent: lista " + alto + "px, ventana " + ventana + "px -> " + (mover ? "se mueve" : "no hace falta"));
      if (!mover) return;
      $pista.append($pista.children().clone().attr("aria-hidden", "true"));
      $lista.addClass("rrecent--on");
      if (!$pista[0].animate) return;
      anim = $pista[0].animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-" + alto + "px)" }],
        { duration: alto / SPEED * 1000, iterations: Infinity }
      );
      $lista.on("mouseenter.rscroll", function () { if (anim) anim.pause(); })
            .on("mouseleave.rscroll", function () { if (anim) anim.play(); });
    }
    medir();
    $(window).on("load", medir);
  });

  safe("avatar", function () {
    if (document.querySelector('.mod-login-avatar') !== null) {
      $("#mural .rintro .ricon img").replaceWith($(".mod-login-avatar img"));
    }
    var avatar = $("#left .mod-login-avatar img");
    if (avatar.length == 0) avatar = '<img src="https://placehold.co/250x400" />';
    $("#mural .rmuralavatar img").replaceWith(avatar);
  });

  safe("copyright", function () {
    var legend = $("p.copyright strong a").text();
    $("p.copyright strong a").html('<i class="fa fa-gear" title="' + legend + '"></i>');
  });

  safe("bienvenida", function () {
    var nombre = $("#left .module .inner span.corners-top ~ div.h3 span strong").text();
    if (nombre) $("#mural .rwelcomesub span").text(nombre);
  });

  safe("más activos", function () {
    var activeUsersHtml = "";
    $("#left .module .inner").each(function () {
      var check1 = $(this).find("div.h3").text();
      var check2 = $(this).find("table").attr("summary");
      if (check2 != null && check1 == check2) {
        $(this).find("div.h3 ~ table > tbody > tr").each(function (index) {
          if ($(this).find("td > table").attr("title") != null) {
            activeUsersHtml += '<div class="ruser" title="' + $(this).find("td > table").attr("title").split("-")[0] + '">';
            activeUsersHtml += '<span>> ' + $(this).find("td > a").text() + '</span>';
            var percentage = parseInt($(this).find("td > table").attr("title").split("-")[1]);
            var accent = (index % 2 == 0) ? 2 : 1;
            activeUsersHtml += '<div><div style="background: linear-gradient(90deg, var(--accent' + accent + ') ' + percentage + '%, transparent ' + (percentage + 10) + '%);"></div></div>';
            activeUsersHtml += '</div>';
          }
        });
      }
      $("#mural .ractiveusers").html(activeUsersHtml);
    });
  });

});
})();
/* --- js-indice.js --- */
(function(){
/* --- índice: solo con bloque de estadísticas --- */
if (!document.querySelector('#rstatscontainer')) return;
/* Índice: solo para el índice.
   1) Reescribe las cifras de estadísticas con textos propios (en español).
   2) Mueve el widget de afiliados (#rneonfooter) a #rfooterreplace.
   3) Construye el panel DATABASE: pastillas + donut + tarjetas de grupos con
      hover (el donut resalta el grupo bajo el cursor).

   ANTES todo iba en un solo bloque y se rompía en la leyenda de grupos (esperaba
   la clase .gensmall); como el resto quedaba sin ejecutar, ni los textos ni el
   widget de afiliados llegaban a aplicarse. Ahora cada parte va en safe(). */
jQuery(document).ready(function(){

  function safe(nombre, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn("[BTS índice] " + nombre, e); }
  }

  // textos de las estadísticas (editar aquí el idioma)
  var totalMessages  = "mensajes";
  var totalUsers     = "miembros registrados";
  var totalConnected = "récord de conectados";
  var lastRegistered = "Bienvenido a Burn The Sky,";

  /* ---- 1. Textos ---- */
  safe("mensajes", function () {
    var n = $("p.page-bottom.rtotalposts strong").text();
    $("p.page-bottom.rtotalposts").html("<strong>" + n + "</strong>" + totalMessages);
  });
  safe("usuarios", function () {
    var n = $("p.page-bottom.rtotalusers strong").text();
    $("p.page-bottom.rtotalusers").html("<strong>" + n + "</strong>" + totalUsers);
  });
  safe("récord", function () {
    var n = $("p.page-bottom.rrecordusers strong").text();
    var fecha = ($("p.page-bottom.rrecordusers").html().split("</strong>")[1] || "").split(" - ")[0];
    $("p.page-bottom.rrecordusers").html("<strong>" + n + "</strong>" + totalConnected + " " + fecha);
  });
  safe("último usuario", function () {
    /* se conserva el enlace (y su color de grupo), no solo el texto */
    var $s = $("p.rnewestuser > strong").first();
    var html = $s.html() || $s.text();
    $("p.rnewestuser").html("<em>" + lastRegistered + "</em><br /><strong>" + html + "</strong>");
  });
  safe("en línea", function () {
    var $t = $("#rstatscontainer .ruserstats");
    if ($t.length) $t.html($t.html().replace("::", "<br />"));
  });

  /* ---- 2. Afiliados ---- */
  safe("afiliados", function () {
    if ($("#rneonfooter").length) $("#rfooterreplace").replaceWith($("#rneonfooter"));
  });

  /* ---- 3. Panel DATABASE ---- */
  safe("database", function () {
    var $leg = $("#rstatscontainer .rgroupleg");
    var enlaces = $leg.find("a").filter(function () {
      return /\/g\d+/.test(this.getAttribute("href") || "") || /\d/.test(this.getAttribute("title") || "");
    });
    if (!enlaces.length) return;

    /* CONFIGURACIÓN
       APARTE .......... grupos que van FUERA de la rosca, como casillas bajo
                         las estadísticas (nombre en minúsculas, en este orden).
       ADMIN_EN_GRUPOS . otros grupos de la rosca donde también está la cuenta
                         admin (u1): se les resta 1 miembro. Authority ya está
                         fuera de la rosca, así que normalmente va vacío. */
    var APARTE = ["authority", "missing"];
    var ADMIN_EN_GRUPOS = ["missing", "divine", "notable", "infamous", "underdogs", "unknown", "ordinary"];

    var todos = [];
    enlaces.each(function () {
      var $a = $(this);
      var nombre = $a.text().replace(/[\[\]]/g, "").trim();
      if (!nombre) return;
      var m = ($a.attr("title") || "").match(/:\s*(\d+)/);
      var n = m ? parseInt(m[1], 10) : 0;
      var $c = $a.find("[style*='color']").first();
      if (!$c.length) $c = $a;
      var rgb = ($c.css("color") || "").match(/\d+(\.\d+)?/g) || [150, 150, 150];
      var clave = nombre.toLowerCase();
      if ($.inArray(clave, ADMIN_EN_GRUPOS) > -1) n = Math.max(0, n - 1);
      todos.push({ clave: clave, nombre: nombre.slice(0, 24), n: n, href: $a.attr("href") || "#", r: +rgb[0], g: +rgb[1], b: +rgb[2] });
    });
    if (!todos.length) return;

    var grupos = [], aparte = [], total = 0;
    $.each(todos, function (i, g) {
      if ($.inArray(g.clave, APARTE) > -1) aparte.push(g);
      else { grupos.push(g); total += g.n; }
    });
    aparte.sort(function (x, y) { return $.inArray(x.clave, APARTE) - $.inArray(y.clave, APARTE); });
    if (!grupos.length) return;

    var base = total > 0 ? total : grupos.length;
    var col = function (g, a) { return "rgba(" + g.r + "," + g.g + "," + g.b + "," + a + ")"; };
    /* El donut usa variables --a0..--a11 (opacidad de cada porción) registradas
       con @property en el CSS: así el atenuado al pasar el ratón se ANIMA con
       la misma velocidad de los demás hovers, en vez de cambiar de golpe. */
    var pintar = function () {
      var acc = 0, partes = [];
      $.each(grupos, function (i, g) {
        var pct = (total > 0 ? g.n : 1) / base * 100;
        var c = "rgba(" + g.r + "," + g.g + "," + g.b + ",var(--a" + Math.min(i, 11) + ", 1))";
        partes.push(c + " " + acc.toFixed(2) + "% " + (acc + pct).toFixed(2) + "%");
        acc += pct;
      });
      return "conic-gradient(" + partes.join(", ") + ")";
    };
    var atenuar = function ($d, activo) {
      for (var k = 0; k < Math.min(grupos.length, 12); k++) {
        $d[0].style.setProperty("--a" + k, activo === null || activo === k ? "1" : "0.18");
      }
    };

    var posts  = $("p.page-bottom.rtotalposts strong").text() || "";
    var users  = $("p.page-bottom.rtotalusers strong").text() || "";
    var newest = $("p.rnewestuser strong").text() || "";

    var tarjetas = "";
    $.each(grupos, function (i, g) {
      var pct = Math.round((total > 0 ? g.n : 0) / base * 100);
      tarjetas +=
        '<a class="rdb__g" data-i="' + i + '" href="' + g.href + '" style="--g:' + col(g, 1) + ';--g-soft:' + col(g, 0.12) + ';--g-glow:' + col(g, 0.45) + '">' +
        '<span class="rdb__gname">' + $("<i>").text(g.nombre).html() + '</span>' +
        '<b class="rdb__gcount">' + g.n + '</b>' +
        '<span class="rdb__gbar"><i style="width:' + pct + '%"></i></span></a>';
    });

    var apartes = "";
    $.each(aparte, function (i, g) {
      apartes +=
        '<a class="rdb__g rdb__g--apart" href="' + g.href + '" style="--g:' + col(g, 1) + ';--g-soft:' + col(g, 0.12) + ';--g-glow:' + col(g, 0.45) + '">' +
        '<span class="rdb__gname">' + $("<i>").text(g.nombre).html() + '</span>' +
        '<b class="rdb__gcount">' + g.n + '</b>' +
        '<span class="rdb__gbar"><i style="width:100%"></i></span></a>';
    });

    var $rdb = $(
      '<div class="rdb"><div class="rdb__bar"><span class="rdb__title">Database</span>' +
      '<span class="rdb__pill">Total episodios <b>' + posts + '</b></span>' +
      '<span class="rdb__pill">Población <b>' + users + '</b></span>' +
      '<span class="rdb__pill">Último <b>' + $("<i>").text(newest).html() + '</b></span></div>' +
      '<div class="rdb__cols"><div class="rdb__donut"><div class="rdb__dtxt"><b>' + total + '</b><span>miembros</span></div></div>' +
      '<div class="rdb__groups">' + tarjetas + '</div></div>' +
      '<p class="rdb__legal">Burn The Sky y todo su contenido pertenecen a sus administradores y miembros. Prohibida su reproducción total o parcial.</p></div>'
    );

    var $donut = $rdb.find(".rdb__donut"), $txt = $rdb.find(".rdb__dtxt");
    var ref = $txt.html(), cambio = null;
    $donut.css("background", pintar());
    atenuar($donut, null);

    /* el texto del centro se cambia con un fundido corto (nunca más lento que el hover) */
    var decir = function (html) {
      clearTimeout(cambio);
      $txt.css("opacity", 0);
      cambio = setTimeout(function () { $txt.html(html).css("opacity", 1); }, 180);
    };

    $rdb.find(".rdb__g")
      .on("mouseenter focus", function () {
        var i = +$(this).attr("data-i"), g = grupos[i];
        atenuar($donut, i);
        decir("<b>" + g.n + "</b><span>" + $("<i>").text(g.nombre).html() + " · " + Math.round((total > 0 ? g.n : 0) / base * 100) + "%</span>");
      })
      .on("mouseleave blur", function () {
        atenuar($donut, null);
        decir(ref);
      });

    /* grupos aparte: bajo los demás grupos de la ventana Database */
    if (apartes) {
      var $ap = $('<div class="rdb__apart"></div>').html(apartes);
      $rdb.find(".rdb__cols").after($ap);   /* debajo de los demás grupos, separados por una línea */
    }

    $("#rstatscontainer").before($rdb).addClass("rdb-ready");
  });

});
})();

  }
  function esperar(n) {
    if (window.jQuery && document.body) { run(); return; }
    if (n > 0) setTimeout(function () { esperar(n - 1); }, 50);
    else if (window.console) console.warn("[BTS] jQuery o <body> no disponibles; banner e índice no arrancan.");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { esperar(200); });
  else esperar(200);
})();
/* --- js-temas.js --- */
(function(){
/* --- temas: solo con posts o editor --- */
/* Las comprobaciones se hacen con el DOM listo: si el script carga en la cabecera, aún no existe nada. */
function btsRun(){
if (!document.querySelector('.post') && !document.querySelector('.sceditor-container')) return;
/* Temas: solo para los temas.
   Campos de perfil con clase slugificada, color del autor como
   --user-color del post, portada e icono del perfil en el banner del post.
   CONFIGURACIÓN arriba del todo. Si cambias los nombres de los campos
   "icon" o "post cover", cámbialos también aquí abajo. */
!function() {


	/*
	 * CONFIGURACIÓN
	 */
	const settings = {
		semicolon: false, // Mostrar dos puntos (:) después del título del campo.
		cleanUp: true, // Eliminar HTML del título del campo que añade colores.
		scrollAvatar: false,
	},



	slugify = str => {
        const from = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;',
        to = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------',
        reg = new RegExp(from.split('').join('|'), 'g');

        return str.trim().toLowerCase()
        		.replace(/\s+/g, '-')
        		.replace(reg, c => to.charAt(from.indexOf(c)))
        		.replace(/&/g, '-and-')
        		.replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
    },

    hideSemicolon = (label, name) => {
        if (label.firstElementChild)
            label.lastChild.remove();
        else
            label.textContent = name;
    },

    main = _ => {

    	document.querySelectorAll('.postprofile-field').forEach(p => {
    		const labelcontainer = p.querySelector('.postprofile-field-label'),
    		label = labelcontainer.querySelector('.label'),
            name = label.textContent.replace(/ *: *$/, '');

    		p.classList.add('postprofile-field-' + slugify(name));

    		if (settings.cleanUp) {
    			labelcontainer.textContent = settings.semicolon ? name + ': ' : name;
    		} else if (!settings.semicolon) {
                hideSemicolon(label, name)
    		}
    	});

	$(".post").each(function( index ) {
          let color = $(this).find(".rtopicuser strong").css("color");
          $(this).get(0).style.setProperty("--user-color", color);
          if($(this).find(".postprofile .postprofile-field-post-cover img").length > 0)
          	$(this).find(".rtopicbgimg img").replaceWith($(this).find(".postprofile .postprofile-field-post-cover img"));
          if($(this).find(".postprofile .postprofile-field-icon img").length > 0)
          	$(this).find(".rprofileicon img").replaceWith($(this).find(".postprofile .postprofile-field-icon img"));
          $(this).find(".postprofile-field-post-cover span.postprofile-field-label").css("display", "none");

          let elementPosition = $(this).find('.postprofile a > img').offset();

          let nextPosition = $('.post').eq(index + 1);
          if(nextPosition.length == 0)
            nextPosition = $(".noprint").offset();
          else
            nextPosition = nextPosition.offset();

          if(settings.scrollAvatar) {
            $(window).scroll(function(){
                    if($(window).scrollTop() + 120 > elementPosition.top
                      && $(window).scrollTop() + 600 < nextPosition.top){
                        $('.postprofile').eq(index).addClass("fixedAvatar");
                    } else {
                        $('.postprofile').eq(index).removeClass("fixedAvatar");
                    }
            });
          }
        });

    };

    document.addEventListener('DOMContentLoaded', main);
}();

/* Respuesta rápida en negro: el iframe WYSIWYG es otro documento y el CSS no
   lo alcanza, así que se le inyecta el estilo al cargar (mismo origen, vale).
   Tres pasadas porque el editor se crea tarde. */
function btsDarkEditor() {
  try {
    document.querySelectorAll(".sceditor-container iframe").forEach(function (fr) {
      try {
        var d = fr.contentDocument || (fr.contentWindow && fr.contentWindow.document);
        if (!d || d.getElementById("bts-ed")) return;
        var s = d.createElement("style");
        s.id = "bts-ed";
        s.textContent = "html,body{background:#0d0d0d!important;color:#ebebeb!important;}" +
          "body{font:13px/1.75 Arial,Helvetica,sans-serif;padding:12px;}" +
          "a{color:#e52222;}blockquote{background:#090909;border:1px solid #1d1d1d;border-left:2px solid #c51515;color:#9a9a9a;}" +
          "pre,.codebox{background:#050505;border:1px solid #1d1d1d;color:#cfcfcf;}";
        d.head.appendChild(s);
      } catch (e) {}
    });
  } catch (e) {}
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    btsDarkEditor();
    setTimeout(btsDarkEditor, 1500);
    setTimeout(btsDarkEditor, 4000);
  });
} else {
  btsDarkEditor();
  setTimeout(btsDarkEditor, 1500);
  setTimeout(btsDarkEditor, 4000);
}

}
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", btsRun); } else { btsRun(); }
})();
/* --- js-post.js --- */
/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Implantes, Inventario y Medallero -> ventana de tres columnas debajo
     del mensaje, con el estilo del perfil.
   - Popularidad y Autocontrol (0-100) -> barras bajo el poder.
   - Perfil, Mensaje privado, Playlist/OST, Expediente, Baúl, Red social,
     Búsqueda, Móvil/localizador y Más -> botones bajo el avatar (los de los
     campos usan el enlace que escribe el usuario; si el campo está vacío,
     no hay botón).
   - Panel al pasar el ratón por el avatar: solo Edad, Orientación sexual,
     Estado sentimental, Alias, Apodos, Ocupación, Facción, Alianza y
     Ubicación, y solo los que el usuario rellena.
   - En el perfil: botones con iconos, enlaces bajo el avatar, y bajo el
     banner: rango, estadísticas, Poder perfil, su detalle y las barras.
     Frase bajo el título; imagen del aliado al final de la columna central.
   - Botones del mensaje (citar, editar, borrar...) -> iconos Capucciicons
     (hoja tempcf.css en la cabecera) y botones Responder / Nuevo tema.
   - Lo demás queda en el panel que aparece al pasar el ratón por el avatar.
   No depende de js-temas.js: calcula sus propias clases a partir del nombre
   del campo. Un campo se reconoce si su nombre (sin tildes ni mayúsculas)
   CONTIENE alguna de estas palabras; cámbialas aquí si usas otras.
   Si un campo no existe o está vacío, se muestra un hueco apagado (se puede
   ocultar con --burnthesky-post-empty: none en el CSS).
   En la consola (F12) aparece "[BTS] post: campos ..." con los nombres que
   encuentra, para comprobar que coinciden. */
!function () {
  var CLAVES = {
    icono:  ['icon'],
    frase:  ['frase-post', 'frase-mensaje'],      // campo "Frase post"
    poder:  ['poder-mensaje', 'poder-post'],      // campo "Poder mensajes"
    inv:    ['inventario', 'objeto', 'item'],
    med:    ['medall', 'insignia'],
    pop:    ['popularidad'],
    auto:   ['autocontrol'],
    oculto: ['cover', 'portada']
  };

  function slug(t) {
    return (t || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function nombre(f) {
    var l = f.querySelector('.postprofile-field-label');
    return l ? l.textContent.replace(/\s*:\s*$/, '').trim() : '';
  }
  function es(f, claves) {
    var s = slug(nombre(f));
    return claves.some(function (c) { return s.indexOf(c) !== -1; });
  }
  function vacio(f) {
    var c = f && f.querySelector('.postprofile-field-content');
    return !c || (!c.querySelector('img') && !c.textContent.replace(/\s+/g, '').length);
  }
  function hueco(box, texto) {
    box.classList.add('vacio');
    box.textContent = texto;
    box.style.display = '';
  }


  var MIN_CASILLAS = 6;   // casillas mínimas por columna (las que faltan salen como hexágonos vacíos)

  function esImplante(f, n) {
    var s = slug(nombre(f));
    if (s.indexOf('implante') === -1) return false;
    var re = n === 1 ? /(^|-)(0?1|i|uno)$/ : /(^|-)(0?2|ii|dos)$/;
    return re.test(s);
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }
  function implante(c, etiqueta) {
    var h = el('div', 'rimp'), ico = el('div', 'rimp__ico'), txt = el('div', 'rimp__txt');
    txt.appendChild(el('span', 'rimp__n', etiqueta));
    var cont = c && c.querySelector('.postprofile-field-content');
    if (c && !vacio(c)) {
      var im = cont.querySelector('img');
      if (im) ico.appendChild(im.cloneNode(true)); else ico.className += ' is-blank';
      var resto = cont.cloneNode(true);
      Array.prototype.forEach.call(resto.querySelectorAll('img'), function (x) { x.parentNode.removeChild(x); });
      var d = el('span', 'rimp__d'); d.innerHTML = resto.innerHTML.trim() || 'Instalado';
      txt.appendChild(d); h.className += ' is-on';
    } else {
      ico.className += ' is-blank';
      txt.appendChild(el('span', 'rimp__d', 'Sin implante'));
    }
    h.appendChild(ico); h.appendChild(txt);
    return h;
  }
  function rejilla(c) {
    var g = el('div', 'rinv__grid'), n = 0;
    var cont = c && c.querySelector('.postprofile-field-content');
    if (cont) Array.prototype.forEach.call(cont.querySelectorAll('img'), function (img) {
      var cas = el('div', 'rslot is-on'), a = img.closest ? img.closest('a') : null;
      cas.appendChild((a && cont.contains(a) ? a : img).cloneNode(true));
      g.appendChild(cas); n++;
    });
    for (var i = n; i < Math.max(MIN_CASILLAS, Math.ceil(n / 6) * 6); i++) {
      var e = el('div', 'rslot'); e.setAttribute('aria-hidden', 'true'); g.appendChild(e);
    }
    return g;
  }
  /* Ventana "Inventario y medallero": tres columnas (implantes, inventario,
     medallero), como en el perfil. Sin título en la cabecera. */
  function ventana(f) {
    var w = el('div', 'rinv'), cols = el('div', 'rinv__cols');
    w.appendChild(el('div', 'rinv__head'));
    var b1 = el('section', 'rinv__box rinv__box--imp'), b2 = el('section', 'rinv__box'), b3 = el('section', 'rinv__box');
    b1.appendChild(el('h3', '', 'Implantes'));
    var im = el('div', 'rinv__implants');
    im.appendChild(implante(f.imp1, 'Implante 01')); im.appendChild(implante(f.imp2, 'Implante 02'));
    b1.appendChild(im);
    b2.appendChild(el('h3', '', 'Inventario')); b2.appendChild(rejilla(f.inv));
    b3.appendChild(el('h3', '', 'Medallero'));  b3.appendChild(rejilla(f.med));
    cols.appendChild(b1); cols.appendChild(b2); cols.appendChild(b3);
    w.appendChild(cols);
    return w;
  }

  /* Barras de porcentaje bajo el avatar (campos "Popularidad" y "Autocontrol":
     el usuario escribe un número del 0 al 100, con o sin %). */
  var BARRAS = [['pop', 'Popularidad', ['popularidad']], ['auto', 'Autocontrol', ['autocontrol']]];
  function porcentaje(c) {
    var t = c ? (c.querySelector('.postprofile-field-content') || c).textContent : '';
    var m = t.replace(',', '.').match(/\d+(\.\d+)?/);
    var n = m ? parseFloat(m[0]) : 0;
    return Math.max(0, Math.min(100, n));
  }
  function barras(f) {
    var box = el('div', 'rbars');
    BARRAS.forEach(function (b) {
      var p = porcentaje(f[b[0]]), fila = el('div', 'rbar');
      fila.appendChild(el('span', 'rbar__l', b[1]));
      var tr = el('div', 'rbar__track'), fl = el('div', 'rbar__fill');
      fl.style.width = '0'; fl.textContent = p + '%';
      tr.appendChild(fl); fila.appendChild(tr);
      fila.title = b[1] + ': ' + p + '%';
      box.appendChild(fila);
      setTimeout(function () { fl.style.width = p + '%'; }, 60);
    });
    return box;
  }


  /* ---- Botones del mensaje con iconos Capucciicons ------------------------
     Reconoce cada botón por su enlace, su texto o su imagen (aunque js-botones
     ya lo haya cambiado por un texto) y le pone un icono "cp-". */
  var ICONO_BTN = {
    thanks: ['cp-heart-o', 'Agradecer'], quote: ['cp-quote', 'Citar'],
    multi:  ['cp-add-o', 'Multicita'],  edit:  ['cp-edit-o', 'Editar'],
    del:    ['cp-trash-o', 'Borrar'],   ip:    ['cp-globe-o', 'Ver IP'],
    report: ['cp-flag-o', 'Reportar']
  };
  function tipoBoton(a, li) {
    var im = a.querySelector('img');
    var t = ((a.getAttribute('href') || '') + ' ' + (im ? (im.className + ' ' + (im.alt || '') + ' ' + (im.title || '')) : '') +
             ' ' + a.textContent + ' ' + (li ? li.className : '') + ' ' + (a.id || '') + ' ' + (a.className || '')).toLowerCase();
    if (/multiquote|multicit/.test(t)) return 'multi';
    if (/mode=quote|icon_quote|citar|\bcita\b/.test(t)) return 'quote';
    if (/editpost|icon_edit|editar/.test(t)) return 'edit';
    if (/mode=delete|icon_delete|apagar|borrar|eliminar/.test(t)) return 'del';
    if (/mode=ip|icon_ip|ver ip|\bip\b/.test(t)) return 'ip';
    if (/report|denunc|icon_report/.test(t)) return 'report';
    if (/thank|agradec|gracias/.test(t)) return 'thanks';
    return null;
  }
  function iconosPost() {
    var lis = document.querySelectorAll('.postbody ul.profile-icons li');
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i], a = li.querySelector('a');
      if (!a || a.getAttribute('data-bts-ico')) continue;
      var tipo = tipoBoton(a, li);
      if (!tipo) continue;
      var d = ICONO_BTN[tipo];
      a.setAttribute('data-bts-ico', tipo);
      a.className += ' rbtn rbtn--' + tipo;
      a.setAttribute('title', a.getAttribute('title') || d[1]);
      a.setAttribute('aria-label', d[1]);
      a.innerHTML = '<i class="cp ' + d[0] + '" aria-hidden="true"></i><span class="rbtn__t">' + d[1] + '</span>';
    }
  }

  /* Responder / Nuevo tema / Bloqueado: botones de texto con icono. Las
     imágenes nativas (sprites) no se veían con el tema oscuro. */
  function botonesTema() {
    var as = document.querySelectorAll('.buttons a, .topic-actions a.rbtn-src');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      if (a.getAttribute('data-bts-main') || a.closest('.profile-icons')) continue;
      var im = a.querySelector('img'), rt = a.querySelector('.rtopicbutton');
      if (!im && !rt) continue;
      var cls = ((im ? im.className : '') + ' ' + (a.getAttribute('href') || '')).toLowerCase();
      var txt = (im ? (im.alt || im.title || '') : rt.textContent).trim();
      var l = (txt + ' ' + cls).toLowerCase(), icono, tipo;
      if (/reply|respond|mode=reply/.test(l)) { icono = 'cp-chat-bubble-o'; tipo = 'reply'; txt = txt || 'Responder'; }
      else if (/lock|bloquead|cerrad/.test(l)) { icono = 'cp-lock-o'; tipo = 'locked'; txt = txt || 'Tema bloqueado'; }
      else if (/newtopic|nuevo|new|i_post|mode=post/.test(l)) { icono = 'cp-edit-o'; tipo = 'new'; txt = txt || 'Nuevo tema'; }
      else if (/msg_newpost|privmsg|mensaje/.test(l)) { icono = 'cp-envelope-o'; tipo = 'pm'; txt = txt || 'Nuevo mensaje'; }
      else continue;
      a.setAttribute('data-bts-main', tipo);
      a.className += ' rbtn-main rbtn-main--' + tipo;
      a.setAttribute('aria-label', txt);
      a.innerHTML = '<i class="cp ' + icono + '" aria-hidden="true"></i><span>' + txt + '</span>';
    }
  }


  /* ---- Botones de contacto bajo el avatar: perfil, mensaje privado y playlist ---- */
  function esPlaylist(f) {
    var sl = slug(nombre(f));
    return /(^|-)(playlist|ost)(-|$)/.test(sl);
  }
  function urlDe(f) {
    var cont = f && (f.querySelector('.postprofile-field-content') || f);
    if (!cont) return '';
    var a = cont.querySelector('a[href]');
    var u = a ? a.getAttribute('href') : (cont.textContent.match(/https?:\/\/[^\s<>"']+/) || [''])[0];
    return /^https?:\/\//i.test(u || '') ? u : '';
  }

  /* Campos que se convierten en botón (enlace). Orden = orden de los botones. */
  var EXTRAS = [
    ['expediente', /(^|-)expediente(-|$)/,                    'cp-folder-o',    'Expediente'],
    ['baul',       /(^|-)baul(-|$)/,                          'cp-briefcase-o', 'Baúl'],
    ['red',        /(^|-)(red-social|redes-sociales|redes)(-|$)/, 'cp-share',   'Red social'],
    ['busqueda',   /(^|-)busqueda(-|$)/,                      'cp-search',      'Búsqueda'],
    ['movil',      /(^|-)(movil|localizador)(-|$)/,           'cp-smartphone',  'Móvil / localizador'],
    ['mas',        /^mas$/,                                   'cp-more',        'Más']
  ];
  function tipoExtra(f) {
    var sl = slug(nombre(f));
    for (var i = 0; i < EXTRAS.length; i++) if (EXTRAS[i][1].test(sl)) return EXTRAS[i][0];
    return null;
  }

  /* Datos del panel del avatar (solo los que el usuario rellena, en este orden) */
  var DATOS = [
    [/^edad$/, 'Edad'], [/orientacion/, 'Orientación sexual'], [/sentimental|estado-civil/, 'Estado sentimental'],
    [/^alias/, 'Alias'], [/apodo/, 'Apodos'], [/ocupacion|profesion/, 'Ocupación'],
    [/faccion/, 'Facción'], [/alianza/, 'Alianza'], [/ubicacion|residencia/, 'Ubicación']
  ];
  function panelDatos(campos) {
    var filas = [];
    DATOS.forEach(function (d) {
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        if (!d[0].test(slug(nombre(c))) || vacio(c)) continue;
        var cont = c.querySelector('.postprofile-field-content');
        var fila = el('div', 'rdato'); fila.title = d[1];
        var v = el('span', 'rdato__v'); v.innerHTML = cont.innerHTML;
        fila.appendChild(v); filas.push(fila);
        return;
      }
    });
    return filas;
  }

  function botonContacto(tipo, href, texto, icono, ext) {
    var a = el('a', 'rcbtn rcbtn--' + tipo);
    a.href = href; a.title = texto; a.setAttribute('aria-label', texto);
    if (ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.innerHTML = '<i class="cp ' + icono + '" aria-hidden="true"></i><span class="rcbtn__t">' + texto + '</span>';
    return a;
  }
  function contactos(post, playlist, extras) {
    var box = post.querySelector('.rcontactfields');
    if (!box || box.getAttribute('data-bts-ct')) return;
    box.setAttribute('data-bts-ct', '1');
    var perfil = '', mp = '', as = box.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var t = (as[i].getAttribute('href') + ' ' + as[i].innerHTML + ' ' + (as[i].title || '')).toLowerCase();
      if (!mp && /privmsg|fa-envelope|icon_pm|mensaje priv|enviar mensaje/.test(t)) mp = as[i].getAttribute('href');
      else if (!perfil && /\/u\d+|viewprofile|fa-user|icon_profile|perfil/.test(t)) perfil = as[i].getAttribute('href');
    }
    box.innerHTML = '';
    if (perfil) box.appendChild(botonContacto('perfil', perfil, 'Ver perfil', 'cp-user', false));
    if (mp) box.appendChild(botonContacto('mp', mp, 'Enviar mensaje privado', 'cp-envelope-o', false));
    var u = urlDe(playlist);
    if (u) box.appendChild(botonContacto('playlist', u, 'Playlist / OST', 'cp-music-note', true));
    EXTRAS.forEach(function (d) {
      for (var k = 0; k < (extras || []).length; k++) {
        if (extras[k].t !== d[0]) continue;
        var url = urlDe(extras[k].f);
        if (url) box.appendChild(botonContacto(d[0], url, d[3], d[2], true));
        break;
      }
    });
    if (!box.firstChild) box.style.display = 'none';
  }


  /* ---- Perfil de usuario: botones con iconos y datos bajo el avatar ----
     Lee los campos volcados por la plantilla (#rperfil-campos) y reparte:
     enlaces -> botones, Popularidad/Autocontrol -> barras, Poderes -> línea.
     Sustituye al cuadro "Otros datos" (que se oculta por CSS). */
  var PF_ACC = [
    [/mode=email|mailto|email/, 'cp-envelope-alt-o', 'Enviar correo'],
    [/privmsg|mode=post/,       'cp-envelope-o',     'Enviar mensaje privado'],
    [/mode=editprofile|editar/, 'cp-edit-o',         'Editar perfil'],
    [/search/,                  'cp-search',         'Buscar sus mensajes']
  ];
  /* ---- HTML y CSS escritos por el usuario en campos "zona de texto" ----------
     Foroactivo escapa el HTML de los campos de perfil: el usuario escribe
     <div style="..."> y el foro lo muestra como texto. Aquí se lee ese texto, se
     interpreta en un documento inerte (DOMParser) y se reconstruye SOLO con
     etiquetas, atributos y propiedades CSS permitidos. No hay scripts, ni
     posiciones fijas/absolutas, ni @import. Los <style> se acotan a su campo y
     las clases se renombran con el prefijo "u-" (.caja -> .u-caja).
     Si el campo no contiene etiquetas, se muestra tal cual (BBCode normal).
     Campos que lo usan: Curiosidades, Cronología, Detalle poder y Aliado (descripción). */
  var HTML_OK = /^(div|span|p|br|b|strong|i|em|u|s|del|small|sub|sup|h[1-6]|ul|ol|li|blockquote|hr|a|img|table|thead|tbody|tr|td|th|center|mark|code|pre|details|summary|figure|figcaption|style)$/;
  var CSS_OK = /^(color|background(-(color|image|size|position|repeat|clip))?|border(-(top|right|bottom|left))?(-(color|style|width|radius))?|border-radius|margin(-(top|right|bottom|left))?|padding(-(top|right|bottom|left))?|font(-(family|size|style|weight|variant))?|text-(align|decoration|transform|indent|shadow)|letter-spacing|word-spacing|line-height|width|height|(min|max)-(width|height)|display|flex(-(direction|wrap|grow|shrink|basis|flow))?|grid(-(template(-(columns|rows|areas))?|column|row|gap|area|auto-flow))?|gap|row-gap|column-gap|align-(items|content|self)|justify-(content|items|self)|opacity|box-shadow|transform|transform-origin|transition(-(property|duration|timing-function|delay))?|filter|cursor|list-style(-type)?|vertical-align|white-space|word-break|overflow-wrap|object-fit|object-position|float|clear|outline(-(color|style|width|offset))?|text-overflow|aspect-ratio|mix-blend-mode)$/;
  var contadorHtml = 0;

  function cssValorOk(v) {
    if (/expression|javascript|behavior|binding|@import|[<>\\]/i.test(v)) return false;
    var m, re = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
    while ((m = re.exec(v))) if (!/^https:\/\//i.test(m[2])) return false;
    return !/url\(/i.test(v.replace(re, ''));
  }
  function cssDecl(estilo) {
    var out = '';
    for (var i = 0; i < estilo.length; i++) {
      var p = estilo[i], v = estilo.getPropertyValue(p);
      if (CSS_OK.test(p) && cssValorOk(v)) out += p + ':' + v + ';';
    }
    return out;
  }
  function textoDe(n) {
    if (n.nodeType === 3) return n.nodeValue;
    if (n.nodeType !== 1) return '';
    var t = n.nodeName.toLowerCase();
    if (t === 'br') return '\n';
    if (t === 'a' && n.getAttribute('href')) return n.getAttribute('href');
    var s = ''; for (var c = n.firstChild; c; c = c.nextSibling) s += textoDe(c);
    return s;
  }
  function escalaSelector(sel, id) {
    return sel.split(',').map(function (x) {
      x = x.trim();
      if (!x || /[{}@<>;\\]/.test(x)) return '';
      x = x.replace(/\.(-?[_a-zA-Z][\w-]*)/g, '.u-$1');
      return '[data-rh="' + id + '"] ' + x;
    }).filter(Boolean).join(',');
  }
  function hojaEstilos(css, id) {
    var out = '';
    try {
      var hoja = new CSSStyleSheet(); hoja.replaceSync(css);
      Array.prototype.forEach.call(hoja.cssRules, function (r) {
        if (r.type !== 1) return;
        var d = cssDecl(r.style), s = escalaSelector(r.selectorText, id);
        if (d && s) out += s + '{' + d + '}';
      });
    } catch (e) {}
    return out;
  }
  function limpia(nodo, destino, estilos, id) {
    for (var c = nodo.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { destino.appendChild(document.createTextNode(c.nodeValue)); continue; }
      if (c.nodeType !== 1) continue;
      var t = c.nodeName.toLowerCase();
      if (/^(script|iframe|object|embed|noscript|template|svg|math|form|input|button|textarea|select|link|meta|base|audio|video)$/.test(t)) continue;   /* se descarta con su contenido */
      if (!HTML_OK.test(t)) { limpia(c, destino, estilos, id); continue; }   /* etiqueta no permitida: se conserva el texto */
      if (t === 'style') { estilos.push(hojaEstilos(c.textContent, id)); continue; }
      var n = document.createElement(t);
      var st = cssDecl(c.style || {}); if (st) n.setAttribute('style', st);
      var cl = (c.getAttribute('class') || '').split(/\s+/).filter(function (x) { return /^[\w-]+$/.test(x); }).map(function (x) { return 'u-' + x; }).join(' ');
      if (cl) n.className = cl;
      ['title', 'alt', 'width', 'height', 'colspan', 'rowspan', 'align'].forEach(function (a) { if (c.hasAttribute(a)) n.setAttribute(a, c.getAttribute(a)); });
      if (t === 'a') {
        var h = c.getAttribute('href') || '';
        if (/^(https?:\/\/|mailto:|#)/i.test(h)) { n.setAttribute('href', h); n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
      }
      if (t === 'img') {
        var sr = c.getAttribute('src') || '';
        if (/^https:\/\//i.test(sr)) { n.setAttribute('src', sr); n.setAttribute('loading', 'lazy'); } else continue;
      }
      limpia(c, n, estilos, id);
      destino.appendChild(n);
    }
  }
  /* Devuelve el HTML a mostrar para un campo (.rpf-c / .postprofile-field-content). */
  function htmlUsuario(campo) {
    if (!campo) return '';
    var txt = textoDe(campo);
    if (!/<\/?[a-z][^>]*>/i.test(txt)) return campo.innerHTML;
    var doc = new DOMParser().parseFromString('<body>' + txt + '</body>', 'text/html');
    var id = ++contadorHtml, estilos = [], caja = document.createElement('div');
    caja.className = 'rhtml'; caja.setAttribute('data-rh', id);
    limpia(doc.body, caja, estilos, id);
    if (estilos.join('')) { var st = document.createElement('style'); st.textContent = estilos.join(''); caja.insertBefore(st, caja.firstChild); }
    return caja.outerHTML;
  }

  /* Lista de fichas: un campo normal = una ficha; un campo plural ("Relaciones",
     "Multicuentas") = una ficha por línea (separadas por salto de línea). */
  function fichasDe(campos) {
    var out = [];
    campos.forEach(function (c) {
      if (!c.getAttribute('data-plural')) { out.push(leerFicha(c)); return; }
      var grupos = [document.createElement('div')];
      for (var n = c.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1 && n.nodeName.toLowerCase() === 'br') grupos.push(document.createElement('div'));
        else grupos[grupos.length - 1].appendChild(n.cloneNode(true));
      }
      grupos.forEach(function (g) { if (g.querySelector('img') || g.textContent.trim()) out.push(leerFicha(g)); });
    });
    return out;
  }

  var PESTANAS = ['Perfil', 'Red y lore', 'Multicuentas y logbook'];   // nombres de las pestañas del perfil
  var MIN_REL = 6, MIN_MULTI = 3;     // casillas mínimas (las que faltan salen con imagen placeholder)
  var IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)|placehold\.co|imgur|postimg|i\.ibb/i;

  /* Pestañas: si js-ajustes.js ya las creó se reutilizan; si no, se crean aquí igual. */
  function pestanas(raiz) {
    var top = raiz.querySelector('.rperfil__top'), cols = raiz.querySelector('.rperfil__cols');
    var bar = raiz.querySelector('.rperfil__tabs');
    if (!bar && top && cols) {
      bar = el('div', 'rperfil__tabs'); bar.setAttribute('role', 'tablist');
      var foot = raiz.querySelector('.rperfil__foot'), extra = document.getElementById('rperfil-extra');
      var ps = PESTANAS.map(function (n, i) {
        var p = el('div', 'rperfil__panel'); p.setAttribute('role', 'tabpanel'); p.hidden = !!i; return p;
      });
      cols.parentNode.insertBefore(ps[0], cols); ps[0].appendChild(cols);
      if (foot) ps[0].appendChild(foot);
      if (extra) ps[0].appendChild(extra);
      var ref = ps[0]; for (var k = 1; k < ps.length; k++) { ref.parentNode.insertBefore(ps[k], ref.nextSibling); ref = ps[k]; }
      var bs = PESTANAS.map(function (n, i) {
        var b = el('button', 'rperfil__tab' + (i ? '' : ' is-on'), n); b.type = 'button'; b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i ? 'false' : 'true');
        b.addEventListener('click', function () {
          bs.forEach(function (x, j) { x.classList.toggle('is-on', j === i); x.setAttribute('aria-selected', j === i ? 'true' : 'false'); ps[j].hidden = j !== i; });
        });
        bar.appendChild(b); return b;
      });
      top.parentNode.insertBefore(bar, top.nextSibling);
    }
    var paneles = raiz.querySelectorAll('.rperfil__panel');
    var botones = bar ? bar.querySelectorAll('.rperfil__tab') : [];
    for (var i = 0; i < botones.length; i++) if (PESTANAS[i]) botones[i].textContent = PESTANAS[i];
    for (var j = 0; j < paneles.length; j++) paneles[j].classList.remove('rperfil__panel--vacio');
    return paneles;
  }

  /* Ventana con la cabecera de tres puntos (igual que Inventario y medallero) */
  function ventanaPf(titulo) {
    var w = el('section', 'rperfil__win');
    w.appendChild(el('div', 'rinv__head', titulo));
    return w;
  }

  /* Lee un campo de ficha: imagen + nombre + descripcion (+ enlace). Formato libre:
     [img]url[/img] Nombre | Descripción breve | https://enlace */
  function leerFicha(c) {
    var d = { img: '', nombre: '', desc: '', link: '' };
    var t = c.cloneNode(true);
    var im = t.querySelector('img'); if (im) d.img = im.getAttribute('src') || '';
    Array.prototype.forEach.call(t.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(h)) { if (!d.img && IMG_RE.test(h) && !a.textContent.trim()) d.img = h; else if (!d.link) d.link = h; }
      if (a.querySelector('img') || /^https?:\/\//i.test(a.textContent.trim())) a.parentNode.removeChild(a);
    });
    Array.prototype.forEach.call(t.querySelectorAll('img'), function (i) { i.parentNode.removeChild(i); });
    Array.prototype.forEach.call(t.querySelectorAll('br,p,div'), function (b) { b.parentNode.insertBefore(document.createTextNode('\n'), b); });
    var partes = t.textContent.split(/\s*\|\s*|\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var resto = [];
    partes.forEach(function (x) {
      if (/^https?:\/\/\S+$/i.test(x)) { if (!d.img && IMG_RE.test(x)) d.img = x; else if (!d.link) d.link = x; }
      else resto.push(x);
    });
    d.nombre = resto[0] || ''; d.desc = resto.slice(1).join(' · ');
    return d;
  }

  /* ---- Paleta del perfil según el grupo del usuario --------------------------
     El color del grupo (el de su nombre en el foro) se toma, por orden, de:
       1. el propio perfil: un enlace a /uNN con color en línea (listas de conectados, etc.)
       2. una búsqueda de sus mensajes (/search?search_author=...), donde su nombre sale
          con el color de su grupo
       3. el mapa GRUPOS_PERFIL de abajo (por id de usuario), si quieres fijarlo a mano
     A partir de ese color se calculan el acento, su versión clara y oscura, el brillo y
     dos colores de apoyo, y se aplican SOLO dentro de #rperfil. Sin color de grupo (o con
     un gris/blanco/negro) se queda la paleta normal. En la consola: "[BTS] perfil: grupo → …". */
  var GRUPOS_PERFIL = {};   // ej. { 12: '#7ac1ff' }  (id de usuario → color)
  var COLORES_NEUTROS = /^(#?(fff(fff)?|000(000)?)|rgb\(\s*(0,\s*0,\s*0|255,\s*255,\s*255)\s*\))$/i;

  function aRgb(c) {
    c = (c || '').trim();
    var m = c.match(/^#([0-9a-f]{3})$/i); if (m) { var h = m[1]; return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]; }
    m = c.match(/^#([0-9a-f]{6})$/i); if (m) return [parseInt(m[1].substr(0, 2), 16), parseInt(m[1].substr(2, 2), 16), parseInt(m[1].substr(4, 2), 16)];
    m = c.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i); if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    var q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    return s ? [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(function (x) { return Math.round(x * 255); }) : [l, l, l].map(function (x) { return Math.round(x * 255); });
  }
  function hex(r) { return '#' + r.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

  function colorEnlace(doc, id) {
    var re = new RegExp('(^|/)u' + id + '(?!\\d)'), as = doc.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var h = as[i].getAttribute('href') || '';
      if (!re.test(h.split('?')[0].split('#')[0]) && !new RegExp('[?&]u=' + id + '(?!\\d)').test(h)) continue;
      var cands = [as[i]].concat(Array.prototype.slice.call(as[i].querySelectorAll('[style*="color"], font[color]')));
      for (var k = 0; k < cands.length; k++) {
        var c = (cands[k].style && cands[k].style.color) || cands[k].getAttribute('color') || '';
        if (c && aRgb(c) && !COLORES_NEUTROS.test(c)) return c;
      }
    }
    return '';
  }

  function aplicaPaleta(raiz, color, fuente) {
    var rgb = aRgb(color); if (!rgb) return;
    var hsl = rgb2hsl(rgb[0], rgb[1], rgb[2]);
    if (hsl[1] < .12 || hsl[2] > .93 || hsl[2] < .07) return;      /* gris, blanco o negro: se queda el tema */
    var h = hsl[0], s = Math.min(.85, Math.max(.35, hsl[1]));
    var base = hsl2rgb(h, s, .6), vivid = hsl2rgb(h, Math.min(.9, s + .05), .74), dark = hsl2rgb(h, s * .8, .3);
    var a2 = hsl2rgb(h + 40, s * .85, .76), a3 = hsl2rgb(h - 35, s * .85, .78);
    var rv = vivid.join(', '), st = raiz.style;
    var v = {
      '--burnthesky-red': hex(base), '--burnthesky-red-vivid': hex(vivid), '--burnthesky-red-dark': hex(dark),
      '--burnthesky-red-ghost': 'rgba(' + rv + ', .32)', '--burnthesky-red-ghost-2': 'rgba(' + rv + ', .16)',
      '--burnthesky-red-glow': 'rgba(' + rv + ', .38)', '--burnthesky-red-wash': 'rgba(' + rv + ', .07)',
      '--burnthesky-accent-rgb': rv, '--burnthesky-accent-2': hex(a2), '--burnthesky-accent-3': hex(a3),
      '--burnthesky-dot-1': hex(vivid), '--burnthesky-dot-2': hex(a3), '--burnthesky-dot-3': hex(a2),
      '--burnthesky-glow': '0 10px 34px rgba(' + rv + ', .14)', '--burnthesky-glow-hover': '0 12px 36px rgba(' + rv + ', .26)',
      '--burnthesky-soft-bg': 'linear-gradient(145deg, rgba(' + rv + ', .06), rgba(' + a2.join(', ') + ', .04) 60%, transparent)'
    };
    for (var k in v) st.setProperty(k, v[k]);
    raiz.setAttribute('data-bts-grupo', color);
    try { console.log('[BTS] perfil: grupo →', color, '(' + fuente + ')'); } catch (e) {}
  }

  function paletaPerfil(raiz) {
    var m = location.pathname.match(/\/u(\d+)(?!\d)/) || location.search.match(/[?&]u=(\d+)/);
    var id = m ? m[1] : '';
    if (!id) { try { console.log('[BTS] perfil: no encuentro el id del usuario en la URL'); } catch (e) {} return; }
    if (GRUPOS_PERFIL[id]) { aplicaPaleta(raiz, GRUPOS_PERFIL[id], 'GRUPOS_PERFIL'); return; }
    var guardado = ''; try { guardado = sessionStorage.getItem('bts-gc-' + id) || ''; } catch (e) {}
    if (guardado) { aplicaPaleta(raiz, guardado, 'caché'); return; }
    var c = colorEnlace(document, id);
    if (c) { try { sessionStorage.setItem('bts-gc-' + id, c); } catch (e) {} aplicaPaleta(raiz, c, 'enlace en esta página'); return; }
    var nombre = ((raiz.querySelector('[data-bind="usuario"]') || {}).textContent || '').trim();
    if (!nombre) { var al = raiz.querySelector('.rperfil__alias'); nombre = al ? al.textContent.trim() : ''; }
    if (!nombre || !window.fetch) return;
    fetch('/search?search_author=' + encodeURIComponent(nombre) + '&show_results=posts', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var doc = new DOMParser().parseFromString(t, 'text/html');
        var col = colorEnlace(doc, id);
        if (col) { try { sessionStorage.setItem('bts-gc-' + id, col); } catch (e) {} aplicaPaleta(raiz, col, 'búsqueda de sus mensajes'); }
        else { try { console.log('[BTS] perfil: no encontré el color del grupo de', nombre, '(id ' + id + '). Puedes fijarlo en GRUPOS_PERFIL.'); } catch (e) {} }
      }).catch(function () {});
  }

  function perfil() {
    var raiz = document.getElementById('rperfil');
    if (!raiz || raiz.getAttribute('data-bts-pf')) return;
    raiz.setAttribute('data-bts-pf', '1');

    /* botones de acción (buscar, editar, mensaje privado, correo) con icono */
    var as = raiz.querySelectorAll('.rperfil__actions a, .rperfil__contact a');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      var t = ((a.getAttribute('href') || '') + ' ' + (a.title || '') + ' ' + a.innerHTML).toLowerCase();
      for (var k = 0; k < PF_ACC.length; k++) {
        if (!PF_ACC[k][0].test(t)) continue;
        a.className += ' rcbtn';
        a.title = PF_ACC[k][2]; a.setAttribute('aria-label', PF_ACC[k][2]);
        a.innerHTML = '<i class="cp ' + PF_ACC[k][1] + '" aria-hidden="true"></i><span class="rcbtn__t">' + PF_ACC[k][2] + '</span>';
        break;
      }
    }

    /* campos del perfil */
    var f = {}, extras = [], playlist = null, poderes = null, detalle = null, aliado = null, aliadoDesc = null, apodos = null, curiosidades = null, cronologia = null, relaciones = [], multis = [], ooc = [];
    var rpf = raiz.querySelectorAll('#rperfil-campos .rpf');
    try { console.log('[BTS] perfil: campos →', Array.prototype.map.call(rpf, function (r) { var l0 = r.querySelector('.rpf-l'); return l0 ? slug(l0.textContent) : '?'; }).join(', ')); } catch (e0) {}
    for (var j = 0; j < rpf.length; j++) {
      var l = rpf[j].querySelector('.rpf-l'), c = rpf[j].querySelector('.rpf-c');
      if (!l || !c) continue;
      var sl = slug(l.textContent.replace(/\s*:\s*$/, '').replace(/\*/g, ''));
      var ex = null;
      for (var e = 0; e < EXTRAS.length; e++) if (EXTRAS[e][1].test(sl)) ex = EXTRAS[e][0];
      if (ex) extras.push({ t: ex, f: c });
      else if (/(^|-)(playlist|ost)(-|$)/.test(sl)) playlist = c;
      else if (/popularidad/.test(sl)) f.pop = c;
      else if (/autocontrol/.test(sl)) f.auto = c;
      else if (/aliad[oa].*descripcion|descripcion.*aliad[oa]/.test(sl)) aliadoDesc = c;
      else if (/(detalle|descripcion|explicacion).*poder|poder.*(detalle|descripcion|explicacion)/.test(sl)) detalle = c;
      else if (/aliad[oa].*(imagen|img)|(imagen|img).*aliad[oa]/.test(sl)) aliado = c;
      else if (/^poder-perfil|^poder(es)?$|^habilidades?$/.test(sl)) poderes = c;
      else if (/^apodos?$/.test(sl)) apodos = c;
      else if (/curiosid|curioso|trivia|secretos?$|notas-ocultas/.test(sl)) curiosidades = c;
      else if (/^cronologia/.test(sl)) cronologia = c;
      else if (/^(relacion|vinculo)/.test(sl)) { if (/^(relaciones|vinculos)$/.test(sl)) c.setAttribute('data-plural', '1'); relaciones.push(c); }
      else if (/^(multicuenta|alter|cuenta)/.test(sl)) { if (/^(multicuentas|alters|cuentas)$/.test(sl)) c.setAttribute('data-plural', '1'); multis.push(c); }
      else if (/^ooc(-|$)/.test(sl)) ooc.push({ l: l.textContent.replace(/\s*:\s*$/, '').replace(/^\s*ooc\s*[-:·]?\s*/i, '').trim() || 'OOC', c: c });
    }

    /* ---------- estructura en pestañas ---------- */
    var paneles = pestanas(raiz);
    var cols = raiz.querySelector('.rperfil__cols');
    var col = raiz.querySelector('.rperfil__avatar'), main = raiz.querySelector('.rperfil__main'),
        side = raiz.querySelector('.rperfil__side');
    function q1(s) { return raiz.querySelector(s); }
    function quita(n) { if (n && n.parentNode) n.parentNode.removeChild(n); return n; }

    /* ===== PESTAÑA 1 · columna izquierda ===== */
    if (col) {
      var rk = quita(q1('.rperfil__rank'));           /* el rango del foro pasa a la columna derecha */
      var box = el('div', 'rcontactfields rpf-bajo');
      var u = urlDe(playlist);
      if (u) box.appendChild(botonContacto('playlist', u, 'Playlist / OST', 'cp-music-note', true));
      EXTRAS.forEach(function (d) {
        for (var q2 = 0; q2 < extras.length; q2++) {
          if (extras[q2].t !== d[0]) continue;
          var url = urlDe(extras[q2].f);
          if (url) box.appendChild(botonContacto(d[0], url, d[3], d[2], true));
          break;
        }
      });
      if (box.firstChild) col.appendChild(box);

      /* navegación rápida: MP, mis mensajes, temas en los que participó, temas abiertos... */
      var acts = q1('.rperfil__actions');
      if (acts) {
        var todos = Array.prototype.slice.call(acts.querySelectorAll('a'));
        function por(re) { for (var z = 0; z < todos.length; z++) if (re.test(todos[z].title || '')) return todos[z]; return null; }
        var mp = por(/privado/i), bus = por(/buscar/i), mail = por(/correo/i), edit = por(/editar/i);
        var seq = [mp, bus];
        if (bus && bus.getAttribute('href')) {
          var h = bus.getAttribute('href');
          var conRes = function (v) { return /show_results=/.test(h) ? h.replace(/show_results=\w+/, 'show_results=' + v) : h + (/\?/.test(h) ? '&' : '?') + 'show_results=' + v; };
          var part = document.createElement('a'); part.href = conRes('topics');
          var abi = document.createElement('a'); abi.href = conRes('topics') + '&search_fields=firstpost';
          [[part, 'cp-chat-bubble-o', 'Temas en los que participó'], [abi, 'cp-add-o', 'Temas abiertos']].forEach(function (d) {
            d[0].className = 'rcbtn'; d[0].title = d[2]; d[0].setAttribute('aria-label', d[2]);
            d[0].innerHTML = '<i class="cp ' + d[1] + '" aria-hidden="true"></i><span class="rcbtn__t">' + d[2] + '</span>';
            seq.push(d[0]);
          });
        }
        seq.push(mail, edit);
        seq.forEach(function (a2) { if (a2) acts.appendChild(a2); });
        quita(acts.querySelector('.rperfil__contact'));
        acts.classList.add('rperfil__nav');
        if (box.firstChild) col.insertBefore(el('hr', 'rperfil__sep'), box.nextSibling);
        col.appendChild(acts);
      }

    }

    /* ===== PESTAÑA 1 · columna central ===== */
    if (main) {
      var idb = q1('.rperfil__id'), qq = q1('.rperfil__quote');
      if (qq && idb && idb.nextSibling !== qq) idb.parentNode.insertBefore(qq, idb.nextSibling);
      var nk = q1('.rperfil__nicks');
      if (nk && !nk.getAttribute('data-bts-one')) {
        var txt = apodos && apodos.textContent.replace(/\s+/g, '').length ? apodos.innerHTML
          : Array.prototype.map.call(nk.querySelectorAll('span'), function (x) { return x.textContent; }).join(', ');
        if (txt) { nk.innerHTML = ''; var one = document.createElement('span'); one.innerHTML = txt; nk.appendChild(one); nk.classList.remove('is-empty'); }
        nk.setAttribute('data-bts-one', '1');
      }
      var ub = q1('[data-slot="ubicacion"]'); if (ub) ub.classList.remove('rtile--wide');
      quita(q1('.rperfil__powers-wrap'));
    }

    /* ===== PESTAÑA 1 · columna derecha ===== */
    var nivel = q1('[data-slot="nivel"]'), rango = q1('[data-slot="rango"]'), creditos = q1('[data-slot="creditos"]');
    var credTxt = creditos ? (creditos.querySelector('.rtile__v') || creditos).textContent.trim() : '';
    var info = el('div', 'rperfil__info');
    var pTile = el('div', 'rstat rstat--power rstat--poder');
    var pv = el('span', 'rtile__v'), pl = el('span', 'rtile__l', 'Poder');
    if (poderes && poderes.textContent.replace(/\s+/g, '').length) pv.innerHTML = poderes.innerHTML;
    else { pv.textContent = '—'; pTile.classList.add('is-empty'); }
    pTile.appendChild(pv); pTile.appendChild(pl);
    var desc = el('div', 'rperfil__powerdesc');
    if (detalle && detalle.textContent.replace(/\s+/g, '').length) { desc.innerHTML = htmlUsuario(detalle); desc.classList.add('tiene'); }
    else { desc.textContent = 'Sin detalles del poder.'; desc.classList.add('vacio'); }
    if (rango) info.appendChild(rango);
    if (rk) info.appendChild(rk);
    info.appendChild(barras(f));
    quita(creditos); quita(q1('.rperfil__stats'));
    var banner = q1('.rperfil__banner');
    if (side) {
      if (banner) side.insertBefore(info, banner.nextSibling); else side.appendChild(info);
    }
    /* nivel de poder, poder y barras: bajo el avatar, encima de los botones */
    if (col) {
      var pb = el('div', 'rperfil__powerbox');
      if (nivel) pb.appendChild(nivel);
      pb.appendChild(pTile);
      pb.appendChild(desc);
      var avi = col.querySelector('.rperfil__avatarimg');
      col.insertBefore(pb, avi ? avi.nextSibling : col.firstChild);
    }
    /* Curiosidades: terminal bajo las barras (pestaña 1) */
    {
  var w2 = el('section', 'rperfil__win rperfil__win--nohead'), term = el('div', 'rterm');
  var alias = (q1('.rperfil__alias') || {}).textContent || '';
  term.appendChild(el('div', 'rterm__l', '> acceso concedido · expediente de ' + alias.trim()));
  term.appendChild(el('div', 'rterm__l', '> biografía y notas ocultas'));
  
  var cu = el('div', 'rterm__body');
  
  // Seleccionamos el textarea u elemento con el ID exacto de la captura
  var campoCuriosidades = document.getElementById('profile_field_2_25');

  // Obtenemos el texto correctamente dependiendo de si es un campo de formulario (.value) o un contenedor de texto (.textContent)
  var textoCuriosidades = campoCuriosidades ? (campoCuriosidades.value || campoCuriosidades.textContent || '') : '';

  if (textoCuriosidades.replace(/\s+/g, '').length) {
    // Si tienes una función para formatear el HTML del usuario, úsala aquí, o asigna el texto directamente
    cu.innerHTML = typeof htmlUsuario === 'function' ? htmlUsuario(campoCuriosidades) : textoCuriosidades;
  } else { 
    cu.textContent = 'Sin registros. Archivo vacío.'; 
    cu.classList.add('vacio'); 
  }
  
  term.appendChild(cu);
  term.appendChild(el('div', 'rterm__l rterm__cur', '> '));
  w2.appendChild(term);
  if (main) main.appendChild(w2);
}

    /* ===== PESTAÑA 2 · red de contactos y lore ===== */
    if (paneles[1]) {
      var w1 = ventanaPf('Relaciones'), rg = el('div', 'rrel');
      var n = 0;
      fichasDe(relaciones).forEach(function (d) {
        var it = el('div', 'rrel__it'), ph = el('div', 'rrel__ph'), imx = document.createElement('img');
        imx.src = d.img || 'https://placehold.co/100'; imx.alt = d.nombre || 'Vínculo';
        ph.appendChild(imx); it.appendChild(ph);
        it.appendChild(el('b', 'rrel__n', d.nombre || 'Sin nombre'));
        if (d.desc) it.appendChild(el('span', 'rrel__d', d.desc));
        if (d.link) { var aa = document.createElement('a'); aa.href = d.link; aa.className = 'rrel__a'; aa.appendChild(it); rg.appendChild(aa); }
        else rg.appendChild(it);
        n++;
      });
      for (; n < MIN_REL; n++) {
        var vi = el('div', 'rrel__it vacio'), vp = el('div', 'rrel__ph'), vimg = document.createElement('img');
        vimg.src = 'https://placehold.co/100'; vimg.alt = ''; vp.appendChild(vimg); vi.appendChild(vp);
        vi.appendChild(el('b', 'rrel__n', 'Sin vínculo')); rg.appendChild(vi);
      }
      w1.appendChild(rg);
      paneles[1].appendChild(w1);

      /* alianza (imagen + cuadro) a la izquierda y Cronología a la derecha, debajo de las relaciones */
      var w5 = ventanaPf('Alianza y cronología'), ag = el('div', 'ralian'), izq = el('div', 'ralian__l');
      var al = el('div', 'rperfil__ally'), im = aliado && aliado.querySelector('img');
      if (!im && aliado) { var uu = urlDe(aliado); if (uu) { im = document.createElement('img'); im.src = uu; im.alt = 'Aliado'; } }
      if (!im) { im = document.createElement('img'); im.src = 'https://placehold.co/250x150'; im.alt = 'Aliado'; al.classList.add('vacio'); }
      al.appendChild(im.cloneNode(true));
      izq.appendChild(al);
      var dd = el('div', 'ralian__d');
      var ti = quita(q1('[data-slot="alianza"]')); if (ti) dd.appendChild(ti);
      var ad = el('div', 'ralian__txt');
      if (aliadoDesc && aliadoDesc.textContent.replace(/\s+/g, '').length) ad.innerHTML = htmlUsuario(aliadoDesc);
      else { ad.textContent = 'Sin descripción.'; ad.classList.add('vacio'); }
      dd.appendChild(ad); izq.appendChild(dd);
      var der = el('div', 'ralian__r'), cr = el('div', 'rcrono');
      cr.appendChild(el('h3', 'rcrono__t', 'Cronología'));
      var cb = el('div', 'rcrono__b');
      if (cronologia && cronologia.textContent.replace(/\s+/g, '').length) cb.innerHTML = htmlUsuario(cronologia);
      else { cb.textContent = 'Sin cronología.'; cb.classList.add('vacio'); }
      cr.appendChild(cb); der.appendChild(cr);
      ag.appendChild(izq); ag.appendChild(der); w5.appendChild(ag);
      paneles[1].appendChild(w5);
    }

    /* ===== PESTAÑA 3 · multicuentas y logbook ===== */
    if (paneles[2]) {
      var w3 = ventanaPf('Multicuentas'), mg = el('div', 'rmulti'), m = 0;
      fichasDe(multis).forEach(function (d) {
        var tile = d.link ? document.createElement('a') : document.createElement('div');
        tile.className = 'rmulti__it';
        if (d.link) tile.href = d.link;
        var imm = document.createElement('img'); imm.src = d.img || 'https://placehold.co/250x150'; imm.alt = d.nombre || 'Multicuenta';
        tile.appendChild(imm);
        if (d.nombre) tile.appendChild(el('span', 'rmulti__n', d.nombre));
        mg.appendChild(tile); m++;
      });
      for (; m < MIN_MULTI; m++) {
        var vt = el('div', 'rmulti__it vacio'), vim = document.createElement('img');
        vim.src = 'https://placehold.co/250x150'; vim.alt = ''; vt.appendChild(vim); mg.appendChild(vt);
      }
      /* carrusel lateral: flechas que desplazan una multicuenta */
      var carr = el('div', 'rmulti-wrap');
      var bPrev = el('button', 'rmulti__arrow rmulti__arrow--prev', '‹'), bNext = el('button', 'rmulti__arrow rmulti__arrow--next', '›');
      bPrev.type = bNext.type = 'button'; bPrev.setAttribute('aria-label', 'Anterior'); bNext.setAttribute('aria-label', 'Siguiente');
      function paso(dir) { var it = mg.querySelector('.rmulti__it'); mg.scrollBy({ left: dir * ((it ? it.offsetWidth : 250) + 14), behavior: 'smooth' }); }
      bPrev.addEventListener('click', function () { paso(-1); });
      bNext.addEventListener('click', function () { paso(1); });
      function flechas() {
        bPrev.hidden = mg.scrollLeft < 4;
        bNext.hidden = mg.scrollLeft + mg.clientWidth >= mg.scrollWidth - 4;
      }
      mg.addEventListener('scroll', flechas);
      window.addEventListener('resize', flechas);
      carr.appendChild(bPrev); carr.appendChild(mg); carr.appendChild(bNext);
      w3.appendChild(carr);
      paneles[2].appendChild(w3);   /* (se añade ya para poder medir) */
      flechas(); setTimeout(flechas, 300);

      var w4 = ventanaPf('Logbook OOC'), lg = el('div', 'rlog');
      var tip = function (s) { var b = q1(s + ' .rdate__tip'); return b ? b.textContent.replace(/^[^·]*·\s*/, '').trim() : ''; };
      var cal = q1('.rdate--cal'), reg = tip('.rdate--cal') || (cal && (cal.getAttribute('data-fallback') || '').trim()) || '';
      var nac = tip('.rdate--cake');
      var lastB = q1('.rperfil__last b'), msgB = q1('.rperfil__stat b'), onl = q1('.rperfil__online');
      var filas = [
        ['Última visita', lastB ? lastB.textContent.trim() : ''],
        ['Estado', onl ? onl.innerHTML.trim() : '', true],
        ['Registro', reg],
        ['Cumpleaños', /sin fecha/i.test(nac) ? '' : nac],
        ['Mensajes', msgB ? msgB.textContent.trim() : ''],
        ['Créditos', credTxt]
      ];
      ooc.forEach(function (o) { filas.push([o.l, o.c.innerHTML.trim(), true]); });
      filas.forEach(function (r) {
        var row = el('div', 'rlog__row'), lb = el('span', 'rlog__l', r[0]), vv = el('span', 'rlog__v');
        if (r[1] && r[1] !== '—') { if (r[2]) vv.innerHTML = r[1]; else vv.textContent = r[1]; } else { vv.textContent = '—'; row.classList.add('is-empty'); }
        row.appendChild(lb); row.appendChild(vv); lg.appendChild(row);
      });
      w4.appendChild(lg);
      paneles[2].appendChild(w4);
    }
    paletaPerfil(raiz);
    /* hover por coordenadas: funciona aunque algo transparente tape las imágenes */
    if (!raiz.getAttribute('data-bts-hv')) {
      raiz.setAttribute('data-bts-hv', '1');
      var marca = function (x, y) {
        Array.prototype.forEach.call(raiz.querySelectorAll('.rrel__it, .rmulti__it'), function (t) {
          var r = t.getBoundingClientRect();
          t.classList.toggle('is-hover', x != null && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
        });
      };
      document.addEventListener('mousemove', function (e) { if (raiz.querySelector('.rperfil__panel:not([hidden]) .rrel, .rperfil__panel:not([hidden]) .rmulti')) marca(e.clientX, e.clientY); }, { passive: true });
      document.addEventListener('mouseleave', function () { marca(null, null); });
    }
    /* los botones de nacimiento e inscripción ya no se muestran: sus datos están en el Logbook */
    Array.prototype.forEach.call(raiz.querySelectorAll('.rdate'), quita);
  }

  /* ---- Índice v3: tarjeta de foro (título + cifras, descripción, enlaces, imagen,
     último tema, último autor con avatar circular) -------------------------------
     Reconstruye cada fila de .forabg ul.topiclist.forums (índice y caja de
     subforos) con las piezas que ya trae: título, FORUM_DESC (.rfordesc,
     .rforlinks, .rforimg o texto plano), cifras y último mensaje. Lo original se
     conserva oculto. Para volver a la estructura anterior: INDICE_V3 = false. */
  var INDICE_V3 = true;

  function indiceV3() {
    if (!INDICE_V3) return;
    var filas = document.querySelectorAll('.forabg ul.topiclist.forums > li.row');
    for (var i = 0; i < filas.length; i++) {
      var li = filas[i];
      if (li.getAttribute('data-bts-c3')) continue;
      li.setAttribute('data-bts-c3', '1');
      var h = li.querySelector('.hierarchy'), dl = li.querySelector('dl.icon');
      if (!h || !dl) continue;
      var tit = h.querySelector('a.forumtitle') || h.querySelector('a');
      var dt = dl.querySelector('dd.topics'), dp = dl.querySelector('dd.posts'), dlp = dl.querySelector('dd.lastpost');
      var num = function (n) { var m = n ? n.textContent.match(/\d[\d.,]*/) : null; return m ? m[0] : '0'; };

      /* descripción: .rsingleforum / .rdoubleforum o cualquier contenido entre el título y las cifras */
      var cont = li.querySelector('.rsingleforum, .rdoubleforum');
      var desc = null, links = null, img = null;
      if (cont) {
        desc = cont.querySelector('.rfordesc'); links = cont.querySelector('.rforlinks'); img = cont.querySelector('.rforimg');
      } else {
        desc = document.createElement('div');
        for (var n = h.nextSibling; n && n !== dl; n = n.nextSibling) desc.appendChild(n.cloneNode(true));
      }

      var card = el('div', 'rc3');
      /* cabecera */
      var head = el('div', 'rc3__head');
      var t = el('a', 'rc3__title'); t.href = tit ? tit.getAttribute('href') : '#'; t.innerHTML = tit ? tit.innerHTML : h.textContent;
      head.appendChild(t); head.appendChild(el('span', 'rc3__line'));
      head.appendChild(el('span', 'rc3__badge', num(dt) + ' temas'));
      head.appendChild(el('span', 'rc3__badge', num(dp) + ' msgs'));
      card.appendChild(head);
      /* texto */
      var cd = el('div', 'rc3__desc');
      if (desc && desc.textContent.replace(/\s+/g, '').length) cd.innerHTML = desc.innerHTML; else cd.classList.add('vacio');
      card.appendChild(cd);
      /* enlaces (chips) */
      if (links && links.querySelector('a')) {
        var ch = el('div', 'rc3__chips'); ch.innerHTML = links.innerHTML; card.appendChild(ch);
      }
      /* columna derecha: imagen, avatar, último tema y último autor */
      var side = el('div', 'rc3__side');
      var bg = img ? (img.style.backgroundImage || '') : '';
      if (bg) {
        var im = el('div', 'rc3__img'); im.style.backgroundImage = bg; side.appendChild(im);
        li.style.setProperty('--rc3-img', bg);
      }
      var av = dlp ? dlp.querySelector('.lastpost-avatar img') : null;
      var topic = dlp ? dlp.querySelector('a[href*="/t"], a[title]') : null;
      var user = null;
      if (dlp) { var as = dlp.querySelectorAll('a'); for (var k = 0; k < as.length; k++) if (/\/u\d+/.test(as[k].getAttribute('href') || '') && as[k].textContent.trim()) { user = as[k]; break; } }
      var ultimo = null;
      if (dlp) { var as2 = dlp.querySelectorAll('a'); for (var q = 0; q < as2.length; q++) if (/#\d+|[?&]p=|\/p\d+/.test(as2[q].getAttribute('href') || '') && as2[q] !== user && !as2[q].textContent.trim()) { ultimo = as2[q]; break; } }
      if (topic || user) {
        if (av) { var aw = el('a', 'rc3__av'); aw.href = user ? user.getAttribute('href') : '#'; var ai = document.createElement('img'); ai.src = av.getAttribute('src'); ai.alt = user ? user.textContent : ''; ai.loading = 'lazy'; aw.appendChild(ai); side.appendChild(aw); }
        else side.classList.add('sin-av');
        if (topic) {
          var b1 = el('a', 'rc3__btn'); b1.href = topic.getAttribute('href'); b1.title = topic.getAttribute('title') || topic.textContent; b1.textContent = topic.textContent.trim(); side.appendChild(b1);
        }
        if (user) {
          var b2 = el('a', 'rc3__btn rc3__btn--user'); b2.href = (ultimo || user).getAttribute('href');
          b2.title = user.textContent.trim() + ' · ' + (dlp.textContent.match(/\d{1,2}[:h]\d{2}[^\n]*$/) || [''])[0];
          b2.appendChild(el('span', 'rc3__uname', user.textContent.trim())); b2.appendChild(el('span', 'rc3__arrow', '→'));
          var col = window.getComputedStyle(user).color; if (col) b2.style.setProperty('--user-color', col);
          side.appendChild(b2);
        }
      } else {
        side.appendChild(el('span', 'rc3__btn rc3__btn--none', 'Sin mensajes'));
      }
      card.appendChild(side);
      li.classList.add('rc3-row');
      li.appendChild(card);
    }
  }

  var avisado = false;

  function arrancar() {
    try { iconosPost(); botonesTema(); perfil(); indiceV3(); } catch (e) {}
    var posts = document.querySelectorAll('.post');
    for (var n = 0; n < posts.length; n++) {
      var post = posts[n];
      if (post.getAttribute('data-bts-post')) continue;
      var campos = post.querySelectorAll('.postprofile .postprofile-field');
      var iconBox = post.querySelector('.rtopicicon'), frBox = post.querySelector('.rphrase'),
          poBox = post.querySelector('.rpower'), invBox = post.querySelector('.rpost-inv');
      if (!iconBox && !frBox && !poBox && !invBox) continue;   // mensaje oculto u otra plantilla
      post.setAttribute('data-bts-post', '1');

      var nombres = [], f = {};
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i], nm = nombre(c);
        nombres.push(nm || '(sin nombre)');
        if (es(c, CLAVES.oculto)) { c.parentNode.removeChild(c); continue; }
        var ex = tipoExtra(c);
        if (ex) { (f.extras = f.extras || []).push({ t: ex, f: c }); continue; }
        if (!f.playlist && esPlaylist(c)) f.playlist = c;
        else if (!f.icono && es(c, CLAVES.icono) && c.querySelector('img')) f.icono = c;
        else if (!f.frase && es(c, CLAVES.frase)) f.frase = c;
        else if (!f.poder && (slug(nombre(c)) === 'poder' || es(c, CLAVES.poder))) f.poder = c;
        else if (!f.pop && es(c, CLAVES.pop)) f.pop = c;
        else if (!f.auto && es(c, CLAVES.auto)) f.auto = c;
        else if (!f.imp1 && esImplante(c, 1)) f.imp1 = c;
        else if (!f.imp2 && esImplante(c, 2)) f.imp2 = c;
        else if (!f.inv && es(c, CLAVES.inv)) f.inv = c;
        else if (!f.med && es(c, CLAVES.med)) f.med = c;
      }
      if (!avisado) {
        avisado = true;
        try { console.log('[BTS] post: campos de perfil encontrados →', nombres.length ? nombres.join(' | ') : '(ninguno: el usuario no tiene campos rellenos)'); } catch (e) {}
      }

      /* icono -> cuadro del nombre */
      if (iconBox) {
        var img = f.icono && f.icono.querySelector('img');
        if (img) { iconBox.innerHTML = ''; iconBox.appendChild(img); iconBox.classList.add('tiene'); f.icono.parentNode.removeChild(f.icono); }
        else hueco(iconBox, '');
      }

      /* frase y poder debajo del avatar */
      if (frBox) {
        if (f.frase && !vacio(f.frase)) { frBox.appendChild(f.frase); frBox.classList.add('tiene'); }
        else { if (f.frase) f.frase.parentNode.removeChild(f.frase); hueco(frBox, 'sin frase'); }
      }
      if (poBox) {
        if (f.poder && !vacio(f.poder)) {
          var lb = f.poder.querySelector('.postprofile-field-label'); if (lb) lb.textContent = 'Poder:';
          poBox.appendChild(f.poder); poBox.classList.add('tiene');
        }
        else { if (f.poder) f.poder.parentNode.removeChild(f.poder); hueco(poBox, 'sin poder'); }
      }

      /* botones de contacto (perfil, MP, playlist) */
      contactos(post, f.playlist, f.extras);
      if (f.playlist && f.playlist.parentNode) f.playlist.parentNode.removeChild(f.playlist);

      /* barras Popularidad / Autocontrol, debajo del poder */
      var yaBarras = post.querySelector('.rbars');
      if (yaBarras) yaBarras.parentNode.removeChild(yaBarras);
      var ancla = poBox || frBox || post.querySelector('.ravatar');
      if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(barras(f), ancla.nextSibling);
      ['pop', 'auto'].forEach(function (k) { if (f[k] && f[k].parentNode) f[k].parentNode.removeChild(f[k]); });

      /* implantes, inventario y medallero: ventana debajo del mensaje */
      if (invBox) {
        invBox.innerHTML = '';
        invBox.appendChild(ventana(f));
        invBox.style.display = '';
        invBox.classList.add('tiene');
        if (!(f.imp1 && !vacio(f.imp1)) && !(f.imp2 && !vacio(f.imp2)) && !(f.inv && !vacio(f.inv)) && !(f.med && !vacio(f.med)))
          invBox.classList.add('sin-datos');
        ['imp1', 'imp2', 'inv', 'med'].forEach(function (k) {
          if (f[k] && f[k].parentNode) f[k].parentNode.removeChild(f[k]);
        });
      }

      /* panel al pasar el ratón por el avatar: solo los datos de DATOS que el usuario rellena */
      var pc = post.querySelector('.ravatar .rprofilecontent');
      if (pc) {
        var filas = panelDatos(campos);
        pc.innerHTML = '';
        filas.forEach(function (x) { pc.appendChild(x); });
        if (!filas.length) pc.style.display = 'none';
      }
    }
  }

  function tarde() { setTimeout(arrancar, 0); setTimeout(function () { try { iconosPost(); botonesTema(); perfil(); indiceV3(); } catch (e) {} }, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarde);
  else tarde();
}();

/* --- js-subforos.js --- */
(function(){
/* --- subforos: solo con lista de temas --- */
/* Las comprobaciones se hacen con el DOM listo: si el script carga en la cabecera, aún no existe nada. */
function btsRun(){
if (!document.querySelector('ul.topiclist.topics')) return;
/* Subforos: solo para los subforos.
   Marco .rbgimg en cabeceras y filas, y color del autor del último mensaje
   como --user-color de la fila. */
jQuery(document).ready(function() {

  $(".forumbg li.header dl.icon dt").html('<div class="rbgimg"></div><b>' + $(".forumbg li.header dl.icon dt").html() + '</b>');
  $("ul.topiclist li.row dl.icon").append('<div class="rbgimg"></div>');
  $("#info_open").css("display", "none");
  
  $('ul.topiclist.topics li.row').each(function( index ) {
    let color = $(this).find('dd.lastpost .color-groups').css('color');
     $(this).get(0).style.setProperty("--user-color", color);
  });
  
});

}
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", btsRun); } else { btsRun(); }
})();
/* --- js-categorias.js --- */
/* Categorías: índice y páginas con subforos (lista de foros).
   Pasa el color del grupo de quien escribió el último mensaje a cada tarjeta
   como --user-color: la hoja lo usa para la franja lateral y el borde al pasar
   el ratón. Si el foro no tiene mensajes, no se pone nada y la hoja usa el
   rojo del tema.

   Patrón setInterval (no $(document).ready): en Foroactivo el orden de
   ejecución de los scripts no es fiable. Comprueba cada 100 ms, hasta 5 s. */
(function () {
  var intentos = 0;
  var t = setInterval(function () {
    intentos++;
    var filas = document.querySelectorAll(".forabg ul.topiclist.forums li.row");
    if (filas.length) {
      clearInterval(t);
      for (var i = 0; i < filas.length; i++) {
        var u = filas[i].querySelector("dd.lastpost .color-groups");
        if (!u) continue;
        var c = window.getComputedStyle(u).color;
        if (c) filas[i].style.setProperty("--user-color", c);
      }
    } else if (intentos > 50) {
      clearInterval(t);
    }
  }, 100);
})();
/* --- js-perfil.js --- */
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
/* --- js-limpieza.js --- */
/* Quita el texto por defecto de Foroactivo: "Tu última visita fue…", "Fecha y hora actual…"
   y la tira de enlaces (mensajes desde la última visita, tus mensajes, sin respuesta,
   marcar foros como leídos). Espera al DOM porque el script va en <head>. */
(function () {
  function limpiar() {
    var main = document.getElementById("main-content") || document.body;
    var hide = function (el) { if (el && el.style) el.style.display = "none"; };

    /* 1. Párrafos de texto suelto */
    main.querySelectorAll("p").forEach(function (p) {
      if (p.closest("#rperfil")) return;
      var t = p.textContent.replace(/\s+/g, " ").trim();
      if (/^Tu .ltima visita fue/i.test(t) || /^Fecha y hora actual/i.test(t)) hide(p);
    });

    /* 2. Tira de enlaces: se oculta el contenedor más alto que solo contenga esos enlaces */
    var SEL = 'a[href*="search_id=newposts"], a[href*="search_id=egosearch"], a[href*="search_id=unanswered"], a[href*="mark=forums"]';
    var enlaces = main.querySelectorAll(SEL);
    if (!enlaces.length) return;
    var esDelSet = function (a) { return a.matches(SEL); };
    var soloEnlaces = function (el) {
      var as = el.querySelectorAll("a");
      for (var i = 0; i < as.length; i++) if (!esDelSet(as[i])) return false;
      var resto = el.cloneNode(true);
      resto.querySelectorAll("a").forEach(function (a) { a.remove(); });
      return !resto.textContent.replace(/[\s|·•\-–—:,]+/g, "").length && !resto.querySelector("img, form, input");
    };
    enlaces.forEach(function (a) {
      if (a.closest("#rperfil, .rdb, #cp-main")) return;
      var el = a;
      while (el.parentElement && el.parentElement !== main && soloEnlaces(el.parentElement)) el = el.parentElement;
      hide(el);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", limpiar);
  else limpiar();
})();

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
  /* Formatos que usa el foro: "Hoy a las 23:04", "Ayer a las 10:00", "11/10/2026 22:00"
     y "Dom 11 Oct 2026 - 21:21". `ref` = fecha y hora actuales del foro. */
  function fechaDe(txt, ref) {
    txt = (txt || "").replace(/\s+/g, " ").trim();
    var h = txt.match(/(\d{1,2}):(\d{2})/), hh = h ? +h[1] : 0, mm = h ? +h[2] : 0, d;
    if (/^hoy/i.test(norm(txt))) { d = new Date(ref || new Date()); d.setHours(hh, mm, 0, 0); return d; }
    if (/^ayer/i.test(norm(txt))) { d = new Date(ref || new Date()); d.setDate(d.getDate() - 1); d.setHours(hh, mm, 0, 0); return d; }
    var n = txt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (n) return new Date(+n[3], +n[2] - 1, +n[1], hh, mm);
    var m = txt.match(/(\d{1,2})\s+([A-Za-zñÑ]{3})\.?\s+(\d{4})/);
    if (!m) return null;
    var mes = MESES[norm(m[2]).slice(0, 3)];
    return mes === undefined ? null : new Date(+m[3], mes, +m[1], hh, mm);
  }
  function ahoraDelForo() {
    var el = document.querySelector(".rcurrtime");
    return (el && fechaDe(el.textContent, null)) || new Date();
  }
  function leerPagina(url, ref) {
    return fetch(url, { credentials: "same-origin" }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var out = [], idx = -1, filas = doc.querySelectorAll("table#memberlist tr, tr");
      for (var i = 0; i < filas.length && idx < 0; i++) {
        var hs = filas[i].querySelectorAll("th");
        for (var c = 0; c < hs.length; c++) if (/visita|activ/i.test(hs[c].textContent + " " + hs[c].className)) { idx = c; break; }
      }
      if (idx < 0) return null;
      var vistos = [];
      filas.forEach(function (tr) {
        if (tr.querySelector("th") || vistos.indexOf(tr) > -1) return;
        vistos.push(tr);
        var celdas = tr.children;
        var link = Array.prototype.filter.call(tr.querySelectorAll("a[href]"), function (x) { return /\/u\d+/.test(x.getAttribute("href")); })[0];
        if (!link || celdas.length <= idx) return;
        var f = fechaDe(celdas[idx].textContent, ref);
        if (!f) return;
        var sp = link.querySelector("[style*='color']");
        out.push({ nombre: link.textContent.replace(/ /g, " ").trim(), href: link.getAttribute("href"), fecha: f, color: (sp && sp.style.color) || link.style.color || "" });
      });
      return out;
    });
  }
  /* Recorre hasta 6 páginas (30 miembros cada una) de una lista de miembros */
  function leerMiembros(base, ref) {
    var todos = [];
    var paso = function (n) {
      var url = base + (base.indexOf("?") > -1 ? "&" : "?") + "start=" + (n * 30);
      return leerPagina(url, ref).then(function (m) {
        if (m === null) return n === 0 ? null : todos;
        todos = todos.concat(m);
        return (m.length >= 30 && n < 5) ? paso(n + 1) : todos;
      });
    };
    return paso(0);
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
      var enlaces = usuarios.map(function (u) {
        var a = document.createElement("a");
        a.className = "r48__u"; a.href = u.href; a.textContent = u.nombre;
        var c = u.color || colorPagina(u.href);
        if (c) a.style.color = c;
        return a;
      });
      conSeparadores(lista, enlaces);
    };
    var ahora = ahoraDelForo(), limite = ahora.getTime() - 48 * 3600 * 1000;
    var clave = "bts-48h", guardado = null;
    try { guardado = JSON.parse(sessionStorage.getItem(clave) || "null"); } catch (e) {}
    if (guardado && Date.now() - guardado.t < 300000) { pintar(guardado.u); return; }
    var urls = ["/memberlist?mode=lastvisit&order=DESC", "/memberlist"];
    var intentar = function (i) {
      if (i >= urls.length) {
        if (nativo) lista.textContent = nativo;
        else lista.innerHTML = '<span class="r48__vacio">No se pudo leer la última visita de los miembros.</span>';
        if (window.console) console.info("[BTS] 48h: la lista de miembros no trae columna de última visita.");
        return;
      }
      leerMiembros(urls[i], ahora).then(function (m) {
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

  /* Color de grupo de un usuario: el que trae su enlace en la lista de miembros; si falta,
     se busca en cualquier otro enlace a su perfil de la página (autores de mensajes, último usuario…). */
  function colorDeEnlace(a) {
    if (!a) return "";
    var sp = a.querySelector("[style*='color'], font[color]");
    if (sp) return sp.style.color || sp.getAttribute("color") || "";
    return a.style.color || "";
  }
  var mapaColores = null;
  function colorPagina(href) {
    if (!mapaColores) {
      mapaColores = {};
      document.querySelectorAll("a[href*='/u']").forEach(function (a) {
        var h = a.getAttribute("href"), c = colorDeEnlace(a);
        if (c && !mapaColores[h]) mapaColores[h] = c;
      });
    }
    return mapaColores[href] || "";
  }
  /* Nombres separados por " · " (sin cajas) */
  function conSeparadores(lista, enlaces) {
    lista.innerHTML = "";
    enlaces.forEach(function (a, i) {
      if (i) { var sp = document.createElement("span"); sp.className = "r48__sep"; sp.textContent = " · "; lista.appendChild(sp); }
      lista.appendChild(a);
    });
  }

  /* "¿Quién está en línea?": los nombres pasan al mismo estilo de etiqueta que los de 48h
     (se quitan las comas y el texto suelto; la etiqueta "Usuarios registrados:" queda arriba) */
  function estiloConectados() {
    var caja = document.querySelector("#rstatscontainer .rloggedinlist");
    if (!caja || caja.querySelector(".r48__list")) return;
    var enlaces = Array.prototype.slice.call(caja.querySelectorAll("a[href]"));
    if (!enlaces.length) return;
    var primero = enlaces[0], etiqueta = "";
    var n = caja.firstChild;
    while (n && !(n === primero || (n.contains && n.contains(primero)))) { etiqueta += n.textContent; n = n.nextSibling; }
    etiqueta = etiqueta.replace(/\s+/g, " ").trim();
    var lista = document.createElement("div");
    lista.className = "r48__list";
    enlaces.forEach(function (a) {
      a.classList.add("r48__u");
      if (!colorDeEnlace(a)) { var c = colorPagina(a.getAttribute("href")); if (c) a.style.color = c; }
    });
    conSeparadores(lista, enlaces);
    caja.innerHTML = "";
    if (etiqueta) { var l = document.createElement("div"); l.className = "rlog__label"; l.textContent = etiqueta; caja.appendChild(l); }
    caja.appendChild(lista);
  }

  /* Barra lateral: imagen de 130x130 con el campo de perfil "Icono" del usuario conectado.
     Se lee de su propia página de perfil (misma web). Si ya existe un .bts-sidebar-avatar
     (por ejemplo el que crea otro bloque del bts.js) lo reutiliza en vez de duplicarlo.
     Sin campo Icono usa el avatar del foro; invitados: no se pinta nada. */
  function iconoSidebar() {
    var log = function (m) { if (window.console) console.info("[BTS] icono: " + m); };
    var nav = document.querySelector("#page-header .navbar");
    if (!nav) { log("no hay .navbar"); return true; }
    var ud = window._userdata, id = ud && +ud.user_id;
    if (!id || id < 1) { log("invitado o sin _userdata"); return true; }
    var host = nav.querySelector(".inner") || nav;
    var caja = nav.querySelector(".bts-sidebar-avatar");
    if (caja && caja.getAttribute("data-icono")) return true;
    if (!caja) {
      caja = document.createElement("a");
      caja.className = "bts-sidebar-avatar";
      host.insertBefore(caja, host.firstChild);
    }
    caja.setAttribute("data-icono", "1");
    if (caja.tagName === "A") { caja.href = "/u" + id; caja.title = ud.username || ""; }
    var vacia = !caja.querySelector("img");
    var poner = function (src, origen) {
      if (!src) return false;
      caja.innerHTML = "";
      var im = new Image();
      im.alt = ""; im.src = src;
      im.onload = function () { caja.hidden = false; log("imagen cargada (" + origen + ")"); };
      im.onerror = function () { log("la imagen no carga: " + src); };
      caja.appendChild(im);
      caja.hidden = false;
      return true;
    };
    var avatarForo = function () {
      var av = ud.avatar || "", m = typeof av === "string" ? av.match(/src=["']([^"']+)["']/i) : null;
      var src = m ? m[1] : (/^https?:/i.test(av) ? av : "");
      if (!poner(src, "avatar del foro")) { if (vacia) caja.hidden = true; log("sin Icono ni avatar"); }
    };
    var clave = "bts-icono:" + id, guardado = null;
    try { guardado = JSON.parse(sessionStorage.getItem(clave) || "null"); } catch (e) {}
    if (guardado && Date.now() - guardado.t < 600000) { if (guardado.s) poner(guardado.s, "Icono (caché)"); else avatarForo(); return true; }
    fetch("/u" + id, { credentials: "same-origin" }).then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html"), cont = null;
      doc.querySelectorAll("#rperfil-campos .rpf").forEach(function (f) {
        var l = f.querySelector(".rpf-l");
        if (!cont && l && norm(l.textContent) === "icono") cont = f.querySelector(".rpf-c");
      });
      if (!cont) doc.querySelectorAll("dl").forEach(function (dl) {
        var dt = dl.querySelector("dt"), dd = dl.querySelector("dd");
        if (!cont && dt && dd && norm(dt.textContent) === "icono") cont = dd.querySelector(".field_uneditable") || dd;
      });
      var im = cont && cont.querySelector("img");
      var src = im ? (im.getAttribute("src") || im.getAttribute("data-src")) : "";
      if (!src && cont) { var m = cont.textContent.match(/https?:\/\/\S+/); if (m) src = m[0]; }
      if (!cont) log("no se encontró el campo Icono en /u" + id);
      else if (!src) log("el campo Icono está vacío");
      try { sessionStorage.setItem(clave, JSON.stringify({ t: Date.now(), s: src || "" })); } catch (e) {}
      if (!poner(src, "Icono")) avatarForo();
    }).catch(function (e) { log("error al leer el perfil: " + e); avatarForo(); });
    return true;
  }

  /* Alineación: el contenido (#main-content) y el pie se alinean con #startindex.
     Si algún contenedor de Foroactivo les añade un desplazamiento propio, se mide la
     diferencia y se compensa con --burnthesky-main-shift / --burnthesky-footer-shift. */
  function alinear() {
    var st = document.getElementById("startindex");
    if (!st || !st.getBoundingClientRect().width) return;
    var raiz = document.documentElement, objetivo = st.getBoundingClientRect().left;
    [["#main-content", "--burnthesky-main-shift"], ["#page-footer", "--burnthesky-footer-shift"]].forEach(function (par) {
      var el = document.querySelector(par[0]);
      if (!el || !el.getBoundingClientRect().width) return;
      var dif = objetivo - el.getBoundingClientRect().left;
      if (Math.abs(dif) < 1) return;
      var actual = parseFloat(raiz.style.getPropertyValue(par[1])) || 0;
      raiz.style.setProperty(par[1], (actual + dif) + "px");
    });
  }
  function programarAlineacion() {
    var n = 0;
    var tick = function () { alinear(); if (++n < 6) setTimeout(tick, 400); };
    tick();
    window.addEventListener("load", alinear);
    window.addEventListener("resize", function () { alinear(); });
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
    estiloConectados();
    return true;
  }

  /* 2. Pestañas del perfil. Cambia aquí los nombres. */
  var PESTANAS = ["Perfil", "Red y lore", "Multicuentas y logbook"];
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

  function arrancar() { programarAlineacion(); esperar(iconoSidebar, 80); esperar(ordenarIndice, 80); esperar(pestanasPerfil, 80); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();
})();

/* --- switcheroo: siempre --- */
/* MultiSwitcher: cambio rápido de cuenta. En todas las páginas.
   Implementa el contrato #szSw de la hoja (no renombrar IDs/clases).

   Cómo funciona: guarda cuentas en localStorage del navegador, pinta la lista
   y al pulsar una entra con el propio formulario de login del foro (envío
   real, sin fetch: así las cookies y la redirección las gestiona phpBB).

   NOTA DE SEGURIDAD: las claves quedan en el localStorage de ESTE navegador
   en texto plano. Es la misma concesión que hacen todos los switchers; no
   usar en ordenadores compartidos. Para olvidar una cuenta, doble clic en su
   nombre (pide confirmación). */
(function () {
  function btsSw() {
  "use strict";
  if (window.__szSw) return;
  window.__szSw = true;

  var KEY = "szSw_accounts";

  function leer() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function guardar(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }

  /* Usuario actual: _userdata lo expone Foroactivo; si no, el saludo. */
  function actual() {
    try {
      if (window._userdata && _userdata.username && _userdata.user_id > 0) return _userdata.username;
    } catch (e) {}
    var w = document.querySelector("#fa_welcome");
    if (w) {
      var t = (w.textContent || "").replace(/^\s*Bienvenid[oa]\/\w+\s*/i, "").trim();
      if (t && !/^(Conectarse|Registrarse)$/i.test(t)) return t;
    }
    return "";
  }

  function inicial(n) {
    return ((n || "?").trim().charAt(0) || "?").toUpperCase();
  }

  function svgIni(n) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#1a1a1a"/><text x="14" y="19" font-family="monospace" font-size="14" fill="#9a9a9a" text-anchor="middle">' + inicial(n).replace(/[<>&]/g, "") + "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(s);
  }

  /* Salida: clona el enlace de desconexión de la navbar si existe. */
  function enlaceSalida() {
    var a = document.querySelector('a[href*="login"][href*="logout"]');
    return a ? a.getAttribute("href") : "/login";
  }

  function entrar(cuenta) {
    var f = document.createElement("form");
    f.method = "post";
    f.action = "/login";
    f.style.display = "none";
    var campos = {
      username: cuenta.n,
      password: cuenta.p,
      autologin: "1",
      login: "Conectarse",
      redirect: location.pathname + location.search
    };
    for (var k in campos) {
      var i = document.createElement("input");
      i.type = "hidden";
      i.name = k;
      i.value = campos[k];
      f.appendChild(i);
    }
    document.body.appendChild(f);
    f.submit();
  }

  var yo = actual();
  var cuentas = leer();

  var root = document.createElement("div");
  root.id = "szSw";
  root.innerHTML =
    '<button id="szSwBtn" title="Cambiar de cuenta">⇄</button>' +
    '<div id="szSwPanel">' +
    '<div id="szSwHead"><b>Cuentas</b><span class="actions">' +
    '<button type="button" data-act="add" title="Añadir cuenta">+</button>' +
    '<button type="button" data-act="out" title="Desconectarse">×</button>' +
    "</span></div>" +
    '<div id="szSwBody"><ul id="szSwList"></ul>' +
    '<div id="szSwAdd" style="display:none">' +
    '<input id="szSwUser" type="text" placeholder="Usuario" autocomplete="username">' +
    '<input id="szSwPass" type="password" placeholder="Clave" autocomplete="current-password">' +
    '<button type="button" data-act="save">Guardar</button>' +
    "</div></div></div>";
  document.body.appendChild(root);

  var lista = root.querySelector("#szSwList");

  function pintar() {
    lista.innerHTML = "";
    if (!cuentas.length) {
      var vacio = document.createElement("li");
      vacio.innerHTML = '<span class="meta"><span class="sub">Sin cuentas: pulsa +</span></span>';
      lista.appendChild(vacio);
      return;
    }
    cuentas.forEach(function (c, i) {
      var li = document.createElement("li");
      if (c.n === yo) li.className = "szSw-active";
      var img = document.createElement("img");
      img.alt = "";
      img.src = c.a || svgIni(c.n);
      var meta = document.createElement("span");
      meta.className = "meta";
      var nick = document.createElement("span");
      nick.className = "nick";
      nick.textContent = c.n;
      var sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = c.n === yo ? "· actual (doble clic quita)" : "doble clic quita";
      meta.appendChild(nick);
      meta.appendChild(sub);
      li.appendChild(img);
      li.appendChild(meta);
      li.addEventListener("click", function () {
        if (c.n !== yo) entrar(c);
      });
      li.addEventListener("dblclick", function (ev) {
        ev.stopPropagation();
        if (window.confirm("¿Olvidar la cuenta " + c.n + " en este navegador?")) {
          cuentas.splice(i, 1);
          guardar(cuentas);
          pintar();
        }
      });
      li.title = c.n === yo ? "Cuenta actual" : "Entrar como " + c.n;
      lista.appendChild(li);
    });
  }
  pintar();

  root.querySelector("#szSwBtn").addEventListener("click", function (ev) {
    ev.stopPropagation();
    root.classList.toggle("open");
  });

  root.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "add") {
      var f = root.querySelector("#szSwAdd");
      f.style.display = f.style.display === "none" ? "flex" : "none";
    } else if (act === "save") {
      var u = root.querySelector("#szSwUser").value.trim();
      var p = root.querySelector("#szSwPass").value;
      if (!u || !p) return;
      cuentas = cuentas.filter(function (c) { return c.n.toLowerCase() !== u.toLowerCase(); });
      cuentas.push({ n: u, p: p });
      guardar(cuentas);
      pintar();
      root.querySelector("#szSwUser").value = "";
      root.querySelector("#szSwPass").value = "";
      root.querySelector("#szSwAdd").style.display = "none";
    } else if (act === "out") {
      location.href = enlaceSalida();
    }
  });

  document.addEventListener("click", function (ev) {
    if (!root.classList.contains("open")) return;
    if (!root.contains(ev.target)) root.classList.remove("open");
  });
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", btsSw); } else { btsSw(); }
})();
