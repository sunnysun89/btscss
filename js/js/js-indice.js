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
  
});
