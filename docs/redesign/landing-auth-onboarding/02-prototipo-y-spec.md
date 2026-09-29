# 02 · Prototipo navegable y spec (fase 2B)

**Fecha:** 2026-09-29 · **Dirección elegida:** 1, "Terminal de inteligencia", con el mock del producto vivo de la dirección 3 · **Prototipo:** [`preview/prototipo-2b.html`](./preview/prototipo-2b.html) · **Diagnóstico:** [`01-diagnostico.md`](./01-diagnostico.md)

## Cómo verlo

- **En la computadora:** doble clic en `preview/prototipo-2b.html`. No necesita internet ni servidor.
- **En el celular:** mandarte el archivo y abrirlo en el navegador del teléfono; funciona igual, sin conexión. En la computadora también se puede ver a 390 px con el modo dispositivo de Chrome (F12, ícono del celular).
- **Recorrido:** landing → "Empieza gratis" → registro → wizard de 4 pasos → entrada al dashboard.
- **Botón "Prototipo"** (abajo a la derecha): salta a cualquier pantalla y activa el movimiento reducido. Si saltas a un paso, los anteriores se completan con datos de ejemplo. Ese botón no es parte del diseño.
- **Capturas:** [`capturas/2b/`](./capturas/2b/), a 390 y 1440 px.

## Las condiciones y cómo quedaron

| # | Condición | Cómo quedó |
|---|---|---|
| 1 | Landing y login en oscuro; el onboarding arranca oscuro y termina claro | Así, con la transición **gradual paso a paso** que elegiste. Ver "Tema" abajo |
| 2 | Nada de velas, tickers ni estética de trading; todo rotulado como datos de ejemplo | Ver "Anti-cripto" abajo |
| 3 | El mock del producto vivo dentro de la terminal, con componentes o estilos reales | El hero muestra una licuadora de ejemplo que pasa del puesto 38 al 6 en 14 días, con gráfico de rank, puntaje y fase. Ver "Qué es real en el mock" abajo |
| 4 | Mobile primero, simplificar en el celular si abruma | A 390 px se ve el titular, los botones y el comienzo del mock en la primera pantalla. En el celular se quitan las detecciones y el radar |
| 5 | Wizard con los mismos campos, progreso, 160–240 ms, stagger de 60 ms, sin bucles | 4 pasos con los 8 campos de hoy. Verificado: sin animaciones continuas y ninguna duración mayor a 240 ms |
| 6 | Recorrido completo navegable | Landing → registro → wizard → entrada al dashboard. "Iniciar sesión" también funciona, pero termina en una nota: el recorrido del prototipo es el de registro |

---

## Tema

### Landing y registro

Usan el tema `.dark` que ya existe en `app/globals.css` (hoy definido y sin activar). No se inventó ningún color.

### Wizard: se aclara en cada paso

**Con una mezcla simple no funcionaba.** Mezclar los fondos oscuro y claro pasaba por grises apagados (#5F616B en el paso 3) y obligaba a llevar el texto secundario casi a blanco, hasta perder la jerarquía. Por eso **el fondo de cada paso es un token real de la escala de tinta de la app**:

| Paso | Fondo | Tarjeta | Texto | Ajustes para AA |
|---|---|---|---|---|
| 1 | `--background` oscuro #080A15 | `--card` oscuro #10132A | claro | ninguno |
| 2 | `--popover` oscuro #161A34 | `--accent` oscuro #1E2342 | claro | borde de campos +5 % hacia el texto |
| 3 | `--border-hover` oscuro #3A4170 (índigo) | `--sidebar-accent` #232850 | claro | texto tenue +28 %, borde de campos +30 % |
| 4 | `--border-hover` claro #CFCFE0 (lavanda) | `--card` claro #FFFFFF | oscuro | texto tenue +11 %, borde de campos +16 %, textos de estado del 4 al 21 % |
| Final | `--background` claro #F5F5FA | `--card` #FFFFFF | oscuro | ninguno |

- **El texto cambia de claro a oscuro entre el paso 3 y el 4.** Ahí el fondo salta la franja de grises (luminancia ~0,18–0,22) en la que ni el texto claro ni el oscuro llegan a AA. Ese salto es inevitable con una transición gradual; se dejó donde el formulario ya tiene la mayor parte de las respuestas.
- **Los "ajustes"** mueven un texto hacia el color principal de su lado lo mínimo para cumplir 4,5:1 contra el fondo y la tarjeta (3:1 los bordes de campos). Los calcula `tools/theme-stages.mjs`, que **falla** si algún par no llega.
- El cambio de colores entre pasos dura 240 ms. Con movimiento reducido es instantáneo.

**D-7 no queda resuelto; queda esquivado de forma coherente.** La app sigue en claro y el oscuro vive solo en las superficies públicas. Es la opción (a) del diagnóstico (B7).

## Anti-cripto

**Se quitó de la dirección 1:**

- las columnas monoespaciadas con Δ y flechas ▲▼ verdes y rojas (se leían como un ticker);
- la línea de escaneo sobre la lista;
- el feed que entraba cada 1,8 s.

**Lo que se ve ahora son cosas de SCOUT:**

- un producto de Shopify con su foto, su tienda y el día de seguimiento;
- el ranking de más vendidos como gráfico de posición (#1 arriba), igual que en el detalle de la app;
- el puntaje (ScoreRing) y la fase del tracker (PhaseBadge);
- en escritorio, "productos nuevos · hoy" de tiendas de ejemplo.

**La terminal está en la forma, no en el contenido:**

- fondo tinta con cuadrícula;
- rótulos en monoespaciada ("seguimiento", "// cómo funciona");
- el radar de la marca, que gira detrás del panel solo en escritorio;
- movimiento corto y seco.

**El rótulo de datos de ejemplo** es visible, en ámbar:

- "Datos de ejemplo" en el mock y en la vista del registro;
- "Ejemplo" en las detecciones y en las tarjetas de "cómo funciona".

Las tiendas se llaman "Tienda de ejemplo A…D" y el dominio es "tienda-de-ejemplo.com".

**Un punto a decidir:** el ícono de "Despegue" en la app es un cohete (lucide `Rocket`), y se copió tal cual. Si te suena a "to the moon", el cambio va en `components/tracker/phase-badge.tsx` y afecta todas las vistas.

## Qué es real en el mock (y qué no)

Elegiste HTML autocontenido, así que los componentes son **réplicas**. Para que no se desactualicen:

- **Colores:** `tools/build-prototipo.mjs` los copia de `app/globals.css` (`:root` y `.dark`) en cada build.
- **Íconos:** salen de `node_modules/lucide-react`, igual que en la app.
- **Logo:** el trazado sale de `components/ui/dropspy-logo.tsx`.
- **ScoreRing:** verde desde 65 y amarillo debajo (la regla actual, con D-1 pendiente); pista `--score-track`; 72 px.
- **PhaseBadge:** mismas clases e íconos que `phase-badge.tsx` (tamaño `md`).
- **Gráfico:** mismas reglas que `RankChart`:
  - línea `--primary` de 2 px y área al 18 %;
  - eje Y invertido con "#";
  - punto hueco en la entrada y relleno en la mejor posición;
  - curva monótona.

**Lo que no es real:**

- los datos;
- las ilustraciones de producto: son SVG provisorios hasta tener las 8 fotos de Unframed (C1 del diagnóstico).

**Para que no se desactualice de verdad, en la fase 3 el mock tiene que importar los componentes de la app** (ver 3.1).

## Movimiento

| Elemento | Cuándo | Duración | Curva |
|---|---|---|---|
| Mock: avance de un día | Cada 900 ms, 14 días. Pausa de 2,4 s y vuelve a empezar con un fundido de 240 ms | Gráfico y puntos en 240 ms. El arco del puntaje usa 700 ms, porque es el `duration-700 ease-out` del ScoreRing real | `cubic-bezier(0.2, 0, 0, 1)` |
| Cambio de fase en el mock | Cuando pasa de Meseta a Despegue | 240 ms, escala de 0,92 a 1 | Igual |
| Detecciones (solo escritorio) | Cada 3,6 s, la última vuelve a entrar arriba | 240 ms | Igual |
| Radar (solo escritorio) | Continuo | 6 s por vuelta | Lineal |
| Secciones de la landing | Al entrar en pantalla, una vez | 240 ms, 12 px, 60 ms entre elementos | `cubic-bezier(0.2, 0, 0, 1)` |
| Botones | Hover y clic | 160 ms | Igual |
| **Wizard: cambio de paso** | Al continuar | Sale en 160 ms; el fondo cambia en 240 ms; entra cada elemento en 200 ms, con 60 ms entre uno y otro | Igual |
| **Wizard y final: bucles** | — | **Ninguno** (verificado) | — |

**Lo que se lee no se mueve:** el titular y el texto del hero están quietos desde el primer pintado, y el mock arranca ya dibujado en el día 1.

**Movimiento reducido:** el mock queda fijo en el día 14, las secciones aparecen sin animar y no hay transiciones.

## Mobile primero (390 px)

- **Landing:**
  - en la primera pantalla se ven el titular, el texto, los dos botones y el comienzo del mock;
  - el aviso "DATO REAL PENDIENTE" baja después del mock;
  - las detecciones y el radar solo están en escritorio.
- **Registro:** la tarjeta del formulario va primero, y el resumen de valor queda debajo.
- **Wizard:**
  - una columna;
  - países y opciones en botones de 48 px de alto, en lugar de selects;
  - nichos y plataformas en chips de 44 px;
  - "Atrás" y "Continuar" al pie de la tarjeta.
- **Final:** "Entrar al dashboard" va antes del resumen, para que no quede debajo del pliegue.

## Wizard: los mismos 8 campos de hoy

| Paso | Campos | Control | Si falta |
|---|---|---|---|
| 1 · Cuéntanos de ti | País · Operas | Radios (8 países) · Solo / Con un equipo | "Elige tu país." · "Elige una opción." |
| 2 · Tu negocio | Vendes · Objetivo principal | Pago anticipado / Contra entrega · 4 objetivos | "Elige una opción." · "Elige tu objetivo principal." |
| 3 · Qué vendes | Nichos · Plataformas | Chips múltiples (13 y 5), con `aria-pressed` | "Elige al menos un nicho." · "… una plataforma." |
| 4 · Tu contacto | Teléfono · Autorización de WhatsApp | Campo con el indicativo del país elegido · casilla | "Escribe tu teléfono (al menos 7 dígitos)." |

- **Validación:** "Continuar" siempre está habilitado. Si falta algo, dice qué y pone el foco en el primer campo que falta. Hoy el botón queda deshabilitado sin explicar nada (B6).
- **"Atrás"** está desde el paso 2. En el 1 no, porque la cuenta ya existe.
- **No hay "saltar":** es obligatorio (CHANGE-099).
- **El teléfono va al final:** es el dato más sensible, y pedirlo cuando ya se invirtió en los pasos anteriores es la práctica habitual.
- **El paso 4** lleva el bloque "DATO REAL PENDIENTE" de la política de tratamiento de datos (Ley 1581).
- **Ya no se promete "menos de 30 segundos":** ahora dice "Cuatro pasos cortos".

## Verificación

`node docs/redesign/landing-auth-onboarding/tools/verify-prototipo.mjs [carpeta]` recorre el flujo con Chromium: **117 de 117 OK**.

- **En cada pantalla, a 390 y 1440 px:**
  - contraste AA de todo el texto visible contra el fondo que tiene detrás;
  - sin scroll horizontal;
  - ningún texto por debajo de 12 px;
  - el fondo de cada paso es el token esperado.
- **Wizard y final:** ningún bucle continuo y ninguna duración mayor a 240 ms.
- **Teclado y lectores de pantalla:**
  - flechas en las pestañas del registro y en los radios;
  - el foco va al primer campo con error, y al título al cambiar de paso;
  - `aria-invalid`, `aria-pressed` y `aria-valuenow` en la barra de progreso.
- **Movimiento reducido:** mock fijo en el día 14 y sin animaciones.
- **Sin errores de JavaScript.**

`tools/theme-stages.mjs` imprime el contraste de cada token en cada paso.

---

## Spec para la fase 3 (implementación)

Un commit por superficie, en este orden. **Nada de lo de abajo cambia** el scoring, el backend, el payload del onboarding ni el control por plan.

| # | Superficie | Riesgo | Depende de |
|---|---|---|---|
| 3.1 | Landing | con cuidado | Textos: copy de B1 aprobado |
| 3.2 | Registro e ingreso | con cuidado | — |
| 3.3 | Onboarding como ruta de pantalla completa | **requiere-revisor-técnico** | 3.2 |
| 3.4 | Entrada al dashboard | solo | 3.3 |

### 3.1 Landing (`app/(marketing)/page.tsx`)

- **Server Component** con islas cliente. Hoy toda la página es `'use client'` (B3.1).
- **Oscuro sin tocar D-7:** el layout de marketing envuelve la página en un contenedor con la clase `dark` y `bg-background`. Los tokens de `.dark` cascadean y `dark:` funciona (`@custom-variant dark (&:is(.dark *))`). **No se toca `globals.css` ni `<html>`.**
  - En iOS, el rebote del scroll muestra el fondo del `body`, que es claro. Se arregla con `body:has(.marketing-dark) { background: … }`, o se acepta.
- **Mock (`components/marketing/live-product-mock.tsx`, cliente):**
  - importa **`ScoreRing` y `PhaseBadge` reales**;
  - para el gráfico, **decisión:**
    - (a) `RankChart` real con los datos cortados por día, cargado con `next/dynamic` después del primer pintado y un SVG fijo del día 14 renderizado en el servidor como respaldo; Recharts pesa, y no puede frenar el LCP;
    - (b) extraer de `RankChart` un `RankArea` en SVG liviano que usen los dos;
    - **recomiendo (b)**: un solo componente, sin Recharts en la landing.
- **Copy:** el de este prototipo, que es el de la 2A, en `messages/es.json` (`Landing.*`), con las 9 afirmaciones de B1 corregidas.
- **Quitar** `generator: 'v0.app'` y agregar la imagen Open Graph (C4).
- **Barra:** "Cómo funciona", "Planes" (la sección), "Ingresar" y "Empieza gratis". "Ver precios" va a `/pricing`.

### 3.2 Registro e ingreso (`app/(auth)/login`)

- **Que el formulario venga en el HTML (B3.2):** leer `tab` en el servidor y pasarlo como prop, en lugar de `useSearchParams` bajo un `Suspense` vacío.
- **Accesibilidad:**
  - pestañas con `role="tab"`, `aria-selected` y flechas (B4.1);
  - nombre accesible en "Mostrar contraseña" (B4.2);
  - errores con `aria-invalid` y `aria-describedby`.
- **Sin botón de Google ni "¿Olvidaste tu contraseña?"** hasta que existan. Los bloques pendientes se reemplazan por los textos legales reales cuando estén.
- **Quitar "más de 2.000 equipos"** (B1.6).

### 3.3 Onboarding como ruta de pantalla completa

- **Nueva ruta `app/(onboarding)/bienvenida/page.tsx`**, fuera del layout del dashboard. Así no hay sidebar detrás, que en el celular se veía cortado (B6).
- **El layout del dashboard redirige** a `/bienvenida` mientras `justRegistered && !completed`, en lugar de montar `OnboardingModal`. Por esto es "requiere-revisor-técnico": toca el ruteo de toda la app para los recién registrados.
- **Se conserva:**
  - `onboardingSlice` (`setAnswer`, `markOnboardingCompleted`);
  - `useSubmitOnboardingMutation`;
  - el respaldo `dismissOnboarding()` si el backend falla;
  - el payload `answers`, idéntico.
- **Pasos:** un componente por paso con el estado en Redux, como hoy.
  - La URL es `/bienvenida?paso=2`, así "Atrás" del navegador funciona.
  - Las etiquetas de nichos pasan a `es.json`; **los valores no cambian**, porque son la taxonomía del backend.
- **Etapas de color:** cinco clases (`.onb-paso-1` … `.onb-final`) con los valores que imprime `tools/theme-stages.mjs`.
  - Viven en el CSS del onboarding, no en `globals.css`.
  - Un test de CI recalcula las etapas desde `globals.css` y falla si alguien cambió un token y no regeneró las clases.
- **Teléfono:** el indicativo solo se muestra. **Decisión con Diego:** guardar "+57 300…" cambia el formato del dato aunque no la forma del payload (B6). Hasta decidirlo, se manda como hoy.

### 3.4 Entrada al dashboard

- Pantalla `/bienvenida/listo` en claro: saludo, vista previa del estado vacío real ("No tienes tiendas registradas aún.") y resumen de respuestas.
- **"Entrar al dashboard"** lleva a `/stores` con el formulario de agregar tienda abierto. Hace falta un `?agregar=1` en `stores/page.tsx`: una línea, riesgo solo.

## Decisiones abiertas

1. **El dashboard no es responsive (B6/M1).** El recorrido está pensado para el celular y termina en un dashboard con el sidebar fijo de 256 px. Es el mayor riesgo del embudo, y está fuera de esta fase.
2. **Gráfico del mock:** (a) o (b) de 3.1. Recomiendo (b).
3. **Textos legales y canal de soporte:** siguen como "DATO REAL PENDIENTE". Sin ellos no hay registro que diga "aceptas" ni onboarding que pida el teléfono con respaldo legal.
4. **Número de escala:** el conteo fechado de tiendas es de Diego. Hasta tenerlo no se publica ninguno.
5. **Fotos de producto:** 8 imágenes de Unframed, ~US$0,25 (C1). El prototipo usa ilustraciones SVG.
6. **Ícono de "Despegue":** ver "Anti-cripto".
