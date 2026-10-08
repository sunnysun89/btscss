# Burn The Sky — Outer Card

Piel adaptada de Neon Nights a este foro, con su CSS (`bts/outer-card.css`)
y sus plantillas. Reglas de la autora: **no quitar sus créditos** (el
`.rcredits` de `index_body`) y **no redistribuir los códigos**.

## Instalación (panel, a mano)

Solo el fundador (u1) puede editar plantillas.

1. **Versión phpBB3.** Visualización → Temas → elegir versión phpBB3.
2. **Colores.** Resetear todos los colores del panel para que no choquen.
3. **Imágenes.** Iconos de foro → ninguno. Iconos de tema: `topic_read` en el
   primero, `topic_unread` en el segundo.
4. **CSS.** Desmarcar "optimizar CSS". La hoja vive en GitHub Pages (ver
   `cabecera.html`); no se pega en el panel.
5. **Plantillas** (`skin/plantillas/`, pegar y publicar cada una):
   `overall_header.html`, `index_body.html`, `index_box.html`,
   `viewtopic_body.html`, `privmsgs_body.html`.
6. **Descripciones de foro** (campo Descripción de cada foro en el panel):
   `descripcion-foro-simple.html` (ancho completo) o
   `descripcion-foro-doble.html` (medio ancho). Sustituir texto e imágenes.
7. **Widgets** (Módulos → Widgets del foro): Recent topics (estándar), Banner
   (`widget-mural.html`), Connection (estándar), Weekly most active
   (estándar), Groups opcional (`widget-leyenda-grupos.html`, iconos en
   fontawesome.com), Footer (`widget-pie.html`).
8. **JavaScript** (`skin/js/`, Módulos → Gestión de códigos Javascript):
   `js-banner.js` + `js-botones.js` en todas las páginas; `js-indice.js` solo
   índice; `js-temas.js` solo temas; `js-subforos.js` solo subforos.
9. **Perfil.** Campos personalizados de imagen: `icon` (70x70) y `post cover`
   (800x300). Si se renombran, cambiar `js-temas.js` también.

## Pendiente (la CSS los referencia pero no vienen en las instrucciones)

- **MultiSwitcher** (`#szSw`): falta su script. Guía candidata en el FAQ de
  necromancer ("Cambiar idioma del Switcheroo de Monomer"). No renombrar sus
  IDs/clases.
- **Afiliados reales** en `widget-pie.html` y staff en `widget-mural.html`.

## Ficheros

| Fichero | Qué es |
|---|---|
| `bts/outer-card.css` | La hoja, con `--burnthesky-img-bg/banner` ya apuntando a `bts/img/` |
| `plantillas/overall_header.html` | Header + `<div id="rheader">` |
| `plantillas/index_body.html` | Índice + `#rstatscontainer` |
| `plantillas/index_box.html` | Categorías y foros |
| `plantillas/viewtopic_body.html` | Temas y posts |
| `plantillas/privmsgs_body.html` | Mensajería |
| `plantillas/descripcion-foro-*.html` | Ejemplos ES para el campo Descripción |
| `plantillas/widget-mural.html` | Widget Banner (adaptado) |
| `plantillas/widget-leyenda-grupos.html` | Leyenda con iconos |
| `plantillas/widget-pie.html` | Widget Footer (adaptado) |
| `js/js-banner.js`, `js-botones.js` | Todas las páginas |
| `js/js-indice.js` | Índice (cadenas en español) |
| `js/js-temas.js`, `js/js-subforos.js` | Temas / subforos |
| `cabecera.html` | Fuentes + FA + link a la hoja |
