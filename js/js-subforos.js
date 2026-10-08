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
