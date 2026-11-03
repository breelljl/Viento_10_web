# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Prototipo web de alta fidelidad para **Viento 10**, un hotel boutique en Córdoba. El diseño de Figma es la fuente de verdad visual; el usuario es diseñador gráfico (no programador), habla español y aporta capturas, recursos y contenido.

**Lee [AGENTS.md](AGENTS.md) antes de trabajar**: es el brief completo (rol, páginas y secciones, restricciones, orden de trabajo, criterios de calidad y formato de respuesta). Puntos críticos:
- HTML, CSS y JS puros: sin frameworks, sin librerías, sin paso de compilación.
- `index.html` es la Home; cada página interior tiene su propio archivo (`habitaciones.html`…) que comparte cabecera, footer, CSS y JS. Decisión del usuario, aunque AGENTS.md hablaba de un único archivo.
- Trabajar **una sección cada vez** y pedir aprobación antes de pasar a la siguiente. Orden: Home → Habitaciones → El hotel → Contacto → Sobre Córdoba → Vivir Viento 10.
- No inventar estilos, contenido ni imágenes: si falta algo, pedirlo o usar una solución neutra.
- Responsive: móvil, tablet, escritorio y escritorio grande.
- Si un texto difiere entre el Figma de móvil y el de escritorio, vale el de escritorio.

## Comandos

```bash
npm install   # instala live-server (única dependencia)
npm start     # live-server sobre src/ (puerto 8080), recarga en caliente
```

No hay build, linter ni tests. Ojo: live-server inyecta los cambios de CSS sin recargar la página, así que el JS sigue con los valores antiguos de los tokens hasta recargar.

## Estado

**Home terminada**: hero, Bienvenida, Habitaciones (pase), Experiencia (carrusel continuo), Testimonios (carrusel con flechas), Córdoba y footer. Pendiente: menú desplegable (aplazado por el usuario), enlaces de redes y páginas legales, y el resto de páginas.

## Arquitectura

- `src/css/tokens.css`: `@font-face` y todas las variables (colores, tamaños, tiempos de animación). El usuario ajusta tiempos y valores aquí directamente; mantener cada token comentado en español.
- `src/css/style.css`: componentes y secciones, con clases BEM. Medidas tomadas del Figma de 1440px (a menudo en `vw`, 1vw = 14.4px); tamaños de texto en `rem`.
- `src/js/main.js`: una IIFE por interacción (idioma, fundido `.reveal`, pase del hero, parallax `data-parallax`, pase de habitaciones, carrusel de Experiencia, carrusel de opiniones, oscurecido del hero). Los tiempos se leen de los tokens CSS.
- Capas: el hero es `position: sticky` (z-index 0) y las secciones siguientes (`.hero ~ section`, footer) lo tapan con z-index 1 y fondo propio; Reservar/Menú son fijos con z-index 20.
- Estilos reutilizables: `.statement`, `.link-arrow` (flecha visible solo en hover), `.caption` (pie de foto), `.eyebrow` (etiqueta en mayúsculas), `.br-desktop` (salto de línea solo en escritorio), `.arrow-btn`.

## Recursos

- Imágenes por página y sección dentro de `src/assets/img/`: `Home/` (`slider_hero`, `bienvenida`, `habitaciones_slider`, `carrusel_servicios`, `cordoba`) y `Habitaciones/` (`hero-habitaciones` y una carpeta por habitación con su galería, numerada `00_`, `01_`…). Si el usuario renombra o mueve un archivo, hay que actualizar la ruta y dejar permisos 644 (algunos archivos llegan con permisos privados).
- Capturas de Figma en `src/assets/design/` (`home-desktop.png`, `home-mobile.png`), excluidas de git.
- Tipografías locales en `src/assets/font/`: **Canela** (serif, títulos), **Gotham Pro** (sans, texto; no existe peso 550, se usa 500) y **Bon Vivant** (script, la carpeta se llama `bont_vivant`).
- Git: repo privado `breelljl/Viento_10_web`, rama de trabajo `main-borrar`. Para hacer push hace falta `git -c http.postBuffer=524288000 push`.
