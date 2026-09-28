# 02 · Propuesta: dos composiciones por vista

Parte del diagnóstico en [`01-diagnostico.md`](./01-diagnostico.md). Las opciones recomendadas se ven en [`preview-panel.html`](./preview-panel.html) y [`preview-pagina.html`](./preview-pagina.html). Qué archivos se tocan, con qué riesgo y cómo se revierte: [`03-spec.md`](./03-spec.md).

## Principios comunes

Valen para las dos vistas y para las cuatro opciones.

1. **Ordenar por decisión, no por componente.** El usuario llega con una sola pregunta: *¿vale la pena testear o escalar este producto?* Por eso el orden es:
   1. **Veredicto:** score, confianza y lo que pasó, en una frase.
   2. **Evidencia:** quién lo pauta, cuántos anuncios hay y hace cuánto corren.
   3. **Trayectoria:** cómo llegó hasta acá.
   4. **Producto:** fotos y descripción de la tienda.
2. **Un solo punto focal por vista, el bloque Veredicto.** Todo lo demás es apoyo: más chico y neutro.
3. **Color solo cuando significa algo** (regla de Radar):
   - Cifras en `foreground`.
   - Verde (`success-foreground`) solo para hechos positivos: crecimiento > 0, un anuncio que lleva ≥ 30 días, un rank que mejoró.
   - Ámbar para señal débil. Rojo solo para caída real (rank que empeoró).
   - El violeta de marca es para acciones y links, nunca para datos.
4. **Una sola tarjeta de anuncio, que se adapta a su contenedor.** Usa container queries, nativas de Tailwind v4. Se ve bien a ~100 px (panel y móvil) y a ~170 px (página). No más grillas con un número fijo de columnas.
5. **Solo piezas que ya existen:**
   - los tokens de `app/globals.css`;
   - el patrón de tarjeta (`rounded-xl border bg-card shadow-card`) y el overline de 12 px;
   - `Segmented`, `Button` (`outline`, `ghost` y como máximo un `brand` por vista), `Sheet`, `Collapsible` y `Tooltip`;
   - `ScoreRing`, `PerformanceBadge` y `FormattedPrice`.

   **Cero dependencias nuevas.**
6. **Nada por debajo de 12 px, cifras con `tabular-nums` y contraste AA verificado** (ver `03-spec.md` › Verificación).

### Pieza compartida: la tarjeta de anuncio v2

Es la corrección de P1–P3 y Q6. La usan las dos vistas y todas las opciones.

```
┌──────────────┐
│ ×3      34 d │  chips de 12 px sobre tinta al 80 %: el texto da 8,8:1 aunque el creativo sea blanco
│              │  "34 d" va en verde sólido cuando lleva ≥ 30 días (la señal ya existe hoy, en emerald)
│      ▶       │  play solo si hay video · un anuncio terminado se ve en escala de grises (como hoy)
│              │
└──────────────┘  9:16
● Activo · desde 25 ago     12 px. Si no entra, pasa a dos líneas: nunca se encima
Hogar Ideal                 anunciante, 12 px, truncado con title
Ver en Meta ↗               Pro/Agency/Admin. El resto ve "🔒 Meta · Pro" en gris AA (hoy 1,65:1)
"🌙 La lámpara que se…"     copy del anuncio: solo si la tarjeta mide ≥ 160 px (container query)
```

- **Grilla:** `repeat(auto-fill, minmax(104px, 1fr))` en el panel, `minmax(152px, 1fr)` en la página y `minmax(96px, 1fr)` en la página en móvil. Entran las columnas que caben:

  | Dónde | Columnas |
  |---|---|
  | Panel de 440 px | 3 de ~127 px |
  | Página en 1440 | 6 de ~165 px |
  | Página en 1024 | 4 |
  | Móvil (panel y página) | 3 de ~102–111 px |

  Con `auto-fill`, 2 anuncios no se estiran a 500 px de ancho.
- **Fecha:** formato corto ("25 ago"). El año va solo si no es el actual. La fecha se interpreta como local (corrige el día de menos de P10) y `null` se muestra como "—" (corrige el 1969).
- **Se saca "FACEBOOK":** todos los anuncios son de Meta y la etiqueta no aportaba nada. El anunciante pasa abajo como texto.
- **Cabecera de la sección:**
  - Título y conteos en una línea.
  - Chips de anunciante **neutros** (`bg-secondary`, ícono de Meta en gris) en lugar del azul de Facebook. En el panel se ven hasta 3 más "+N"; en la página, todos.
  - A la derecha, el orden y "actualizado hace 5 h".

---

## Vista 1 · Panel de detalle en `/pool`

### Opción A · Panel de triage (recomendada)

```
┌ Panel · 440 px, sticky bajo el topbar ───────┐
│ [img] Lámpara de luna 3D recargable c…  ⤢  ✕ │ ← cabecera fija dentro del panel
│       casabella.co · US$22                   │
├──────────────────────────────────────────────┤
│ (72)  [En alza]  Día 10 de 30                │ ← VEREDICTO
│       Confianza 20 %  ▰▱▱▱▱▱▱▱▱▱             │
│ Subió 48 posiciones en 10 días (+80 %).      │
│ RANK ACTUAL   MEJOR RANK   CRECIMIENTO       │
│ #12           #12          +80 %             │
│ entró en #60  día 10                         │
├──────────────────────────────────────────────┤
│ Anuncios · 6 activos · 3 terminados  Orden ⌄ │ ← EVIDENCIA
│ [casabella.co] [Hogar Ideal] [Deco Lux]      │
│ ┌──┐ ┌──┐ ┌──┐                               │
│ └──┘ └──┘ └──┘   3 columnas de ~127 px       │
├──────────────────────────────────────────────┤
│ TRAYECTORIA              [ Rank | Score ]    │ ← un gráfico de 140 px
├──────────────────────────────────────────────┤
│ Descripción de la tienda · 2 imágenes    ›   │ ← PRODUCTO (una fila que abre el Dialog de hoy)
│ [      Abrir página completa      ]          │
└──────────────────────────────────────────────┘
```

| Decisión | Por qué |
|---|---|
| Cabecera fija **dentro** del panel, con ⤢ ("Abrir página completa", tooltip) y ✕ con hover neutro | El título y el botón de cerrar siempre están a mano (P6). Cerrar no es destructivo, así que no va en rojo (P8). |
| El veredicto va primero: anillo (72 px) con `confidence`, badge con `resolveDisplayLabel` y "Día N de 30" | Responde "¿es buena señal?" en el primer vistazo. Usa la misma función de label que la página, así que **nunca muestra Declining**. |
| La confianza se muestra junto al anillo, con número y barra | Hoy es un número violeta en la cuarta celda. La confianza califica al score, así que va a su lado (Q5, ver D-1). |
| Se suma la frase narrativa (hoy solo está en la página, al fondo) | "Subió 48 posiciones en 10 días" dice más que cuatro números. En el pool no hay `totalProducts` (Q8), así que se omite la parte de la zona. |
| Sale el stat "Score" | Estaba duplicado con el anillo (P8). |
| 3 métricas neutras con subtítulo | Son el apoyo, no el foco. El crecimiento va en verde solo si es > 0; con `null` se ve "—" (Q4). |
| Los anuncios van justo después del veredicto, en 3 columnas con la tarjeta v2 | Es el mismo orden de la página (evidencia antes que trayectoria). La frase y las métricas ya resumen la trayectoria. Corrige P1–P3. **Medido en el preview a 1440 × 900:** la sección de anuncios arranca a 320 px del borde del panel y el primer creativo a 444 px, entero en pantalla. Hoy arrancan a 923 y 1144 px, fuera de la vista. |
| **Un** gráfico de 140 px con `Segmented` Rank/Score, en lugar de dos de 256 px | Ahorra ~400 px. La forma de la curva alcanza para el triage; el detalle está en la página. La opción elegida se mantiene al cambiar de producto. |
| Sin tarjetas anidadas: las secciones se separan con `border-t` | `ProductAdsSection` recibe un prop `embedded` (sin borde ni padding propio) en lugar de un fork (P8). |
| "Abrir página completa" también al final, como `outline` a todo el ancho | Es la salida natural al terminar de leer. Sin degradado: el panel no es una vista aparte. |

**Comportamiento por ancho**

- **≥ 1280 px (`xl`):** split con el panel de 440 px, sticky en `top-20` (debajo del topbar de 64 px) y con scroll propio. Requiere el ajuste del shell de P6 (ver `03-spec.md`, S1). La tabla pasa a modo compacto y **su cabecera usa la misma plantilla que las filas** (P4).
- **768–1279 px:** el mismo contenido se abre en un **`Sheet` desde la derecha** (440 px, `components/ui/sheet.tsx` ya existe) sobre la tabla. La tabla conserva todas sus columnas porque no se comprime (P5, P7). Esc o ✕ cierran.
- **< 768 px:** `Sheet` a pantalla completa (ver "Móvil").

### Opción B · Panel con pestañas

```
┌ Panel · 440 px ──────────────────────────────┐
│ [img] Lámpara de luna 3D…               ⤢  ✕ │
│ (72) En alza · Conf. 20 % · #12 · +80 %      │ ← franja de veredicto compacta (fija)
├──────────────────────────────────────────────┤
│ [ Anuncios 6 ] [ Evolución ] [ Producto ]    │ ← se recuerda al cambiar de producto
├──────────────────────────────────────────────┤
│  contenido de la pestaña, a todo el alto     │
└──────────────────────────────────────────────┘
```

- **A favor:**
  - Cada pestaña usa el alto completo del panel.
  - No hay scroll largo.
  - Comparar el mismo aspecto entre productos es rápido: la pestaña queda en "Anuncios" mientras cambias de fila.
- **En contra:**
  - La trayectoria, que es la mitad de la señal, queda detrás de un clic.
  - La frase narrativa no entra en la franja.
  - Son tres estados más para diseñar y probar (carga y vacío por pestaña).
  - La página (vista 2) no comparte la estructura.
  - Las pestañas suman controles en 440 px.

### Recomendación: A

- **El panel es para hacer triage:** comparar filas rápido. A responde las tres preguntas (señal, evidencia, trayectoria) en un vistazo y un scroll corto. B pide uno o dos clics por producto para ver lo mismo.
- **A comparte orden y piezas con la página:** un solo modelo mental y menos código.
- **Menos riesgo:** A reordena y quita cosas; B agrega estado y tres vistas.
- **Cuándo ganaría B:** si los datos muestran que el panel se abre sobre todo para ver anuncios (por ejemplo, clics en "Ver en Meta" desde el panel). Hoy no hay esa medición.

---

## Vista 2 · Página `/tracker/[candidateId]`

### Opción A · Ficha + veredicto (recomendada)

```
← Mis testeos / Lámpara de luna 3D…                            [Compartir] [Ver producto ↗]

┌ Hero ──────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐  Casa Bella Co · visto por primera vez el 19 sept                  │
│ │              │  Lámpara de luna 3D recargable con control táctil y 16 colores RGB │ ← único h1
│ │  galería 1:1 │  US$22 · [En alza] · Día 10 de 30                                  │
│ │              │  ┌ Veredicto ──────────────────────────────────────────────────┐   │
│ └──────────────┘  │ (72)  Confianza 20 %  ▰▱▱▱▱▱▱▱▱▱                            │   │
│ [▫][▫][▫][▫]      │       Subió 48 posiciones en 10 días (+80 %).               │   │
│                   │       Aún en zona alta del catálogo (top 3 %).              │   │
│                   │       [↑ Spikear] (si isScalable) · nota de decay (si hay)  │   │
│                   └─────────────────────────────────────────────────────────────┘   │
│                   RANK ACTUAL        MEJOR RANK        CRECIMIENTO                   │
│                   #12                #12               +80 %                         │
│                   entró en #60       día 10            superó al 97 % del catálogo   │
│                   ─────────────────────────────────────────────────────────────────  │
│                   Descripción de la tienda · 2 imágenes                  Ver ›       │
└────────────────────────────────────────────────────────────────────────────────────┘
┌ Anuncios · 6 activos · 3 terminados · 3 anunciantes          [Impresiones ⌄] 5 h ┐
│ [casabella.co] [Hogar Ideal] [Deco Lux]                                          │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  auto-fill ≥ 152 px                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
┌ Progresión del rank   #60 → #12 ┐┌ Puntaje de rendimiento   Pico: 80% ┐  ← "Pico" queda igual (R-1)
└─────────────────────────────────┘└────────────────────────────────────┘
▸ Historial diario · 10 días  (cerrado por defecto)
```

| Decisión | Por qué |
|---|---|
| Migas en lugar del h1 "Detalle del producto"; "Volver" según el origen: `from=pool` → "Explorar testeos" (`/pool`), si no → "Mis testeos" | Queda un solo h1 (Q2) y la vuelta lleva a donde estabas (Q3). Usa el `from` que ya existe solo para el texto y el destino: no abre nada nuevo (G-4 no cambia). |
| Hero en grilla `minmax(280px,5fr) 7fr`, sin `justify-between` y sin el velo degradado | La columna derecha es el veredicto, así que no sobra espacio (Q1). Radar no usa degradado en cabeceras. |
| Galería: imagen 1:1 con miniaturas en fila debajo | La columna izquierda tiene un alto predecible. Para un dropshipper la foto es un dato ("¿lo vendería?") y queda grande. |
| **Veredicto como único foco:** anillo de 96 px + confianza + frase + la acción | La frase más útil de la página pasa del fondo (13 px gris, estilo inline) al lugar principal (Q7). |
| **"Spikear" como el único botón `brand` de la vista** (solo si `isScalable`, como hoy) | Hoy es un chip de 10 px y es la acción que más cambia algo. *Si Diego o Daniel no quieren empujarla, queda `outline` y la vista no tiene CTA de marca.* |
| Nota de decay en 12 px AA ("Score ajustado ×0,87 · 4 d sin mejora") | Hoy mide 10 px al 70 % de opacidad (3,79:1). Mismo dato, legible. |
| 3 métricas neutras, cada una con una línea de contexto | Jerarquía clara: el veredicto es el foco y esto es apoyo (Q4). "Confianza" sale de la grilla porque vive en el veredicto. "Mejor rank" deja de ser verde sin motivo. |
| La descripción pasa a ser una fila al pie del hero | Una tarjeta suelta menos (Q7). Abre el mismo Dialog de hoy. |
| Anuncios a todo el ancho con la tarjeta v2 | Corrige Q6. En la cabecera, un resumen útil en lugar de solo badges. |
| Gráficos con tokens, fechas en español y 224 px de alto; el de rank marca entrada y mejor posición | Corrige P9. **"Pico: …" se queda exactamente como hoy:** es la regresión viva #1 y necesita su propia spec. |
| **Historial diario cerrado por defecto**, con la columna "Cambio" (↑/↓ del rank contra el día anterior) y **sin la columna "Estado"** | Repite los gráficos, así que lo abre quien lo necesite. "Cambio" muestra la tendencia real (el rank se movió) sin tocar el scoring. Así esta vista deja de mostrar "En baja" sin decidir D-2. |
| `space-y-6` en el contenedor, en lugar de márgenes sueltos en cada componente | Ritmo vertical de 24 px parejo (Q7). |

### Opción B · Tablero de señal (bento + pestañas)

```
[img] Lámpara de luna 3D…  US$22 · [En alza] · Día 10 de 30        [Compartir] [Ver producto]  ← fija al hacer scroll
┌ Señal (5 col, 2 filas) ─┐┌ Rank (4 col) ──────────┐┌ Crecimiento (3 col) ┐
│ (72) Confianza 20 %     ││ #12  ╱‾‾ sparkline     ││ +80 %               │
│ Subió 48 posiciones…    ││ entró #60              ││ superó al 97 %      │
│ [↑ Spikear]             │├ Anuncios (4 col) ──────┤├ Producto (3 col) ───┤
│                         ││ 6 activos · máx. 34 d  ││ [img] Descripción › │
└─────────────────────────┘└────────────────────────┘└─────────────────────┘
[ Anuncios 6 ] [ Evolución ] [ Historial ]
contenido de la pestaña
```

- **A favor:**
  - Máxima densidad sobre el pliegue: todo lo clave cabe en una pantalla.
  - La jerarquía sale del tamaño de cada bloque.
  - Se siente como un producto de analítica (estilo Kalodata).
- **En contra:**
  - La foto del producto, que es el primer filtro del dropshipper, queda reducida a 64 px.
  - Las pestañas esconden la evidencia (anuncios) y la trayectoria.
  - Hay más layout nuevo: 5 bloques, cabecera fija y pestañas.
  - En móvil igual termina siendo una pila larga.
  - Los mini gráficos suman dos instancias más de Recharts.

### Recomendación: A

- **La foto es un dato:** para un dropshipper es el primer filtro. A la mantiene grande; B la achica a 64 px.
- **A corrige las cuatro quejas con composición:**
  - una grilla en lugar de `justify-between`;
  - un solo foco;
  - secciones con ritmo;

  y lo hace sin esconder contenido en pestañas.
- **Coherencia:** A repite el orden del panel (veredicto → evidencia → trayectoria → producto).
- **Menos riesgo:** A reordena JSX y saca el h1 redundante. B suma una cabecera fija, pestañas y bloques.
- **Cuándo ganaría B:** si la página pasa a ser un "escritorio de investigación" con más datos (estimaciones, competidores). Hoy no.

---

## Móvil (390 px)

**Condición previa: el shell no tiene layout móvil** (Q9: sidebar fija de 256 px y `pl-64`). Nada de esto funciona hasta que la sidebar se pliegue (hamburguesa + `Sheet`, que ya existe). Esa es la spec **M1** en `03-spec.md` y toca todas las páginas. Los previews muestran la columna de contenido a 390 px **suponiendo** ese shell: 358 px útiles con márgenes de 16 px.

### Panel (pool)

- Tocar una fila abre un **`Sheet` a pantalla completa** con el contenido de la opción A en una columna.
- La cabecera del sheet (imagen, título, ✕) queda fija.
- Los anuncios van en 3 columnas de ~110 px y "Abrir página completa" queda al final.
- **Por qué un sheet y no navegar a la página:** los filtros del pool viven en estado local y se pierden al navegar. El sheet deja la lista donde estaba.

### Página

Una sola columna, en este orden:

1. Migas.
2. Galería 1:1 a todo el ancho, con miniaturas que scrollean en horizontal.
3. Título, precio y badge.
4. Veredicto.
5. Las 3 métricas en una fila (3 × ~105 px).
6. Acciones a todo el ancho, de 44 px de alto.
7. Descripción.
8. Anuncios (3 columnas).
9. Gráficos apilados.
10. Historial cerrado, con fechas cortas ("19 sept").

### Límites del táctil

- La vista previa de video al pasar el mouse (`FloatingVideoPanel`) no existe en táctil.
- Tocar el creativo abre Meta para Pro (como hoy); para el resto no hace nada.
- *Pregunta abierta:* ¿reproducir el video en línea al tocar? Es una función nueva, fuera de este alcance.

---

## D-1 · El color del score (no se resuelve acá)

**Hoy:** el anillo es verde si el score es ≥ 65 e ignora la confianza (`score-ring.tsx:28` y `:37`). El panel le pasa `confidence`; la página no (`page.tsx:485`).

### Qué hace el diseño sin decidir D-1

- **Muestra la confianza pegada al anillo**, con número y barra, en lugar de un número violeta en la cuarta celda.
  - La barra usa el **único umbral que ya existe en el producto**: `isScalable` (`lib/label-utils.ts:56`, confianza ≥ 0,5). Por debajo es ámbar (señal débil) y desde 0,5 es verde.
  - Hasta que se resuelva D-1 va a haber un anillo verde junto a una barra ámbar. Es incómodo pero honesto: es lo que dicen los datos. Hoy esa contradicción está escondida porque la confianza va en violeta.
  - *Si Diego prefiere no colorear la barra antes de resolver D-1, queda neutra.*
- **El número del score deja de ir en verde** en el panel (`tone="good"` → neutro). Las cifras son datos; el color lo pone el anillo.

### Cómo se ve si se resuelve D-1

Es la regla de CHANGE-004, SPEC-R2a en `../03-spec-fase-2.md`. El anillo se dibuja con dos arcos:

- verde = score × confianza;
- ámbar = score × (1 − confianza).

Para 72 con 20 % quedan 14 en verde y 58 en ámbar: "mayormente amarillo", como pide CLAUDE.md. **Los previews tienen un interruptor "D-1: hoy / resuelto"** para ver los dos estados.

### D-1 como ítem aparte (PR propio, no mezclado con el rediseño)

- **Archivos:** `components/dashboard/score-ring.tsx`, más `page.tsx:485` (agregar `confidence={summary?.signalConfidence}`) y los demás call sites de SPEC-R2a.
- **Riesgo: requiere-revisor-técnico.** Cambia lo que el usuario lee de la señal principal en toda la app (Resumen, Mis testeos, pool, detalle). Diego tiene que confirmar que no hubo un motivo para quitarla (por ejemplo, un `signalConfidence` poco fiable).
- **Orden:** puede ir antes o después del rediseño. El rediseño no depende de D-1.

---

## D-2 · Las etiquetas (no se resuelve acá: necesito tu decisión, Diego)

### Dónde aparece en estas vistas

| Dónde | Qué pasa |
|---|---|
| Badge de la cabecera de la página | `resolveDisplayLabel` nunca devuelve Declining (el backend clampa `growthPct ≥ 0`). Está bien hoy. |
| Columna "Estado" de la tabla diaria | `computeSmartLabel` sí puede devolver Declining y se ve **"En baja" en rojo**. Solo pasa en días de score bajo con caída: la misma caída se lee "Estable" con score 45 y "En baja" con 18 (Q7). |
| Panel | Hoy no tiene badge. En la opción A usa `resolveDisplayLabel`, igual que la página, así que nunca muestra Declining. |

### Qué hace el diseño sin decidir D-2

Saca la columna "Estado" del historial y agrega "Cambio": el delta de rank contra el día anterior, calculado con `bestsellerRank` (presentación, no scoring). Así esta vista cumple la regla de CLAUDE.md (el usuario nunca ve Declining) **sin decidir qué significa Declining**. D-2 sigue abierta para `kpi-cards.tsx`, `app-header.tsx`, etc.

### La decisión que necesito (una de dos)

- **D-2a · El backend emite etiquetas de tendencia reales.** Un campo nuevo (por ejemplo, `trendLabel`: sube / estable / baja, calculado con el rank de los últimos N días) aparte de la banda de score.
  - "En baja" pasa a ser legítimo y rojo donde corresponda.
  - En este diseño, el badge de la cabecera muestra la tendencia junto al anillo y el historial recupera una columna "Tendencia".
  - **Costo:** cambio en `TrackingService`, campo nuevo en la API y en los tipos.
- **D-2b · El frontend trata `performanceLabel` como banda de score.**
  - "Declining" nunca llega al usuario: el badge lo muestra como "En observación" (neutro), o mejor, nombra la banda.
  - Toda "tendencia" de la UI sale del movimiento del rank, como la columna "Cambio" de esta propuesta.
  - **Costo:** solo frontend. Se ajusta `computeSmartLabel` y la rama `Declining` de `PerformanceBadge`.

**Mi recomendación: D-2b ahora**, porque no cuesta nada y saca la contradicción hoy. D-2a más adelante si se quieren etiquetas de tendencia, que son más útiles pero necesitan backend. **Con cualquiera de las dos, este diseño no cambia de estructura:** con D-2a se agrega un badge y una columna; con D-2b se queda como en los previews.

---

## Control de acceso por plan

El diseño mantiene **exactamente** las reglas de hoy (tabla en `01-diagnostico.md`) y no agrega ninguna. Los previews tienen el mismo selector "Vista: Real (admin) / Prueba gratis / Básico / Pro / Agency" que `ViewAsBar`, para ver cada plan.

| Elemento | Cómo queda |
|---|---|
| Anuncios para Prueba gratis (panel y página) | Mismo blur y candado. Copy actualizado: "Los anuncios se ven desde el plan Básico" + "Ver planes" (hoy "plan Starter" + "Upgrade →"). |
| Anunciante en los chips de la cabecera, si no es Pro | Borroso con candado, como hoy, pero en chip neutro. |
| Anunciante en cada tarjeta | Visible para Básico, como hoy (**G-3 pendiente**). |
| "Ver en Meta" para Básico | "🔒 Meta · Pro", legible (6:1) y con tooltip. Sigue sin ser link: mismo gating. |
| "Ver producto" desde el pool | Misma condición `fromTracker \|\| isPro \|\| isScoutStore` (`page.tsx:517`). |
| Métricas de la página para Prueba gratis | Visibles, como hoy (**G-2 pendiente**). El preview de la página tiene un interruptor "G-2" que muestra cómo quedaría si se decide bloquearlas. Bloquea lo mismo que Mis testeos: score, confianza, badge, crecimiento, gráfico de score y esas columnas del historial. El rank queda visible, como en la tabla. Aparece una tarjeta de upgrade en lugar de la frase. Aplicaría solo a candidatos propios (`from=tracker`): en el pool la prueba ya ve score y crecimiento en la tabla. |
| Páginas del pool | Sin cambios (`maxPoolPage`). |

G-1, G-3, G-4, G-5 y S-1 quedan documentados en `01-diagnostico.md` como decisiones de negocio. El diseño no las toca.

---

## Fuera de alcance (y por qué)

- **Migrar la tabla del pool a Radar** (colores emerald/rose, textos de 10 px). Acá solo se corrige su cabecera en modo compacto (P4), porque es parte del split view.
- **G-1, G-2, G-3, G-5 y S-1:** son decisiones de negocio o de scoring.
- **La regresión #1 (`page.tsx:625`)** queda literal. Las regresiones #2 y #3 no están en estas vistas.
- **Usar `candidate.storeBaseUrl` como respaldo** para la galería y el nombre de tienda en productos del pool (Q8): depende de G-5.
- **Guardar los filtros del pool en la URL** para que sobrevivan a "Volver": es un cambio en `pool/page.tsx` aparte.
- **El shell móvil (M1):** spec propia, porque toca todas las páginas.
