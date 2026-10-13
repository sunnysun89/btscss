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
      poderes: ["poderes", "poder", "habilidades"],
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