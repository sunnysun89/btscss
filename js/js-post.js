/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Implantes, Inventario y Medallero -> ventana "Inventario y medallero"
     debajo del mensaje, con el mismo estilo que en el perfil.
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
    inv:    ['inventario', 'objeto', 'item'],
    med:    ['medall', 'insignia'],
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


  var MIN_CASILLAS = 6;   // casillas por columna (las que faltan salen como hexágonos vacíos)

  function esImplante(f, n) {
    var s = slug(nombre(f));
    if (s.indexOf('implante') === -1) return false;
    var re = n === 1 ? /(^|-)(0?1|i|uno)$/ : /(^|-)(0?2|ii|dos)$/;
    return re.test(s);
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }
  function implante(c, etiqueta) {
    var h = el('div', 'rimp'), ico = el('div', 'rimp__ico'), txt = el('div', 'rimp__txt');
    txt.appendChild(el('span', 'rimp__n', etiqueta));
    var cont = c && c.querySelector('.postprofile-field-content');
    if (c && !vacio(c)) {
      var im = cont.querySelector('img');
      if (im) ico.appendChild(im.cloneNode(true)); else ico.className += ' is-blank';
      var resto = cont.cloneNode(true);
      Array.prototype.forEach.call(resto.querySelectorAll('img'), function (x) { x.parentNode.removeChild(x); });
      var d = el('span', 'rimp__d'); d.innerHTML = resto.innerHTML.trim() || 'Instalado';
      txt.appendChild(d); h.className += ' is-on';
    } else {
      ico.className += ' is-blank';
      txt.appendChild(el('span', 'rimp__d', 'Sin implante'));
    }
    h.appendChild(ico); h.appendChild(txt);
    return h;
  }
  function rejilla(c) {
    var g = el('div', 'rinv__grid'), n = 0;
    var cont = c && c.querySelector('.postprofile-field-content');
    if (cont) Array.prototype.forEach.call(cont.querySelectorAll('img'), function (img) {
      var cas = el('div', 'rslot is-on'), a = img.closest ? img.closest('a') : null;
      cas.appendChild((a && cont.contains(a) ? a : img).cloneNode(true));
      g.appendChild(cas); n++;
    });
    for (var i = n; i < Math.max(MIN_CASILLAS, Math.ceil(n / 6) * 6); i++) {
      var e = el('div', 'rslot'); e.setAttribute('aria-hidden', 'true'); g.appendChild(e);
    }
    return g;
  }
  function ventana(f) {
    var w = el('div', 'rinv'), cols = el('div', 'rinv__cols');
    w.appendChild(el('div', 'rinv__head', 'Inventario y medallero'));
    var b1 = el('section', 'rinv__box rinv__box--imp'), b2 = el('section', 'rinv__box'), b3 = el('section', 'rinv__box');
    b1.appendChild(el('h3', '', 'Implantes'));
    var im = el('div', 'rinv__implants');
    im.appendChild(implante(f.imp1, 'Implante 01')); im.appendChild(implante(f.imp2, 'Implante 02'));
    b1.appendChild(im);
    b2.appendChild(el('h3', '', 'Inventario')); b2.appendChild(rejilla(f.inv));
    b3.appendChild(el('h3', '', 'Medallero'));  b3.appendChild(rejilla(f.med));
    cols.appendChild(b1); cols.appendChild(b2); cols.appendChild(b3);
    w.appendChild(cols);
    return w;
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
        else if (!f.imp1 && esImplante(c, 1)) f.imp1 = c;
        else if (!f.imp2 && esImplante(c, 2)) f.imp2 = c;
        else if (!f.inv && es(c, CLAVES.inv)) f.inv = c;
        else if (!f.med && es(c, CLAVES.med)) f.med = c;
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

      /* implantes, inventario y medallero: ventana debajo del mensaje */
      if (invBox) {
        invBox.innerHTML = '';
        invBox.appendChild(ventana(f));
        invBox.style.display = '';
        invBox.classList.add('tiene');
        if (!(f.imp1 && !vacio(f.imp1)) && !(f.imp2 && !vacio(f.imp2)) && !(f.inv && !vacio(f.inv)) && !(f.med && !vacio(f.med)))
          invBox.classList.add('sin-datos');
        ['imp1', 'imp2', 'inv', 'med'].forEach(function (k) {
          if (f[k] && f[k].parentNode) f[k].parentNode.removeChild(f[k]);
        });
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
