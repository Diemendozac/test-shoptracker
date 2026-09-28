# Biblioteca de anuncios: diagnóstico, propuesta y spec

**Fecha:** 2026-09-28 · **Pantalla:** `/ads-library` · **Pedido:** Daniel, con una captura de producción.

El pedido tenía tres partes:

- anuncios que no coinciden con lo que abre Meta al hacer clic;
- anuncios activos que aparecen como terminados ("¿eso no se actualiza a diario?");
- mejorar la pantalla, con el copy de cada video.

## Qué leer

| Archivo | Para qué |
|---|---|
| [`01-diagnostico.md`](./01-diagnostico.md) | **Por qué pasa.** A: los datos (A1 "Terminado" falso, A2 link equivocado con 3 consultas SQL para Diego, A3 copy, A4 duplicados). B: la pantalla (B1–B11). |
| [`02-propuesta.md`](./02-propuesta.md) | Cómo se ve y por qué, qué se arregla en los datos, qué se descartó y las decisiones pendientes para Diego y Daniel. |
| [`03-spec.md`](./03-spec.md) | Un PR por fila (F0, L1, L1b, D1–D5, L2), con archivos, qué no cambia, riesgo, verificación y reversión. |
| [`preview.html`](./preview.html) | **Preview navegable.** Doble clic y listo: no necesita internet. Arriba alterna "Hoy (solo pantalla)" y "Con los arreglos de datos"; abajo, la barra "Vista" muestra el bloqueo por plan. |
| [`capturas/`](./capturas/) | La propuesta en escritorio (solo pantalla, con arreglos, modal, sin Pro) y en móvil. |

## En corto

1. **El job sí corre todos los días, pero no revisa todos los anuncios.**
   - Lee como máximo 50 por tienda.
   - No llega a todas las tiendas.
   - Al terminar el seguimiento de un producto, marca todos sus anuncios como terminados sin mirar Meta.
   - "Terminado" se deduce de **no haberlo visto**, y por eso hay activos marcados como terminados.
2. **El link equivocado** tiene tres causas posibles en el scraper. Tres consultas de un minuto dicen cuál es.
3. **El copy no se guarda hoy.** Hay que tocar scraper, job y backend. La tarjeta ya está lista para mostrarlo.
4. **La pantalla se puede mejorar ya, sin backend (L1):**
   - arranca en Activos;
   - muestra el producto;
   - dice "No visto" en lugar de "Terminado" cuando no sabemos;
   - filtros en español;
   - video en un modal;
   - bloqueo que vende.
5. **Arreglo de datos más urgente (D1):** que una revisión incompleta no marque nada como terminado. Es chico y ataca la causa principal.

## Qué no es real en el preview

Datos, imágenes y conteos. Los números de "con los arreglos" (activos, creativos, 412 de 438 tiendas) son ilustrativos, no una predicción.
