/* Lista de miembros (/memberlist): convierte la tabla en tarjetas.
   El grupo de cada miembro se deduce del color de su nombre (el que le pone Foroactivo
   según su grupo): se compara con los colores de GRUPOS y la tarjeta toma el color y el
   nombre del grupo. Si un color no coincide con ninguno, la tarjeta usa ese mismo color
   sin nombre de grupo. La tabla original se oculta (no se borra) para no romper nada.
   Si cambias el color de un grupo en el panel, cámbialo también aquí. */
(function () {
  var GRUPOS = [
    ['Authority', '#D96A50'], ['Divine', '#D6AD68'], ['Infamous', '#C85B70'], ['Notorious', '#9290D4'],
    ['Underdogs', '#C77B55'], ['Unknown', '#B77AC4'], ['Ordinary', '#72A995'], ['Missing', '#9296AA']
  ];

  function iniciar() {
    var tabla = document.getElementById('memberlist') || document.querySelector('table#memberlist');
    if (!tabla || tabla.getAttribute('data-bts-m')) return;

    function rgb(c) {
      if (!c) return null;
      var m = c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (m) { var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
      m = c.match(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i);
      return m ? [+m[1], +m[2], +m[3]] : null;
    }
    function grupoDe(color) {
      var a = rgb(color), mejor = null, dist = 1e9;
      if (!a) return null;
      GRUPOS.forEach(function (g) {
        var b = rgb(g[1]), d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
        if (d < dist) { dist = d; mejor = g; }
      });
      return dist <= 24 ? mejor : null;
    }

    var filas = tabla.querySelectorAll('tr'), cab = [], datos = [];
    Array.prototype.forEach.call(filas, function (tr) {
      var ths = tr.querySelectorAll('th');
      if (ths.length && !cab.length) { cab = Array.prototype.map.call(ths, function (t) { return (t.textContent || '').trim().toLowerCase(); }); return; }
      if (ths.length) return;
      var link = Array.prototype.filter.call(tr.querySelectorAll('a[href]'), function (a) { return /\/u\d+/.test(a.getAttribute('href') || '') && a.textContent.trim(); })[0];
      if (!link) return;
      var celdas = tr.children, sp = link.querySelector('[style*="color"], font[color]');
      var color = (sp && (sp.style.color || sp.getAttribute('color'))) || link.style.color || link.getAttribute('color') || '';
      var img = null, imgs = tr.querySelectorAll('img');
      for (var i = 0; i < imgs.length && !img; i++) {
        var s = imgs[i].getAttribute('src') || '';
        if (s && !/rank|icon_|_icon|status|forum_ico|spacer|blank|\/images\/(?!avatar)/i.test(s)) img = imgs[i];
      }
      var dato = {};
      Array.prototype.forEach.call(celdas, function (td, k) {
        var h = cab[k] || '', t = (td.textContent || '').replace(/\s+/g, ' ').trim();
        if (/mensaj|post/.test(h)) dato.mensajes = t;
        else if (/regist|inscrip|unid|desde/.test(h)) dato.desde = t;
        else if (/visita|activ|conex/.test(h)) dato.visita = t;
      });
      datos.push({ nombre: link.textContent.replace(/ /g, ' ').trim(), href: link.getAttribute('href'), color: color, img: img ? img.getAttribute('src') : '', d: dato });
    });
    if (!datos.length) return;

    var rej = document.createElement('div'); rej.className = 'rmiembros';
    datos.forEach(function (m) {
      var g = grupoDe(m.color), c = g ? g[1] : (rgb(m.color) ? m.color : '');
      var a = document.createElement('a'); a.className = 'rmiembro'; a.href = m.href;
      if (c) a.style.setProperty('--g', c);
      if (g) a.setAttribute('data-grupo', g[0].toLowerCase());
      var f = document.createElement('div'); f.className = 'rmiembro__foto';
      if (m.img) { var im = document.createElement('img'); im.src = m.img; im.alt = ''; im.loading = 'lazy'; f.appendChild(im); }
      else { f.textContent = (m.nombre || '?').charAt(0).toUpperCase(); f.className += ' sin-foto'; }
      var t = document.createElement('div'); t.className = 'rmiembro__txt';
      var gr = document.createElement('span'); gr.className = 'rmiembro__grupo'; gr.textContent = g ? g[0] : '';
      var n = document.createElement('strong'); n.className = 'rmiembro__nombre'; n.textContent = m.nombre;
      var meta = document.createElement('span'); meta.className = 'rmiembro__meta';
      var bits = []; if (m.d.mensajes) bits.push(m.d.mensajes + ' mensajes'); if (m.d.desde) bits.push('desde ' + m.d.desde);
      meta.textContent = bits.join(' · ');
      t.appendChild(gr); t.appendChild(n); t.appendChild(meta);
      a.appendChild(f); a.appendChild(t);
      rej.appendChild(a);
    });
    tabla.setAttribute('data-bts-m', '1');
    tabla.parentNode.insertBefore(rej, tabla);
    tabla.style.display = 'none';
    try { console.log('[BTS] miembros: ' + datos.length + ' tarjetas (' + datos.filter(function (x) { return grupoDe(x.color); }).length + ' con grupo reconocido)'); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  setTimeout(iniciar, 800);
})();
