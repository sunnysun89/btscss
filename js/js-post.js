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
   - En el perfil: botones con iconos, enlaces bajo el avatar, y bajo el
     banner: rango, estadísticas, Poder perfil, su detalle y las barras.
     Frase bajo el título; imagen del aliado al final de la columna central.
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
    frase:  ['frase-post', 'frase-mensaje'],      // campo "Frase post"
    poder:  ['poder-mensaje', 'poder-post'],      // campo "Poder mensajes"
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
  /* ---- HTML y CSS escritos por el usuario en campos "zona de texto" ----------
     Foroactivo escapa el HTML de los campos de perfil: el usuario escribe
     <div style="..."> y el foro lo muestra como texto. Aquí se lee ese texto, se
     interpreta en un documento inerte (DOMParser) y se reconstruye SOLO con
     etiquetas, atributos y propiedades CSS permitidos. No hay scripts, ni
     posiciones fijas/absolutas, ni @import. Los <style> se acotan a su campo y
     las clases se renombran con el prefijo "u-" (.caja -> .u-caja).
     Si el campo no contiene etiquetas, se muestra tal cual (BBCode normal).
     Campos que lo usan: Curiosidades, Cronología, Detalle poder y Aliado (descripción). */
  var HTML_OK = /^(div|span|p|br|b|strong|i|em|u|s|del|small|sub|sup|h[1-6]|ul|ol|li|blockquote|hr|a|img|table|thead|tbody|tr|td|th|center|mark|code|pre|details|summary|figure|figcaption|style)$/;
  var CSS_OK = /^(color|background(-(color|image|size|position|repeat|clip))?|border(-(top|right|bottom|left))?(-(color|style|width|radius))?|border-radius|margin(-(top|right|bottom|left))?|padding(-(top|right|bottom|left))?|font(-(family|size|style|weight|variant))?|text-(align|decoration|transform|indent|shadow)|letter-spacing|word-spacing|line-height|width|height|(min|max)-(width|height)|display|flex(-(direction|wrap|grow|shrink|basis|flow))?|grid(-(template(-(columns|rows|areas))?|column|row|gap|area|auto-flow))?|gap|row-gap|column-gap|align-(items|content|self)|justify-(content|items|self)|opacity|box-shadow|transform|transform-origin|transition(-(property|duration|timing-function|delay))?|filter|cursor|list-style(-type)?|vertical-align|white-space|word-break|overflow-wrap|object-fit|object-position|float|clear|outline(-(color|style|width|offset))?|text-overflow|aspect-ratio|mix-blend-mode)$/;
  var contadorHtml = 0;

  function cssValorOk(v) {
    if (/expression|javascript|behavior|binding|@import|[<>\\]/i.test(v)) return false;
    var m, re = /url\(\s*(['"]?)([^'")]*)\1\s*\)/gi;
    while ((m = re.exec(v))) if (!/^https:\/\//i.test(m[2])) return false;
    return !/url\(/i.test(v.replace(re, ''));
  }
  function cssDecl(estilo) {
    var out = '';
    for (var i = 0; i < estilo.length; i++) {
      var p = estilo[i], v = estilo.getPropertyValue(p);
      if (CSS_OK.test(p) && cssValorOk(v)) out += p + ':' + v + ';';
    }
    return out;
  }
  function textoDe(n) {
    if (n.nodeType === 3) return n.nodeValue;
    if (n.nodeType !== 1) return '';
    var t = n.nodeName.toLowerCase();
    if (t === 'br') return '\n';
    if (t === 'a' && n.getAttribute('href')) return n.getAttribute('href');
    var s = ''; for (var c = n.firstChild; c; c = c.nextSibling) s += textoDe(c);
    return s;
  }
  function escalaSelector(sel, id) {
    return sel.split(',').map(function (x) {
      x = x.trim();
      if (!x || /[{}@<>;\\]/.test(x)) return '';
      x = x.replace(/\.(-?[_a-zA-Z][\w-]*)/g, '.u-$1');
      return '[data-rh="' + id + '"] ' + x;
    }).filter(Boolean).join(',');
  }
  function hojaEstilos(css, id) {
    var out = '';
    try {
      var hoja = new CSSStyleSheet(); hoja.replaceSync(css);
      Array.prototype.forEach.call(hoja.cssRules, function (r) {
        if (r.type !== 1) return;
        var d = cssDecl(r.style), s = escalaSelector(r.selectorText, id);
        if (d && s) out += s + '{' + d + '}';
      });
    } catch (e) {}
    return out;
  }
  function limpia(nodo, destino, estilos, id) {
    for (var c = nodo.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) { destino.appendChild(document.createTextNode(c.nodeValue)); continue; }
      if (c.nodeType !== 1) continue;
      var t = c.nodeName.toLowerCase();
      if (/^(script|iframe|object|embed|noscript|template|svg|math|form|input|button|textarea|select|link|meta|base|audio|video)$/.test(t)) continue;   /* se descarta con su contenido */
      if (!HTML_OK.test(t)) { limpia(c, destino, estilos, id); continue; }   /* etiqueta no permitida: se conserva el texto */
      if (t === 'style') { estilos.push(hojaEstilos(c.textContent, id)); continue; }
      var n = document.createElement(t);
      var st = cssDecl(c.style || {}); if (st) n.setAttribute('style', st);
      var cl = (c.getAttribute('class') || '').split(/\s+/).filter(function (x) { return /^[\w-]+$/.test(x); }).map(function (x) { return 'u-' + x; }).join(' ');
      if (cl) n.className = cl;
      ['title', 'alt', 'width', 'height', 'colspan', 'rowspan', 'align'].forEach(function (a) { if (c.hasAttribute(a)) n.setAttribute(a, c.getAttribute(a)); });
      if (t === 'a') {
        var h = c.getAttribute('href') || '';
        if (/^(https?:\/\/|mailto:|#)/i.test(h)) { n.setAttribute('href', h); n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
      }
      if (t === 'img') {
        var sr = c.getAttribute('src') || '';
        if (/^https:\/\//i.test(sr)) { n.setAttribute('src', sr); n.setAttribute('loading', 'lazy'); } else continue;
      }
      limpia(c, n, estilos, id);
      destino.appendChild(n);
    }
  }
  /* Devuelve el HTML a mostrar para un campo (.rpf-c / .postprofile-field-content). */
  function htmlUsuario(campo) {
    if (!campo) return '';
    var txt = textoDe(campo);
    if (!/<\/?[a-z][^>]*>/i.test(txt)) return campo.innerHTML;
    var doc = new DOMParser().parseFromString('<body>' + txt + '</body>', 'text/html');
    var id = ++contadorHtml, estilos = [], caja = document.createElement('div');
    caja.className = 'rhtml'; caja.setAttribute('data-rh', id);
    limpia(doc.body, caja, estilos, id);
    if (estilos.join('')) { var st = document.createElement('style'); st.textContent = estilos.join(''); caja.insertBefore(st, caja.firstChild); }
    return caja.outerHTML;
  }

  /* Lista de fichas: un campo normal = una ficha; un campo plural ("Relaciones",
     "Multicuentas") = una ficha por línea (separadas por salto de línea). */
  function fichasDe(campos) {
    var out = [];
    campos.forEach(function (c) {
      if (!c.getAttribute('data-plural')) { out.push(leerFicha(c)); return; }
      var grupos = [document.createElement('div')];
      for (var n = c.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1 && n.nodeName.toLowerCase() === 'br') grupos.push(document.createElement('div'));
        else grupos[grupos.length - 1].appendChild(n.cloneNode(true));
      }
      grupos.forEach(function (g) { if (g.querySelector('img') || g.textContent.trim()) out.push(leerFicha(g)); });
    });
    return out;
  }

  var PESTANAS = ['Perfil', 'Red y lore', 'Multicuentas y logbook'];   // nombres de las pestañas del perfil
  var MIN_REL = 6, MIN_MULTI = 3;     // casillas mínimas (las que faltan salen con imagen placeholder)
  var IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)|placehold\.co|imgur|postimg|i\.ibb/i;

  /* Pestañas: si js-ajustes.js ya las creó se reutilizan; si no, se crean aquí igual. */
  function pestanas(raiz) {
    var top = raiz.querySelector('.rperfil__top'), cols = raiz.querySelector('.rperfil__cols');
    var bar = raiz.querySelector('.rperfil__tabs');
    if (!bar && top && cols) {
      bar = el('div', 'rperfil__tabs'); bar.setAttribute('role', 'tablist');
      var foot = raiz.querySelector('.rperfil__foot'), extra = document.getElementById('rperfil-extra');
      var ps = PESTANAS.map(function (n, i) {
        var p = el('div', 'rperfil__panel'); p.setAttribute('role', 'tabpanel'); p.hidden = !!i; return p;
      });
      cols.parentNode.insertBefore(ps[0], cols); ps[0].appendChild(cols);
      if (foot) ps[0].appendChild(foot);
      if (extra) ps[0].appendChild(extra);
      var ref = ps[0]; for (var k = 1; k < ps.length; k++) { ref.parentNode.insertBefore(ps[k], ref.nextSibling); ref = ps[k]; }
      var bs = PESTANAS.map(function (n, i) {
        var b = el('button', 'rperfil__tab' + (i ? '' : ' is-on'), n); b.type = 'button'; b.setAttribute('role', 'tab');
        b.setAttribute('aria-selected', i ? 'false' : 'true');
        b.addEventListener('click', function () {
          bs.forEach(function (x, j) { x.classList.toggle('is-on', j === i); x.setAttribute('aria-selected', j === i ? 'true' : 'false'); ps[j].hidden = j !== i; });
        });
        bar.appendChild(b); return b;
      });
      top.parentNode.insertBefore(bar, top.nextSibling);
    }
    var paneles = raiz.querySelectorAll('.rperfil__panel');
    var botones = bar ? bar.querySelectorAll('.rperfil__tab') : [];
    for (var i = 0; i < botones.length; i++) if (PESTANAS[i]) botones[i].textContent = PESTANAS[i];
    for (var j = 0; j < paneles.length; j++) paneles[j].classList.remove('rperfil__panel--vacio');
    return paneles;
  }

  /* Ventana con la cabecera de tres puntos (igual que Inventario y medallero) */
  function ventanaPf(titulo) {
    var w = el('section', 'rperfil__win');
    w.appendChild(el('div', 'rinv__head', titulo));
    return w;
  }

  /* Lee un campo de ficha: imagen + nombre + descripcion (+ enlace). Formato libre:
     [img]url[/img] Nombre | Descripción breve | https://enlace */
  function leerFicha(c) {
    var d = { img: '', nombre: '', desc: '', link: '' };
    var t = c.cloneNode(true);
    var im = t.querySelector('img'); if (im) d.img = im.getAttribute('src') || '';
    Array.prototype.forEach.call(t.querySelectorAll('a[href]'), function (a) {
      var h = a.getAttribute('href') || '';
      if (/^https?:\/\//i.test(h)) { if (!d.img && IMG_RE.test(h) && !a.textContent.trim()) d.img = h; else if (!d.link) d.link = h; }
      if (a.querySelector('img') || /^https?:\/\//i.test(a.textContent.trim())) a.parentNode.removeChild(a);
    });
    Array.prototype.forEach.call(t.querySelectorAll('img'), function (i) { i.parentNode.removeChild(i); });
    Array.prototype.forEach.call(t.querySelectorAll('br,p,div'), function (b) { b.parentNode.insertBefore(document.createTextNode('\n'), b); });
    var partes = t.textContent.split(/\s*\|\s*|\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var resto = [];
    partes.forEach(function (x) {
      if (/^https?:\/\/\S+$/i.test(x)) { if (!d.img && IMG_RE.test(x)) d.img = x; else if (!d.link) d.link = x; }
      else resto.push(x);
    });
    d.nombre = resto[0] || ''; d.desc = resto.slice(1).join(' · ');
    return d;
  }

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

    /* campos del perfil */
    var f = {}, extras = [], playlist = null, poderes = null, detalle = null, aliado = null, aliadoDesc = null, apodos = null, curiosidades = null, cronologia = null, relaciones = [], multis = [], ooc = [];
    var rpf = raiz.querySelectorAll('#rperfil-campos .rpf');
    try { console.log('[BTS] perfil: campos →', Array.prototype.map.call(rpf, function (r) { var l0 = r.querySelector('.rpf-l'); return l0 ? slug(l0.textContent) : '?'; }).join(', ')); } catch (e0) {}
    for (var j = 0; j < rpf.length; j++) {
      var l = rpf[j].querySelector('.rpf-l'), c = rpf[j].querySelector('.rpf-c');
      if (!l || !c) continue;
      var sl = slug(l.textContent.replace(/\s*:\s*$/, '').replace(/\*/g, ''));
      var ex = null;
      for (var e = 0; e < EXTRAS.length; e++) if (EXTRAS[e][1].test(sl)) ex = EXTRAS[e][0];
      if (ex) extras.push({ t: ex, f: c });
      else if (/(^|-)(playlist|ost)(-|$)/.test(sl)) playlist = c;
      else if (/popularidad/.test(sl)) f.pop = c;
      else if (/autocontrol/.test(sl)) f.auto = c;
      else if (/aliad[oa].*descripcion|descripcion.*aliad[oa]/.test(sl)) aliadoDesc = c;
      else if (/(detalle|descripcion|explicacion).*poder|poder.*(detalle|descripcion|explicacion)/.test(sl)) detalle = c;
      else if (/aliad[oa].*(imagen|img)|(imagen|img).*aliad[oa]/.test(sl)) aliado = c;
      else if (/^poder-perfil|^poder(es)?$|^habilidades?$/.test(sl)) poderes = c;
      else if (/^apodos?$/.test(sl)) apodos = c;
      else if (/curiosid|curioso|trivia|secretos?$|notas-ocultas/.test(sl)) curiosidades = c;
      else if (/^cronologia/.test(sl)) cronologia = c;
      else if (/^(relacion|vinculo)/.test(sl)) { if (/^(relaciones|vinculos)$/.test(sl)) c.setAttribute('data-plural', '1'); relaciones.push(c); }
      else if (/^(multicuenta|alter|cuenta)/.test(sl)) { if (/^(multicuentas|alters|cuentas)$/.test(sl)) c.setAttribute('data-plural', '1'); multis.push(c); }
      else if (/^ooc(-|$)/.test(sl)) ooc.push({ l: l.textContent.replace(/\s*:\s*$/, '').replace(/^\s*ooc\s*[-:·]?\s*/i, '').trim() || 'OOC', c: c });
    }

    /* ---------- estructura en pestañas ---------- */
    var paneles = pestanas(raiz);
    var cols = raiz.querySelector('.rperfil__cols');
    var col = raiz.querySelector('.rperfil__avatar'), main = raiz.querySelector('.rperfil__main'),
        side = raiz.querySelector('.rperfil__side');
    function q1(s) { return raiz.querySelector(s); }
    function quita(n) { if (n && n.parentNode) n.parentNode.removeChild(n); return n; }

    /* ===== PESTAÑA 1 · columna izquierda ===== */
    if (col) {
      var rk = quita(q1('.rperfil__rank'));           /* el rango del foro pasa a la columna derecha */
      var box = el('div', 'rcontactfields rpf-bajo');
      var u = urlDe(playlist);
      if (u) box.appendChild(botonContacto('playlist', u, 'Playlist / OST', 'cp-music-note', true));
      EXTRAS.forEach(function (d) {
        for (var q2 = 0; q2 < extras.length; q2++) {
          if (extras[q2].t !== d[0]) continue;
          var url = urlDe(extras[q2].f);
          if (url) box.appendChild(botonContacto(d[0], url, d[3], d[2], true));
          break;
        }
      });
      if (box.firstChild) col.appendChild(box);

      /* navegación rápida: MP, mis mensajes, temas en los que participó, temas abiertos... */
      var acts = q1('.rperfil__actions');
      if (acts) {
        var todos = Array.prototype.slice.call(acts.querySelectorAll('a'));
        function por(re) { for (var z = 0; z < todos.length; z++) if (re.test(todos[z].title || '')) return todos[z]; return null; }
        var mp = por(/privado/i), bus = por(/buscar/i), mail = por(/correo/i), edit = por(/editar/i);
        var seq = [mp, bus];
        if (bus && bus.getAttribute('href')) {
          var h = bus.getAttribute('href');
          var conRes = function (v) { return /show_results=/.test(h) ? h.replace(/show_results=\w+/, 'show_results=' + v) : h + (/\?/.test(h) ? '&' : '?') + 'show_results=' + v; };
          var part = document.createElement('a'); part.href = conRes('topics');
          var abi = document.createElement('a'); abi.href = conRes('topics') + '&search_fields=firstpost';
          [[part, 'cp-chat-bubble-o', 'Temas en los que participó'], [abi, 'cp-add-o', 'Temas abiertos']].forEach(function (d) {
            d[0].className = 'rcbtn'; d[0].title = d[2]; d[0].setAttribute('aria-label', d[2]);
            d[0].innerHTML = '<i class="cp ' + d[1] + '" aria-hidden="true"></i><span class="rcbtn__t">' + d[2] + '</span>';
            seq.push(d[0]);
          });
        }
        seq.push(mail, edit);
        seq.forEach(function (a2) { if (a2) acts.appendChild(a2); });
        quita(acts.querySelector('.rperfil__contact'));
        acts.classList.add('rperfil__nav');
        if (box.firstChild) col.insertBefore(el('hr', 'rperfil__sep'), box.nextSibling);
        col.appendChild(acts);
      }

    }

    /* ===== PESTAÑA 1 · columna central ===== */
    if (main) {
      var idb = q1('.rperfil__id'), qq = q1('.rperfil__quote');
      if (qq && idb && idb.nextSibling !== qq) idb.parentNode.insertBefore(qq, idb.nextSibling);
      var nk = q1('.rperfil__nicks');
      if (nk && !nk.getAttribute('data-bts-one')) {
        var txt = apodos && apodos.textContent.replace(/\s+/g, '').length ? apodos.innerHTML
          : Array.prototype.map.call(nk.querySelectorAll('span'), function (x) { return x.textContent; }).join(', ');
        if (txt) { nk.innerHTML = ''; var one = document.createElement('span'); one.innerHTML = txt; nk.appendChild(one); nk.classList.remove('is-empty'); }
        nk.setAttribute('data-bts-one', '1');
      }
      var ub = q1('[data-slot="ubicacion"]'); if (ub) ub.classList.remove('rtile--wide');
      quita(q1('.rperfil__powers-wrap'));
    }

    /* ===== PESTAÑA 1 · columna derecha ===== */
    var nivel = q1('[data-slot="nivel"]'), rango = q1('[data-slot="rango"]'), creditos = q1('[data-slot="creditos"]');
    var credTxt = creditos ? (creditos.querySelector('.rtile__v') || creditos).textContent.trim() : '';
    var info = el('div', 'rperfil__info');
    var pTile = el('div', 'rstat rstat--power rstat--poder');
    var pv = el('span', 'rtile__v'), pl = el('span', 'rtile__l', 'Poder');
    if (poderes && poderes.textContent.replace(/\s+/g, '').length) pv.innerHTML = poderes.innerHTML;
    else { pv.textContent = '—'; pTile.classList.add('is-empty'); }
    pTile.appendChild(pv); pTile.appendChild(pl);
    var desc = el('div', 'rperfil__powerdesc');
    if (detalle && detalle.textContent.replace(/\s+/g, '').length) { desc.innerHTML = htmlUsuario(detalle); desc.classList.add('tiene'); }
    else { desc.textContent = 'Sin detalles del poder.'; desc.classList.add('vacio'); }
    if (rango) info.appendChild(rango);
    if (rk) info.appendChild(rk);
    info.appendChild(barras(f));
    quita(creditos); quita(q1('.rperfil__stats'));
    var banner = q1('.rperfil__banner');
    if (side) {
      if (banner) side.insertBefore(info, banner.nextSibling); else side.appendChild(info);
    }
    /* nivel de poder, poder y barras: bajo el avatar, encima de los botones */
    if (col) {
      var pb = el('div', 'rperfil__powerbox');
      if (nivel) pb.appendChild(nivel);
      pb.appendChild(pTile);
      pb.appendChild(desc);
      var avi = col.querySelector('.rperfil__avatarimg');
      col.insertBefore(pb, avi ? avi.nextSibling : col.firstChild);
    }
    /* Curiosidades: terminal bajo las barras (pestaña 1) */
    {
      var w2 = el('section', 'rperfil__win rperfil__win--nohead'), term = el('div', 'rterm');
      var alias = (q1('.rperfil__alias') || {}).textContent || '';
      term.appendChild(el('div', 'rterm__l', '> ACCESO CONCEDIDO · EXPEDIENTE: ' + alias.trim().toUpperCase()));
      term.appendChild(el('div', 'rterm__l', '> BIOGRAFÍA Y NOTAS OCULTAS'));
      var cu = el('div', 'rterm__body');
      if (curiosidades && curiosidades.textContent.replace(/\s+/g, '').length) cu.innerHTML = htmlUsuario(curiosidades);
      else { cu.textContent = 'SIN REGISTROS. ARCHIVO VACÍO.'; cu.classList.add('vacio'); }
      term.appendChild(cu);
      term.appendChild(el('div', 'rterm__l rterm__cur', '> '));
      w2.appendChild(term);
      if (main) main.appendChild(w2);
    }

    /* ===== PESTAÑA 2 · red de contactos y lore ===== */
    if (paneles[1]) {
      var w1 = ventanaPf('Relaciones'), rg = el('div', 'rrel');
      var n = 0;
      fichasDe(relaciones).forEach(function (d) {
        var it = el('div', 'rrel__it'), ph = el('div', 'rrel__ph'), imx = document.createElement('img');
        imx.src = d.img || 'https://placehold.co/100'; imx.alt = d.nombre || 'Vínculo';
        ph.appendChild(imx); it.appendChild(ph);
        it.appendChild(el('b', 'rrel__n', d.nombre || 'Sin nombre'));
        if (d.desc) it.appendChild(el('span', 'rrel__d', d.desc));
        if (d.link) { var aa = document.createElement('a'); aa.href = d.link; aa.className = 'rrel__a'; aa.appendChild(it); rg.appendChild(aa); }
        else rg.appendChild(it);
        n++;
      });
      for (; n < MIN_REL; n++) {
        var vi = el('div', 'rrel__it vacio'), vp = el('div', 'rrel__ph'), vimg = document.createElement('img');
        vimg.src = 'https://placehold.co/100'; vimg.alt = ''; vp.appendChild(vimg); vi.appendChild(vp);
        vi.appendChild(el('b', 'rrel__n', 'Sin vínculo')); rg.appendChild(vi);
      }
      w1.appendChild(rg);
      paneles[1].appendChild(w1);

      /* alianza (imagen + cuadro) a la izquierda y Cronología a la derecha, debajo de las relaciones */
      var w5 = ventanaPf('Alianza y cronología'), ag = el('div', 'ralian'), izq = el('div', 'ralian__l');
      var al = el('div', 'rperfil__ally'), im = aliado && aliado.querySelector('img');
      if (!im && aliado) { var uu = urlDe(aliado); if (uu) { im = document.createElement('img'); im.src = uu; im.alt = 'Aliado'; } }
      if (!im) { im = document.createElement('img'); im.src = 'https://placehold.co/250x150'; im.alt = 'Aliado'; al.classList.add('vacio'); }
      al.appendChild(im.cloneNode(true));
      izq.appendChild(al);
      var dd = el('div', 'ralian__d');
      var ti = quita(q1('[data-slot="alianza"]')); if (ti) dd.appendChild(ti);
      var ad = el('div', 'ralian__txt');
      if (aliadoDesc && aliadoDesc.textContent.replace(/\s+/g, '').length) ad.innerHTML = htmlUsuario(aliadoDesc);
      else { ad.textContent = 'Sin descripción.'; ad.classList.add('vacio'); }
      dd.appendChild(ad); izq.appendChild(dd);
      var der = el('div', 'ralian__r'), cr = el('div', 'rcrono');
      cr.appendChild(el('h3', 'rcrono__t', 'Cronología'));
      var cb = el('div', 'rcrono__b');
      if (cronologia && cronologia.textContent.replace(/\s+/g, '').length) cb.innerHTML = htmlUsuario(cronologia);
      else { cb.textContent = 'Sin cronología.'; cb.classList.add('vacio'); }
      cr.appendChild(cb); der.appendChild(cr);
      ag.appendChild(izq); ag.appendChild(der); w5.appendChild(ag);
      paneles[1].appendChild(w5);
    }

    /* ===== PESTAÑA 3 · multicuentas y logbook ===== */
    if (paneles[2]) {
      var w3 = ventanaPf('Multicuentas'), mg = el('div', 'rmulti'), m = 0;
      fichasDe(multis).forEach(function (d) {
        var tile = d.link ? document.createElement('a') : document.createElement('div');
        tile.className = 'rmulti__it';
        if (d.link) tile.href = d.link;
        var imm = document.createElement('img'); imm.src = d.img || 'https://placehold.co/250x150'; imm.alt = d.nombre || 'Multicuenta';
        tile.appendChild(imm);
        if (d.nombre) tile.appendChild(el('span', 'rmulti__n', d.nombre));
        mg.appendChild(tile); m++;
      });
      for (; m < MIN_MULTI; m++) {
        var vt = el('div', 'rmulti__it vacio'), vim = document.createElement('img');
        vim.src = 'https://placehold.co/250x150'; vim.alt = ''; vt.appendChild(vim); mg.appendChild(vt);
      }
      /* carrusel lateral: flechas que desplazan una multicuenta */
      var carr = el('div', 'rmulti-wrap');
      var bPrev = el('button', 'rmulti__arrow rmulti__arrow--prev', '‹'), bNext = el('button', 'rmulti__arrow rmulti__arrow--next', '›');
      bPrev.type = bNext.type = 'button'; bPrev.setAttribute('aria-label', 'Anterior'); bNext.setAttribute('aria-label', 'Siguiente');
      function paso(dir) { var it = mg.querySelector('.rmulti__it'); mg.scrollBy({ left: dir * ((it ? it.offsetWidth : 250) + 14), behavior: 'smooth' }); }
      bPrev.addEventListener('click', function () { paso(-1); });
      bNext.addEventListener('click', function () { paso(1); });
      function flechas() {
        bPrev.hidden = mg.scrollLeft < 4;
        bNext.hidden = mg.scrollLeft + mg.clientWidth >= mg.scrollWidth - 4;
      }
      mg.addEventListener('scroll', flechas);
      window.addEventListener('resize', flechas);
      carr.appendChild(bPrev); carr.appendChild(mg); carr.appendChild(bNext);
      w3.appendChild(carr);
      paneles[2].appendChild(w3);   /* (se añade ya para poder medir) */
      flechas(); setTimeout(flechas, 300);

      var w4 = ventanaPf('Logbook OOC'), lg = el('div', 'rlog');
      var tip = function (s) { var b = q1(s + ' .rdate__tip'); return b ? b.textContent.replace(/^[^·]*·\s*/, '').trim() : ''; };
      var cal = q1('.rdate--cal'), reg = tip('.rdate--cal') || (cal && (cal.getAttribute('data-fallback') || '').trim()) || '';
      var nac = tip('.rdate--cake');
      var lastB = q1('.rperfil__last b'), msgB = q1('.rperfil__stat b'), onl = q1('.rperfil__online');
      var filas = [
        ['Última visita', lastB ? lastB.textContent.trim() : ''],
        ['Estado', onl ? onl.innerHTML.trim() : '', true],
        ['Registro', reg],
        ['Cumpleaños', /sin fecha/i.test(nac) ? '' : nac],
        ['Mensajes', msgB ? msgB.textContent.trim() : ''],
        ['Créditos', credTxt]
      ];
      ooc.forEach(function (o) { filas.push([o.l, o.c.innerHTML.trim(), true]); });
      filas.forEach(function (r) {
        var row = el('div', 'rlog__row'), lb = el('span', 'rlog__l', r[0]), vv = el('span', 'rlog__v');
        if (r[1] && r[1] !== '—') { if (r[2]) vv.innerHTML = r[1]; else vv.textContent = r[1]; } else { vv.textContent = '—'; row.classList.add('is-empty'); }
        row.appendChild(lb); row.appendChild(vv); lg.appendChild(row);
      });
      w4.appendChild(lg);
      paneles[2].appendChild(w4);
    }
    /* hover por coordenadas: funciona aunque algo transparente tape las imágenes */
    if (!raiz.getAttribute('data-bts-hv')) {
      raiz.setAttribute('data-bts-hv', '1');
      var marca = function (x, y) {
        Array.prototype.forEach.call(raiz.querySelectorAll('.rrel__it, .rmulti__it'), function (t) {
          var r = t.getBoundingClientRect();
          t.classList.toggle('is-hover', x != null && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
        });
      };
      document.addEventListener('mousemove', function (e) { if (raiz.querySelector('.rperfil__panel:not([hidden]) .rrel, .rperfil__panel:not([hidden]) .rmulti')) marca(e.clientX, e.clientY); }, { passive: true });
      document.addEventListener('mouseleave', function () { marca(null, null); });
    }
    /* los botones de nacimiento e inscripción ya no se muestran: sus datos están en el Logbook */
    Array.prototype.forEach.call(raiz.querySelectorAll('.rdate'), quita);
  }

  /* ---- Índice v3: tarjeta de foro (título + cifras, descripción, enlaces, imagen,
     último tema, último autor con avatar circular) -------------------------------
     Reconstruye cada fila de .forabg ul.topiclist.forums (índice y caja de
     subforos) con las piezas que ya trae: título, FORUM_DESC (.rfordesc,
     .rforlinks, .rforimg o texto plano), cifras y último mensaje. Lo original se
     conserva oculto. Para volver a la estructura anterior: INDICE_V3 = false. */
  var INDICE_V3 = true;

  function indiceV3() {
    if (!INDICE_V3) return;
    var filas = document.querySelectorAll('.forabg ul.topiclist.forums > li.row');
    for (var i = 0; i < filas.length; i++) {
      var li = filas[i];
      if (li.getAttribute('data-bts-c3')) continue;
      li.setAttribute('data-bts-c3', '1');
      var h = li.querySelector('.hierarchy'), dl = li.querySelector('dl.icon');
      if (!h || !dl) continue;
      var tit = h.querySelector('a.forumtitle') || h.querySelector('a');
      var dt = dl.querySelector('dd.topics'), dp = dl.querySelector('dd.posts'), dlp = dl.querySelector('dd.lastpost');
      var num = function (n) { var m = n ? n.textContent.match(/\d[\d.,]*/) : null; return m ? m[0] : '0'; };

      /* descripción: .rsingleforum / .rdoubleforum o cualquier contenido entre el título y las cifras */
      var cont = li.querySelector('.rsingleforum, .rdoubleforum');
      var desc = null, links = null, img = null;
      if (cont) {
        desc = cont.querySelector('.rfordesc'); links = cont.querySelector('.rforlinks'); img = cont.querySelector('.rforimg');
      } else {
        desc = document.createElement('div');
        for (var n = h.nextSibling; n && n !== dl; n = n.nextSibling) desc.appendChild(n.cloneNode(true));
      }

      var card = el('div', 'rc3');
      /* cabecera */
      var head = el('div', 'rc3__head');
      var t = el('a', 'rc3__title'); t.href = tit ? tit.getAttribute('href') : '#'; t.innerHTML = tit ? tit.innerHTML : h.textContent;
      head.appendChild(t); head.appendChild(el('span', 'rc3__line'));
      head.appendChild(el('span', 'rc3__badge', num(dt) + ' temas'));
      head.appendChild(el('span', 'rc3__badge', num(dp) + ' msgs'));
      card.appendChild(head);
      /* texto */
      var cd = el('div', 'rc3__desc');
      if (desc && desc.textContent.replace(/\s+/g, '').length) cd.innerHTML = desc.innerHTML; else cd.classList.add('vacio');
      card.appendChild(cd);
      /* enlaces (chips) */
      if (links && links.querySelector('a')) {
        var ch = el('div', 'rc3__chips'); ch.innerHTML = links.innerHTML; card.appendChild(ch);
      }
      /* columna derecha: imagen, avatar, último tema y último autor */
      var side = el('div', 'rc3__side');
      var bg = img ? (img.style.backgroundImage || '') : '';
      if (bg) {
        var im = el('div', 'rc3__img'); im.style.backgroundImage = bg; side.appendChild(im);
        li.style.setProperty('--rc3-img', bg);
      }
      var av = dlp ? dlp.querySelector('.lastpost-avatar img') : null;
      var topic = dlp ? dlp.querySelector('a[href*="/t"], a[title]') : null;
      var user = null;
      if (dlp) { var as = dlp.querySelectorAll('a'); for (var k = 0; k < as.length; k++) if (/\/u\d+/.test(as[k].getAttribute('href') || '') && as[k].textContent.trim()) { user = as[k]; break; } }
      var ultimo = null;
      if (dlp) { var as2 = dlp.querySelectorAll('a'); for (var q = 0; q < as2.length; q++) if (/#\d+|[?&]p=|\/p\d+/.test(as2[q].getAttribute('href') || '') && as2[q] !== user && !as2[q].textContent.trim()) { ultimo = as2[q]; break; } }
      if (topic || user) {
        if (av) { var aw = el('a', 'rc3__av'); aw.href = user ? user.getAttribute('href') : '#'; var ai = document.createElement('img'); ai.src = av.getAttribute('src'); ai.alt = user ? user.textContent : ''; ai.loading = 'lazy'; aw.appendChild(ai); side.appendChild(aw); }
        else side.classList.add('sin-av');
        if (topic) {
          var b1 = el('a', 'rc3__btn'); b1.href = topic.getAttribute('href'); b1.title = topic.getAttribute('title') || topic.textContent; b1.textContent = topic.textContent.trim(); side.appendChild(b1);
        }
        if (user) {
          var b2 = el('a', 'rc3__btn rc3__btn--user'); b2.href = (ultimo || user).getAttribute('href');
          b2.title = user.textContent.trim() + ' · ' + (dlp.textContent.match(/\d{1,2}[:h]\d{2}[^\n]*$/) || [''])[0];
          b2.appendChild(el('span', 'rc3__uname', user.textContent.trim())); b2.appendChild(el('span', 'rc3__arrow', '→'));
          var col = window.getComputedStyle(user).color; if (col) b2.style.setProperty('--user-color', col);
          side.appendChild(b2);
        }
      } else {
        side.appendChild(el('span', 'rc3__btn rc3__btn--none', 'Sin mensajes'));
      }
      card.appendChild(side);
      li.classList.add('rc3-row');
      li.appendChild(card);
    }
  }

  var avisado = false;

  function arrancar() {
    try { iconosPost(); botonesTema(); perfil(); indiceV3(); } catch (e) {}
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
        else if (!f.poder && (slug(nombre(c)) === 'poder' || es(c, CLAVES.poder))) f.poder = c;
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
        if (f.poder && !vacio(f.poder)) {
          var lb = f.poder.querySelector('.postprofile-field-label'); if (lb) lb.textContent = 'Poder:';
          poBox.appendChild(f.poder); poBox.classList.add('tiene');
        }
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

  function tarde() { setTimeout(arrancar, 0); setTimeout(function () { try { iconosPost(); botonesTema(); perfil(); indiceV3(); } catch (e) {} }, 800); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tarde);
  else tarde();
}();
