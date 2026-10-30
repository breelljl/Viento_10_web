# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Prototipo web de alta fidelidad para **Viento 10**, un hotel boutique en Córdoba. El diseño de Figma es la fuente de verdad visual; el usuario es diseñador gráfico y aporta capturas, recursos y contenido.

**Lee [AGENTS.md](AGENTS.md) antes de trabajar**: es el brief completo (rol, páginas y secciones, restricciones, orden de trabajo, criterios de calidad y formato de respuesta). Puntos críticos:
- HTML, CSS y JS puros: sin frameworks, sin librerías, sin paso de compilación.
- Un único `index.html` con secciones que actúan como las 6 "páginas" conceptuales (Home, Habitaciones, El hotel, Vivir Viento 10, Sobre Córdoba, Contacto), navegables por anclas.
- Trabajar por partes y pedir aprobación antes de pasar a la siguiente. Orden: Home → Habitaciones → El hotel → Contacto → Sobre Córdoba → Vivir Viento 10.
- No inventar estilos, contenido ni imágenes: si falta algo, pedirlo o usar una solución neutra.
- Responsive: móvil, tablet, escritorio y escritorio grande.

## Comandos

```bash
npm install   # instala live-server (única dependencia)
npm start     # live-server sobre src/, recarga en caliente
```

No hay build, linter ni tests (los scripts `build` y `test` de package.json solo hacen echo).

## Estructura y estado

- `src/index.html` enlaza `css/tokens.css` (variables de diseño: colores, tipografía, espaciados) y `css/style.css` (componentes). **Ninguno de los dos existe todavía**, y `src/js/` y `src/assets/img/` están vacíos.
- Las clases CSS siguen BEM (`header__nav-link`, `btn--reserve`). `#menuToggle` es el botón del menú móvil.
- Tipografías locales en `src/assets/font/`: **Canela** (serif, títulos), **Gotham Pro** (sans, texto) y **Bon Vivant** (script, la carpeta se llama `bont_vivant`). Hay que declararlas con `@font-face`; no usar el CDN de rawgit que aparece en `gotham.md`.
- Las capturas del diseño de Figma deben ir en `src/assets/design/` como referencia.
- El README.md es una plantilla genérica y está desactualizado (menciona `styles.css` y `main.js`).
