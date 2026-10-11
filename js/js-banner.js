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
