/* MultiSwitcher: cambio rápido de cuenta. En todas las páginas.
   Implementa el contrato #szSw de la hoja (no renombrar IDs/clases).

   Cómo funciona: guarda cuentas en localStorage del navegador, pinta la lista
   y al pulsar una entra con el propio formulario de login del foro (envío
   real, sin fetch: así las cookies y la redirección las gestiona phpBB).

   NOTA DE SEGURIDAD: las claves quedan en el localStorage de ESTE navegador
   en texto plano. Es la misma concesión que hacen todos los switchers; no
   usar en ordenadores compartidos. Para olvidar una cuenta, doble clic en su
   nombre (pide confirmación). */
(function () {
  "use strict";
  if (window.__szSw) return;
  window.__szSw = true;

  var KEY = "szSw_accounts";

  function leer() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function guardar(a) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {}
  }

  /* Usuario actual: _userdata lo expone Foroactivo; si no, el saludo. */
  function actual() {
    try {
      if (window._userdata && _userdata.username && _userdata.user_id > 0) return _userdata.username;
    } catch (e) {}
    var w = document.querySelector("#fa_welcome");
    if (w) {
      var t = (w.textContent || "").replace(/^\s*Bienvenid[oa]\/\w+\s*/i, "").trim();
      if (t && !/^(Conectarse|Registrarse)$/i.test(t)) return t;
    }
    return "";
  }

  function inicial(n) {
    return ((n || "?").trim().charAt(0) || "?").toUpperCase();
  }

  function svgIni(n) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect width="28" height="28" fill="#1a1a1a"/><text x="14" y="19" font-family="monospace" font-size="14" fill="#9a9a9a" text-anchor="middle">' + inicial(n).replace(/[<>&]/g, "") + "</text></svg>";
    return "data:image/svg+xml," + encodeURIComponent(s);
  }

  /* Salida: clona el enlace de desconexión de la navbar si existe. */
  function enlaceSalida() {
    var a = document.querySelector('a[href*="login"][href*="logout"]');
    return a ? a.getAttribute("href") : "/login";
  }

  function entrar(cuenta) {
    var f = document.createElement("form");
    f.method = "post";
    f.action = "/login";
    f.style.display = "none";
    var campos = {
      username: cuenta.n,
      password: cuenta.p,
      autologin: "1",
      login: "Conectarse",
      redirect: location.pathname + location.search
    };
    for (var k in campos) {
      var i = document.createElement("input");
      i.type = "hidden";
      i.name = k;
      i.value = campos[k];
      f.appendChild(i);
    }
    document.body.appendChild(f);
    f.submit();
  }

  var yo = actual();
  var cuentas = leer();

  var root = document.createElement("div");
  root.id = "szSw";
  root.innerHTML =
    '<button id="szSwBtn" title="Cambiar de cuenta">⇄</button>' +
    '<div id="szSwPanel">' +
    '<div id="szSwHead"><b>Cuentas</b><span class="actions">' +
    '<button type="button" data-act="add" title="Añadir cuenta">+</button>' +
    '<button type="button" data-act="out" title="Desconectarse">×</button>' +
    "</span></div>" +
    '<div id="szSwBody"><ul id="szSwList"></ul>' +
    '<div id="szSwAdd" style="display:none">' +
    '<input id="szSwUser" type="text" placeholder="Usuario" autocomplete="username">' +
    '<input id="szSwPass" type="password" placeholder="Clave" autocomplete="current-password">' +
    '<button type="button" data-act="save">Guardar</button>' +
    "</div></div></div>";
  document.body.appendChild(root);

  var lista = root.querySelector("#szSwList");

  function pintar() {
    lista.innerHTML = "";
    if (!cuentas.length) {
      var vacio = document.createElement("li");
      vacio.innerHTML = '<span class="meta"><span class="sub">Sin cuentas: pulsa +</span></span>';
      lista.appendChild(vacio);
      return;
    }
    cuentas.forEach(function (c, i) {
      var li = document.createElement("li");
      if (c.n === yo) li.className = "szSw-active";
      var img = document.createElement("img");
      img.alt = "";
      img.src = c.a || svgIni(c.n);
      var meta = document.createElement("span");
      meta.className = "meta";
      var nick = document.createElement("span");
      nick.className = "nick";
      nick.textContent = c.n;
      var sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = c.n === yo ? "· actual (doble clic quita)" : "doble clic quita";
      meta.appendChild(nick);
      meta.appendChild(sub);
      li.appendChild(img);
      li.appendChild(meta);
      li.addEventListener("click", function () {
        if (c.n !== yo) entrar(c);
      });
      li.addEventListener("dblclick", function (ev) {
        ev.stopPropagation();
        if (window.confirm("¿Olvidar la cuenta " + c.n + " en este navegador?")) {
          cuentas.splice(i, 1);
          guardar(cuentas);
          pintar();
        }
      });
      li.title = c.n === yo ? "Cuenta actual" : "Entrar como " + c.n;
      lista.appendChild(li);
    });
  }
  pintar();

  root.querySelector("#szSwBtn").addEventListener("click", function (ev) {
    ev.stopPropagation();
    root.classList.toggle("open");
  });

  root.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act");
    if (act === "add") {
      var f = root.querySelector("#szSwAdd");
      f.style.display = f.style.display === "none" ? "flex" : "none";
    } else if (act === "save") {
      var u = root.querySelector("#szSwUser").value.trim();
      var p = root.querySelector("#szSwPass").value;
      if (!u || !p) return;
      cuentas = cuentas.filter(function (c) { return c.n.toLowerCase() !== u.toLowerCase(); });
      cuentas.push({ n: u, p: p });
      guardar(cuentas);
      pintar();
      root.querySelector("#szSwUser").value = "";
      root.querySelector("#szSwPass").value = "";
      root.querySelector("#szSwAdd").style.display = "none";
    } else if (act === "out") {
      location.href = enlaceSalida();
    }
  });

  document.addEventListener("click", function (ev) {
    if (!root.classList.contains("open")) return;
    if (!root.contains(ev.target)) root.classList.remove("open");
  });
})();
