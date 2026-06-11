# Skills Instaladas — Cheatsheet

**Para Daniel.** Sin tecnicismos. Todo lo que necesitas saber para sacarle partido.

---

## Qué son las skills

Son guías de criterio que Claude lee automáticamente antes de generar código React o Redux. No tienes que activarlas manualmente para las tareas del día a día — Claude las consulta solo. Lo que sí puedes hacer es invocarlas explícitamente cuando quieras un análisis más riguroso.

---

## Skills instaladas

| Nombre | Qué hace |
|---|---|
| `redux-toolkit` | Patrones correctos de Redux: cómo estructurar slices, selectores, RTK Query. Evita anti-patrones. |
| `react-core-architecture` | Cómo estructurar proyectos React grandes. Separación de responsabilidades. |
| `react-core-state` | Cuándo usar useState vs useReducer vs Redux vs Context. |
| `react-core-concurrent` | React 19: Suspense, transiciones, uso de `use()`. |
| `react-syntax-hooks-basic` | useState, useEffect, useContext — sintaxis correcta. |
| `react-syntax-hooks-advanced` | useCallback, useMemo, useRef, custom hooks. |
| `react-syntax-jsx` | JSX: keys, fragmentos, condicionales, listas. |
| `react-syntax-components` | Componentes funcionales, composición, props typing. |
| `react-syntax-events` | Manejo de eventos, formularios, event delegation. |
| `react-syntax-context` | Context API: cuándo y cómo usarla correctamente. |
| `react-syntax-refs` | useRef para DOM y valores mutables. |
| `react-syntax-forms` | react-hook-form, validación, controlled vs uncontrolled. |
| `react-impl-testing` | Cómo testear componentes React (Testing Library). |
| `react-impl-performance` | Memoización, lazy loading, profiling. |
| `react-impl-styling` | Tailwind + shadcn: convenciones y patrones. |
| `react-impl-server-components` | Cuándo usar Server Component vs Client Component en Next.js. |
| `react-errors-boundaries` | Error boundaries: cómo y dónde ponerlos. |
| `react-errors-debugging` | Guía de diagnóstico de bugs React. |
| `react-errors-hooks` | Errores comunes de hooks y sus fixes. |
| `react-errors-hydration` | Errores de hidratación en Next.js App Router. |
| `react-agents-review` | Checklist de revisión de componentes (11 áreas). |
| `react-agents-project-scaffolder` | Estructura de proyectos React nuevos. |

---

## Las 3 frases que debes conocer

Estas son invocaciones manuales — úsalas cuando quieras un análisis explícito:

1. **"Revisa lo que hiciste con react-agents-review"**
   → Claude recorre el checklist completo (11 áreas) sobre el componente que acaba de escribir o modificar. Recibirás hallazgos clasificados por riesgo.

2. **"Sigue la skill redux-toolkit para esto"**
   → Claude aplica los patrones estándar de RTK: slice, selector, RTK Query — sin improvisar.

3. **"Usa react-errors-debugging para diagnosticar"**
   → Claude aplica el protocolo de diagnóstico antes de proponer un fix a un bug de renderizado o comportamiento extraño.

---

*Todo lo demás es automático.*
