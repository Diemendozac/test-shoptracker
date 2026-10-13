# Competidores (`/stores`): prototipo y spec

**Prototipo:** `preview/prototipo.html`. Es autocontenido y sin internet, con los tokens reales de `app/globals.css` y controles de estado (con datos, vacío, cargando, error, límite del plan), tema claro u oscuro y movimiento reducido. Los datos son de ejemplo y están rotulados. Sin las fuentes Inter y Outfit cae a la fuente del sistema.

## Spec (CHANGE-143)

**Objetivo.** Que Competidores deje de verse rota y deje de recomendar algo falso. En producción las tarjetas se montan unas sobre otras (hallazgos 1 y 2 del diagnóstico) y la pantalla le pide al usuario liberar el cupo de las tiendas que más lanzan (hallazgo 3). Importa ahora porque es una de las pantallas que se muestran al vender a mano en Colombia (plan de 30 días): una demo con tarjetas encimadas y un consejo contradictorio le quita credibilidad al producto.

**Qué cambia**
1. La tarjeta es una grilla de una columna `minmax(0,1fr)`: ningún texto la ensancha. Sin `opacity-90` en las tiendas quietas.
2. Cabecera: inicial de la tienda en un cuadro violeta suave, para ubicar cada tarjeta de un vistazo. El país va con su nombre completo (`countryName`, ya existente). El distintivo de estado solo aparece cuando no es "Activa".
3. Número de productos nuevos más grande (30 px). Las barras de 4 semanas tienen altura fija y el rótulo "últimas 4 semanas". Las semanas previas van en gris `--input` (3,5:1) y la actual en violeta.
4. "Su mejor producto ahora": foto de 44 px (mismo proxy de imágenes que "Nuevos por revisar") y título en 2 líneas en vez de 1. Si la señal no cabe, baja de línea sin partir el rótulo.
5. Pie separado: icono y "N anuncios activos" ("Sin anuncios activos" con 0), más "Ver tienda →". "Está quieta: considera liberar este cupo." pasa a su propia línea.
6. `storeHealth`: una tienda con productos nuevos en 7 días nunca queda como quieta (`bad`). Se muestra "Activa". Aplica en Competidores, Hoy y la ficha de tienda.
7. Estado de error: "No pudimos cargar tus tiendas" con "Reintentar", en lugar de "Todavía no sigues ninguna tienda". El contador "N de M" se oculta mientras carga o si falló.
8. Orden: las tiendas no quietas van por productos nuevos (de más a menos), sin poner las "Moderada" primero.

**Qué NO cambia**
- Backend, contratos (`services/*Api.ts`), slices de Redux, tipos y scoring. El puntaje de inactividad sigue igual en el backend; solo cambia cómo lo muestra el frontend cuando contradice los datos de la misma tarjeta.
- Los datos que se muestran y de dónde salen (tabla de verdad del diagnóstico).
- El menú ⋮ (editar, sincronizar solo admin, dejar de seguir), los modales, "Nuevos por revisar", la búsqueda, el límite del plan y el estado vacío.
- Las reglas de CLAUDE.md: sin estimaciones, sin "Rocket" ni "Declining", `computeSignal` igual.

**Archivos**

| Archivo | Riesgo | Por qué |
|---|---|---|
| `components/stores/store-card.tsx` | solo | Presentación de la tarjeta; solo la usa `/stores`. |
| `app/(dashboard)/stores/page.tsx` | solo | Estado de error, orden y contador de esta página. Usa `useGetStoresQuery` solo para `refetch` (la misma consulta que ya hace `useStores`). |
| `lib/today.ts` (`storeHealth`) | **con cuidado** | Lógica de presentación compartida por Hoy, Competidores y la ficha de tienda. El cambio es una sola condición; no toca el puntaje. |
| `docs/redesign/competidores/**` | — | Documentación, prototipo, capturas y herramienta de capturas. |

**Verificación** (resultado real en el PR y en CHANGE-143)
- `next build` compila; `tsc --noEmit` = 8 errores, todos en `lib/mock-data.ts`, igual que la línea base.
- `tools/capturas.mjs` a 390 y 1440: 0 tarjetas desbordadas (antes 6), sin scroll horizontal, sin `href="#"`, sin errores de consola (salvo el 500 forzado en el estado de error), y lo mismo con movimiento reducido.
- Teclado: nombre → ⋮ → mejor producto → Ver tienda, con foco visible.
- Hoy con los mismos datos: las tiendas que lanzan dejan de salir "Inactiva" y el aviso cuenta solo las quietas de verdad.

**Rollback.** Revertir el commit de CHANGE-143. No hay migraciones ni datos que deshacer.
