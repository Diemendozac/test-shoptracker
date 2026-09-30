import { redirect } from 'next/navigation'

// "Mis testeos" pasó a ser el alcance "Mis tiendas" del Radar (CHANGE-134, Fase 2c): la misma
// fila y los mismos filtros que el pool. La ficha de cada producto (/tracker/[id]) no cambia.
// Los componentes que usaba esta pantalla (tracker-table, hero-signal-card, shooting-stars,
// kpi-cards) quedan sin uso hasta decidir en la pantalla Hoy (2e) si alguno vuelve.
export default function TrackerPage() {
  redirect('/pool?alcance=mis-tiendas')
}
