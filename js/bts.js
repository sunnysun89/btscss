/* ==========================================================================
   BTS todo-en-uno — pegar UNA vez en el gestor de Javascript, "En todas
   las páginas". Cada bloque lleva su propio guardián: solo corre donde
   tiene que correr. Editar los ficheros sueltos de skin/js/ y regenerar
   este paquete (mismo orden que aquí).
   Orden: botones, banner, índice, temas, subforos, categorías, switcheroo.
   ========================================================================== */

/* --- js-banner.js --- */
(function(){
/* --- banner: solo si hay mural que mover --- */
/* Las comprobaciones se hacen con el DOM listo: si el script carga en la cabecera, aún no existe nada. */
function btsRun(){
if (!document.querySelector('#left #startindex')) return;
/* Banner: todas las páginas.
   Mueve el widget Banner (#startindex) a #rheader, los últimos temas a la
   tabla del mural, el avatar y nombre al bloque de bienvenida, el copyright
   a icono, y construye la lista de más activos. Requiere el widget "Banner"
   (plantillas/widget-mural.html) y los widgets estándar en #left. */
jQuery(document).ready(function(){
  
  $("#rheader").replaceWith($("#left #startindex"));
  /* Recent topics: se lee la lista del widget estándar (#comments_scroll_div,
     que se queda donde está para que su script siga funcionando) y se pinta
     una lista .rrecent propia en la ventana del mural. Se reintenta hasta 8 s
     porque el widget rellena su contenido después de cargar la página. */
  (function btsRecent() {
    var intentos = 0;
    var t = setInterval(function () {
      intentos++;
      var cont = $("#mural .rsubsrecent, #mural .rrecent").first();
      var src = $("#comments_scroll_div").first();
      var enlaces = src.find("a[href]").filter(function () { return /\/t\d+/.test($(this).attr("href")); });
      if (cont.length && enlaces.length) {
        clearInterval(t);
        var lista = $('<div class="rrecent"></div>');
        var vistos = {};
        enlaces.each(function () {
          var a = $(this), href = a.attr("href");
          if (vistos[href]) return;
          vistos[href] = 1;
          var bloque = a.closest(".gensmall, p, li, div").not(src);
          if (!bloque.length || bloque.is(src)) bloque = a.parent();
          var autor = bloque.find("a[href]").not(a).first().text().trim();
          var resto = bloque.text().replace(a.text(), "");
          var fecha = resto.indexOf("»") > -1 ? resto.split("»").slice(1).join("»") : "";
          fecha = fecha.replace(/\s+/g, " ").trim();
          var item = $('<a class="rrecent__item"></a>').attr("href", href);
          item.append($('<span class="rrecent__title"></span>').text(a.text().trim()));
          var meta = $('<span class="rrecent__meta"></span>');
          if (autor) { meta.append("por ").append($("<b></b>").text(autor)); }
          if (fecha) { meta.append((autor ? " · " : "") + fecha); }
          item.append(meta);
          lista.append(item);
        });
        cont.replaceWith(lista);
      } else if (intentos > 80) {
        clearInterval(t);
        if (cont.length) cont.replaceWith('<p class="rrecent__empty">Sin temas recientes.</p>');
      }
    }, 100);
  })();
  if (document.querySelector('.mod-login-avatar') !== null) {
    $("#mural .rintro .ricon img").replaceWith($(".mod-login-avatar img"));
  }
  
  let legend = $("p.copyright strong a").text();
  $("p.copyright strong a").html('<i class="fa fa-gear" title="' + legend + '"></i>');
  
  let avatar = $("#left .mod-login-avatar img");
  if(avatar.length == 0)
    avatar = '<img src="https://placehold.co/250x400" />';
  $("#mural .rmuralavatar img").replaceWith(avatar);
  $("#mural .rwelcomesub span").text($("#left .module .inner span.corners-top ~ div.h3 span strong").text());
  
  let activeUsersHtml = "";
  $("#left .module .inner").each(function( index ) {
    let check1 = $(this).find("div.h3").text();
    let check2 = $(this).find("table").attr("summary");
    if(check2 != null && check1 == check2) {
      $(this).find("div.h3 ~ table > tbody > tr").each(function( index ) {
        
        if($(this).find("td > table").attr("title") != null) {
        
        activeUsersHtml += '<div class="ruser" title="' + $(this).find("td > table").attr("title").split("-")[0] + '">';
        activeUsersHtml += '<span>> ' + $(this).find("td > a").text() + '</span>';
        let percentage = parseInt($(this).find("td > table").attr("title").split("-")[1]);
        let accent = 1;
        if(index % 2 == 0)
          accent = 2;
        activeUsersHtml += '<div>' + 
          '<div style="background: linear-gradient(90deg, var(--accent' + accent + ') ' + percentage + '%, transparent ' + (percentage + 10) + '%);">' +
          '</div></div>';
        activeUsersHtml += '</div>';
        
      	}
      });
    }
    $("#mural .ractiveusers").html(activeUsersHtml);
  });
  
  
  
});

}
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", btsRun); } else { btsRun(); }
})();
/* --- js-indice.js --- */
(function(){
/* --- índice: solo con bloque de estadísticas --- */
/* Las comprobaciones se hacen con el DOM listo: si el script carga en la cabecera, aún no existe nada. */
function btsRun(){
if (!document.querySelector('#rstatscontainer')) return;
/* Índice: solo para el índice.
   Reescribe las cifras de estadísticas con textos propios (en español) y
   normaliza la leyenda de grupos para las barras de miembros.
   Adaptado: cadenas en español (el original venía en inglés). */
jQuery(document).ready(function(){
  
  // textos de las estadísticas (editar aquí el idioma)
  let totalMessages = "mensajes";
  let totalUsers = "miembros registrados";
  let totalConnected = "récord de conectados";
  let lastRegistered = "Bienvenido a Burn The Sky,";
  
  $("#rstatscontainer .rgroupsicon").replaceWith($("#left .rgrouplegend"));
  
  let totalGroupMembers = 0;
  
  let maxHeight = 0;
  
  if ($(".rgroupleg").length) {
    $(".rgroupleg").html($(".rgroupleg").html().replaceAll("[", "").replaceAll("]", "").replaceAll("&nbsp;", ""));
  }
  
  $(".rgroupslegend .gensmall").each(function( index ) {
    let height = parseInt($(this).css("height"));
    if(height > maxHeight)
      maxHeight = height;
    
    let nMembers = $(this).attr("title");
    nMembers = parseInt(nMembers.split(":")[1], 10);
    totalGroupMembers += nMembers;
  });
  
  $(".rgroupleg b").each(function( index ) {
    let text = $( this ).find(".rgroupleg").html();
    $( this ).find(".rgroupleg").html(text);
    
    let color = $(this).find(".gensmall").css("color");
    $(".rgroupslegend .rgrouplegend em").eq(index).css("color", color);
    let width = $(this).css("width");
    $(".rgroupslegend .rgrouplegend em").eq(index).css("width", width);
    
    let nMembers = $(this).find(".gensmall").attr("title");
    nMembers = parseInt(nMembers.split(":")[1], 10);
    let percentage;
    
    if(index > 0) {
      percentage = (nMembers / totalGroupMembers * 100) + "%";
    } else {
      percentage = '100%';
    }
    
    $(this).css("height", maxHeight);
    $(this).append('<div class="rgroupmembers"><div></div></div>');
    $(this).find(".rgroupmembers div").css("width", percentage);
    $(this).find(".rgroupmembers div").css("background-color", color);
  });
  
  let nMessages = $("p.page-bottom.rtotalposts strong").text();
  $("p.page-bottom.rtotalposts").html("<strong>" + nMessages + "</strong>" + totalMessages);
  
  let nUsers = $("p.page-bottom.rtotalusers strong").text();
  $("p.page-bottom.rtotalusers").html("<strong>" + nUsers + "</strong>" + totalUsers);
  
  let recordUsers = $("p.page-bottom.rrecordusers strong").text();
  let recordDate = $("p.page-bottom.rrecordusers").html().split("</strong>")[1].split(" - ")[0];
  $("p.page-bottom.rrecordusers").html("<strong>" + recordUsers + "</strong>" + totalConnected + " " + recordDate);
  
  let lUser = $("p.rnewestuser > strong").text();
  $("p.rnewestuser").html("<em>" + lastRegistered + "</em>" + "<br />" + "<strong>" + lUser + "</strong>");
  
  let currOnlineList = $("#rstatscontainer .rloggedinlist").html();
  currOnlineList = currOnlineList.split(" : ");
  $("#rstatscontainer .rloggedinlist").html(currOnlineList[1]);
  
  let currOnline = $("#rstatscontainer .ruserstats").html();
  currOnline = currOnline.replace("::", "<br />");
  $("#rstatscontainer .ruserstats").html(currOnline);
  
  $("#rfooterreplace").replaceWith($("#rneonfooter"));

  /* Bloque DATABASE: pastillas + donut de grupos (con el total en el centro)
     + una tarjeta por grupo con su color, cifra y barra. Datos de la leyenda
     (title "Grupo: N"). Sin datos no se pinta nada. */
  try {
    var grupos = [];
    var total = 0;
    /* La leyenda nativa es UN solo .rgroupleg con un <b><span class="gensmall"
       title="Grupo: N"> por grupo: se recorre cada .gensmall, no el contenedor. */
    var fuentes = $("#rstatscontainer .rgroupleg .gensmall[title], .rgroupslegend .gensmall[title]");
    fuentes = fuentes.filter(function (i) { return fuentes.index(this) === i; });
    fuentes.each(function () {
      var tit = $(this).attr("title") || "";
      var partes = tit.split(":");
      var txt = (partes[0] || $(this).text()).trim();
      if (!txt) return;
      var n = parseInt((partes[1] || "").replace(/\D/g, ""), 10) || 0;
      var col = $(this).css("color") || "#9a9a9a";
      grupos.push({ nombre: txt.slice(0, 28), n: n, color: col });
      total += n;
    });
    if (grupos.length) {
      var posts = $("p.page-bottom.rtotalposts strong").text() || "";
      var users = $("p.page-bottom.rtotalusers strong").text() || "";
      var newest = $("p.rnewestuser strong").text() || "";
      var esc = function (s) { return $("<div>").text(s).html(); };
      var gradiente = function (activo) {
        var acc = 0, partes = [];
        grupos.forEach(function (g, i) {
          if (!g.n) return;
          var pct = g.n / total * 100, ini = acc;
          acc += pct;
          var c = (activo === null || activo === i) ? g.color : "color-mix(in srgb, " + g.color + " 18%, #090909)";
          partes.push(c + " " + ini.toFixed(2) + "% " + acc.toFixed(2) + "%");
        });
        return partes.length ? "conic-gradient(" + partes.join(", ") + ")" : "conic-gradient(#2b2b2e 0 100%)";
      };
      var tarjetas = grupos.map(function (g, i) {
        var pct = total ? Math.round(g.n / total * 100) : 0;
        return '<div class="rdb__g" tabindex="0" data-i="' + i + '" style="--g:' + g.color +
          ';--g-soft:color-mix(in srgb, ' + g.color + ' 14%, #090909);--g-glow:color-mix(in srgb, ' + g.color + ' 40%, transparent)">' +
          '<span class="rdb__gname">' + esc(g.nombre) + '</span><span class="rdb__gcount">' + g.n + '</span>' +
          '<span class="rdb__gbar"><i style="width:' + pct + '%"></i></span></div>';
      }).join("");
      var rdb =
        '<div class="rdb"><div class="rdb__bar"><span class="rdb__title">Database</span>' +
        '<span class="rdb__pill">Total episodios <b>' + esc(posts) + "</b></span>" +
        '<span class="rdb__pill">Población <b>' + esc(users) + "</b></span>" +
        '<span class="rdb__pill">Último <b>' + esc(newest) + "</b></span></div>" +
        '<div class="rdb__cols"><div class="rdb__donut" style="background:' + gradiente(null) + '">' +
        '<div class="rdb__dtxt"><b>' + total + '</b><span>miembros</span></div></div>' +
        '<div class="rdb__groups">' + tarjetas + "</div></div>" +
        '<p class="rdb__legal">Burn The Sky y todo su contenido pertenecen a sus administradores y miembros. Prohibida su reproducción total o parcial.</p></div>';
      var $rdb = $(rdb);
      $rdb.find(".rdb__g").on("mouseenter focus", function () {
        $rdb.find(".rdb__donut").css("background", gradiente(+$(this).attr("data-i")));
      }).on("mouseleave blur", function () {
        $rdb.find(".rdb__donut").css("background", gradiente(null));
      });
      $("#rstatscontainer").before($rdb).addClass("rdb-ready");
    }
  } catch (e) {}

});

}
if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", btsRun); } else { btsRun(); }
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
