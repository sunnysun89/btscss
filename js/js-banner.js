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
