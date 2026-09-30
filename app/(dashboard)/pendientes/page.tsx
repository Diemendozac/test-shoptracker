import { redirect } from 'next/navigation'

// Pendientes pasó a ser el bloque "Nuevos por revisar" de Competidores (CHANGE-137, Fase 3a).
export default function PendientesPage() {
  redirect('/stores')
}
