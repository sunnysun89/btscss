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
