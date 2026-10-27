/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Implantes (con botones Inventario / Medallero) -> ventana compacta
     debajo del mensaje, con el estilo del perfil.
   - Popularidad y Autocontrol (0-100) -> barras bajo el poder.
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
    pop:    ['popularidad'],
    auto:   ['autocontrol'],
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


  var MIN_CASILLAS = 8;   // casillas mínimas por vista (las que faltan salen como hexágonos vacíos)

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
    for (var i = n; i < Math.max(MIN_CASILLAS, Math.ceil(n / 4) * 4); i++) {
      var e = el('div', 'rslot'); e.setAttribute('aria-hidden', 'true'); g.appendChild(e);
    }
    return g;
  }
  /* Ventana compacta: se ven los 2 implantes y, arriba a la derecha, dos botones
     (Inventario / Medallero) que cambian la vista. Pulsar el botón activo vuelve
     a los implantes. */
  var TITULOS = { implantes: 'Implantes', inventario: 'Inventario', medallero: 'Medallero' };
  function ventana(f) {
    var w = el('div', 'rinv rinv--mini'), head = el('div', 'rinv__head');
    w.setAttribute('data-vista', 'implantes');
    var tabs = el('div', 'rinv__tabs');
    ['inventario', 'medallero'].forEach(function (v) {
      var bt = el('button', 'rinv__tab', TITULOS[v]);
      bt.type = 'button'; bt.setAttribute('data-ver', v); bt.setAttribute('aria-pressed', 'false');
      tabs.appendChild(bt);
    });
    head.appendChild(tabs);
    w.appendChild(head);

    var cuerpo = el('div', 'rinv__vistas');
    var v1 = el('section', 'rinv__box rinv__box--imp rinv__vista'), v2 = el('section', 'rinv__box rinv__vista'), v3 = el('section', 'rinv__box rinv__vista');
    v1.setAttribute('data-v', 'implantes'); v2.setAttribute('data-v', 'inventario'); v3.setAttribute('data-v', 'medallero');
    var im = el('div', 'rinv__implants');
    im.appendChild(implante(f.imp1, 'Implante 01')); im.appendChild(implante(f.imp2, 'Implante 02'));
    v1.appendChild(el('h3', '', TITULOS.implantes)); v1.appendChild(im);
    v2.appendChild(el('h3', '', TITULOS.inventario)); v2.appendChild(rejilla(f.inv));
    v3.appendChild(el('h3', '', TITULOS.medallero)); v3.appendChild(rejilla(f.med));
    cuerpo.appendChild(v1); cuerpo.appendChild(v2); cuerpo.appendChild(v3);
    w.appendChild(cuerpo);
    return w;
  }
  document.addEventListener('click', function (e) {
    var bt = e.target.closest ? e.target.closest('.rinv__tab') : null;
    if (!bt) return;
    var w = bt.closest('.rinv'), ver = bt.getAttribute('data-ver');
    var nueva = w.getAttribute('data-vista') === ver ? 'implantes' : ver;
    w.setAttribute('data-vista', nueva);
    Array.prototype.forEach.call(w.querySelectorAll('.rinv__tab'), function (t) {
      t.setAttribute('aria-pressed', t.getAttribute('data-ver') === nueva ? 'true' : 'false');
    });
  });

  /* Barras de porcentaje bajo el avatar (campos "Popularidad" y "Autocontrol":
     el usuario escribe un número del 0 al 100, con o sin %). */
  var BARRAS = [['pop', 'Popularidad', ['popularidad']], ['auto', 'Autocontrol', ['autocontrol']]];
  function porcentaje(c) {
    var t = c ? (c.querySelector('.postprofile-field-content') || c).textContent : '';
    var m = t.replace(',', '.').match(/\d+(\.\d+)?/);
    var n = m ? parseFloat(m[0]) : 0;
    return Math.max(0, Math.min(100, n));
  }
  function barras(f) {
    var box = el('div', 'rbars');
    BARRAS.forEach(function (b) {
      var p = porcentaje(f[b[0]]), fila = el('div', 'rbar');
      fila.appendChild(el('span', 'rbar__l', b[1]));
      var tr = el('div', 'rbar__track'), fl = el('div', 'rbar__fill');
      fl.style.width = '0';
      tr.appendChild(fl); fila.appendChild(tr);
      fila.title = b[1] + ': ' + p + '%';
      box.appendChild(fila);
      setTimeout(function () { fl.style.width = p + '%'; }, 60);
    });
    return box;
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
        else if (!f.pop && es(c, CLAVES.pop)) f.pop = c;
        else if (!f.auto && es(c, CLAVES.auto)) f.auto = c;
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

      /* barras Popularidad / Autocontrol, debajo del poder */
      var yaBarras = post.querySelector('.rbars');
      if (yaBarras) yaBarras.parentNode.removeChild(yaBarras);
      var ancla = poBox || frBox || post.querySelector('.ravatar');
      if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(barras(f), ancla.nextSibling);
      ['pop', 'auto'].forEach(function (k) { if (f[k] && f[k].parentNode) f[k].parentNode.removeChild(f[k]); });

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
