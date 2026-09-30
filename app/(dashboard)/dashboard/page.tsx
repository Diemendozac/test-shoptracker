import { redirect } from 'next/navigation'

// Resumen se unió a Hoy (/home) en CHANGE-136 (Fase 2e): sus tres indicadores eran de inventario y
// el mejor producto por tienda ahora vive en la ficha de cada tienda. Los links viejos llegan a Hoy.
export default function DashboardPage() {
  redirect('/home')
}
