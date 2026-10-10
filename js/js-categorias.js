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
