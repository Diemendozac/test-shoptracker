# 02 · Propuesta: Biblioteca de anuncios

**Fecha:** 2026-09-28 · **Pantalla:** `/ads-library` · **Diagnóstico:** [`01-diagnostico.md`](./01-diagnostico.md)

**Preview:** [`preview.html`](./preview.html). Se abre con doble clic y no necesita internet.

- Arriba se alterna entre **"Hoy (solo pantalla)"**, lo que se puede hacer ya, y **"Con los arreglos de datos"**, lo que suma cuando Diego y el scraper hagan su parte.
- La barra "Vista" de abajo muestra el bloqueo para quien no es Pro.
- Capturas en [`capturas/`](./capturas/).

---

## La idea en una línea

**Primero que los datos digan la verdad, después que se vea bien.**

Una tarjeta más linda que dice "Terminado" sobre un anuncio que lleva 255 días corriendo hace la mentira más creíble. Por eso la propuesta tiene dos capas, y la pantalla nueva **deja de afirmar lo que los datos no saben** desde el primer día, aunque el arreglo de datos tarde.

| Entrega | Qué resuelve | Quién | ¿Necesita backend? |
|---|---|---|---|
| **L1 · Pantalla** | Arranca en Activos, tarjeta con producto, estado en palabras honestas, filtros en español, video en un modal, bloqueo que vende, móvil (B1, B2, B5, B6, B8, B9, B11) | Frontend | No |
| **D1–D3 · Datos confiables** | "Terminado" solo cuando es cierto (A1), link y miniatura del mismo anuncio (A2) | Job de este repo + Diego | Sí |
| **L2 + D4 · Lo que falta en la API** | Búsqueda, orden, copy de cada anuncio, duplicados agrupados, link al producto (A3, A4, B3, B4, B7) | Diego + frontend | Sí |
| **D5 · Cobertura** | Que el job alcance a revisar lo que importa | Decisión de negocio | Sí |

---

## 1. Qué ve el usuario (L1, sin tocar backend)

### 1.1 Arranca en "Activos", ordenado por tiempo corriendo (B1)

Quien entra a la Biblioteca busca anuncios que **siguen corriendo hace mucho**: esa es la señal de que venden. Hoy la vista por defecto es "Todos" y la primera pantalla sale gris.

Con "Activos" por defecto, lo primero que se ve son los que llevan más días. "Todos" queda a un clic.

### 1.2 La tarjeta

De arriba hacia abajo:

1. **Creativo en 4:5** con ▶ al centro. Dos chips arriba:
   - **días corriendo**, en verde desde 30 días, como en la tarjeta del detalle (S3);
   - **"×5 anuncios"** cuando el mismo creativo corre en varios anuncios (L2).
2. **Estado** en una línea (ver 1.3).
3. **Anunciante y país.**
4. **Copy del anuncio** en 3 líneas (D4). Es lo que pediste: se lee el gancho sin abrir el video.
5. **Producto:** foto y título en 2 líneas. La API ya los manda (`productTitle`, `productImage`) y hoy no se muestran (B2). Con L2 se vuelve link al análisis del producto en Dropspy.
6. **"Ver en Meta".**

**¿Por qué 4:5 y no 9:16 como en el detalle?**

- En 1440 × 900, con 5 columnas, una tarjeta 9:16 mide ~575 px y no entra entera en la primera pantalla. En 4:5 mide ~465 px y la primera fila se ve completa.
- **El costo:** se recorta arriba y abajo del video vertical, donde a veces va el texto del gancho. Lo compensan el copy en texto (D4) y el modal, que muestra el video entero.
- Si Daniel prefiere ver el creativo completo en la grilla, volver a 9:16 es cambiar una clase.
- El detalle del producto (S3) sigue en 9:16: ahí hay pocos anuncios de un solo producto y el tamaño no es problema.

### 1.3 El estado, en palabras que no mienten (A1, B9)

Con los datos de hoy, "inactivo" solo quiere decir **"no apareció en la última revisión"** (motivos 1, 2 y 4 del diagnóstico). La pantalla tiene que decir eso y no "Terminado".

**L1, con los datos de hoy:**

| La API dice | Hoy se ve | L1 muestra | Por qué |
|---|---|---|---|
| `active` y visto hace ≤ 2 días | ● Activo | **● Activo** · desde 15 ene | — |
| `active` y visto hace > 2 días | ● Activo | **● Activo** · visto hace 9 d (ámbar, con tooltip "Su tienda no se revisó desde el 19 sept") | Motivo 3: la tienda no se visitó. El "Activo" puede ser viejo. |
| `inactive` | Terminado, en gris | **○ No visto** · desde el 27 sept (ámbar, **sin gris**, con tooltip) | Puede haber terminado, o puede que no se haya revisado. No lo sabemos. |

**Con D2 (backend con tres estados):**

| Estado | Se ve | Cuándo |
|---|---|---|
| Activo | **● Activo** · desde 15 ene | Se vio en una revisión de los últimos 2 días. |
| Sin verificar | **○ Sin verificar** · visto el 2 sept (ámbar) | Nadie lo revisó hace rato: tienda no visitada, producto fuera de seguimiento. |
| Terminado | **● Terminado** · el 19 jul (gris) | No apareció en **dos revisiones completas seguidas** de su tienda. |

**El gris queda solo para "Terminado" confirmado.** Eso arregla también B9: la página deja de verse apagada.

El filtro de estado usa las mismas palabras:

- en L1: **Activos · No vistos · Todos**;
- con D2: **Activos · Sin verificar · Terminados · Todos**.

### 1.4 Filtros (B4, B5)

Una sola barra, pegada arriba al hacer scroll en escritorio:

- **Estado** y **Duración** (Todas · 7+ d · 30+ d · 90+ d) como botones segmentados, en español.
- **Categoría** en un desplegable con las 13 casillas. El botón muestra cuántas hay elegidas y, debajo, cada una queda como chip con ×. Hoy las 13 casillas ocupan medio panel.
- **País** en un desplegable. La API ya acepta `country` y la pantalla no lo usa.
- **"Limpiar filtros".**
- Con L2 se suman **búsqueda** (producto, marca o texto del anuncio) y **orden** (más tiempo corriendo · más recientes · más copias del creativo).

### 1.5 El video en un modal (B6)

- **Clic en el creativo:** abre un modal con el video completo (con controles y sonido) a la izquierda. A la derecha van el estado, el anunciante, días · copias · país, el copy completo, el producto, "Ver en Meta" y, con L2, "Ver producto en Dropspy".
- **En escritorio, pasar el mouse** reproduce el video sin sonido dentro de la misma tarjeta. Reemplaza, solo en esta pantalla, el panel flotante que hoy tapa las tarjetas vecinas. El panel se sigue usando donde está.
- **En celular** el toque abre el mismo modal. Hoy abre Meta directo.
- Si el anuncio no tiene video en R2, el modal muestra la miniatura y "Ver en Meta".

### 1.6 Encabezado y "Cargar más" (B8)

- **Encabezado:** "Biblioteca de anuncios", una línea de para qué sirve y dos cifras: **"25.568 anuncios · 6.214 activos"**. En L1 salen de dos pedidos a la API que ya existe; en L2, de un solo campo `counts`.
- **Línea de resultados:** "6.214 anuncios activos · ordenados por tiempo corriendo". Con D1 se suma "Última revisión en Meta: hoy 3:12 a. m. · 412 de 438 tiendas", **para que la cobertura sea visible y no un secreto**.
- **"Cargar 24 más"** en lugar de "Página 1 de 1.066". No se pierde lo que ya se vio.

### 1.7 Quien no es Pro (B11)

Hoy ve un texto plano. La propuesta:

- tarjetas vacías (esqueletos) detrás;
- una tarjeta al frente que dice qué trae la Biblioteca ("25.568 anuncios de Meta de productos que Dropspy siguió, con cuánto llevan corriendo y el producto que venden") y un botón **"Ver planes"** a `/pricing`.

**Nunca anuncios reales difuminados:** el blur se saca con el inspector del navegador y regala lo que se vende.

El bloqueo también tiene que respetar la barra "Vista" del admin. Hoy depende solo de `data.isPro`, que viene del backend, así que el admin no puede ver el bloqueo.

### 1.8 Móvil

- 2 columnas.
- La barra de filtros deja de ser fija. Quedan a la vista la búsqueda (L2) y el estado; orden, duración, categoría y país se pliegan en un botón **"Filtros"** con contador.
- La primera tarjeta empieza en la primera pantalla. Hoy los filtros la ocupan entera.
- El modal ocupa el ancho, con el video arriba y el copy debajo.

---

## 2. Qué se arregla en los datos

Detalle, archivos y riesgos en [`03-spec.md`](./03-spec.md).

### D1 · No deducir "terminado" de una revisión incompleta

- El scraper ya sabe cuántos anuncios dice Meta que tiene la tienda (`totalAdsOnMeta`) y cuántos leyó.
- Si leyó menos, el job avisa "revisión incompleta" y el backend **solo actualiza lo que vio**: no marca nada como terminado.
- **Es el arreglo más barato y el que más "Activos marcados como Terminado" corrige**: ataca el motivo 1, incluido el caso de "0 anuncios" que borra un producto entero.

### D2 · Tres estados en lugar de dos

- **Terminado** exige dos revisiones completas seguidas sin verlo.
- El barrido de vencidos deja de marcar "terminado" (motivo 4): lo que ya no se revisa pasa a **"Sin verificar"**.

**La consecuencia, sin maquillaje:** la mayoría de la Biblioteca son productos que ya no están en seguimiento, y esos anuncios **van a quedar "Sin verificar"**. Es la verdad: hoy nadie los revisa. Para que vuelvan a tener un estado confiable hace falta D5.

### D3 · Link y miniatura del mismo anuncio

Arregla A2:

- solo se aceptan links de un anuncio concreto (`?id=N`);
- nunca el de la página del anunciante;
- una tarjeta con dos IDs se descarta;
- el nombre del archivo en R2 deja de poder repetirse;
- el archivo se nombra por una huella del contenido, que es lo que permite agrupar duplicados.

### D4 · Guardar el copy

El scraper extrae el texto principal del anuncio, el job lo manda y el backend lo guarda y lo devuelve en `body_text`. **La tarjeta ya sabe mostrarlo**: `AdSlide` pinta `body_text` si viene.

### D5 · Cobertura: el problema de fondo

**El job no puede leer todo todos los días.** Meta frena la IP de GitHub Actions, hay 438 tiendas en 165 minutos y un tope de 50 anuncios por tienda. D1 y D2 hacen que la pantalla **no mienta** sobre lo que no se vio, pero no hacen que se vea más.

Opciones, de más barata a más cara:

| Opción | Qué es | Pro | Contra |
|---|---|---|---|
| **a. Re-verificar por ID** (recomendada para empezar) | Un paso aparte abre la página de cada anuncio en Meta (`/ads/library/?id=N`) y lee si está activo. Empieza por los ≥ 30 días y los que hace más tiempo no se verifican, con un cupo diario (p. ej. 300, ~25 min). | Apunta justo al contenido que vale de la Biblioteca y es barato. | Hay que probar primero que esa página muestra el estado y que Meta no la bloquea desde GitHub Actions. |
| b. Partir el job | El pool en un job aparte con su propio presupuesto (la decisión abierta de FIX-068). | Llega a las ~110 tiendas que hoy quedan afuera. | No cambia el tope de 50. |
| c. Proxy residencial | Scrapear desde IPs que Meta no frena. | Permite subir el tope. | Costo mensual y otro proveedor. |
| d. VPS propio | Sacar el job de GitHub Actions. | Sin límite de 180 min. | Hay que mantener un servidor. |

---

## 3. Lo que suma la API (L2)

| Campo o parámetro | Para qué |
|---|---|
| `q` | Búsqueda por anunciante, producto o copy. |
| `sort` = `days` · `recent` · `copies` | Ordenar. Hoy el orden está fijo. |
| `storeId` en cada ítem | Link "Ver producto en Dropspy": la página de detalle lo necesita (`tracker/[candidateId]/page.tsx:276`). |
| `counts: { total, active }` | Las dos cifras del encabezado en un solo pedido. |
| `lastSync: { at, storesComplete, storesTotal }` | "Última revisión en Meta: hoy 3:12 a. m. · 412 de 438 tiendas". |
| `creativeHash` y `copies`, con agrupado opcional | Una tarjeta por creativo con "×5 anuncios". El conteo pasa a ser "4.127 creativos activos (9.418 anuncios)". |
| `body_text` | El copy (D4). |

---

## 4. Qué descarté y por qué

1. **Agrupar duplicados en el frontend por anunciante y fecha.** Los testeos suelen lanzar varios creativos distintos el mismo día, así que se juntarían creativos que no son el mismo y se esconderían. Sin huella del contenido (D3) no se puede hacer bien.
2. **Subir el tope de 50 a 200 sin cambiar de IP.** CHANGE-058 ya lo probó con 130: Meta frenó a 17–40 anuncios en 4 de 8 tiendas. Más tope dio menos datos.
3. **Esconder los "No vistos".** Serían más de la mitad de la Biblioteca, y muchos siguen corriendo. Mejor mostrarlos con la palabra correcta.
4. **Seguir diciendo "Terminado" mientras se arreglan los datos.** Es lo que generó la desconfianza. "No visto" es igual de corto y es cierto.
5. **Scroll infinito.** "Cargar más" deja llegar al pie de página y es predecible. Con RTK Query (`infiniteQuery`, ya disponible en la versión instalada) cuesta lo mismo.
6. **Mantener el panel flotante del hover en esta pantalla.** Tapa tarjetas vecinas y no existe en celular.

---

## 5. Lo que necesito de ustedes

**Diego (backend):**

1. Correr las 3 consultas de A2 (1 minuto) para saber cuál de las tres causas del link equivocado es la real.
2. OK al contrato de D1: un campo `complete` en `POST /internal/webhook/ads`. Si no viene, se asume `true`, que es el comportamiento de hoy, así que nada se rompe al desplegar.
3. OK al modelo de estados de D2 y a cómo guardarlo.
4. Los campos de L2, y dos datos:
   - si `/dashboard/ads-library` devuelve `total` a quien no es Pro;
   - el formato de `country` (`'CO'` o `'Colombia'`).

**Daniel (producto):**

1. **"No visto" también en el detalle del producto.** Recomiendo que sí, en el mismo PR que L1, para no tener dos verdades sobre el mismo anuncio. Cambia lo que el usuario interpreta, así que necesita tu OK.
2. **4:5 en la grilla** o creativo completo en 9:16.
3. **D5:** si se prueba la re-verificación por ID y, si no alcanza, qué presupuesto hay para b, c o d.
