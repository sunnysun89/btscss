/* Botones, iconos y títulos: todas las páginas.
   Sustituye los iconos nativos por botones de texto y añade el marco .rbgimg
   a los títulos. Requiere FontAwesome (va en overall_header). */
jQuery(document).ready(function() {
  
  let iconsReplace = [
    ['.i_icon_thanks', 'Agradecer'],
    ['.i_icon_quote', 'Citar'],
    ['.i_icon_edit', 'Editar'],
    ['.i_icon_delete', 'Apagar'],
    ['.i_icon_ip', 'Ver IP'],
    ['.i_post', ''],
    ['.i_msg_newpost', '']
  ];
  
  for(const elem of iconsReplace) {
    let text = elem[1];
    if(text === '')
      text = $(elem[0]).attr("alt");
    $(elem[0]).replaceWith('<div class="rtopicbutton">' + text + '</div>');
  }
  
  $('.profile-icons .rpostmultiquote img').replaceWith('');
  $('.i_icon_profile').replaceWith('<i class="fa fa-user"></i>');
  $('.i_icon_pm').replaceWith('<i class="fa fa-envelope"></i>');
  
  $('.pmlist li.row > dl.icon').each(function( index ) {
    let className = "";
    let color;
    if($(this).css("background-image").includes('topic_read')) {
      className = "rmpread";
      color = "var(--text-color);"
    } else if($(this).css("background-image").includes('topic_unread')) {
      className = "rmpunread";
      color = $(this).find("span a > span").css("color");
    }
    $(this).find('dt').prepend('<div class="' + className + '" style="background-color: ' + color + ';"></div>');
  });
  
  $('ul#privmsgs-menu li').each(function( index ) {
    if($(this).find("a").length == 0) {
      $("h1.page-title").text($(this).text());
      $(this).css("display", "none");
    }
  });
  
  $('h1.page-title').each(replaceTitle);
  $('.content .h3').each(replaceTitle);
  $('h2.u').each(replaceTitle);
  
  function replaceTitle( index ) {
    $(this).html('<div class="rbgimg"></div><b>' + $(this).html() + '</b>');
  }
});
