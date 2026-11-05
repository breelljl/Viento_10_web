# Adaptación a portátiles · Viento 10

## Problema

El diseño de escritorio sale de un Figma de 1440 × ~1000 px. Un MacBook Air tiene un ancho parecido (1280–1470 px), pero mucho menos alto útil (≈ 700–850 px de ventana). Los breakpoints por ancho trataban el portátil como un escritorio grande, así que todo se veía sobredimensionado en vertical.

## Criterio: media query por alto

Todas las adaptaciones están en un único bloque al final de `src/css/style.css`:

```css
@media (min-width: 768px) and (max-height: 900px) { … }
```

- `min-width: 768px`: no afecta a móvil, que tiene sus propios estilos.
- `max-height: 900px`: separa los portátiles de los monitores de escritorio, que superan ese alto.

Por encima de 900 px de alto, la web es exactamente la del Figma.

## Dos factores de escala (tokens)

Están en `src/css/tokens.css`, en el grupo «Portátiles». El diseñador los ajusta directamente.

| Token | Valor | Qué escala | Cómo |
|---|---|---|---|
| `--laptop-text-scale` | `.88` | Todos los textos | `html { font-size: calc(100% * var(--laptop-text-scale)) }`. Todos los tamaños de texto están en `rem`, así que bajan a la vez. |
| `--laptop-scale` | `.85` | Medidas en `px` y `vw`: logo, botones, fotos, iconos, márgenes | Cada regla se reescribe como `calc(<medida Figma> * var(--laptop-scale))`. |

Con `1`, cada factor deja su parte como en el Figma.

## Qué cubre el bloque

- **Cabecera:**
  - logo y botones Reservar/Menú escalados;
  - `top` recalculado para mantener el centro vertical a 59 px: `calc(59px - 29px * var(--laptop-scale))`.
- **Menú:**
  - logo, foto, línea vertical, email/teléfono e iconos de redes;
  - el contacto y los iconos usan `min(px, vh)` para no chocar en ventanas muy bajas.
- **Fotos que no ocupan todo el ancho:**
  - se redefine `--room-max` (ancho de las fotos grandes de 1125 px) dentro de la media query, y cada sección que lo usa se adapta sola;
  - las fotos medidas en `vw` (parejas de Vivir, collage de Bienvenida, calles de Córdoba, Contacto) se multiplican por el factor.
- **Mapa de la ruta (Sobre Córdoba):**
  - el ancho se calcula a partir del alto disponible para que frase y mapa quepan enteros mientras la sección está detenida;
  - fórmula: `min(78.5vw, (100vh − top − frase − margen) × 1130/449)`.
- **Pantalla de carga:** el símbolo y la posición del texto.
- **Barra de reserva:** `display: none`. Queda «Reservar» en la cabecera.

## Qué no se toca

- Fotos a todo el ancho (heros, bandas) y carruseles: ya dependen del ancho de pantalla.
- Espaciados verticales entre secciones: siguen con las medidas del Figma.

## Comprobación

Las medidas se han validado en Safari con ventanas de 1440 × 648, 768 y 848 px de alto, leyendo las posiciones reales de los elementos desde la consola.

## Para mantenerlo

Si se añade un componente con medidas fijas en `px` o `vw`, hay que añadir su versión escalada dentro de ese mismo bloque, multiplicando por `--laptop-scale`. Los textos no necesitan nada, siempre que sus tamaños estén en `rem`.
