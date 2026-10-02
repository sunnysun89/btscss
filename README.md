# Burn The Sky — la skin

Ocho hojas CSS modulares, servidas desde fuera igual que las de Blinding
Lights, y una cabecera que las enlaza.

## Lo primero: esto NO esta puesto en el foro

A 30/09/2026 el foro vivo sirve **una sola hoja de estilo**:

```
https://burnthesky.foroactivo.com/0-ltr.css
```

que es el tema por defecto de phpBB. No hay ningun `github.io`, ni `localhost`,
ni `--bts-surface`, ni Playfair en el HTML. El foro se ve con el tema claro
azulado de fabrica.

Todo lo de este directorio esta escrito y comprobado con medidas, pero **no se ve
en el foro** hasta que se pegue `cabecera.html` en `overall_header` y las hojas
esten servidas desde algun sitio. Si has estado mirando `burnthesky.foroactivo.com`
para juzgar la skin, lo que has visto es phpBB, no esto.

## Como se despliega

1. Sube la carpeta `bts/` a GitHub Pages. Si el repo es `bts-skin` y el usuario
   es `TU-USUARIO`, la base es:

   ```
   https://TU-USUARIO.github.io/bts-skin/bts
   ```

2. Abre `cabecera.html`, sustituye `RAW_BASE` por esa URL y pega el bloque
   entero en el panel:

   ```
   Panel -> Visualizacion -> General -> Editar
   ```

   dentro de `overall_header`, justo despues de `{CSS}`.

3. Guarda y publica la plantilla.

Probar en local: `RAW_BASE` a `http://localhost:8742` y servir esta carpeta con
el `serve.ps1` que hay al lado. Cambiar `RAW_BASE` antes de publicar.

## Las hojas

| Fichero | Que hace |
|---|---|
| `bts/01-base.css` | Variables, reset, tipografia. Colores y las tres fuentes. |
| `bts/02-layout.css` | Fondo, cabecera en hero, navegacion, columnas, pie. |
| `bts/03-index.css` | Categorias, filas de foro, los contadores. |
| `bts/04-thread.css` | Lista de temas y los posts. |
| `bts/05-profile.css` | Campos de perfil y los implantes. |
| `bts/06-forms.css` | Botones, campos, y el editor sceditor. |
| `bts/08-groups.css` | Puente con los ocho grupos de fama. |
| `bts/09-stats.css` | El bloque de estadisticas viejo. |
| `bts/10-stats.css` | El bloque de estadisticas nuevo. |
| `bts/11-topbar.css` | La barra de arriba. Retira la de Foroactivo. |
| `bts/07-responsive.css` | Puntos de ruptura. Va el ultimo a proposito: gana. |

## La barra de arriba, y por que no es una barra nueva

`11-topbar.css` retira `#fa_toolbar` —la de Foroactivo— y pone en su sitio una
barra propia. Pero **no la construye desde cero**, y esa es la decision que
importa.

Dentro de `#fa_toolbar` hay cosas de phpBB con JavaScript debajo: el saludo
(`#fa_welcome`), el desplegable de usuario (`#fa_menulist`, con avatar, rango y
enlaces), las notificaciones (`#fa_notifications`, `#notif_list`, que se
rellena por ajax) y el boton de desconectarse. Borrar el markup y escribir
otro deja el menu de usuario a medio hacer, las notificaciones sin llegar y sin
sesion que cerrar. En un foro de rol eso no es un detalle: es perder la sesion.

Asi que el DOM no se toca. Se retira solo lo que es marca de Foroactivo —el
logo `#fa_left`, el enlace a su web, el boton de plegar— y se cambia de
vestido el resto. La marca del foro va en un `::before`, de modo que **no hay
que editar ninguna plantilla ni pegar nada en el panel**: basta con el
`<link>` de la hoja.

Ojo con la atribucion: Foroactivo da el foro gratis a cambio de que su nombre
siga en la pagina. Ocultar la barra no es quitar el aviso legal del pie, que es
donde esta el aviso, pero quitar la marca visible puede ir contra las
condiciones del servicio. Si hay que devolverla, se borra el `<link>` de
`11-topbar.css` en `cabecera.html` y no hay ningun otro sitio del que
dependa.

## Lo que hace que no salga gris

Son tres cosas, y las tres hacen falta. La segunda es la que mas se nota y la
mas facil de perder.

**1. La paleta.** Cerca de negro, pero neutra. El acento es un ember
`#e08a4a`, el que usan los cuatro foros de referencia — NBorn rosa polvo,
LoveWinsAll terracota, DTT rust — ninguno con un acento frio saturado.

**2. El velo va DEBAJO del contenido.** Este era el problema de verdad, y
estaba escondido en una aparentemente inocente `z-index: 0`.

`body::before` es el velo oscuro que apaga la foto de fondo. Estaba escrito con
`position: fixed; z-index: 0`, y eso lo convierte en un elemento POSICIONADO
con z-index cero. Segun el orden de pintado del CSS, los hijos posicionados con
z-index 0 se pintan en el paso 9, y el contenido normal esta en los pasos 3 y 4.
O sea que **el velo se pintaba encima de TODA la pagina**, con un negro al
82-97 %. Cada palabra del foro se dibujaba debajo. De ahi la queja de que "todo
se ve gris menos el banner": el banner es lo unico con luz propia para
atravesar un velo de esa densidad.

Con `z-index: -1` baja al paso 2, debajo del contenido y por encima del fondo,
que es lo que tiene que hacer. Y de paso ya no necesita tapar tanto: del
82-97 % al 62-90 %, asi que la foto de fondo se ve de verdad.

**3. Los colores de phpBB, pintados a mano.** phpBB pone su color de tema
claro (`#333`, `#666`, `#777`) directamente sobre un puñado de contenedores.
`#333` sobre `#101011` da **1,4 de contraste**. No sale gris: sale ilegible. En
`01-base.css` esta la lista completa, en tres niveles para que el indice no
pierda la jerarquia.

## Y una trampa con los !important

`01-base.css` pone unos cuantos contenedores en
`background-color: transparent !important` para tapar los fondos claros de
phpBB. Eso esta bien, pero es una pared: **cualquier otra regla que ponga un
fondo ahi sin llevar tambien su `!important` no hace nada.** Se escribe,
parece correcta, y no se ve.

Por eso `.post` tenia su tarjeta entera en `04-thread.css` —fondo, borde,
radio, sombra— y no se veia nada: el reset se la comia. Lo mismo con las
tarjetas de las estadisticas, y con el hover de las filas del formulario.

Un `!important` que gana contra el `!important` de al lado no se nota leyendo
el CSS, porque las dos reglas parecen correctas.

`construir/revisar-superficies.js` recorre las once hojas, saca la lista de
elementos que aplasta el reset y avisa de los fondos que se quedan sin
`!important`. Sale con codigo 1 si hay alguno.

## Y otra con los selectores agrupados

Una regla agrupada **no** vale lo que vale su selector mas fuerte, ni la
media: vale la SUMA. Dos que ya han salido:

- `a, a:link, a:visited, a:active, a.topictitle` vale `(0,4,5)` y le gana a
  `.navbar a.mainmenu`, que es `(0,2,1)`. Con eso media pagina salia en color
  de acento.
- `li.header dd` agrupado con `#page-footer` vale `(2,8,5)`, con los dos ID
  sumados, y le gana a la regla del nombre de la categoria —`(0,3,2)`—, que se
  queda en gris. Una regla pensada solo para pintar el pie estaba apagando los
  titulos de seccion.

La regla general: **un selector por regla** cuando el peso importa, y
`construir/revisar-cascada.js` para comprobarlo.

## Como se comprueba

- `node construir/contraste.js` — el contraste de la paleta, sobre los
  literales de `:root`, donde no puede mentir.
- `node construir/revisar-superficies.js` — los fondos que se come el reset.
- `construir/revisar-cascada.js` — que regla gana DE VERDAD sobre un elemento
  real, preguntando al elemento con `matches()`.

`getComputedStyle` no sirve para nada aqui: devuelve valores rancios, hasta
con un `!important` puesto encima. Sjeweldo se corrigieron tres cosas que ya
estaban bien.
## El hover, que era el problema

El hover de las filas nunca funcionaba bien. Tres intentos:

| | Fondo | Contraste con la superficie | Descripcion al pasar el raton |
|---|---|---|---|
| 1. `surface-2` | `#1f242f` | **1,07** | 3,81 — invisible el cambio |
| 2. Dedicated | `#303849` | 1,47 | **3,81** — se ve la fila, se pierde el texto |
| 3. El actual | `#2a3140` | 1,32 | **5,98** — el texto sube con el fondo |

La clave es la ultima columna. La descripcion es `--bts-text-3` (#8a93a6), que
sobre la superficie da 5,58 pero sobre un fondo mas claro baja a 3,81. Por eso
se veia la fila iluminarse y la descripcion desaparecer.

La solucion es que **el hover mueva el texto tambien**: al pasar el raton, la
descripcion sube a `--bts-text-2` (#a8b0c0) y queda en 5,98, mejor que en reposo.
Un hover que solo mueve el fondo siempre acaba comiendose el texto.

Vorfreude hace lo mismo y con un color en vez de un gris (`--colehover: #ad3233`),
y LoveWinsAll en sus botones pasa de `#232323` a `#333`. El patron en los cinco
foros de referencia es el mismo: **el hover es un tinte, no un escalon de gris**.

Ademas sale una barra de acento de 2 px a la izquierda de la fila, que es la
senal de "estoy aqui" que ningun color por si solo da.

## Botones

Copiados del patron comun: radio 5 px, 12 px, mayusculas, borde de 1 px, y al
pasar el raton el fondo va al acento y aparece una sombra.

```
Vorfreude   .button1  ->  var(--accent6) + box-shadow 0 1px 9px rgba(0,0,0,.6)
LoveWinsAll #theme-toggler  #232323  ->  #333
```

## La paleta

El base sigue siendo casi negro (`#0a0c11`), pero cada superficie se separa de
la de debajo.

| Par | Antes | Ahora |
|---|---|---|
| Texto normal sobre superficie | 14,16 | 14,29 |
| Texto secundario | 7,07 | 7,91 |
| Texto terciario | 3,31 | **5,58** |
| Acento sobre superficie | 11,59 | 10,75 |

El terciario era el problema: 3,31 esta bajo el 4,5 de AA, y es el color de las
fechas, los contadores y los moderadores.

Los ocho grupos son `--group1` a `--group8` en el orden del escalafon. Seis
cumplen AA sobre la superficie nueva; **INFAMOUS (4,20) y UNKNOWN (3,93)** se
quedan cortos. Se pueden subir un punto si quieres que todos cumplan.

## El indice: el ajuste que hay que saber

`Visualizacion → Indice → Estructura y Jerarquia` → "Conservar las categorias en
el indice" tiene seis valores. Probados los seis uno por uno:

| Valor | Cajas | Filas | Que sale |
|---|---|---|---|
| 0 | 1 | 24 | plano, sin nombre de categoria |
| 1 | 1 | 24 | plano, sin nombre de categoria |
| 2 | 1 | 8 | solo categorias |
| **3** | **8** | **24** | **categoria > foro > subforo, con sangria. ESTE** |
| 4 | 8 | 24 | categoria > foro, sin sangria |
| 5 | 8 | 8 | solo categorias, separadas |

Esta en **3**, que es el unico con el tercer nivel sangrado. El 4 se ve igual
porque hoy no hay subforos, pero el 3 los muestra si anades alguno.

Antes estaba en 0, donde las siete categorias no aparecian en el indice.

## Lo que el markup obliga a hacer

- **phpBB pone estilos EN LINEA que ganan a la hoja de estilo.** El div de cada
  foro lleva `style="display: block; margin : 0 0px 0 45px;"`. Cualquier cosa
  que se quiera hacer con su `display` necesita `!important`, o no se hace
  nada. Esto estuvo horas pareciendo un fallo mio cuando era esto.
- **La descripcion es un nodo de texto suelto**, no un elemento. Va dentro del
  div, separada por `<br>`. Por eso el div se hace columna flexible: cada nodo
  sale en su linea y los `<br>` sobran.
- **La clase `mainmenu` va en cada `<a>`, no en la lista.** La lista es
  `ul.linklist.navlinks`. El `ul` se deja como bloque: ponerle `display:flex`
  no cuela, y haciendo que los `li` floten en linea sale la misma fila.
- **`#page-header` tiene que quedar como bloque.** Si se vuelve una fila flex
  con `justify-content: space-between`, `.headerbar` se encoge al ancho de su
  contenido: la banda salia de 398 px en una pagina de 965. Por eso el fondo va
  en `.headerbar` y no en `#logo-desc`, que esta dentro del `inner` con ancho
  maximo.
- **La caja de la categoria se llama `.forabg`, no `.forumbg`.**
- **El nombre de la categoria esta en `li.header .table-title`.**
- **La rejilla va en `dl.icon`, no en `li.row`.** `li.row` tiene un solo hijo;
  las celdas estan dentro de ese `dl`.
- **La lista de foros del indice es `ul.topiclist.forums`**, con las dos clases.
  Todo `04-thread.css` va con `:not(.forums)`.
- **Cada `dl.icon` lleva un fondo gif y un `margin-left: 45px` en linea** que hay
  que anular con `!important`.

## Una nota sobre medir en este navegador

`getComputedStyle` **miente con `display` y con `font-size`**. Comprobado:

- Un `font-size: 20px` fijo da la misma altura que `64px` (probe de texto).
- `ul.navlinks { display: flex !important }` sigue leyendo `block`, cuando la
  fila se ve correcta en pantalla.
- Un probe `color: red !important` no cambia el valor informado.

Lo que si es fiable: `offsetTop`/`offsetHeight`, `getBoundingClientRect` de
anchos, `getPropertyValue` de variables, `document.fonts`, y **el parser de la
propia pagina**: metiendo el CSS en un `<style>` en linea, `sheet.cssRules` si
devuelve las 57 reglas y sus declaraciones, y eso si es la prueba definitiva de
que una regla esta bien escrita.

Como comprobar una regla sin fiarse de las medidas: insertar el CSS como
`<style>` en linea y leer `cssRules`.

## Lo que el skin no hace todavia

- **El indice es el de phpBB.** No hay mural, ni panel de estadisticas con
  imagen, ni leyenda de grupos en portada. Eso va con `index_body`.
- **Las columnas laterales estan vacias**, y el CSS las oculta con
  `:not(:empty)`. En cuanto anadas un widget aparece sola.
- **No se ha tocado ninguna plantilla.** Todo son hojas de estilo.
- **La vista movil** esta escrita pero sin probar en un telefono de verdad.
- **La cabecera nueva no se ha visto con ojos.** El sandbox de este navegador
  dejo de dar capturas a mitad del trabajo; todo lo de aqui sale de medidas y
  del parser, que son fiables, pero falta el vistazo.
---

## Los fallos que salieron al verla de verdad

La hoja se escribio y se midio mucho antes de que estuviera puesta en el foro.
Al verlaasi aparecieron cinco cosas que ninguna medicion anterior habia visto.

**1. Los palos blancos entre columnas del indice.**
phpBB pone `ul.forums dd { border-left: 1px solid #fff }` en CADA celda del
listado de foros. Es el borde del tema claro, y en un foro oscuro salian unos
palos blancos verticales entre columnas. phpBB se lo quita a `dd.topics` y
`dd.posts`, pero no a `dd.dterm` ni a `dd.lastpost`, que son justo las dos que se
notan. Y poner `border:0` en el `dl.icon` padre no sirve: los bordes no se
heredan, hay que ir celda por celda.

**2. El final del indice, que salia roto.** Media pantalla en negro y un par de
textos partidos. Causa: **mio**. La clase `usr_grp_clr` de Foroactivo no es una
barra de color bajo el autor, como pense al escribirla: es la insignia de grupo
de TODO, el autor de un post, el usuario conectado, el ultimo registrado, cada
entrada de la leyenda. La regla le ponia `width:44px; height:2px`, asi que
"Faceless" se partia en "Face / less" porque el nombre no cabia en 44 px.

La clase ahora se trata como lo que es: una insignia de texto con el color del
grupo puesto en linea por phpBB.

**3. El "Faceless" gigante en Estadisticas.** `.bts-stat strong` ponia 42 px en
Bodoni, y eso funciona para `13` y para `1` pero `{NEWEST_USER}` trae el NOMBRE
dentro del `<strong>`, no una cifra. La tercera celda lleva ya su propio
tratamiento, con el nombre a tamano normal.

**4. Los enlaces azules casi invisibles.** phpBB tiene
`a:link, a:visited { color: #105289 }`, azul oscuro de tema claro. Un `a` a secas
tiene especificidad (0,0,1) contra (0,1,1) de un `a:link`, y pierde. El color va
ahora en `a:link` y `a:visited`, y tambien en `a.topictitle`, que trae el suyo.

**5. Los posts en Verdana.** phpBB define `font-family: Verdana` directamente
sobre `.content` Y otra vez sobre `.content p`, que es un elemento distinto.
Arreglando solo el contenedor, los parrafos de dentro seguian en Verdana. Hay 32
selectores de phpBB que hacen esto; `01-base.css` los pisa todos con
`!important`.

## Lo que no se ha podido comprobar

`getComputedStyle` miente de forma systematica en este navegador:

- `a { color: red !important }` no cambia el valor que informa.
- `ul.navlinks { display: flex !important }` sigue leyendo `block` cuando la fila
  se ve bien.
- Un `font-size: 20px` fijo da la misma altura que `64px`.

Lo que si es fiable: anchos, `offsetTop`/`offsetHeight`, `getPropertyValue` de las
variables, `document.fonts`, y el parser de la pagina. Para comprobar una regla
sin fiarse de las medidas: pegarla como `<style>` en linea y leer `sheet.cssRules`.
---

## El contraste, que es donde estaba el problema de verdad

Se escribio un auditor que recorre los textos visibles, calcula el ratio contra
lo que tienen detras y solo se fia de los valores que salen iguales en dos
lecturas separadas. La primera pasada dio 19 fallos. Los que de verdad importaban:

**Las superficies claras de phpBB.** El foro esta sobre el tema claro, que pinta
de blanco o azul claro un puñado de contenedores:

    #wrap        #FFFFFF     el contenedor de TODA la pagina
    .navbar      #CADCEB     la barra de navegacion
    ul.forums    #ECF3F7     la lista de foros del indice
    .module      #ECF3F7     los modulos del perfil
    input        #FFFFFF     los campos de los formularios

La primera version no los tocaba: ponia el fondo oscuro en el body y confiaba en
un velo (`body::before`, un gradiente al 82-97 %) para tapar lo de debajo. En
cuanto un texto transparente se apoyaba en uno de esos contenedores, salia claro
sobre claro: "Ver mensajes desde la ultima visita" a 1,60 de contraste, los
titulos de foro a 1,43, el menu a 1,14.

Ahora las superficies se pintan de verdad y el velo ha bajado a 30-75 %, que ya
solo es profundidad y no un tapon.

**El ancho de las celdas.** phpBB pone `width:60%` en `dd.dterm`, `8%` en
`dd.topics`/`dd.posts` y `20%` en `dd.lastpost`. En una rejilla el `width` de la
celda manda sobre la pista, asi que la pista de 470px se quedaba en una celda de
282 y hacia un hueco de 208px entre la descripcion y los contadores. Con
`width: auto !important` en las celdas, el hueco son 20px, que es la propia
separacion de la rejilla. Y las cabeceras "TEMAS"/"MENSAJES" ahora caen exactamente
sobre sus numeros (531 / 615 / 699 las dos filas).

**El reparto por porcentajes**, como los de referencia:

    Vorfreude   dd.dterm { width:52% }   dd.lastpost { width:32% }
    NBorn       dd.dterm { width:60% }   dd.lastpost { width:20% }

**Los colores de grupo** no se pueden arreglar en el CSS: phpBB los escribe en un
style EN LINEA en cada insignia, y un estilo en linea gana a cualquier hoja de
estilo. Se han cambiado en el panel, y los ocho pasan ahora AA. Los que estaban
mal:

    AUTHORITY  #e8552f -> #ff7a4d   (3,73 -> 5,26)
    INFAMOUS   #e43d5b -> #ff6b8a   (3,31 -> 4,99)
    NOTABLE    #5b8cff -> #7aa5ff   (4,29 -> 5,60)
    UNKNOWN    #c13bce -> #d97ae0   (3,09 -> 5,05)
    MISSING    #7c8598 -> #9aa5b8   (3,66 -> 5,46)

**Las pestanas del perfil** no tienen clase. No es `ul.tabnav` como en phpBB de
escritorio: es un `<ul>` a pelo, con `<li><a><span>` y la activa con
`activetab` en el `<li>`. Escribir `.tabnav` no encuentra nada, que es lo que
fallaba en la primera version.

## Lo que el indice y el tema dan: cero fallos

La ultima auditoria sobre el indice y sobre la vista de tema no encuentra ningun
texto por debajo del minimo de WCAG AA.