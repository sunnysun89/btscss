/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Medallas / Inventario -> fila debajo del mensaje.
   - Lo demás queda en el panel que aparece al pasar el ratón por el avatar.
   Los nombres de los campos se cambian en CAMPOS (en minúsculas, sin tildes ni
   espacios: "Frase del personaje" -> "frase-del-personaje"). */
!function () {
  var CAMPOS = {
    icono:  ['icon', 'icono'],
    frase:  ['frase', 'cita', 'quote'],
    poder:  ['poder', 'poderes', 'habilidad'],
    inv:    ['medallas', 'inventario', 'insignias', 'objetos'],
    oculto: ['post-cover']              // campos que no se muestran en ningún sitio
  };

  function campo(post, nombres) {
    for (var i = 0; i < nombres.length; i++) {
      var f = post.querySelector('.postprofile .postprofile-field-' + nombres[i]);
      if (f) return f;
    }
    return null;
  }
  function vacio(f) {
    var c = f && f.querySelector('.postprofile-field-content');
    return !c || (!c.querySelector('img') && !c.textContent.replace(/\s+/g, '').length);
  }

  function arrancar() {
    document.querySelectorAll('.post').forEach(function (post) {
      if (post.dataset.btsPost) return;
      post.dataset.btsPost = '1';

      /* icono -> cuadro del nombre */
      var ic = campo(post, CAMPOS.icono), dest = post.querySelector('.rtopicicon');
      var img = ic && ic.querySelector('img');
      if (dest) {
        if (img) { dest.innerHTML = ''; dest.appendChild(img); dest.classList.add('tiene'); }
        else dest.style.display = 'none';
      }
      if (ic) ic.remove();

      /* campos que no se usan */
      CAMPOS.oculto.forEach(function (n) {
        var f = post.querySelector('.postprofile .postprofile-field-' + n);
        if (f) f.remove();
      });

      /* frase y poder debajo del avatar */
      [['frase', '.rphrase'], ['poder', '.rpower']].forEach(function (par) {
        var f = campo(post, CAMPOS[par[0]]), box = post.querySelector(par[1]);
        if (!box) return;
        if (f && !vacio(f)) { box.appendChild(f); box.classList.add('tiene'); }
        else { if (f) f.remove(); box.style.display = 'none'; }
      });

      /* medallas / inventario debajo del mensaje */
      var inv = campo(post, CAMPOS.inv), cont = post.querySelector('.rpost-inv');
      if (cont) {
        if (inv && !vacio(inv)) { cont.appendChild(inv); cont.style.display = ''; }
        else if (inv) inv.remove();
      }

      /* si no queda ningún dato, no hay panel al pasar el ratón */
      var pc = post.querySelector('.ravatar .rprofilecontent');
      if (pc && !pc.querySelector('.postprofile-field') && !pc.textContent.trim()) pc.style.display = 'none';
    });
  }

  /* se espera un instante: js-temas.js tiene que haber puesto antes las clases
     postprofile-field-<nombre> a cada campo */
  function tarde() { setTimeout(arrancar, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarde);
  else tarde();
}();
