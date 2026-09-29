# 01 · Diagnóstico de la Biblioteca de anuncios

**Fecha:** 2026-09-28 · **Base:** producción (`Diemendozac/test-shoptracker`, `main` en `3ef34c4`) · **Pantalla:** `/ads-library`.

## Cómo se hizo

- **Lectura de código:**
  - la pantalla (`app/(dashboard)/ads-library/page.tsx`);
  - la tarjeta (`components/tracker/product-ads.tsx`);
  - el job diario que trae los anuncios de Meta (`lib/jobs/sync-ads.ts` y `lib/scrapers/meta-ads.ts`, que viven en este repo);
  - el historial de `docs/CHANGES.md` (CHANGE-104, 105, 107, 111).
- **Captura de producción:** la que mandó el dueño el 2026-09-28, con la vista "Todos", 25.568 anuncios, los 12 primeros "Terminado" y el mismo creativo de STORE JAKE CO 5 veces.
- **Límites:**
  - desde este entorno no hay acceso a `facebook.com` ni a `getdropspy.com` (bloqueados por la política de red);
  - no tengo acceso al backend real (`Diemendozac/ShopTracker`) ni a la base de datos.

  Lo que depende del backend está marcado como **inferido** y trae la forma de confirmarlo.

---

## A. Los datos (lo más grave)

### A1. "Terminado" no quiere decir que el anuncio terminó

El job **nunca ve un anuncio terminado**:

- el scraper busca solo anuncios activos en Meta (`active_status: 'active'`, `meta-ads.ts:48`);
- todo lo que encuentra lo guarda como `active` (`meta-ads.ts:467`).

"Terminado" se **deduce por ausencia**. En cada corrida, `sync-ads` le manda al backend los anuncios de cada producto que encontró hoy (`sync-ads.ts:343`), y el backend marca como terminado el que antes estaba y hoy no vino (FIX-071, descrito en `sync-ads.ts:330–336`).

El problema es que **que no aparezca no prueba que terminó**. Hay cuatro motivos por los que un anuncio vivo no aparece:

| # | Motivo | Dónde | Efecto |
|---|---|---|---|
| 1 | **Solo se leen 50 anuncios por tienda** (100 si la tienda tiene más de 200 en Meta), y menos si Meta frena el scroll. Se bajó a 50 por el bloqueo que Meta le aplica a la IP de GitHub Actions (CHANGE-058/059). | `meta-ads.ts:570` (`maxPerPass = 50`) y `:598` | Si una tienda tiene 150 anuncios activos, cada día se ven ~50 y **los otros ~100 quedan "Terminado"**. Si ningún anuncio de un producto cae entre los leídos, el job avisa "este producto tiene 0 anuncios" (`sync-ads.ts:343`) y el backend marca **todos** los de ese producto como terminados. Además Meta cambia el orden a diario, así que el mismo anuncio **pasa de Activo a Terminado y vuelta** de un día para otro. |
| 2 | **El anuncio tiene que "matchear" con un producto** por el handle en su URL de destino. | `meta-ads.ts:485–497` (`matchAdToCandidate`) | Un anuncio que apunta a la home, a una colección, a una landing o a un acortador no matchea, y cuenta como ausente. |
| 3 | **No se visitan todas las tiendas.** El job corre a las 3 a. m. de Colombia (`sync-ads.yml:6`), pero en 165 min llega a ~322 de 438 tiendas (CHANGE-111). Además salta las tiendas con productos estancados 5+ días o con score < 20. | `sync-ads.ts:146–162` (`shouldScrapeStore`) | En esas tiendas nada se actualiza: un "Activo" puede tener semanas. Es el error contrario. |
| 4 | **El barrido de vencidos:** cuando termina el seguimiento de un producto (completed, expired, stale o **winner**), `reconcileStaleAds()` marca **todos** sus anuncios como terminados sin mirar Meta (FIX-072/074). | `sync-ads.ts:224–232` | La Biblioteca existe justamente para mostrar anuncios de productos que ya no están en seguimiento (CHANGE-107), así que **la mayoría de su contenido sale "Terminado" por diseño**, empezando por los productos que terminaron como ganadores. Según CHANGE-111, este barrido **nunca había corrido solo**: el job moría por timeout antes de llegar. Desde el 24-sep corre cada noche, y eso explica la ola de "Terminado" de estos días. |

**La prueba está en tu captura.** Un anuncio de STORE JAKE CO dice "Terminado · 255 d · desde 15 ene". `days_running` se calcula el día en que se lo ve (`meta-ads.ts:440–457`), y 15 ene + 255 días = **27 sept**. O sea, el job lo vio corriendo ayer y hoy dice "Terminado". Un anuncio que corrió 255 días rara vez muere de un día para otro. Mucho más probable es que STORE JAKE CO tenga más de 50 anuncios activos y este quedó fuera del tope (motivo 1).

**Respuesta a "¿eso no se actualiza a diario?":** el job sí corre todos los días, pero no revisa todos los anuncios:

- ~1 de cada 4 tiendas no se alcanza a visitar;
- las tiendas "estancadas" se saltan;
- de cada tienda visitada se leen como máximo 50–100 anuncios.

Encima, "terminado" se deduce de no haberlo visto, y eso falla por cualquiera de los cuatro motivos.

### A2. Anuncios que no coinciden con lo que muestra Meta al hacer clic

No lo pude reproducir: sin acceso a Meta ni a la base de datos. En el código hay tres causas concretas, de más a menos probable, y cada una se confirma con una consulta:

1. **Una "tarjeta" puede juntar varios anuncios.**
   - Cuando Meta no marca cada anuncio con `[role="article"]`, el scraper arma cada tarjeta subiendo hasta 6 niveles desde un elemento `_7jyh` hasta encontrar texto con un ID (`meta-ads.ts:342–352`).
   - El bucle sube al menos un nivel antes de mirar. Si el `_7jyh` ya era la tarjeta completa, el contenedor termina siendo **la fila** con varios anuncios.
   - En ese caso, el link es el primer ID de la fila, la imagen la más grande de la fila y la fecha la primera de la fila. Resultado: **miniatura de un anuncio y link a otro**.
   - Además, los otros anuncios de esa fila se descartan como repetidos (`seen`, `:371`): no se guardan y cuentan como ausentes, así que **también alimentan el "Terminado" falso de A1**.
2. **El link puede no ser del anuncio.**
   - Se acepta cualquier link que contenga `ads/library` e `id=` (`:361`), y eso incluye el link a la biblioteca del **anunciante** (`view_all_page_id=…`), que abre todos sus anuncios y no el anuncio concreto.
   - Además, el respaldo por texto `\b(\d{15,16})\b` (`:368`) puede tomar el ID de la página en lugar del del anuncio.
3. **Archivos de R2 que se pisan.**
   - La miniatura y el video se guardan con el ID del anuncio como nombre (`lib/storage/r2.ts:65–72`).
   - Si el link no trae `?id=N`, `extractAdId` (`meta-ads.ts:169–173`) usa los primeros 20 caracteres de la URL en base64, que son **iguales para todas** (`https://www.fac…`).
   - Todos esos anuncios comparten **un solo archivo**, y el último que se sube pisa al resto.

**Cómo confirmarlo (Diego, 1 minuto).** Tabla y columnas según `schema.sql` del respaldo del backend (`product_ads`); ajustar si cambiaron:

```sql
-- (a) links que no apuntan a un anuncio concreto
SELECT count(*) FROM product_ads WHERE ad_snapshot_url !~ '[?&]id=[0-9]+';
-- (b) links que abren la página del anunciante en vez del anuncio
SELECT count(*) FROM product_ads WHERE ad_snapshot_url LIKE '%view_all_page_id%';
-- (c) una misma miniatura usada por anuncios distintos (archivo pisado o tarjeta mezclada)
SELECT thumbnail_url, count(DISTINCT ad_snapshot_url) AS anuncios
FROM product_ads GROUP BY thumbnail_url
HAVING count(DISTINCT ad_snapshot_url) > 1 ORDER BY anuncios DESC LIMIT 20;
```

Si (a) o (b) dan más que 0, es la causa 2 o la 3. Si (c) devuelve filas con miniaturas en R2, es la causa 1 o la 3. Si las tres dan 0, hay que correr `lib/scrapers/test-scraper.ts` contra una tienda afectada y comparar a mano 5 anuncios.

### A3. El copy de los anuncios no se guarda

- `ScrapedAd` no tiene ningún campo de texto (`meta-ads.ts:13–26`).
- `pushAds` no lo manda (`sync-ads.ts:190–214`).
- `Ad.body_text` existe en los tipos del frontend (`app/(dashboard)/types/index.ts:199`), pero solo lo llena el mock de desarrollo.

Para mostrar el copy hay que tocar el scraper (sacar el texto principal), el envío y el backend (guardar y devolver `body_text`).

### A4. Los duplicados no se pueden agrupar

El mismo creativo usado en varios anuncios aparece como varias tarjetas: en tu captura, el creativo de STORE JAKE CO sale 5 veces en las 12 primeras.

- El archivo en R2 se nombra por ID de anuncio, así que dos anuncios con el mismo video tienen URLs distintas.
- Por eso el agrupado por URL de la sección de anuncios (`product-ads.tsx:423–425`) casi nunca junta nada desde que se espeja a R2.
- Para agrupar hace falta una huella del contenido: un hash de los bytes al subirlo a R2.

### A5. Nota sobre fechas

`first_seen` y `last_seen` son `DATE` en el esquema del respaldo del backend (`schema.sql:175–176`). La API casi seguro los manda como `YYYY-MM-DD`. Eso responde la pregunta que quedó abierta en la fase 2: el arreglo de fechas locales (CHANGE-117) **sí corregía un día corrido** en Latinoamérica.

---

## B. La pantalla: lo que no tiene sentido

| # | Qué | Dónde | Por qué importa |
|---|---|---|---|
| B1 | La vista por defecto es **"Todos"** y el orden es por duración, así que **la primera pantalla es toda gris** (12 de 12 "Terminado" en la captura). | `page.tsx:69` | Quien busca anuncios para modelar quiere ver primero los **activos que más tiempo llevan**. Los terminados son historia. |
| B2 | **No dice de qué producto es cada anuncio.** La API ya manda `productTitle`, `productImage`, `productNiche` y `country` (`types/index.ts:211–217`), pero la tarjeta no los muestra. | `page.tsx:184` (usa `AdSlide` tal cual) | Para saber qué se vende hay que abrir Meta. |
| B3 | **Duplicados:** 5 de 12 tarjetas son el mismo creativo. | A4 | Se pierde media pantalla. |
| B4 | **No hay búsqueda ni orden:** 25.568 anuncios con 3 filtros. No se puede buscar por producto, marca o texto, ni ordenar por "más recientes". | `page.tsx:75–80` | Encontrar algo concreto es imposible. |
| B5 | **Filtros:** "Status" y "Runtime" están en inglés, las 13 casillas de categoría ocupan medio panel y el panel mide ~190 px de alto. | `page.tsx:118–167` | Mucho espacio para poco control. |
| B6 | **Ver el video depende del mouse.** En escritorio, pasar el mouse abre un panel flotante con el video que tapa las tarjetas vecinas y se cierra al salir, y el clic abre Meta. En celular no hay hover: el toque abre Meta directo. | `AdSlide` (`product-ads.tsx:175–200`) y `FloatingVideoPanel` | El video ya está en R2 (`video_url_r2`). En celular no hay forma de verlo sin salir de Dropspy, y en ningún lado se ve con calma junto a su copy. |
| B7 | **No hay link al producto en Dropspy:** el ítem trae `candidateId` pero no `storeId`, y la página de detalle necesita `storeId`. | `types/index.ts:211` | No se puede pasar del anuncio al análisis del producto. |
| B8 | **Paginación de 24 con anterior/siguiente:** 1.066 páginas. | `page.tsx:196–220` | "Cargar más" conserva el contexto. |
| B9 | En "Todos", todos los "Terminado" van en **escala de grises**: la página se ve apagada y, peor, el gris dice "muerto" sobre anuncios que no sabemos si terminaron (A1). | `AdSlide` (`product-ads.tsx:194`) | Se suma a B1. |
| B10 | ~~"Terminado desde 15 ene"~~ y ~~"25568"~~ | — | **Ya corregidos** en CHANGE-120. |
| B11 | Quien no es Pro ve solo un texto plano. | `page.tsx:93–103` | Es el gancho de upgrade y no muestra nada de lo que se pierde. |
