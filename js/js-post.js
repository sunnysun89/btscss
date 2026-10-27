/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Medallas / Inventario -> fila debajo del mensaje.
   - Lo demás queda en el panel que aparece al pasar el ratón por el avatar.
   No depende de js-temas.js: calcula sus propias clases a partir del nombre
   del campo. Un campo se reconoce si su nombre (sin tildes ni mayúsculas)
   CONTIENE alguna de estas palabras; cámbialas aquí si usas otras.
   Si un campo no existe o está vacío, se muestra un hueco apagado (se puede
   ocultar con --burnthesky-post-empty: none en el CSS).
   En la consola (F12) aparece "[BTS] post: campos ..." con los nombres que
   encuentra, para comprobar que coinciden. */
!function () {
  var CLAVES = {
    icono:  ['icon'],
    frase:  ['frase', 'cita', 'quote', 'lema'],
    poder:  ['poder', 'habilidad'],
    inv:    ['medall', 'inventario', 'insignia', 'objeto', 'item'],
    oculto: ['cover', 'portada']
  };

  function slug(t) {
    return (t || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function nombre(f) {
    var l = f.querySelector('.postprofile-field-label');
    return l ? l.textContent.replace(/\s*:\s*$/, '').trim() : '';
  }
  function es(f, claves) {
    var s = slug(nombre(f));
    return claves.some(function (c) { return s.indexOf(c) !== -1; });
  }
  function vacio(f) {
    var c = f && f.querySelector('.postprofile-field-content');
    return !c || (!c.querySelector('img') && !c.textContent.replace(/\s+/g, '').length);
  }
  function hueco(box, texto) {
    box.classList.add('vacio');
    box.textContent = texto;
    box.style.display = '';
  }

  var avisado = false;

  function arrancar() {
    var posts = document.querySelectorAll('.post');
    for (var n = 0; n < posts.length; n++) {
      var post = posts[n];
      if (post.getAttribute('data-bts-post')) continue;
      var campos = post.querySelectorAll('.postprofile .postprofile-field');
      var iconBox = post.querySelector('.rtopicicon'), frBox = post.querySelector('.rphrase'),
          poBox = post.querySelector('.rpower'), invBox = post.querySelector('.rpost-inv');
      if (!iconBox && !frBox && !poBox && !invBox) continue;   // mensaje oculto u otra plantilla
      post.setAttribute('data-bts-post', '1');

      var nombres = [], f = {};
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i], nm = nombre(c);
        nombres.push(nm || '(sin nombre)');
        if (es(c, CLAVES.oculto)) { c.parentNode.removeChild(c); continue; }
        if (!f.icono && es(c, CLAVES.icono) && c.querySelector('img')) f.icono = c;
        else if (!f.frase && es(c, CLAVES.frase)) f.frase = c;
        else if (!f.poder && es(c, CLAVES.poder)) f.poder = c;
        else if (!f.inv && es(c, CLAVES.inv)) f.inv = c;
      }
      if (!avisado) {
        avisado = true;
        try { console.log('[BTS] post: campos de perfil encontrados →', nombres.length ? nombres.join(' | ') : '(ninguno: el usuario no tiene campos rellenos)'); } catch (e) {}
      }

      /* icono -> cuadro del nombre */
      if (iconBox) {
        var img = f.icono && f.icono.querySelector('img');
        if (img) { iconBox.innerHTML = ''; iconBox.appendChild(img); iconBox.classList.add('tiene'); f.icono.parentNode.removeChild(f.icono); }
        else hueco(iconBox, '');
      }

      /* frase y poder debajo del avatar */
      if (frBox) {
        if (f.frase && !vacio(f.frase)) { frBox.appendChild(f.frase); frBox.classList.add('tiene'); }
        else { if (f.frase) f.frase.parentNode.removeChild(f.frase); hueco(frBox, 'sin frase'); }
      }
      if (poBox) {
        if (f.poder && !vacio(f.poder)) { poBox.appendChild(f.poder); poBox.classList.add('tiene'); }
        else { if (f.poder) f.poder.parentNode.removeChild(f.poder); hueco(poBox, 'sin poder'); }
      }

      /* medallas / inventario debajo del mensaje */
      if (invBox) {
        if (f.inv && !vacio(f.inv)) { invBox.appendChild(f.inv); invBox.classList.add('tiene'); }
        else {
          if (f.inv) f.inv.parentNode.removeChild(f.inv);
          hueco(invBox, 'Medallas e inventario: nada por ahora');
        }
        invBox.style.display = '';
      }

      /* si no queda ningún dato, no hay panel al pasar el ratón */
      var pc = post.querySelector('.ravatar .rprofilecontent');
      if (pc && !pc.querySelector('.postprofile-field') && !pc.textContent.replace(/\s+/g, '')) pc.style.display = 'none';
    }
  }

  function tarde() { setTimeout(arrancar, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarde);
  else tarde();
}();
