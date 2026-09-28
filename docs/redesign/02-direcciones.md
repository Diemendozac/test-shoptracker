# 02 · Dos direcciones de diseño

**Previews:** [`preview-a.html`](./preview-a.html) · [`preview-b.html`](./preview-b.html). Se abren con doble clic, sin internet y sin build. Cada uno tiene un selector Claro/Oscuro y un link al otro.

Las dos direcciones comparten lo que **no es negociable**: la semántica de color (verde = confirmado/positivo, ámbar = débil, rojo = caída/error), la regla del ScoreRing y las reglas de CLAUDE.md. Se diferencian en personalidad: tema por defecto, neutros, acento, uso de degradados, tipografía, forma, profundidad y densidad.

| | **A · Precisión** | **B · Radar** |
|---|---|---|
| Idea | Herramienta de análisis sobria. El color solo aparece cuando significa algo. | Centro de mando nocturno, con marca fuerte. El degradado firma lo importante. |
| Referencias | Kalodata, Linear, Stripe Dashboard | Foreplay, Raycast |
| Tema por defecto | **Claro** (oscuro derivado) | **Oscuro** (claro con sidebar de tinta) |
| Neutros | Gris frío casi neutro | Azul tinta derivado del logo `#1C2140` |
| Acento | Índigo cobalto `#3B4FE0`, sólido | Violeta eléctrico `#6B4EFF` + degradado violeta → azul → cian |
| Degradados | Ninguno en la UI (solo relleno de sparklines) | Firma de marca: logo, 1 CTA por vista, señal #1, nav activa |
| Tipografía | Inter en todo | Outfit (títulos, KPI) + Inter (cuerpo, tablas) |
| Forma | Radios 5–10 px, badges rectangulares, bordes hairline | Radios 8–20 px, badges en píldora, sombras en capas |
| Densidad | Alta: filas de 68 px | Media: filas de 80 px, filas de tabla como tarjetas |
| Fuentes nuevas | Ninguna | Ninguna (Outfit ya se carga para el wordmark) |

---

## Dirección A — Precisión

### Paleta (tokens)

Los nombres son los del preview. La columna **shadcn** dice a qué variable de `app/globals.css` se mapea en la fase 2. Ojo: en este documento **"accent" es el color de marca**. En shadcn, `--accent` es el hover neutro, y ese es justamente el error C1.

| Token | Claro | Oscuro | Uso | shadcn (fase 2) |
|---|---|---|---|---|
| `--bg` | `#F6F7F9` | `#0B0D12` | Fondo de página | `--background` |
| `--surface` | `#FFFFFF` | `#12151C` | Tarjetas, popovers, tabla | `--card`, `--popover` |
| `--surface-2` | `#F2F4F7` | `#181C25` | Cabecera de tabla, controles secundarios | `--secondary`, `--muted` |
| `--surface-3` | `#EAEDF2` | `#20252F` | **Hover** de ghost, menús, filas | `--accent` ← arregla C1 |
| `--border` | `#E4E7EC` | `#262B36` | Bordes y separadores decorativos | `--border` |
| `--border-input` | `#878F9E` | `#646D7E` | Borde de inputs y selects (≥3:1) | `--input` |
| `--text` | `#101828` | `#ECEEF2` | Texto principal | `--foreground` y `*-foreground` |
| `--text-2` | `#475467` | `#A4ACB9` | Texto secundario, labels | `--muted-foreground` |
| `--text-3` | `#5D6679` | `#8E97A7` | Captions, placeholders, "—" (sigue siendo ≥4,5:1) | nuevo `--subtle-foreground` |
| `--accent` | `#3B4FE0` | `#5566F2` | CTA primario, links, selección | `--primary`, `--ring`, `--sidebar-primary` |
| `--accent-hover` | `#2F40C4` | `#4455E0` | Hover del CTA | nuevo `--primary-hover` |
| `--accent-fg` | `#FFFFFF` | `#FFFFFF` | Texto sobre acento | `--primary-foreground` |
| `--accent-subtle` | `#EEF0FE` | `#1D2244` | Fondo de ítem activo, chip "Spikear", badge "Nuevo" | nuevo `--primary-subtle` |
| `--accent-text` | `#3342CF` | `#9DA7FF` | Texto de acento sobre superficie | nuevo `--primary-text` |
| `--success` / `-text` / `-subtle` | `#079455` / `#067647` / `#E8F8EF` | `#2FBF71` / `#4CD48A` / `#0F2A1D` | Confirmado, en alza, crecimiento + | nuevos `--success*` |
| `--warning` / `-text` / `-subtle` | `#B87400` / `#A15C07` / `#FEF5E1` | `#F2B632` / `#F5C451` / `#2E2410` | Señal débil, inactiva, pendientes | nuevos `--warning*` |
| `--danger` / `-text` / `-subtle` | `#D92D20` / `#B42318` / `#FEF0EF` | `#F0584D` / `#FF8A80` / `#351817` | Caída, error, eliminar | `--destructive` + nuevos |
| `--info` / `-text` / `-subtle` | `#0B86A3` / `#0E6F87` / `#E7F6FA` | `#22B3CC` / `#5CCCE3` / `#0E2A31` | Estable, rebote, anunciantes | nuevos `--info*` |
| `--ring-track` | `#E7EAF0` | `#262B36` | Pista del ScoreRing | nuevo `--score-track` |
| `--sidebar*` | = superficie clara | `#0E1016` | Barra lateral | `--sidebar*` existentes |

Los bordes de badge (`--*-border`) están en el preview.

**Colores de gráficos** (`--chart-1..5`): acento, success, warning, info, text-3. **Bandas de score** ("Salud del seguimiento"): una sola rampa del acento (100% → 28%) más un gris para `<15`. Sin rojo.

### Degradados

- **Sí:** relleno del área de las sparklines (color semántico del 22% al 0%, vertical); shimmer de skeletons; fondo del login y el marketing (un halo radial del acento al 6–8%).
- **No:** botones (incluido el primario), tarjetas y sus hovers, ScoreRing, badges, texto, cabeceras de página, estados semánticos. Se eliminan los 15 usos actuales dentro de la app, salvo el overlay negro sobre los thumbnails de video (`product-ads.tsx:230`), que es legibilidad y no decoración.

### Tipografía

Inter (ya cargada) en todo. Pesos 400/500/600, sin 700 ni 900. **Mínimo 12 px.** Cifras siempre con `tabular-nums`.

| Rol | Tamaño / interlineado | Peso | Tracking |
|---|---|---|---|
| KPI | 28/31 | 600 | −0.02em |
| H1 de página | 22/28 | 600 | −0.02em |
| H2 de sección | 16/24 | 600 | −0.01em |
| Cuerpo | 14/20 | 400 | 0 |
| Celda de tabla | 13–14/18–20 | 500 | 0 |
| Meta, caption | 12/16 | 400 | 0 |
| Overline (MAYÚSC.) | 12/16 | 600 | +0.05em |

### Radios, sombras y espaciado

- **Radios:** `xs 4` (chips de delta), `sm 5`, `md 7` (botones, inputs), `lg 10` (tarjetas), `xl 12` (marcos, modales), badge 5 (rectangular). Reemplaza los 7 radios actuales por 5 con un rol cada uno.
- **Sombras:** claro: `card 0 1px 2px rgb(16 24 40 / .04)`, `hover 0 4px 12px -2px / .08`, `pop 0 12px 32px -8px / .16`. Oscuro: sin sombras, la elevación la dan superficies más claras (`bg` → `surface` → `surface-2` → `surface-3`).
- **Espaciado (base 4):** página 24, padding de tarjeta 16, gap entre tarjetas 12, fila de tabla 10 + imagen 48 = 68 px (hoy ~88).

### Modo oscuro (A)

Derivado, no protagonista. Casi negro neutro `#0B0D12`, superficies que suben 3–4 puntos de luminosidad por nivel, sin sombras, acento aclarado (`#5566F2`) y colores semánticos más brillantes y menos saturados para que no "vibren". Ojo: blanco sobre el acento oscuro da **4,60:1**. Pasa, pero con poco margen. Si se oscurece `--surface`, hay que re-verificar.

---

## Dirección B — Radar

### Paleta (tokens)

| Token | Oscuro (default) | Claro | Uso |
|---|---|---|---|
| `--bg` | `#080A15` | `#F5F5FA` | Fondo |
| `--surface` | `#10132A` | `#FFFFFF` | Tarjetas, filas |
| `--surface-2` | `#161A34` | `#F1F1F8` | Controles, cabeceras |
| `--surface-3` | `#1E2342` | `#E9E9F3` | Hover |
| `--border` | `#262B4B` | `#E2E2EE` | Bordes decorativos |
| `--border-input` | `#5E6590` | `#86889F` | Inputs (≥3:1) |
| `--text` | `#F1F2FA` | `#14162B` | Texto |
| `--text-2` | `#B3B8D6` | `#484C69` | Secundario |
| `--text-3` | `#9096BA` | `#5C6082` | Captions, "—" |
| `--accent` | `#6B4EFF` | `#5B3FE6` | CTA, selección |
| `--accent-hover` | `#5A3DF0` | `#4A2FD0` | |
| `--accent-subtle` / `-text` | `#231F4F` / `#B3A6FF` | `#EFECFF` / `#5035D6` | Activo, "Nuevo", "Spikear" |
| `--success` / `-text` / `-subtle` | `#34D399` / `#5EE3AB` / `#0D2A28` | igual que A claro | |
| `--warning` / `-text` / `-subtle` | `#FBBF24` / `#FCD04F` / `#2C2415` | igual que A claro | |
| `--danger` / `-text` / `-subtle` | `#F87171` / `#FCA5A5` / `#331A26` | igual que A claro | |
| `--info` / `-text` / `-subtle` | `#38BDF8` / `#7DD3FC` / `#0E2440` | igual que A claro | |
| `--sidebar` | `#0B0E1F` | **`#10132A`** (tinta, también en claro) | Sello de identidad de B |
| `--grad-brand` | `135°, #8B6CFF → #4F7BFF → #22D3EE` | `#7C5CFF → #4F7BFF → #22C3E6` | Solo decorativo, nunca detrás de texto |
| `--grad-cta` | `135°, #6B4EFF → #3D5BFF` | `#5B3FE6 → #3450E6` | CTA con texto blanco (≥5,05:1 en todo el recorrido) |

La correspondencia con shadcn es la misma que en A. En modo claro, los colores semánticos de B son los mismos que los de A a propósito: la semántica no cambia con la dirección.

### Degradados

- **Sí:** logo y wordmark (`--grad-brand`); **un solo** CTA primario por vista (`--grad-cta`); borde de 1 px + halo de la tarjeta "Señal más fuerte"; barra de 3 px de la navegación activa; brillo radial casi imperceptible arriba del header; relleno de sparklines (semántico, igual que en A).
- **No:** ScoreRing, badges de performance y de fase, fondos de tabla, filas y KPI, cifras y texto de datos, estados de éxito/alerta/error, y más de un CTA con degradado por vista.
- **Regla madre:** el degradado es la voz de la marca y el color plano es la voz de los datos. Si un degradado toca un dato, el verde deja de significar "confirmado".

### Tipografía

Outfit (ya cargada para el wordmark, pesos 400/600/700) en H1, H2 y KPI; Inter en todo lo demás. Mínimo 12 px.

| Rol | Fuente | Tamaño | Peso |
|---|---|---|---|
| KPI | Outfit | 34/37 | 600 |
| H1 | Outfit | 26/32 | 600 |
| H2 | Outfit | 18/24 | 600 |
| Cuerpo, tabla, meta | Inter | 14/20 · 13/18 · 12/16 | 400–600 |

### Radios, sombras y espaciado

- **Radios:** `xs 6`, `sm 8`, `md 10` (controles), `lg 14` (tarjetas y filas), `xl 20` (marcos), badges en píldora.
- **Sombras (oscuro):** filo de luz arriba `inset 0 1px 0 rgb(255 255 255 / .04)` + sombra larga `0 12px 32px -16px rgb(0 0 0 / .7)`. Halo violeta (`--glow`) solo en la señal #1 y en el CTA. **(Claro):** dos capas suaves con tinte tinta.
- **Espaciado:** página 28, tarjeta 20, gap 16, fila 12 + imagen 56 = 80 px. Las filas del tracker son tarjetas separadas por 8 px.

### Modo oscuro (B)

Es el modo principal: tinta azul-noche en vez de negro, superficies con un leve tono índigo y el acento violeta como único color saturado fuera de la semántica. El claro conserva la sidebar oscura de tinta, así que la identidad se mantiene en los dos temas.

---

## Contraste WCAG 2.1 AA: verificado

Lo verifica [`tools/contrast-check.mjs`](./tools/contrast-check.mjs), que lee los tokens **directamente de los HTML** (lo verificado es lo que se ve). Además, la sección 06 de cada preview recalcula los ratios en vivo en el navegador.

```
$ node docs/redesign/tools/contrast-check.mjs
A · Precisión — claro:  41/41 pares OK · peor texto 4.78:1
A · Precisión — oscuro: 41/41 pares OK · peor texto 4.60:1
B · Radar — oscuro:     42/42 pares OK · peor texto 5.05:1
B · Radar — claro:      42/42 pares OK · peor texto 4.78:1
Todos los pares cumplen WCAG 2.1 AA.
```

Pares críticos (texto ≥ 4,5:1 · gráficos y bordes de control ≥ 3:1):

| Par | A claro | A oscuro | B oscuro | B claro |
|---|---:|---:|---:|---:|
| `text` / `bg` | 16,56 | 16,73 | 17,68 | 16,38 |
| `text-3` / `surface-3` (el peor texto neutro) | 4,91 | 5,22 | 5,28 | 5,05 |
| `accent-fg` / `accent` (botón primario) | 6,21 | **4,60** | 5,05 | 6,37 |
| `accent-fg` / `grad-cta` (peor punto) | — | — | 5,05 | 6,11 |
| `warning-text` / `warning-subtle` (badge ámbar) | **4,78** | 9,37 | 10,42 | **4,78** |
| `success` / `surface` (arco verde) | 3,91 | 7,66 | 9,51 | 3,91 |
| `warning` / `surface-3` (arco ámbar en fila con hover) | 3,23 | 8,42 | 9,15 | **3,15** |
| `border-input` / `surface` | 3,25 | 3,51 | 3,26 | 3,48 |

**Comparación con hoy:** el número del ScoreRing en ámbar da 1,72:1, el trazo de la sparkline 1,92:1, `text-emerald-600` 3,65:1 y `text-rose-500` 3,75:1 (ver diagnóstico C6/C8/S4).

**Límites de la verificación:**
- Cubre pares de tokens, no cada combinación que un componente pueda inventar. En la fase 2, cualquier `text-x` sobre `bg-y` fuera de la tabla necesita correr el script.
- El texto blanco sobre los thumbnails de video depende de la imagen. Se mantiene el overlay negro actual.
- Las fotos de producto no se pueden "verificar". En oscuro (sobre todo en B) las fotos con fondo blanco brillan mucho. Es un riesgo de percepción, no de contraste.

---

## Recomendación

**Dirección A (Precisión), con claro por defecto.** Tres razones, en orden de peso:

1. **Costo y riesgo de la fase 2.** Hoy hay 447 colores escritos a mano, calibrados (mal, pero calibrados) para fondo claro. A se puede lanzar por partes: primero tokens, después componentes, pantalla por pantalla, y lo que todavía no se migró sigue viéndose aceptable en claro. B es oscura por defecto: **no se puede lanzar hasta migrar prácticamente todos los colores**, porque un `text-emerald-600` sobre `#10132A` se ve roto. B es un proyecto más grande disfrazado de "cambio de look".
2. **El contenido es fotos de producto sobre fondo blanco.** Las miniaturas son la pieza visual principal (tabla, store cards, hero). En oscuro son rectángulos blancos que se comen la pantalla (se ve en `preview-b.html`). Las dos referencias que dio el dueño (Kalodata, Foreplay) usan UI clara en la app.
3. **"Premium" no es "oscuro con degradados".** Lo que hace que Kalodata y Linear se sientan caros es la disciplina: un acento, jerarquía tipográfica, color con significado y cero ruido. B puede verse más impactante en el preview y peor después de 3 horas de uso. Hay que desconfiar de esa primera impresión.

**Qué tomaría de B si se elige A:** nada en la fase 2. Si después de lanzar A se quiere más marca, lo más barato y seguro sería Outfit en H1/KPI, sin degradados. Mezclar las dos direcciones desde el inicio produce exactamente la inconsistencia que se quiere eliminar.

**Cuándo elegir B:** si el dueño quiere que Dropspy se diferencie por marca y no solo por datos, y acepta que la fase 2 dure más (migrar los ~450 colores antes de lanzar, más un modo oscuro que hoy no existe).
