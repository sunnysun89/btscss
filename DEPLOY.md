# Poner la skin en marcha

Tres pasos. El primero es en tu ordena, el segundo y el tercero son del panel.

---

## 1. Subir `bts/` a GitHub Pages

La carpeta que se sube es **`skin/`** entera, tal cual. Es decir, lo que se
publica es `skin/bts/` y la carpeta `skin/` es la raiz del repositorio.

```bash
cd "C:\Users\Iñaki\Documents\Proyecto predeterminado\skin"

git init
git add .
git commit -m "Burn The Sky skin v1"

# crea el repo en GitHub primero (vacio, sin README), luego:
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

Despues, en GitHub: **Settings → Pages → Source: Deploy from a branch**, rama
`main`, carpeta `/ (root)`. Espera un minuto.

Comprueba que funciona:

```
https://TU-USUARIO.github.io/TU-REPO/bts/01-base.css
```

Si ese archivo sale en crudo, esta todo bien. Si da 404, las Pages no estan
activas todavia o la carpeta no es la raiz.

---

## 2. Pegar la cabecera en el panel

Abre **`skin/cabecera.html`**, sustituye las dos apariciones de `RAW_BASE`:

```
RAW_BASE  ->  https://TU-USUARIO.github.io/TU-REPO/bts
```

Ojo: la URL termina en `/bts`, sin barra final, y la que va en `RAW_BASE` es la
**base**, no una hoja concreta. El fichero se llama `cabecera.html` y lo que se
pega es el bloque `<link>` y `<style>` que hay dentro, sin los comentarios
exteriores.

En el panel:

```
Visualizacion -> General -> Editar
```

en `overall_header`, justo **despues de `{CSS}`** y antes de `</head>`.

Guarda y **publica** la plantilla. Si no la publicas, no se ve: en phpBB editar
y publicar son dos pasos y el segundo es el que cuenta.

---

## 3. Comprobar

En el foro, el titulo de la pestaña debe seguir siendo "Burn The Sky" pero la
cabecera tiene que salir la imagen del banner con **Burn The Sky** en Bodoni
encima, sin nada de "Foroactivo.com".

Si sale el tema claro azul de fabrica, el enlace no esta resolviendo. Abre la
consola del navegador (F12) y mira la pestaña Network: si hay un 404 en
`01-base.css`, casi todo es que `RAW_BASE` esta mal escrito.

---

## Si prefieres probarlo antes de subir nada

```powershell
$script = "C:\Users\Iñaki\Documents\Proyecto predeterminado\skin\serve.ps1"
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$script`""
```

Con eso servido en `http://localhost:8742`, pon `RAW_BASE` a
`http://localhost:8742/bts` en la cabecera y recarga. **Ojo: `localhost` solo
funciona en tu propio navegador**, asi que esto solo te vale para ti. Antes de
publicar, vuelve a poner la URL de GitHub.

---

## Un aviso sobre el cache

GitHub Pages cachea los ficheros un rato. Si cambias el CSS y no se nota,
prueba a abrir la URL con `?v=2` DETRAS added, o espera unos minutos. Y para
cambios rapidos durante el trabajo, la version local sirve mejor.

Si acabas tocando mucho el CSS, en `cabecera.html` puedes cambiar
`/bts/01-base.css?v=2` y subir el numero cuando cambies algo.
---

## Las imagenes

Van en `bts/img/`, dentro de la carpeta que ya subes, asi que el CSS las encuentra
con una ruta relativa (`url("img/fondo.jpg")`). No hay que subirlas a ningun otro
sitio.

    img/fondo.jpg      1920x1080 -> 1600x900   2.922 KB -> 183 KB
    img/cabecera.jpg   1920x1080 -> 1600x900   4.296 KB -> 164 KB

Juntas: 7,2 MB -> 347 KB. Veinte veces menos, sin que se note, porque las dos van
bajo capas oscuras y casi solo se ven en los margenes.

## El avatar del ultimo usuario

phpBB no pasa ningun avatar al indice: en `NEWEST_USER` solo va el nombre con su
enlace. Para poner la foto hay un modulo pequeno, `plantillas/avatar-ultimo.js`,
que lee ese enlace, pide el perfil de ese usuario una vez, saca el avatar y lo
guarda en `sessionStorage`. Para que no se vuelva a pedir en cada visita.

Va pegado en **`overall_footer_end`**, no en la cabecera, porque es JS y no CSS:

    Panel -> Visualizacion -> Plantillas -> General -> overall_footer_end

Si no se pega, el bloque de estadisticas funciona igual: se ve solo el nombre,
sin foto. No es critico.

## El bloque de estadisticas, para pegar a mano

Esta plantilla si se publica por fetch; el problema es con `index_body`, que
revierte al original. El texto nuevo esta en:

    plantillas/bloque-estadisticas.html

Para meterlo: `Visualizacion -> Plantillas -> General -> index_body`, y sustituir
el tramo que va desde el comentario "El pie de estadisticas" hasta justo antes de
`<!-- BEGIN switch_chatbox_activate -->` por el contenido de ese fichero.