# Propuesta para Diego: el puntaje de inactividad castiga a las tiendas que lanzan

**Nivel:** requiere-revisor-técnico (scoring). **No implementado.** · **Fecha:** 2026-10-13 · **Código:** `StoreSyncService.updateInactivityScore` (`origin/master` `df2a6d4`, líneas 283-314)

## Qué pasa

```
recencia  = 0 si el producto activo más nuevo tiene ≤ 7 días (sube hasta 40 a los 90 días)
noRising  = % de productos activos cuyo performanceLabel no es "Rising"
puntaje   = 100 − min(puntajeMedio / 60, 1) × 100
score     = 0,40 × recencia + 0,35 × noRising × 100 + 0,25 × puntaje
tier      = ACTIVA ≤ 25 < MODERADA ≤ 50 < INACTIVA ≤ 75 < ZOMBIE
```

Un producto recién lanzado no puede ser "Rising" en sus primeros días: su puntaje máximo el día 1 ronda 30 (CLAUDE.md del frontend, "labels como bandas"). Entonces una tienda que lanza 29 productos en una semana tiene casi todo "no Rising" y un puntaje medio bajo: 0 + ~35 + ~20 = **~55 → INACTIVA**. Cuanto más lanza, más "inactiva" sale.

En producción (2026-10-13) le pasó a dos tiendas con 29 y 28 productos nuevos en 7 días. La app les ponía "Inactiva · considera liberar este cupo".

## Qué hizo el frontend mientras tanto (CHANGE-143)

`lib/today.ts → storeHealth`: si el tier es INACTIVA o ZOMBIE y la tienda tiene productos nuevos en los últimos 7 días, se muestra "Activa" y no cuenta como quieta. Es un parche de presentación; el número del backend no cambia.

## Opciones (Diego decide)

1. **Excluir de `noRising` y del puntaje medio a los productos con menos de N días** (por ejemplo, 7). Son demasiado nuevos para juzgarlos, igual que la regla de señal del frontend, que los llama "Nuevo" hasta el día 2 y les baja la confianza hasta el día 9.
2. **Que la recencia mande:** si hubo lanzamientos en 7 días, el tier no puede pasar de MODERADA.
3. **Separar las dos preguntas:** "¿lanza?" (recencia y cantidad) y "¿le funciona lo que lanza?" (Rising y puntaje) en dos campos. Hoy se mezclan en un solo número y la UI no puede decir "lanza mucho, pero nada despega", que sí es información útil.

Recomendación: la 1 es la más chica y arregla el error. La 3 es la que más sirve al usuario.

## Límite relacionado

`findNewestActiveDateByStore`, igual que `GET /dashboard/tracker`, mira solo candidatos `active`. Para un usuario sin detección automática, los productos nuevos quedan pendientes y no cuentan como lanzamiento, así que su tienda también puede salir "quieta" sin estarlo.
