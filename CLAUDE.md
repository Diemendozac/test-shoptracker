# CLAUDE.md — Dropspy Frontend

## Contexto del proyecto

**Dropspy** es un SaaS de inteligencia competitiva para dropshippers avanzados. Este es el frontend Next.js que consume la API del backend (`Diemendozac/ShopTracker`).

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Redux Toolkit · pnpm

**Deploy:** Vercel — auto-deploy desde rama `main`.

**Backend:** `Diemendozac/ShopTracker` (Spring Boot). La API corre en Easypanel. URL configurada en variables de entorno de Vercel.

---

## Estructura del proyecto

```
app/
├── (auth)/              ← Login, registro
├── (dashboard)/         ← Todo lo que requiere autenticación
│   ├── dashboard/       ← Vista principal: store-cards + overview
│   ├── tracker/         ← Lista de candidatos activos + detalle por candidato
│   ├── pool/            ← Winners del pool global (plan básico+)
│   ├── stores/          ← Gestión de tiendas monitoreadas
│   ├── pendientes/      ← Candidatos pendientes de activar/descartar
│   ├── settings/        ← Configuración de usuario
│   ├── services/        ← Llamadas a la API (dashboardApi, storeApi, etc.)
│   └── types/           ← Tipos TypeScript compartidos del dashboard
├── api/                 ← Route handlers de Next.js (proxy, auth, etc.)
└── globals.css

components/
├── dashboard/           ← Componentes de la vista principal
│   ├── store-card.tsx          ← Tarjeta por tienda con top candidato
│   ├── score-ring.tsx          ← Anillo SVG de score (verde=confirmado, amarillo=débil)
│   ├── performance-badge.tsx   ← Badge Rising/Watching/Declining/Stable
│   └── stats-card.tsx          ← KPI cards del dashboard
├── tracker/             ← Componentes del tracker de candidatos
│   ├── tracker-table.tsx       ← Tabla principal de candidatos con estimaciones
│   ├── winner-card.tsx         ← Winner de la semana por tienda
│   ├── winner-podium.tsx       ← Top 5 productos que llegaron a rank #1
│   ├── race-track.tsx          ← Visualización tipo "carrera" de posiciones
│   ├── score-chart.tsx         ← Histórico del score (Recharts)
│   ├── rank-chart.tsx          ← Histórico del rank (Recharts)
│   ├── phase-badge.tsx         ← Badge Despegue/Meseta/Caída/Rebote
│   ├── pool-winners.tsx        ← Feed del pool global
│   ├── kpi-cards.tsx           ← Cards de métricas del tracker
│   └── shooting-stars.tsx      ← Animación decorativa
└── layout/              ← Sidebar, header, nav

store/                   ← Redux store
└── currencySlice.ts     ← Estado global de moneda preferida

lib/
├── types.ts             ← Tipos globales (Store, Candidate, etc.)
├── utils.ts             ← fmtCompact(), fmtUnits(), formatCurrency(), etc.
└── api.ts               ← Cliente axios base
```

---

## Convenciones de código

- **Estimaciones siempre con `~`:** nunca mostrar un número de ventas o ingresos estimados sin prefijo `~`. El backend los llama `estUnitsDayLow` / `estRevDayLow` — son estimaciones conservadoras, no cifras exactas.
- **Labels de performance:** `Rocket` del backend se mapea a `Rising` en la UI. El usuario nunca ve "Rocket" ni "Winner" — siempre "Señal más fuerte" o el badge correspondiente.
- **`signalConfidence`:** siempre pasar al `ScoreRing`. Un score alto con baja confianza debe verse mayormente amarillo, no verde.
- **Moneda:** usar siempre `formatCurrency(amount, currency)` de `lib/utils.ts`. No hardcodear `$`.
- **Null safety:** la API puede devolver `null` en casi cualquier campo numérico. Usar `?? 0` o `?? '—'` según el contexto, nunca asumir que hay un valor.

---

## Protocolo de cierre de sesión

**Regla obligatoria:** Toda sesión termina con `git add` + `git commit` + `git push` de lo trabajado antes de cerrar. El clon vive en `/tmp/scout-frontend` y lo no pusheado se pierde al reiniciar el sistema.

---

## Regla de documentación de cambios

Cuando se complete cualquier cambio importante (feature nueva, fix de bug, cambio de UI significativo):

**Agregar una entrada en `docs/CHANGES.md`** con este formato:

```
### CHANGE-NNN — Título descriptivo
**Fecha:** YYYY-MM-DD  ← OBLIGATORIO
**Tipo:** feature | fix | refactor | ui

**Qué cambió:** Descripción de qué hace el cambio y por qué se hizo.
**Archivos modificados:**
- `ruta/al/archivo.tsx` — qué cambió y por qué
**Relacionado con backend:** FIX-NNN (si aplica)
**Wiki actualizado:** Sí (páginas: ...) | No aplica
```

La entrada debe ser suficientemente clara para que Diego pueda entender el cambio sin haber estado en la conversación. Incluir el "por qué" es más importante que el "qué" — el código dice el qué.

---

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=<URL del backend en Easypanel>
```

---

## Notas de arquitectura

- **Redux solo para estado global cross-page:** actualmente solo `currencySlice` (moneda preferida). No agregar Redux para estado local de componentes.
- **Server vs Client components:** usar Server Components por defecto. Solo `'use client'` cuando se necesite estado, hooks de React, o event handlers.
- **Autenticación:** JWT guardado en localStorage. `lib/api.ts` lo inyecta en cada request. El backend valida con `JwtUtil`.

---

## Skills instaladas — reglas de uso

Las skills en `.claude/skills/` son guías de criterio para Claude. Las siguientes reglas son obligatorias:

### 1. Estado global → `redux-toolkit`
Antes de crear o modificar estado global (tiendas, productos monitoreados, sesión, plan del usuario) → consultar la skill `redux-toolkit`.

**Prohibido:**
- `createStore` manual o reducers con `switch/case`
- Thunks manuales repetitivos cuando RTK Query resuelve el caso
- Lógica inline en `useSelector` (usar selectores memoizados)
- Slices para estado de UI local (modales, tabs, acordeones) → usar `useState`

### 2. Componentes nuevos o cambios medianos/grandes → `react-agents-review`
Antes de dar por terminado cualquier componente nuevo o cambio de mediano o gran alcance, ejecutar el checklist de `react-agents-review` y reportar el resultado en el resumen final de la respuesta.

### 3. Bugs de renderizado, hooks o hidratación → `react-errors/`
Antes de improvisar un fix, consultar la skill correspondiente:
- Problema en hook → `react-errors-hooks`
- Error de hidratación → `react-errors-hydration`
- Error boundary → `react-errors-boundaries`
- Debug general → `react-errors-debugging`

### 4. Componentes con datos del servidor → `react-impl-server-components`
Para cualquier componente que lea datos del servidor, consultar `react-impl-server-components` para decidir si debe ser Server Component o Client Component antes de escribir código.

### 5. Las skills NO tienen prioridad sobre las reglas de producto
Las reglas de labels, estimaciones con `~`, `signalConfidence`, moneda y null safety de este CLAUDE.md siempre ganan sobre cualquier recomendación de las skills. Si una skill sugiere algo que contradice el producto, gana el producto y se reporta el conflicto.

### 6. Migraciones de arquitectura → flagear a Diego, NO implementar
Si una skill recomienda introducir una nueva arquitectura que no existe en el proyecto (ej: TanStack Query donde ya existe RTK Query, nuevo sistema de routing) → NO implementar. Especificar la recomendación y flagear a Diego para que decida.
