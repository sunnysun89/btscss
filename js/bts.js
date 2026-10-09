/* ==========================================================================
   BTS todo-en-uno — pegar UNA vez en el gestor de Javascript, "En todas
   las páginas". Cada bloque lleva su propio guardián: solo corre donde
   tiene que correr. Editar los ficheros sueltos de skin/js/ y regenerar
   este paquete (mismo orden que aquí).
   Orden: botones, banner, índice, temas, subforos, switcheroo.
   ========================================================================== */

/* --- js-banner.js --- */
(function(){
/* --- banner: solo si hay mural que mover --- */
if (!document.querySelector('#left #startindex')) return;
/* Banner: todas las páginas.
   Mueve el widget Banner (#startindex) a #rheader, los últimos temas a la
   tabla del mural, el avatar y nombre al bloque de bienvenida, el copyright
   a icono, y construye la lista de más activos. Requiere el widget "Banner"
   (plantillas/widget-mural.html) y los widgets estándar en #left. */
jQuery(document).ready(function(){
  
  $("#rheader").replaceWith($("#left #startindex"));
  $("#mural .rmuralinfo .rsubsrecent").replaceWith($("#left #comments_scroll_div"));
  var replace = $("#mural .rmuralinfo td:nth-child(3) div").html().replace("»", ">");
  $("#mural .rmuralinfo .rsubsrecent").html(replace);
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

})();
/* --- js-indice.js --- */
(function(){
/* --- índice: solo con bloque de estadísticas --- */
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
  
  $(".rgroupleg").html($(".rgroupleg").html().replaceAll("[", ""));
  $(".rgroupleg").html($(".rgroupleg").html().replaceAll("]", ""));
  $(".rgroupleg").html($(".rgroupleg").html().replaceAll("&nbsp;", ""));
  
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

  /* Bloque DATABASE: pastillas + donut de grupos con los conteos de la
     leyenda (title "Grupo: N"). Sin datos no se pinta nada. */
  try {
    var grupos = [];
    var total = 0;
    $("#rstatscontainer .rgroupleg").each(function () {
      var txt = $(this).text().trim();
      if (!txt) return;
      var tit = $(this).attr("title") || $(this).find("[title]").first().attr("title") || "";
      var num = tit.match(/(\d+)/);
      var n = num ? parseInt(num[1], 10) : 0;
      var col = "var(--burnthesky-gray)";
      var pintado = $(this).find("[style*='color']").first();
      if (!pintado.length) pintado = $(this);
      var c = pintado.css("color") || "";
      var hex = pintado.attr("style") || "";
      var hm = hex.match(/color\s*:\s*(#[0-9a-fA-F]{3,8})/);
      if (hm) col = hm[1];
      else if (/^rgb/.test(c)) col = c;
      grupos.push({ nombre: txt.split("\n")[0].trim().slice(0, 24), n: n, color: col });
      total += n;
    });
    if (grupos.length && total > 0) {
      var acc = 0;
      var partes = [];
      var lis = "";
      grupos.forEach(function (g) {
        var pct = g.n / total * 100;
        var ini = acc;
        acc += pct;
        partes.push(g.color + " " + ini.toFixed(1) + "% " + acc.toFixed(1) + "%");
        lis += '<li><i style="background:' + g.color + '"></i>' + g.nombre + "<b>" + g.n + "</b></li>";
      });
      var posts = $("p.page-bottom.rtotalposts strong").text() || "";
      var users = $("p.page-bottom.rtotalusers strong").text() || "";
      var newest = $("p.rnewestuser strong").text() || "";
      var rdb =
        '<div class="rdb"><div class="rdb__bar"><span class="rdb__title">Database</span>' +
        '<span class="rdb__pill">Total episodios <b>' + posts + "</b></span>" +
        '<span class="rdb__pill">Population <b>' + users + "</b></span>" +
        '<span class="rdb__pill">Newest <b>' + newest + "</b></span></div>" +
        '<div class="rdb__cols"><div class="rdb__donut" style="background: conic-gradient(' + partes.join(", ") + ')"></div>' +
        '<ul class="rdb__legend">' + lis + "</ul></div>" +
        '<p class="rdb__legal">Burn The Sky y todo su contenido pertenecen a sus administradores y miembros. Prohibida su reproducción total o parcial.</p></div>';
      $("#rstatscontainer").before(rdb);
    }
  } catch (e) {}

});

})();
/* --- js-temas.js --- */
(function(){
/* --- temas: solo con posts o editor --- */
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

})();
/* --- js-subforos.js --- */
(function(){
/* --- subforos: solo con lista de temas --- */
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
})();
