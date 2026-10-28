/* Mensajes de los temas: reparte los campos de perfil en la tarjeta.
   - Icono (campo "Icono") -> a la derecha del cuadro del nombre.
   - Frase y Poder -> debajo del avatar.
   - Implantes, Inventario y Medallero -> ventana de tres columnas debajo
     del mensaje, con el estilo del perfil.
   - Popularidad y Autocontrol (0-100) -> barras bajo el poder.
   - Perfil, Mensaje privado, Playlist/OST, Expediente, Baúl, Red social,
     Búsqueda, Móvil/localizador y Más -> botones bajo el avatar (los de los
     campos usan el enlace que escribe el usuario; si el campo está vacío,
     no hay botón).
   - Panel al pasar el ratón por el avatar: solo Edad, Orientación sexual,
     Estado sentimental, Alias, Apodos, Ocupación, Facción, Alianza y
     Ubicación, y solo los que el usuario rellena.
   - En el perfil: botones con iconos y los datos de "Otros datos" (barras,
     poderes y enlaces) debajo del avatar.
   - Botones del mensaje (citar, editar, borrar...) -> iconos Capucciicons
     (hoja tempcf.css en la cabecera) y botones Responder / Nuevo tema.
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


  var MIN_CASILLAS = 6;   // casillas mínimas por columna (las que faltan salen como hexágonos vacíos)

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
  /* Ventana "Inventario y medallero": tres columnas (implantes, inventario,
     medallero), como en el perfil. Sin título en la cabecera. */
  function ventana(f) {
    var w = el('div', 'rinv'), cols = el('div', 'rinv__cols');
    w.appendChild(el('div', 'rinv__head'));
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
      fl.style.width = '0'; fl.textContent = p + '%';
      tr.appendChild(fl); fila.appendChild(tr);
      fila.title = b[1] + ': ' + p + '%';
      box.appendChild(fila);
      setTimeout(function () { fl.style.width = p + '%'; }, 60);
    });
    return box;
  }


  /* ---- Botones del mensaje con iconos Capucciicons ------------------------
     Reconoce cada botón por su enlace, su texto o su imagen (aunque js-botones
     ya lo haya cambiado por un texto) y le pone un icono "cp-". */
  var ICONO_BTN = {
    thanks: ['cp-heart-o', 'Agradecer'], quote: ['cp-quote', 'Citar'],
    multi:  ['cp-add-o', 'Multicita'],  edit:  ['cp-edit-o', 'Editar'],
    del:    ['cp-trash-o', 'Borrar'],   ip:    ['cp-globe-o', 'Ver IP'],
    report: ['cp-flag-o', 'Reportar']
  };
  function tipoBoton(a, li) {
    var im = a.querySelector('img');
    var t = ((a.getAttribute('href') || '') + ' ' + (im ? (im.className + ' ' + (im.alt || '') + ' ' + (im.title || '')) : '') +
             ' ' + a.textContent + ' ' + (li ? li.className : '') + ' ' + (a.id || '') + ' ' + (a.className || '')).toLowerCase();
    if (/multiquote|multicit/.test(t)) return 'multi';
    if (/mode=quote|icon_quote|citar|\bcita\b/.test(t)) return 'quote';
    if (/editpost|icon_edit|editar/.test(t)) return 'edit';
    if (/mode=delete|icon_delete|apagar|borrar|eliminar/.test(t)) return 'del';
    if (/mode=ip|icon_ip|ver ip|\bip\b/.test(t)) return 'ip';
    if (/report|denunc|icon_report/.test(t)) return 'report';
    if (/thank|agradec|gracias/.test(t)) return 'thanks';
    return null;
  }
  function iconosPost() {
    var lis = document.querySelectorAll('.postbody ul.profile-icons li');
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i], a = li.querySelector('a');
      if (!a || a.getAttribute('data-bts-ico')) continue;
      var tipo = tipoBoton(a, li);
      if (!tipo) continue;
      var d = ICONO_BTN[tipo];
      a.setAttribute('data-bts-ico', tipo);
      a.className += ' rbtn rbtn--' + tipo;
      a.setAttribute('title', a.getAttribute('title') || d[1]);
      a.setAttribute('aria-label', d[1]);
      a.innerHTML = '<i class="cp ' + d[0] + '" aria-hidden="true"></i><span class="rbtn__t">' + d[1] + '</span>';
    }
  }

  /* Responder / Nuevo tema / Bloqueado: botones de texto con icono. Las
     imágenes nativas (sprites) no se veían con el tema oscuro. */
  function botonesTema() {
    var as = document.querySelectorAll('.buttons a, .topic-actions a.rbtn-src');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      if (a.getAttribute('data-bts-main') || a.closest('.profile-icons')) continue;
      var im = a.querySelector('img'), rt = a.querySelector('.rtopicbutton');
      if (!im && !rt) continue;
      var cls = ((im ? im.className : '') + ' ' + (a.getAttribute('href') || '')).toLowerCase();
      var txt = (im ? (im.alt || im.title || '') : rt.textContent).trim();
      var l = (txt + ' ' + cls).toLowerCase(), icono, tipo;
      if (/reply|respond|mode=reply/.test(l)) { icono = 'cp-chat-bubble-o'; tipo = 'reply'; txt = txt || 'Responder'; }
      else if (/lock|bloquead|cerrad/.test(l)) { icono = 'cp-lock-o'; tipo = 'locked'; txt = txt || 'Tema bloqueado'; }
      else if (/newtopic|nuevo|new|i_post|mode=post/.test(l)) { icono = 'cp-edit-o'; tipo = 'new'; txt = txt || 'Nuevo tema'; }
      else if (/msg_newpost|privmsg|mensaje/.test(l)) { icono = 'cp-envelope-o'; tipo = 'pm'; txt = txt || 'Nuevo mensaje'; }
      else continue;
      a.setAttribute('data-bts-main', tipo);
      a.className += ' rbtn-main rbtn-main--' + tipo;
      a.setAttribute('aria-label', txt);
      a.innerHTML = '<i class="cp ' + icono + '" aria-hidden="true"></i><span>' + txt + '</span>';
    }
  }


  /* ---- Botones de contacto bajo el avatar: perfil, mensaje privado y playlist ---- */
  function esPlaylist(f) {
    var sl = slug(nombre(f));
    return /(^|-)(playlist|ost)(-|$)/.test(sl);
  }
  function urlDe(f) {
    var cont = f && (f.querySelector('.postprofile-field-content') || f);
    if (!cont) return '';
    var a = cont.querySelector('a[href]');
    var u = a ? a.getAttribute('href') : (cont.textContent.match(/https?:\/\/[^\s<>"']+/) || [''])[0];
    return /^https?:\/\//i.test(u || '') ? u : '';
  }

  /* Campos que se convierten en botón (enlace). Orden = orden de los botones. */
  var EXTRAS = [
    ['expediente', /(^|-)expediente(-|$)/,                    'cp-folder-o',    'Expediente'],
    ['baul',       /(^|-)baul(-|$)/,                          'cp-briefcase-o', 'Baúl'],
    ['red',        /(^|-)(red-social|redes-sociales|redes)(-|$)/, 'cp-share',   'Red social'],
    ['busqueda',   /(^|-)busqueda(-|$)/,                      'cp-search',      'Búsqueda'],
    ['movil',      /(^|-)(movil|localizador)(-|$)/,           'cp-smartphone',  'Móvil / localizador'],
    ['mas',        /^mas$/,                                   'cp-more',        'Más']
  ];
  function tipoExtra(f) {
    var sl = slug(nombre(f));
    for (var i = 0; i < EXTRAS.length; i++) if (EXTRAS[i][1].test(sl)) return EXTRAS[i][0];
    return null;
  }

  /* Datos del panel del avatar (solo los que el usuario rellena, en este orden) */
  var DATOS = [
    [/^edad$/, 'Edad'], [/orientacion/, 'Orientación sexual'], [/sentimental|estado-civil/, 'Estado sentimental'],
    [/^alias/, 'Alias'], [/apodo/, 'Apodos'], [/ocupacion|profesion/, 'Ocupación'],
    [/faccion/, 'Facción'], [/alianza/, 'Alianza'], [/ubicacion|residencia/, 'Ubicación']
  ];
  function panelDatos(campos) {
    var filas = [];
    DATOS.forEach(function (d) {
      for (var i = 0; i < campos.length; i++) {
        var c = campos[i];
        if (!d[0].test(slug(nombre(c))) || vacio(c)) continue;
        var cont = c.querySelector('.postprofile-field-content');
        var fila = el('div', 'rdato'); fila.title = d[1];
        var v = el('span', 'rdato__v'); v.innerHTML = cont.innerHTML;
        fila.appendChild(v); filas.push(fila);
        return;
      }
    });
    return filas;
  }

  function botonContacto(tipo, href, texto, icono, ext) {
    var a = el('a', 'rcbtn rcbtn--' + tipo);
    a.href = href; a.title = texto; a.setAttribute('aria-label', texto);
    if (ext) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    a.innerHTML = '<i class="cp ' + icono + '" aria-hidden="true"></i><span class="rcbtn__t">' + texto + '</span>';
    return a;
  }
  function contactos(post, playlist, extras) {
    var box = post.querySelector('.rcontactfields');
    if (!box || box.getAttribute('data-bts-ct')) return;
    box.setAttribute('data-bts-ct', '1');
    var perfil = '', mp = '', as = box.querySelectorAll('a[href]');
    for (var i = 0; i < as.length; i++) {
      var t = (as[i].getAttribute('href') + ' ' + as[i].innerHTML + ' ' + (as[i].title || '')).toLowerCase();
      if (!mp && /privmsg|fa-envelope|icon_pm|mensaje priv|enviar mensaje/.test(t)) mp = as[i].getAttribute('href');
      else if (!perfil && /\/u\d+|viewprofile|fa-user|icon_profile|perfil/.test(t)) perfil = as[i].getAttribute('href');
    }
    box.innerHTML = '';
    if (perfil) box.appendChild(botonContacto('perfil', perfil, 'Ver perfil', 'cp-user', false));
    if (mp) box.appendChild(botonContacto('mp', mp, 'Enviar mensaje privado', 'cp-envelope-o', false));
    var u = urlDe(playlist);
    if (u) box.appendChild(botonContacto('playlist', u, 'Playlist / OST', 'cp-music-note', true));
    EXTRAS.forEach(function (d) {
      for (var k = 0; k < (extras || []).length; k++) {
        if (extras[k].t !== d[0]) continue;
        var url = urlDe(extras[k].f);
        if (url) box.appendChild(botonContacto(d[0], url, d[3], d[2], true));
        break;
      }
    });
    if (!box.firstChild) box.style.display = 'none';
  }


  /* ---- Perfil de usuario: botones con iconos y datos bajo el avatar ----
     Lee los campos volcados por la plantilla (#rperfil-campos) y reparte:
     enlaces -> botones, Popularidad/Autocontrol -> barras, Poderes -> línea.
     Sustituye al cuadro "Otros datos" (que se oculta por CSS). */
  var PF_ACC = [
    [/mode=email|mailto|email/, 'cp-envelope-alt-o', 'Enviar correo'],
    [/privmsg|mode=post/,       'cp-envelope-o',     'Enviar mensaje privado'],
    [/mode=editprofile|editar/, 'cp-edit-o',         'Editar perfil'],
    [/search/,                  'cp-search',         'Buscar sus mensajes']
  ];
  function perfil() {
    var raiz = document.getElementById('rperfil');
    if (!raiz || raiz.getAttribute('data-bts-pf')) return;
    raiz.setAttribute('data-bts-pf', '1');

    /* botones de acción (buscar, editar, mensaje privado, correo) con icono */
    var as = raiz.querySelectorAll('.rperfil__actions a, .rperfil__contact a');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      var t = ((a.getAttribute('href') || '') + ' ' + (a.title || '') + ' ' + a.innerHTML).toLowerCase();
      for (var k = 0; k < PF_ACC.length; k++) {
        if (!PF_ACC[k][0].test(t)) continue;
        a.className += ' rcbtn';
        a.title = PF_ACC[k][2]; a.setAttribute('aria-label', PF_ACC[k][2]);
        a.innerHTML = '<i class="cp ' + PF_ACC[k][1] + '" aria-hidden="true"></i><span class="rcbtn__t">' + PF_ACC[k][2] + '</span>';
        break;
      }
    }

    /* datos bajo el avatar */
    var col = raiz.querySelector('.rperfil__avatar');
    var rpf = raiz.querySelectorAll('#rperfil-campos .rpf');
    if (!col || !rpf.length) return;
    var f = {}, extras = [], playlist = null, poderes = null;
    for (var j = 0; j < rpf.length; j++) {
      var l = rpf[j].querySelector('.rpf-l'), c = rpf[j].querySelector('.rpf-c');
      if (!l || !c) continue;
      var sl = slug(l.textContent.replace(/\s*:\s*$/, '').replace(/\*/g, ''));
      var par = { c: c };
      var ex = null;
      for (var e = 0; e < EXTRAS.length; e++) if (EXTRAS[e][1].test(sl)) ex = EXTRAS[e][0];
      if (ex) extras.push({ t: ex, f: c });
      else if (/(^|-)(playlist|ost)(-|$)/.test(sl)) playlist = c;
      else if (/popularidad/.test(sl)) f.pop = c;
      else if (/autocontrol/.test(sl)) f.auto = c;
      else if (/(^|-)(poder|poderes|habilidades?)(-|$)/.test(sl)) poderes = c;
    }
    if (col.querySelector('.rbars, .rcontactfields.rpf-bajo')) return;

    if (poderes && poderes.textContent.replace(/\s+/g, '').length) {
      var po = el('div', 'rpower tiene');
      po.innerHTML = '<span class="postprofile-field-label">Poderes</span> <span class="postprofile-field-content"></span>';
      po.querySelector('.postprofile-field-content').innerHTML = poderes.innerHTML;
      col.appendChild(po);
    }
    col.appendChild(barras(f));
    var box = el('div', 'rcontactfields rpf-bajo');
    var u = urlDe(playlist);
    if (u) box.appendChild(botonContacto('playlist', u, 'Playlist / OST', 'cp-music-note', true));
    EXTRAS.forEach(function (d) {
      for (var q = 0; q < extras.length; q++) {
        if (extras[q].t !== d[0]) continue;
        var url = urlDe(extras[q].f);
        if (url) box.appendChild(botonContacto(d[0], url, d[3], d[2], true));
        break;
      }
    });
    if (box.firstChild) col.appendChild(box);
  }

  var avisado = false;

  function arrancar() {
    try { iconosPost(); botonesTema(); perfil(); } catch (e) {}
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
        var ex = tipoExtra(c);
        if (ex) { (f.extras = f.extras || []).push({ t: ex, f: c }); continue; }
        if (!f.playlist && esPlaylist(c)) f.playlist = c;
        else if (!f.icono && es(c, CLAVES.icono) && c.querySelector('img')) f.icono = c;
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

      /* botones de contacto (perfil, MP, playlist) */
      contactos(post, f.playlist, f.extras);
      if (f.playlist && f.playlist.parentNode) f.playlist.parentNode.removeChild(f.playlist);

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

      /* panel al pasar el ratón por el avatar: solo los datos de DATOS que el usuario rellena */
      var pc = post.querySelector('.ravatar .rprofilecontent');
      if (pc) {
        var filas = panelDatos(campos);
        pc.innerHTML = '';
        filas.forEach(function (x) { pc.appendChild(x); });
        if (!filas.length) pc.style.display = 'none';
      }
    }
  }

  function tarde() { setTimeout(arrancar, 0); setTimeout(function () { try { iconosPost(); botonesTema(); perfil(); } catch (e) {} }, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarde);
  else tarde();
}();
