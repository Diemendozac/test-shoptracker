# 02 · Prototipo navegable y spec (fase 2B)

**Fecha:** 2026-09-29 · **Dirección elegida:** 1, "Terminal de inteligencia", con el mock del producto vivo de la dirección 3 · **Prototipo:** [`preview/prototipo-2b.html`](./preview/prototipo-2b.html) · **Diagnóstico:** [`01-diagnostico.md`](./01-diagnostico.md)

## Cómo verlo

- **En la computadora:** doble clic en `preview/prototipo-2b.html`. No necesita internet ni servidor.
- **En el celular:** mandarte el archivo y abrirlo en el navegador del teléfono; funciona igual, sin conexión. En la computadora también se puede ver a 390 px con el modo dispositivo de Chrome (F12, ícono del celular).
- **Recorrido:** landing → "Empieza gratis" → registro → wizard de 4 pasos → entrada al dashboard.
- **Botón "Prototipo"** (abajo a la derecha): salta a cualquier pantalla y activa el movimiento reducido. Si saltas a un paso, los anteriores se completan con datos de ejemplo. Ese botón no es parte del diseño.
- **Capturas:** [`capturas/2b/`](./capturas/2b/), a 390 y 1440 px.

## Cambio de posicionamiento (2026-09-29)

**Antes:** la landing vendía una herramienta para seguir tus propias tiendas ("Deja que otros testeen por ti", "las tiendas Shopify que sigues").

**Ahora:** vende la base que ya existe. **"Ya vigilamos el mercado por ti; tú ves qué está ganando"**, como Charm con su "1M+ productos". Seguir tus propias tiendas pasa a ser una funcionalidad más.

| Parte de la landing | Qué dice ahora |
|---|---|
| Hero | "Ya vigilamos el mercado. Tú ves qué está ganando." El texto explica que Dropspy revisa todos los días el ranking de más vendidos de tiendas Shopify de Latinoamérica y guarda su historial. El botón secundario es "Ver el mercado" |
| Mock del hero | "mercado · subiendo": el producto de ejemplo es de una tienda del mercado (con país), no de una que agregaste. Debajo, en escritorio, "también subiendo hoy": otros productos del mercado con tienda, país y fase |
| **Bloque de escala** (nuevo, justo después del hero) | "No empiezas de cero: la base ya existe." Tres contadores (tiendas monitoreadas, productos detectados, días de historial), cada uno con su definición al lado, más el desglose por país con LATAM primero. **Todo en "DATO REAL PENDIENTE"**, con la fecha de corte pendiente |
| Cómo funciona | "Cada mañana, lo que se movió en el mercado." La tarjeta 01 pasa de "Sigues tus tiendas" a "Vigilamos las tiendas por ti", y la 02 suma "con historial" |
| Tus competidores (nuevo, secundario) | "¿Tienes competidores fijos? Súmalos." Seguir tus tiendas, de 15 a 100 según el plan |
| Planes | Todos incluyen primero el "Pool global de productos" (así figura en `/pricing`) y después las "tiendas propias" |
| Cierre | "Mira qué está ganando hoy." |

### Cómo se cargan las cifras

- Están en un solo lugar: el objeto `SCALE` de `tools/build-prototipo.mjs`.
- Mientras un valor sea `null`, su casilla dice "DATO REAL PENDIENTE"; hoy son todos `null`.
- Cuando Diego entregue los conteos, se completan ahí y se regenera el prototipo. Cada contador anima de 0 al valor en 700 ms al entrar en pantalla, con separador de miles, y el desglose ordena LATAM de mayor a menor y suma el resto en "Otros países". La verificación lo prueba con valores de prueba que no se publican.

### Cuidados para que el ángulo no prometa de más

1. **"Tiendas monitoreadas" solo puede contar tiendas cuyos datos el usuario puede ver**: el pool global (Explorar testeos). No cuenta las tiendas privadas de Pro y Agency. Si las contara, el "tú ves" sería falso. La definición exacta está en "Decisiones abiertas".
2. **No decir "miles" sin el conteo.** La única referencia en el repo es interna y vieja: `CHANGES.md` registra 724 tiendas en el pool del plan admin en agosto. Si el conteo sale de ese orden, "miles" sería falso. El bloque está hecho para que la cifra más fuerte pueda ir primero; es probable que sea productos detectados.
3. **"de Latinoamérica"** en el texto del hero depende del desglose. Si LATAM no es la mayoría, cambia a "de Latinoamérica y otros mercados".
4. **La prueba gratis ve solo la primera página del pool** (`lib/view-as.tsx`, `MAX_POOL_PAGE.free = 0`). "Tú ves qué está ganando" se cumple con "lo que más está ganando hoy", no con todo el mercado. Ver "Registro y onboarding con el nuevo ángulo".
5. **Los "días de historial" son de la base, no de lo que ve cada plan** (30 días, 90 días o 1 año). Por eso las tarjetas de planes siguen diciendo cuánto historial ve cada uno.

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
- en escritorio, "también subiendo hoy": otros productos del mercado con su tienda, su país y su fase;
- el bloque de escala: conteos de la base (tiendas, productos, días), no precios ni variaciones, sin flechas ni verde y rojo de subida o bajada.

**La terminal está en la forma, no en el contenido:**

- fondo tinta con cuadrícula;
- rótulos en monoespaciada ("seguimiento", "// cómo funciona");
- el radar de la marca, que gira detrás del panel solo en escritorio;
- movimiento corto y seco.

**El rótulo de datos de ejemplo** es visible, en ámbar:

- "Datos de ejemplo" en el mock y en la vista del registro;
- "Ejemplo" en las detecciones y en las tarjetas de "cómo funciona".

Las tiendas se llaman "Tienda de ejemplo A…D" y los dominios son "tienda-de-ejemplo-a.com" y "mi-competidor.com".

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
| Contadores del bloque de escala | Al entrar en pantalla, una vez, y solo cuando hay cifras | De 0 al valor en 700 ms; las barras por país, también 700 ms | Desaceleración cúbica. Es una excepción al 160–240 ms, igual que el arco del ScoreRing: un número que cuenta necesita tiempo para leerse. Va solo en la landing |
| Secciones de la landing | Al entrar en pantalla, una vez | 240 ms, 12 px, 60 ms entre elementos | `cubic-bezier(0.2, 0, 0, 1)` |
| Botones | Hover y clic | 160 ms | Igual |
| **Wizard: cambio de paso** | Al continuar | Sale en 160 ms; el fondo cambia en 240 ms; entra cada elemento en 200 ms, con 60 ms entre uno y otro | Igual |
| **Wizard y final: bucles** | — | **Ninguno** (verificado) | — |

**Lo que se lee no se mueve:** el titular y el texto del hero están quietos desde el primer pintado, y el mock arranca ya dibujado en el día 1.

**Movimiento reducido:** el mock queda fijo en el día 14, las secciones aparecen sin animar, los contadores muestran el valor final y no hay transiciones.

## Mobile primero (390 px)

- **Landing:**
  - en la primera pantalla se ven el titular, el texto, los dos botones y el comienzo del mock;
  - el bloque de escala va justo después del hero, con las tres casillas apiladas y el desglose por país en filas;
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

`node docs/redesign/landing-auth-onboarding/tools/verify-prototipo.mjs [carpeta]` recorre el flujo con Chromium: **129 de 129 OK**.

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
- **Bloque de escala:**
  - ninguna cifra publicada: las tres casillas dicen "DATO REAL PENDIENTE" y la fecha de corte está pendiente;
  - sin cifras de escala en el hero;
  - con valores de prueba (que no se publican), el contador anima desde 0, termina con separador de miles ("1.234"), muestra la fecha de corte y el "desde", y ordena los países con LATAM primero y "Otros países" al final.
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
- **Copy:** el de este prototipo, con el posicionamiento del 2026-09-29, en `messages/es.json` (`Landing.*`), con las 9 afirmaciones de B1 corregidas.
- **Bloque de escala (`components/marketing/scale-block.tsx`):**
  - las cifras viven en `lib/marketing/scale.ts` (`corte`, `desde`, `tiendas`, `productos`, `dias`, `paises`), versionadas en el repo y actualizadas en cada corte (propuesta: mensual);
  - se renderiza en el servidor: el HTML trae el número final, sirve para SEO y funciona sin JavaScript. Una isla cliente solo anima el contador y respeta el movimiento reducido;
  - **en producción no existe "DATO REAL PENDIENTE"**: si falta alguna de las tres cifras, el bloque no se muestra;
  - más adelante puede leerse de un endpoint público cacheado un día (p. ej. `/public/stats`); es decisión de Diego.
- **Quitar** `generator: 'v0.app'` y agregar la imagen Open Graph (C4).
- **Barra:** "El mercado" (el bloque de escala), "Cómo funciona", "Planes", "Ingresar" y "Empieza gratis". "Ver precios" va a `/pricing`.

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
- **Con el nuevo ángulo, esto debería cambiar** (propuesta sin aplicar; ver la sección siguiente): la acción principal pasa a ser "Ver qué está ganando", que va a `/pool`, y "Agregar mis tiendas" queda como secundaria.

## Registro y onboarding con el nuevo ángulo

Sí hay que cambiar textos. El registro y la pantalla final siguen diciendo que el valor empieza cuando agregas una tienda, y eso contradice la landing justo en el momento de entrar.

**Solo apliqué una corrección, porque era un error mío:** el paso 2 del wizard decía "Así te mostramos primero lo que te sirve". La app no usa las respuestas del onboarding para nada visible: solo se guardan con `PATCH /me/onboarding`. Ahora dice "Dos preguntas sobre cómo vendes". El resto queda como propuesta, para que decidas:

| Dónde | Dice hoy | Propuesta | Por qué |
|---|---|---|---|
| Registro, título de la columna de valor | "Tu radar empieza con la primera tienda que agregues." | "El mercado ya está vigilado. Entra y mira qué está ganando." | Contradice la landing: el valor ya existe antes de agregar nada |
| Registro, hechos | "Una foto diaria del ranking de cada tienda" · "De 15 a 100 tiendas, según el plan" | "Una foto diaria del ranking de las tiendas que monitoreamos" · "Y si quieres, sigue tus propias tiendas: de 15 a 100 según el plan" | Las tiendas propias pasan a ser secundarias |
| Registro, subtítulo de "Crear cuenta" | "7 días gratis. Sin tarjeta de crédito." | "7 días gratis, sin tarjeta. En la prueba ves lo que más está ganando hoy." | La prueba solo ve la primera página del pool: mejor decirlo que decepcionar. La otra opción es que la prueba vea más; es decisión de negocio |
| Registro, mini-mock | "Licuadora portátil recargable · #38 → #6 en 14 días" | Agregar "Tienda de ejemplo · CO" | Que se lea como un producto del mercado |
| Wizard, paso 1 | "Cuatro pasos cortos para configurar tu cuenta." | "Cuatro pasos cortos y entras a ver el mercado." | Recuerda qué hay del otro lado |
| Wizard, pasos 2 y 3 | — | **No prometer personalización** ("te mostramos tus nichos") hasta que el pool filtre por los nichos del onboarding | Hoy sería falso. Si se quiere, es una funcionalidad, no un texto |
| Final, título y texto | "Todo listo." · "Tu radar empieza con la primera tienda que agregues." | "Todo listo." · "El mercado ya está vigilado: mira qué está ganando hoy." | Mismo motivo que en el registro |
| Final, vista previa | Estado vacío: "No tienes tiendas registradas aún." | Vista previa de Explorar testeos con 3 productos subiendo (datos de ejemplo) | El estado vacío le dice al usuario nuevo "no tienes nada", justo cuando la landing le prometió lo contrario |
| Final, acción | "Entrar al dashboard" → `/stores` para agregar tienda | "Ver qué está ganando" → `/pool`; secundaria "Agregar mis tiendas" → `/stores?agregar=1` | El primer paso tiene que ser ver el valor, no configurar |

## Decisiones abiertas

1. **El dashboard no es responsive (B6/M1).** El recorrido está pensado para el celular y termina en un dashboard con el sidebar fijo de 256 px. Es el mayor riesgo del embudo, y está fuera de esta fase.
2. **Gráfico del mock:** (a) o (b) de 3.1. Recomiendo (b).
3. **Textos legales y canal de soporte:** siguen como "DATO REAL PENDIENTE". Sin ellos no hay registro que diga "aceptas" ni onboarding que pida el teléfono con respaldo legal.
4. **Los 3 conteos del bloque de escala y el desglose por país (Diego).** Hasta tenerlos no se publica ninguna cifra, ni en el hero ni en el bloque. Definiciones exactas:

   - **Fecha de corte (C):** una sola fecha para las tres cifras, en hora de Colombia (America/Bogota). Se publica como "corte: 1 oct 2026".
   - **Universo:** las tiendas cuyo ranking alimenta el pool global (Explorar testeos):
     - las del plan admin (las que monitorea Dropspy);
     - las de usuarios cuyo plan comparte con la comunidad (hoy Básico);
     - **nunca** las tiendas privadas de Pro y Agency.

     Un mismo dominio en varias cuentas cuenta como una tienda: se compara sin protocolo, sin `www` y sin barra final. **Diego confirma qué planes alimentan el pool** (en particular, las tiendas de la prueba gratis).
   - **Conteo 1 · Tiendas monitoreadas:** tiendas del universo con al menos una foto del ranking de más vendidos (`snapshots.collection_type = 'bestseller'`) guardada entre C − 6 y C: 7 días calendario, inclusive. La definición que va al lado en la landing es "con al menos una foto del ranking en los últimos 7 días".
   - **Conteo 2 · Productos detectados:** productos candidatos (`candidate_products`) de tiendas del universo con `first_seen_date` ≤ C, estén activas o no.
     - Un producto es un par (tienda, handle): el mismo producto en dos tiendas cuenta dos veces, porque son dos detecciones.
     - Va al lado: "productos nuevos que entraron al ranking de esas tiendas, en total".
   - **Conteo 3 · Días de historial:** días calendario con al menos una foto del ranking de más vendidos de alguna tienda del universo, hasta C.
     - Si hubo días sin fotos, **no** se cuentan: es un conteo de días con datos, no el tiempo transcurrido.
     - Se entrega también la fecha de la primera foto, que se publica como "desde el …".
   - **Desglose por país:** las tiendas del conteo 1 agrupadas por el país de la tienda (código ISO de 2 letras), con todos los países y su número.
     - La página ordena LATAM de mayor a menor y suma el resto en "Otros países".
     - Además: **cuántas tiendas no tienen país.** Si son muchas, el desglose no es representativo y no se publica.

   **SQL de referencia.** Es sobre el `schema.sql` del respaldo de junio, que no tiene `stores.country`; hay que ajustarlo a la base actual y a la regla real del pool:

   ```sql
   -- :corte = '2026-10-01' (hora de Colombia)
   CREATE TEMP VIEW universo AS
   SELECT s.store_id, s.country,
          lower(regexp_replace(s.base_url, '^(https?://)?(www\.)?|/+$', '', 'g')) AS dominio
   FROM stores s JOIN users u ON u.user_id = s.user_id
   WHERE u.plan IN ('admin', 'starter');          -- AJUSTAR a la regla real del pool

   -- 1) Tiendas monitoreadas
   SELECT count(DISTINCT un.dominio) FROM universo un
   WHERE EXISTS (SELECT 1 FROM snapshots sn WHERE sn.store_id = un.store_id
                 AND sn.collection_type = 'bestseller'
                 AND sn.snapshot_date BETWEEN DATE :corte - 6 AND DATE :corte);

   -- 2) Productos detectados
   SELECT count(DISTINCT (un.dominio, c.product_handle))
   FROM candidate_products c JOIN universo un USING (store_id)
   WHERE c.first_seen_date <= DATE :corte;

   -- 3) Días de historial y primer día
   SELECT count(DISTINCT sn.snapshot_date) AS dias, min(sn.snapshot_date) AS desde
   FROM snapshots sn JOIN universo un USING (store_id)
   WHERE sn.collection_type = 'bestseller' AND sn.snapshot_date <= DATE :corte;

   -- 4) Por país (tiendas del conteo 1; '(sin país)' dice cuántas no tienen)
   SELECT coalesce(un.country, '(sin país)') AS pais, count(DISTINCT un.dominio) AS tiendas
   FROM universo un
   WHERE EXISTS (SELECT 1 FROM snapshots sn WHERE sn.store_id = un.store_id
                 AND sn.collection_type = 'bestseller'
                 AND sn.snapshot_date BETWEEN DATE :corte - 6 AND DATE :corte)
   GROUP BY 1 ORDER BY 2 DESC;
   ```
5. **Fotos de producto:** 8 imágenes de Unframed, ~US$0,25 (C1). El prototipo usa ilustraciones SVG.
6. **Ícono de "Despegue":** ver "Anti-cripto".
7. **Textos del registro y del onboarding con el nuevo ángulo:** ver la tabla de "Registro y onboarding con el nuevo ángulo". Están sin aplicar, salvo la corrección del paso 2.
8. **Qué ve la prueba gratis:** hoy, la primera página del pool. O el registro lo dice ("en la prueba ves lo que más está ganando hoy"), o la prueba ve más. Es decisión de negocio.
