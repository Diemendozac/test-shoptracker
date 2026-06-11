# SPEC-TEMPLATE — Plantilla para cambios en Dropspy

Usar para cualquier cambio mediano o grande antes de que Claude escriba una sola línea de código.
Cambios pequeños y obvios (fix de typo, ajuste de color) pueden omitir la plantilla — el criterio es: "¿Diego necesitaría saber por qué se hizo esto?"

> **Regla de auto-accept:** cambios con nivel de riesgo **"con cuidado"** o **"Diego"** nunca se ejecutan con auto-accept activado. Claude debe esperar aprobación explícita antes de cada edición.

---

## SPEC-NNN — [Título del cambio]

**Fecha:** YYYY-MM-DD
**Autor:** Daniel / Claude
**Nivel de riesgo:** solo | con cuidado | Diego

---

### Objetivo

_Una oración. Qué problema resuelve y por qué importa ahora._

---

### Qué cambia

_Lista concreta de comportamientos o código que será diferente después del cambio._

- [ ] ...
- [ ] ...

---

### Qué NO debe cambiar

_Lista de invariantes que deben sobrevivir el cambio. Incluir las reglas del CLAUDE.md que aplican._

- Las estimaciones siempre muestran `~`
- Los labels mapeados en `performance-badge.tsx` no cambian sin decisión explícita
- `signalConfidence` siempre llega al `ScoreRing`
- ...

---

### Archivos probablemente afectados

_Lista de rutas. Ayuda a Claude a saber qué leer antes de tocar._

- `components/...`
- `app/(dashboard)/...`
- `lib/...`

---

### Nivel de riesgo

**Solo** — frontend puro, sin tocar scoring, DB ni arquitectura. Claude puede ejecutar directamente tras aprobación del plan.

**Con cuidado** — afecta lógica compartida, tipos, o tiene dependencias no obvias. Claude debe listar cada archivo antes de editarlo y esperar confirmación.

**Diego** — toca scoring (`TrackingService`, fórmulas, labels del backend), esquema de DB, contrato del API, o arquitectura. **No implementar sin que Diego lo revise.** Claude redacta la propuesta técnica; Diego decide.

---

### Cómo verifico que funcionó

_Pasos concretos y observables. No "parece que funciona" — criterio de aceptación real._

1. ...
2. `npx next build` sin errores
3. ...

---

### Rollback

_Qué hacer si algo sale mal._

- `git revert <hash>` y push
- Si tocó backend: redeploy desde rama anterior en Easypanel
- ...
