# Sync Ads — Infraestructura

## Por qué GitHub Actions

El sync de Meta Ad Library requiere Playwright (Chromium headless), acceso a R2, y llamadas al backend. Las alternativas consideradas:

| Opción | Por qué no |
|---|---|
| Vercel Cron | Límite de 10s en free, sin soporte Playwright |
| n8n | No puede correr Playwright nativo |
| Easypanel cron | No tiene Java instalado y mezcla con el backend |
| Servicio dedicado | Overhead de infra para un job diario de 15-20 min |

GitHub Actions da 2000 min/mes gratis en repos públicos y privados. El sync usa ~20-30 min/día = ~600-900 min/mes — dentro del límite.

## Cuándo migrar a servicio dedicado

Migrar cuando ocurra cualquiera de estos:

- El sync supera **45 minutos** de forma regular (GitHub Actions timeout es 60 min)
- Hay más de **50 tiendas Pro** activas
- Se necesita sync más de una vez por día
- Se requiere reintentos automáticos por tienda fallida

Alternativa recomendada cuando llegue ese momento: worker en Fly.io (256MB RAM, cron nativo, Playwright funciona).

## Configurar los 7 secrets en GitHub

Ir a: **github.com/Diemendozac/test-shoptracker/settings/secrets/actions**

Agregar cada uno con "New repository secret":

| Secret | Descripción |
|---|---|
| `R2_ACCOUNT_ID` | ID de cuenta Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Access Key ID del bucket R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key del bucket R2 |
| `R2_BUCKET_NAME` | Nombre del bucket (ej: `dropspy-ads`) |
| `R2_PUBLIC_URL` | URL pública del bucket (ej: `https://pub-xxx.r2.dev`) |
| `WEBHOOK_SECRET` | Secret compartido con el backend Spring Boot |
| `NEXT_PUBLIC_API_URL` | URL del backend SIN `/api` al final (ej: `https://api.getdropspy.com`) |

> ⚠️ `NEXT_PUBLIC_API_URL` debe apuntar al backend de producción (Easypanel), no a localhost.

## Correr manualmente

1. Ir a **github.com/Diemendozac/test-shoptracker/actions**
2. Seleccionar **Sync Ads** en el panel izquierdo
3. Click **Run workflow** → **Run workflow** (branch: main)
4. Monitorear en tiempo real desde la misma pantalla

## Headless en CI vs local

GitHub Actions establece `CI=true` automáticamente. El scraper lo detecta:

```typescript
// lib/scrapers/meta-ads.ts
const headless = options.headless ?? (process.env.CI === 'true')
```

- **CI**: `headless: true` — sin display, más rápido
- **Local**: `headless: false` — ventana visible para debugging

> Nota: Playwright en GitHub Actions es ~1.5-2x más lento que local por el overhead de la VM Ubuntu. Un store que tarda 1 min local puede tardar 1.5-2 min en CI.

## Debuggear un run fallido

1. Ir a la pestaña **Actions** del repo
2. Click en el run fallido
3. Ver los logs del step **Run ads sync** — cada tienda tiene su propio bloque de logs
4. Si el run completó (aunque con errores), descargar el artifact:
   - En el run, scroll al final → **Artifacts** → `sync-log-{run_id}`
   - El archivo `sync-results.json` tiene el resumen: `stores_processed`, `errors`, `duration_seconds`

## Formato de sync-results.json

```json
{
  "timestamp": "2026-06-09T08:00:00.000Z",
  "duration_seconds": 847,
  "stores_processed": 15,
  "stores_skipped": 3,
  "total_ads_saved": 142,
  "matches": 89,
  "errors": []
}
```

- `stores_skipped`: tiendas saltadas por smart gate (sin candidatos activos, estancadas, o dominio inválido)
- `errors`: array de strings con el mensaje de error por tienda — vacío si todo fue bien
- `matches`: candidatos que recibieron al menos 1 ad con match de F3
