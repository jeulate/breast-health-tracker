# Próximas fases – BI-RADS Tracker

## Fase 2 – Hallazgos, síntomas y ciclos

**Objetivo:** registrar y visualizar la información clínica básica.

- Entidad `Finding`: resultado BI-RADS, fecha, imagen asociada.
- Entidad `Symptom`: tipo, intensidad, fecha.
- Entidad `Cycle`: fechas de inicio y fin del ciclo menstrual.
- API: CRUD de hallazgos y síntomas.
- Dashboard: historial cronológico por paciente.
- Redis keys: `findings:{id}`, `findings:patient:{patientId}`, `symptoms:{id}`, etc.

## Fase 3 – Hábitos y controles médicos

**Objetivo:** seguimiento de hábitos saludables y controles programados.

- Entidad `Habit`: tipo, frecuencia, registro diario.
- Entidad `MedicalControl`: tipo de control, fecha, resultado, profesional.
- API: CRUD de hábitos y controles.
- Dashboard: calendario de controles pendientes.

## Fase 4 – Bot de Telegram y máquina de estados

**Objetivo:** canal de comunicación con las pacientes.

- Webhook en `src/app/api/telegram/webhook/route.ts`.
- Máquina de estados por paciente (Redis como storage de estado).
- Comandos: `/start`, `/registro`, `/sintoma`, `/ciclo`.
- Vinculación de cuenta Telegram con perfil de paciente.
- Variables de entorno: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`.

## Fase 5 – Recordatorios, cron y alertas

**Objetivo:** notificaciones proactivas.

- Vercel Cron Jobs para recordatorios diarios.
- Alertas por síntomas que superen umbrales.
- Recordatorios de controles próximos.
- Registro de recordatorios enviados.

## Fase 6 – Exportaciones, gráficas y observabilidad

**Objetivo:** análisis de datos y monitoreo.

- Exportación de datos a CSV por paciente.
- Gráficas de evolución de síntomas (Recharts o Chart.js).
- Dashboard con métricas agregadas reales.
- Integración con OpenTelemetry / Vercel Analytics.

## Fase 7 – Despliegue de producción

**Objetivo:** plataforma lista para uso real.

- Pipeline de deploy en Vercel con variables de entorno de producción.
- Configuración de dominio personalizado y SSL.
- Revisión de seguridad: rate limiting, CORS, CSP headers.
- Backup de datos Redis.
- Documentación de operaciones.
- Tests de integración end-to-end con Playwright.
