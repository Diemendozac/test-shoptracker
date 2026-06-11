# ROADMAP — Dropspy Frontend

Registro de iniciativas planificadas, diferidas y completadas. El estado más reciente de cada entrada es el canónico.

---

## Ahora

_No hay ítems activos en este momento._

---

## Próximo

_No hay ítems encolados en este momento._

---

## Diferido

### ROADMAP-001 — Orquestación de agentes (subagents y agent teams)

**Estado: DIFERIDO** · Registrado: 2026-06-11 · Re-evaluar cuando: se contrate un plan de Claude con límites de tokens holgados (Max o superior), o los agent teams salgan de fase experimental — lo que ocurra primero.

**Contexto.** El flujo actual del proyecto ya es orquestación manual: Daniel coordina sesiones secuenciales (modelo razonador para specs y auditorías, modelo ejecutor para implementación) usando el framework instalado (CLAUDE.md + 22 skills + SPEC-TEMPLATE + DECISIONS). Los agent teams de Claude Code automatizan esa coordinación: un líder + teammates paralelos con lista de tareas compartida y mensajería entre agentes.

**Por qué se difiere ahora.**
1. Feature experimental, deshabilitada por defecto (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`), con limitaciones conocidas (sin resume de teammates, estados de tareas que se traban, cleanup inconsistente).
2. El consumo de tokens escala linealmente por teammate (cada uno es una instancia completa con su propio contexto) — incompatible con los límites del plan actual.
3. Riesgo operativo: los teammates heredan el modo de permisos del líder; combinado con sesiones en auto-accept, multiplica el riesgo de cambios no revisados. Requiere disciplina de permisos que aún estamos consolidando.
4. La implementación paralela exige particionar el codebase por archivos para evitar sobreescrituras — criterio que corresponde a Diego.

**Activos que ya están listos (no se pierde trabajo al esperar).** Los teammates cargan automáticamente CLAUDE.md y las skills de `.claude/` del proyecto, pero NO heredan historia de conversación. Todo el gobierno instalado (reglas de producto, regresiones prohibidas, estándar redux-toolkit, protocolo de Diego) se inyecta solo en cada futuro teammate. El framework actual ES el prerequisito de los teams.

**Plan de adopción escalonado al activarse:**

- **Fase A — Subagents (puede adelantarse sin esperar el plan nuevo):** usar subagents dentro de sesiones normales para verificaciones enfocadas que solo reportan resultados (menor costo, sin coordinación). Casos: verificar un build mientras se edita, investigar una librería, validar un fix contra los casos de la auditoría.
- **Fase B — Teams de solo lectura:** primera activación del flag exclusivamente para revisión y diagnóstico, nunca implementación. Casos candidatos ya identificados: (1) re-auditoría del Performance Score con 3 revisores adversariales con hipótesis en competencia — alineado con la filosofía de triangulación del producto; (2) revisión de PRs grandes de Diego con 3 lentes: seguridad, performance, coherencia con CLAUDE.md. Regla: plan approval obligatorio y sin auto-accept.
- **Fase C — Teams de implementación paralela:** solo con partición de archivos definida por Diego y hooks de calidad (TaskCompleted) configurados. No antes.

**Precondiciones para mover de DIFERIDO a PRÓXIMO (todas):**
- [ ] Plan de Claude con margen de tokens (Max o equivalente)
- [ ] Agent teams fuera de experimental, o estabilidad validada por la comunidad
- [ ] Regla de permisos del SPEC-TEMPLATE consolidada en la práctica (≥1 mes sin incidentes de auto-accept)
- [ ] OK de Diego para la fase B (activar el flag toca settings del entorno)