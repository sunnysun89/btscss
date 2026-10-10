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
