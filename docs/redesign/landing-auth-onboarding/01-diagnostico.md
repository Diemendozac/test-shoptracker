# 01 · Diagnóstico: landing, login/registro y onboarding

**Fecha:** 2026-09-29 · **Base:** `main` en `5d7ff79` · **Superficies:** `/` (landing), `/login` (pestañas Ingresar y Registrarse) y el modal de onboarding (se abre en `/home` después de registrarse) · **Referencia de movimiento:** [info.charm.io](https://info.charm.io/)

## Cómo se hizo

- **Lectura de código:**
  - `app/(marketing)/page.tsx` y `layout.tsx`;
  - `app/(auth)/login/page.tsx` y `layout.tsx`;
  - `app/(auth)/hooks/useAuth.ts` y `services/authApi.ts`;
  - `components/onboarding/onboarding-modal.tsx`, `app/(auth)/store/onboardingSlice.ts` y `app/(dashboard)/layout.tsx`;
  - `messages/es.json` (Landing, Auth, Onboarding), `app/globals.css`, `app/layout.tsx` y `next.config.mjs`;
  - `app/(marketing)/pricing/page.tsx` y `lib/view-as.tsx`, para saber qué números son verificables.
- **Capturas del estado actual** con gstack browse contra `next dev` local, a 1440×900 y 390×844. Están en [`capturas/antes/`](./capturas/antes/).
  - Solo existe el modo claro (ver B7). Las capturas `oscuro-forzado-*` agregan la clase `.dark` a mano y sirven solo de referencia.
  - El onboarding se abrió simulando en `localStorage` el estado de un registro recién hecho, con un token falso y sin backend. La interfaz es la real; lo que se ve detrás del modal no tiene datos.
- **Charm**, con gstack browse a 1440 y 390:
  - las animaciones de carga se leyeron de la configuración que Framer publica en el HTML (`__framer__appearAnimationsContent`);
  - las de scroll y hover se midieron cuadro a cuadro, muestreando `opacity` y `transform`. El navegador headless pinta ~15 cuadros por segundo, así que las duraciones tienen un error de ±70 ms.
- **Límites:**
  - sin `.env.local` no hay backend local, así que no se probó un registro real;
  - Lighthouse no se corrió (queda para la fase 3);
  - las capturas de Charm **no están en el repo**, porque `Diemendozac/test-shoptracker` es público y son de un tercero. Se entregaron aparte.

## En corto

1. **La landing es una plantilla de v0** (`app/layout.tsx:28`, `generator: 'v0.app'`) con voz B2B traducida ("equipos de e-commerce", "insights", `tu@empresa.com`). No le habla al dropshipper Drop 2.0 y **no muestra el producto**: no tiene una sola imagen ni un solo mock.
2. **Hay 9 afirmaciones sin respaldo o falsas**, no solo las 3 stats del brief. La más grave: "más de 2.000 equipos" en el login, justo donde se decide el registro, y "tus datos nunca se comparten", que es falso en el plan Básico.
3. **Hay 7 links o botones que no hacen nada.** Dos de ellos son "Términos" y "Privacidad" en el registro, que dice "al crear una cuenta, aceptas" documentos que no existen.
4. **El login en producción llega vacío** hasta que carga el JavaScript (B3.2).
5. **El onboarding tiene 8 campos en un modal**, y en el celular se abre encima de un dashboard que no es responsive (B6).
6. **Lo que hace buena a Charm es sobre todo prueba real** (clientes, prensa, reseñas, escala), y nada de eso lo tenemos hoy. Lo transferible es su gramática de movimiento y su jerarquía (A).

---

## A. Qué hace buena a Charm

### A1. Movimiento (medido)

| # | Elemento | Disparador | Qué se mueve | Duración | Curva |
|---|---|---|---|---|---|
| 1 | Titular, subtítulo, CTA y rating del hero | — | **Nada.** Están quietos desde el primer pintado | — | — |
| 2 | Cuatro capas de luz detrás del hero | Al cargar | Opacidad de 0 a entre 0,13 y 0,65 | 2 s, con 0,4 s de retraso | `cubic-bezier(0.44, 0, 0.56, 1)`: entrada y salida suaves |
| 3 | Diagrama de flujo de datos y filas de logos | Al cargar | Suben 30 px, sin fade | ~0,7 s, con 0,1 s de retraso | Resorte con rebote 0,1 |
| 4 | Partículas sobre las líneas del diagrama | Continuo | Viajan por las líneas hacia el centro | Bucle | Lineal |
| 5 | Logos de clientes y de prensa | Continuo (marquee) | Se desplazan a la izquierda | ~50 px/s | Lineal |
| 6 | Bloque "Discover & Analyze" | Al entrar en pantalla, una vez | Escala de 0,5 a 1 y opacidad de 0,5 a 1 | ~0,65 s | Resorte sin rebote: arranca rápido y frena con cola larga |
| 7 | Tarjeta de stats | Al entrar | Entra 30 px desde la izquierda, con fade | ~0,4 s | Igual que la 6 |
| 8 | Números de stats | Al entrar | Cuentan hacia arriba: 8M → 100M+, $2B → $14B+, 2 → 15 | ~1,5 s | Desacelera al final |
| 9 | Títulos de sección (Challenge, How it works, Use cases, Testimonials) | Al entrar | Suben 72 px, sin fade | ~0,7 s | Resorte sin rebote |
| 10 | Título de "How it works" | Scroll | Parallax ligado al scroll, con inercia | Continuo | Resorte |
| 11 | Casos de uso: tarjetas apiladas | Scroll (sticky) | Cada tarjeta se fija a 80–85 px del borde y la siguiente la cubre. El texto de la anterior se apaga (opacidad de 0,85 a 0 en ~500 px de scroll) | Ligado al scroll | Lineal al scroll |
| 12 | Bloque "More than data" | Al entrar | Fade y sube 48 px | ~1,1 s, con 0,3 s de retraso | Resorte sin rebote |
| 13 | Las 3 tarjetas de soporte | Al entrar | Fade y suben 48 px | ~0,5 s. **Entran las tres a la vez**, sin stagger | Igual que la 12 |
| 14 | Testimonios | Continuo (marquee) | Se desplazan a la izquierda, con máscara de fade en los bordes | ~90–100 px/s | Lineal |
| 15 | CTA "Book a Call" | Hover | El círculo negro de la flecha se expande hasta cubrir el botón (escala X de 0,22 a 1), la flecha gira −45° y el texto se corre 2 px | ~0,5 s (80 % en los primeros 0,2 s) | Resorte sin rebote |
| 16 | Ilustración del radar ("Image 1") | **Al cargar** | Escala de 0,8 a 1, con fade | 0,6 s | Resorte con rebote 0,2 |

**En 390 px** usa las mismas primitivas, con dos simplificaciones:

- las tarjetas apiladas se vuelven una lista normal (texto y luego imagen);
- el titular se apila en tres líneas: "TikTok Shop", el interruptor y "DTC Brands".

Los marquees siguen. La página mide 11.828 px en móvil y 9.379 px a 1440.

**El lenguaje que vale la pena traducir:**

1. **Cinco primitivas repetidas en toda la página:** subir, escalar al entrar, contador, marquee y pila fija. Por eso se siente coherente.
2. **Resortes sin rebote o casi (0 a 0,2).** Se siente físico pero serio; nunca elástico.
3. **Lo que se lee no se mueve.** El texto del hero está quieto y el movimiento de arriba es atmósfera (luz y partículas). Así el LCP no espera a ninguna animación.
4. **Solo `transform` y `opacity`.** Las animaciones que Framer delega al navegador (WAAPI) son todas de esas dos propiedades.
5. **Casi no hay stagger.** Los bloques entran juntos y el ritmo lo pone el scroll, no los retrasos.
6. **El movimiento continuo** (marquees y partículas) se reserva para la prueba social y para "los datos fluyendo". Comunica que el producto está vivo.

**Lo que no hay que copiar:**

- La animación 16 corre al cargar, 3.500 px debajo del pliegue: nadie la ve y gasta recursos.
- El interruptor del hero es un link (`./dtc-brands`) sin texto accesible.
- El banner de cookies tapa un cuarto de la primera pantalla.
- La página es larguísima en móvil.

### A2. Jerarquía

- **Una idea por sección, con un rótulo en píldora encima de cada H2** ("The Challenge", "How It Works", "Use Cases"). Se puede escanear saltando de rótulo en rótulo.
- **Un solo CTA, repetido** ("Book a Call") en la barra, el hero, cada caso de uso y el cierre. Hay una sola acción de conversión.
- **Se ve el producto en cada sección:** radar, tarjetas de señales y métricas. Es una versión ilustrada, no capturas crudas, pero se entiende qué hace.
- **Ritmo de fondos:** casi todo blanco, con una sección saturada (soporte) y un cierre en tarjeta a sangre. El color se usa para marcar momentos.
- **Casos de uso por comprador** (retailers, inversionistas, marcas). Cada lector encuentra su fila.

### A3. Prueba social, y cuánto de ella viene de datos que no tenemos

| Bloque de Charm | Qué es | ¿Lo tenemos? |
|---|---|---|
| Rating 4,5 con insignias de G2 y Capterra | Reseñas de terceros | No |
| Logos de clientes (Ulta, Academy, Roku…) | Clientes reales | No |
| "Data Featured in" (Bloomberg, WWD…) | Prensa | No |
| 100M+ productos, $14B+ en ventas, 15 países | Escala de su propia base | **Parcial.** La base existe, pero no hay un número actual y fechado. Los conteos que hay en la wiki son de agosto y septiembre y no sirven para publicar sin volver a consultarlos |
| Stats de industria con fuente (eMarketer, Statista…) | Datos de terceros citados | Posible, si conseguimos cifras de LATAM con fuente. Hoy la wiki no tiene ninguna |
| Testimonios con foto, nombre, cargo y empresa | Clientes reales | No |
| Una cita como titular ("All our revenue comes from Charm") | Testimonio | No |

**Honestamente:** buena parte de la autoridad que transmite Charm viene de esos bloques; mi estimación es más de la mitad del efecto. El movimiento es el envoltorio. Si copiamos el movimiento sin la prueba, queda una landing bonita que promete sin demostrar.

**Lo que sí tenemos y se puede verificar:**

- **Prueba gratis de 7 días, sin tarjeta:** `lib/view-as.tsx:76` (`TRIAL_DAYS = 7`), y el registro no pide pago.
- **Planes** (`app/(marketing)/pricing/page.tsx`):
  - 15, 40 o 100 tiendas;
  - 30 días, 90 días o 1 año de historial;
  - precios en COP, con Mercado Pago.
- **Una foto diaria del ranking de más vendidos** de cada tienda (wiki `scout-pipeline`).
- **Un puntaje explicable:** la fórmula está en el CLAUDE.md del repo. Da para una metodología pública, como la práctica #4 de `benchmark-charm-aplicado`.
- **El producto mismo:** pantallas reales mostradas con datos de ejemplo rotulados como tales.

De ahí sale el principio para la fase 2: **prueba por demostración, no por declaración.** En lugar de "10x más rápido", mostrar cómo un producto sube en el ranking día a día.

---

## B. Auditoría de lo actual

### B1. Afirmaciones sin respaldo o falsas

| # | Dónde | Dice | Qué se puede verificar | Propuesta |
|---|---|---|---|---|
| 1 | `page.tsx:19`, `es.json:20` | "**10x** descubrimiento de productos más rápido" | Nada en el código ni en la wiki | Quitar |
| 2 | `page.tsx:20`, `es.json:21` | "**50+** tiendas por cuenta" | Los planes dan 15, 40 o 100. Ninguno da "50+" | "De 15 a 100 tiendas según el plan" |
| 3 | `page.tsx:21`, `es.json:22` | "**30** días de ventana de seguimiento" | 30 días es el historial del Básico; Pro tiene 90 y Agency 1 año | "Hasta 1 año de historial" |
| 4 | `page.tsx:22`, `es.json:23` | "**24/7** monitoreo automatizado" | Es una foto diaria, no un monitoreo continuo | "Una foto diaria de cada tienda" |
| 5 | `es.json:66` | "Únete a **miles de equipos**" | Sin respaldo | Quitar |
| 6 | `es.json:112` (login) | "Con la confianza de **más de 2.000 equipos**" | Sin respaldo. Es la más riesgosa: está en el punto de conversión | Quitar |
| 7 | `es.json:38` | "Puntajes **calculados por IA**" | El puntaje es una fórmula fija (crecimiento × 0,5 + calidad de rank × 0,3 + momentum × 0,2). La IA se usa para clasificar nichos y en la búsqueda del pool | Decir qué mide el puntaje |
| 8 | `es.json:34` | "Detecta **al instante**" | La detección es diaria | "Cada día" |
| 9 | `es.json:50` | "Completamente privados y **nunca se comparten**" | El plan Básico es `community` (`pricing/page.tsx:37`): sus tiendas alimentan el pool. Es falso para 1 de 3 planes, y es una promesa de privacidad | "En Pro y Agency tus tiendas son privadas; en Básico suman al pool de la comunidad" |

**Verdadero, se queda:** "prueba gratis de 7 días, sin tarjeta" (`es.json:93`).

### B2. Links y botones que no hacen nada

| # | Dónde | Qué es | Soporte en el código | Propuesta |
|---|---|---|---|---|
| 1 | `page.tsx:54` | "Documentación" en la barra → `#` | No hay documentación | Quitar. Más adelante puede apuntar a una página de metodología |
| 2 | `page.tsx:213–215` | Privacidad, Términos y Contacto en el pie → `#` | No hay páginas | Ver la nota legal |
| 3 | `login/page.tsx:103` | "¿Olvidaste tu contraseña?" → `#` | `authApi.ts` solo tiene `login` y `register` | Ocultar, como pide el brief. Pero entonces quien olvida su clave no tiene salida: hace falta un canal de soporte real |
| 4 | `login/page.tsx:16–28` | Botón de Google, sin `onClick` | No hay OAuth en el backend; está bloqueado en el paso 0 (wiki `scout-google-oauth-propuesta`) | Ocultar, como pide el brief |
| 5 | `login/page.tsx:264, 268` | "Términos de servicio" y "Política de privacidad" → `#`, bajo "Al crear una cuenta, aceptas…" | No hay documentos | Ver la nota legal |

Además, la barra no enlaza a `/pricing`, que existe y es pública. La clave `nav.pricing` ya está en `es.json` sin usar.

**Nota legal (a confirmar con asesoría):** el onboarding pide teléfono y autorización para contactar por WhatsApp. En Colombia, la Ley 1581 de 2012 y el Decreto 1377 de 2013 exigen una política de tratamiento de datos y autorización del titular. Ocultar los links no lo resuelve; hace falta el texto real, y ese texto no lo puede inventar Claude. En el prototipo irá como bloque "DATO REAL PENDIENTE".

### B3. Rendimiento y técnica

1. **La landing entera es `'use client'`** (`page.tsx:1`). El texto sí llega en el HTML (verificado en `.next/server/app/index.html`), pero toda la página se hidrata. Con motion, lo sano es un Server Component con islas cliente para las animaciones.
2. **El login en producción llega vacío.** `useSearchParams()` (`login/page.tsx:280`) bajo un `<Suspense fallback={null}>` (`(auth)/layout.tsx:8`) hace que Next lo renderice solo en el cliente. El prerender (`.next/server/app/login.html`) trae `BAILOUT_TO_CLIENT_SIDE_RENDERING` y no trae el formulario. En un celular de gama media se ve una página en blanco hasta que carga el JS.
3. **`images.unoptimized: true`** (`next.config.mjs`): `next/image` no genera AVIF ni WebP. Las imágenes nuevas hay que pregenerarlas en los tamaños finales. Cambiar esa opción afecta todas las imágenes de la app y el costo en Vercel, y la decisión es de Diego.
4. **No hay imagen Open Graph:** las únicas rutas de imagen son `/icon` y `/apple-icon`. Un link compartido por WhatsApp, que es el canal natural de esta audiencia, sale sin vista previa.
5. **Tipografía:** Outfit ya se carga (`app/layout.tsx:19–23`) y es la fuente de display de la dirección B. No hace falta una fuente nueva.
6. **`typescript.ignoreBuildErrors: true`:** el build no valida tipos. La línea base de hoy son 8 errores, todos en `lib/mock-data.ts`.

### B4. Accesibilidad (cuenta para la meta de Lighthouse ≥ 95)

1. Las pestañas Ingresar y Registrarse son botones sueltos, sin `role="tab"` ni `aria-selected` (`login/page.tsx:313–325`).
2. El botón de mostrar contraseña es solo un ícono y no tiene nombre accesible (`login/page.tsx:121` y `235`).
3. **Onboarding:**
   - los `<Label>` no tienen `htmlFor` (`onboarding-modal.tsx:119, 130, 151, 163, 177, 191, 196`), así que los selects no tienen nombre accesible;
   - los chips no tienen `aria-pressed` (`:40–54`), así que un lector de pantalla no sabe cuáles están elegidos;
   - el teléfono usa el placeholder "Obligatorio" como instrucción (`es.json:126`).
4. El contraste se mide en la fase 2 con `docs/redesign/tools/contrast-check.mjs`.

### B5. Copy y posicionamiento

- **Le habla a otra persona.** Según `audiencia-drop2` y `charm-referencia`, la audiencia es el dropshipper Drop 2.0 de LATAM, que se pregunta "¿qué producto lanzo esta semana?". La landing habla de "equipos de e-commerce", "insights" y "gana mercados".
- **Falta el mensaje validado.** En la wiki (`messaging-posicionamiento`, `referencias`) ese mensaje es "otros testean por ti", y no aparece.
- **El hero no enseña nada.** Lo único que nos distingue, ver cómo un producto sube en el ranking día a día, no se ve en ninguna parte.
- **"Ver cómo funciona" lleva a Funcionalidades** (`page.tsx:101`), no a "Cómo funciona".

### B6. Onboarding

- **Ocho campos en un modal** (`onboarding-modal.tsx:104–205`), con scroll interno a 60 % de la altura:
  - a 390 px, las plataformas quedan fuera de vista dentro del modal;
  - "Continuar" queda deshabilitado sin decir qué falta (`:201`).
- **Promete "menos de 30 segundos"** (`es.json:118`) para 8 campos, uno de ellos el teléfono. La expectativa no se cumple.
- **El teléfono es texto libre, sin indicativo.** Como el país se elige antes, el wizard puede mostrar el prefijo. Guardarlo con "+57" cambia el formato del dato, aunque no la forma del payload, así que lo decide el dueño con Diego.
- **Las listas están escritas en el componente** (`:26–38`), no en `es.json`. Los nichos son valores que deben coincidir con la taxonomía del backend: en el wizard, las etiquetas pueden salir de `es.json` y los valores quedar iguales.
- **Es obligatorio por diseño** (CHANGE-099): no tiene X, ni Escape, ni clic afuera. El wizard debe conservar eso (sin "saltar") y el respaldo `dismissOnboarding()` cuando el backend falla (`:90–101`).
- **Se abre en `/home`, cuyo layout no es responsive:**
  - `pl-64` fijo y sidebar fijo (`app/(dashboard)/layout.tsx:44`);
  - a 390 px se ve el sidebar cortado detrás del modal;
  - al terminar, el usuario cae en un dashboard que no cabe en el celular.

  Está fuera de alcance, pero choca con el objetivo mobile-first: el embudo llevaría a gente desde el celular a un producto de escritorio.

### B7. Modo oscuro

- **Hoy no existe.** La decisión D-7 (`docs/redesign/03-spec-fase-2.md:10`) fue "claro primero": `.dark` está definido pero sin activar, y activarlo en toda la app es "requiere-revisor-técnico" (`:118`), porque rompe las pantallas no migradas.
- **Con `.dark` forzado**, la landing y el registro se ven bien porque usan tokens (capturas `oscuro-forzado-*`).
- **El brief pide claro y oscuro.** Opciones para la app:
  - **(a)** oscuro solo en landing y auth, siguiendo `prefers-color-scheme` con un contenedor propio, sin tocar D-7. El onboarding queda claro, como el dashboard;
  - **(b)** solo claro en la app hasta que cambie D-7.

  En los prototipos se muestran los dos modos para evaluar. Mi recomendación es **(a)**: se implementa con CSS, sin parpadeo al cargar. Pero toca `globals.css`, que es compartido, así que es riesgo "con cuidado".

---

## C. Assets

**Criterio:** capturas o mocks del producto real, luego CSS/SVG, y la IA solo donde nada de lo anterior sirve.

| # | Asset | Dónde va | Formato | Cómo se resuelve |
|---|---|---|---|---|
| 1 | Mock animado del tracker o del radar | Hero | HTML/CSS en la página | **Sin imagen.** Texto y SVG reales: nítido, cambia con el tema, se anima y no pesa en el LCP. Los datos van rotulados como "Datos de ejemplo" |
| 2 | Capturas del producto (dashboard, detalle con gráfico de rank, biblioteca de anuncios) | Secciones de funcionalidades | WebP/AVIF a 2×, 16:10 | Se capturan de la app con la API simulada. **No sirven datos de producción:** mostrarían tiendas y fotos de terceros |
| 3 | Fotos de producto para los mocks | Dentro de los mocks 1 y 2 (miniaturas) | 1:1, 1024 px → AVIF/WebP a 160 y 320 px | **Unframed (C1).** No se puede con CSS, no se pueden usar fotos de tiendas reales (son de terceros) y un banco de fotos tiene costo y licencia |
| 4 | Imagen Open Graph | Metadatos (vista previa en WhatsApp y redes) | 1200×630 PNG | HTML rasterizado con gstack: logo, titular y mock. No es IA |
| 5 | Atmósfera (radar, cuadrícula, grano) | Fondos del hero y del cierre | CSS/SVG | Degradados radiales, cuadrícula SVG y ruido. La IA solo si la dirección elegida pide profundidad fotográfica (C2, opcional) |
| 6 | Banderas, plataformas y nichos del onboarding | Wizard | Emoji o SVG, texto e íconos lucide | Sin IA. Las plataformas van como texto con ícono genérico, sin logos de marcas |

### C1. Fotos de producto para los mocks (8 imágenes)

**Proyecto de salida en Unframed:** `scout-landing-redesign`. Una generación por producto, 1:1.

**Costo:** según la guía de uso de Unframed, una imagen cuesta ~US$0,03, así que 8 imágenes son ~US$0,25 por ronda. Es un estimado; el gasto lo aprueba Daniel.

**Por qué:** son las miniaturas de los productos ficticios del mock. Tienen que parecer productos típicos de dropshipping en LATAM sin ser de ninguna tienda real.

**Estilo común** (pegar al inicio de cada prompt, o guardarlo como plantilla en la Library):

```
Studio e-commerce product photo, single product centered, seamless light gray background (#F5F5FA), soft diffused lighting, subtle contact shadow, three-quarter angle, sharp focus, true-to-life colors, no text, no logos, no brand names, no printed packaging, no hands, no people, square 1:1 composition, generous empty margin around the product.
```

**Producto de cada prompt** (va después del estilo):

| Archivo | Nicho | Prompt del producto |
|---|---|---|
| `producto-01` | Belleza & Cuidado | `A rose quartz facial roller next to a small heart-shaped gua sha stone.` |
| `producto-02` | Hogar & Cocina | `A compact portable blender bottle in matte white with a clear jar.` |
| `producto-03` | Mascotas | `A reusable pet hair remover roller in teal and light gray plastic.` |
| `producto-04` | Deportes & Fitness | `Three fabric resistance bands in muted sage, sand and charcoal, neatly stacked.` |
| `producto-05` | Tecnología & Gadgets | `A magnetic wireless car phone mount in matte black with a round charging pad.` |
| `producto-06` | Salud & Bienestar | `A U-shaped cordless neck massager in white and warm gray.` |
| `producto-07` | Bebés & Niños | `A silicone baby bib and a suction bowl set in sage green.` |
| `producto-08` | Moda & Accesorios | `A minimalist crossbody phone bag in caramel vegan leather with a thin strap.` |

**Después:** se copian a `public/landing/productos/` y se convierten a AVIF y WebP a 160 y 320 px, porque `images.unoptimized` impide que Next lo haga.

### C2. Textura de atmósfera (opcional, solo si la dirección la pide)

**Formato:** 16:9, 2560×1440, para el fondo del hero en oscuro. Recomiendo **no generarla** si la dirección elegida se resuelve con CSS, que es lo esperable.

```
Abstract dark navy background (#080A15) with a faint radar sweep of violet light (#5B3FE6), fine concentric circles and a subtle dot grid, cinematic, very low contrast, lots of negative space, no text, no interface elements, no logos, 16:9 composition.
```

---

## D. Decisiones antes de la fase 2

1. **Modo oscuro en la app:** (a) o (b) de B7. Los prototipos muestran los dos modos igual.
2. **¿Qué números reales hay?** Hoy solo los de los planes y la prueba gratis. Para un número de escala ("N tiendas seguidas a diario") hace falta una consulta fechada a la base, y eso es de Diego.
3. **Textos legales y canal de soporte.** Sin política de privacidad ni términos, el registro no puede decir "aceptas nuestros términos", y el onboarding no debería pedir el teléfono. Sin canal de soporte, ocultar "¿Olvidaste tu contraseña?" deja a la gente sin salida.
4. **El repo es público.** Todo lo que se commitee en `docs/redesign/` queda a la vista. La estrategia de calificación de leads se queda en el vault y aquí solo se enlaza.
5. **El dashboard no es responsive** (B6). Está fuera de alcance, pero condiciona el éxito del flujo en móvil.

## Capturas

- **Estado actual** ([`capturas/antes/`](./capturas/antes/)):
  - `landing-{1440,390}-*`: hero, funcionalidades, cómo funciona, CTA y página completa a 1440;
  - `login-{1440,390}-*`: ingresar y registro;
  - `onboarding-{1440,390}-*`: inicio y final del scroll del modal;
  - `oscuro-forzado-*`: referencia, no existe en producción.
- **Charm:** fuera del repo, por ser de un tercero en un repo público. Se entregaron como dos hojas de contacto, a 1440 y a 390.
