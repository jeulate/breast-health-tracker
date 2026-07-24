# Breast Health Tracker

Plataforma web para el seguimiento organizado de pacientes, hallazgos mamarios, controles clínicos y recordatorios asociados a casos BI-RADS.

El proyecto combina un dashboard administrativo, persistencia en Redis, autenticación segura, automatización de calidad e integración con Telegram para la vinculación de pacientes y la entrega de recordatorios.

> [!IMPORTANT]
> Breast Health Tracker es una herramienta de registro, seguimiento y acompañamiento. No realiza diagnósticos, no prescribe tratamientos y no sustituye la evaluación de un profesional de salud.

## Estado del proyecto

Las fases de arquitectura base, dashboard analítico, gestión avanzada de pacientes, hallazgos BI-RADS, timeline clínico, calendario, recordatorios, integración con Telegram y reportes se encuentran completadas y publicadas en `main`. La Fase 9 se encuentra en desarrollo sobre `feature/phase-9`; sus bloques de dominio/API de perfil y de interfaz de preferencias ya fueron implementados, probados y publicados en la rama remota, pero todavía no fueron integrados en `develop` ni en producción.

| Área                          | Estado     | Implementación                                  |
| ----------------------------- | ---------- | ----------------------------------------------- |
| Arquitectura inicial          | Completada | Next.js 16, App Router y TypeScript             |
| Persistencia                  | Completada | Upstash Redis con aislamiento por prefijo       |
| Autenticación                 | Completada | JWT, cookie HTTP-only y rutas protegidas        |
| Gestión avanzada de pacientes | Completada | Búsqueda, filtros, ordenamiento y paginación    |
| Dashboard base                | Completada | Header, sidebar y tarjetas reutilizables        |
| Diseño responsive             | Completada | Sidebar colapsable en escritorio y drawer móvil |
| Modo oscuro                   | Completada | Tema persistente y componentes adaptados        |
| Calidad                       | Completada | Formato, lint, typecheck, tests y build         |
| CI/CD                         | Completada | GitHub Actions y despliegue en Vercel           |
| Dashboard analítico           | Completada | KPIs reales, gráfica y actividad reciente       |
| Perfil de paciente            | Completada | Avatar, datos, estado y edición validada        |
| Hallazgos BI-RADS             | Completada | Registro, consulta, edición y seguimiento       |
| Timeline clínico              | Completada | Hallazgos, controles, síntomas y notas          |
| Calendario                    | Completada | Vista mensual, agenda móvil y filtros           |
| Recordatorios                 | Completada | Programación, ejecución y control de estados    |
| Telegram                      | Completada | Vinculación segura y entrega de recordatorios   |
| Reportes                      | Completada | Resumen, filtros y tabla administrativa         |
| Exportaciones                 | Completada | Descargas CSV UTF-8 y PDF protegidas            |
| Perfil de usuario             | En rama    | Datos de cuenta y preferencias persistentes     |
| Preferencias de interfaz      | En rama    | Tema, idioma, zona horaria y notificaciones     |
| Sincronización de tema        | En rama    | Modos claro, oscuro y sistema sin sobrescrituras |

## Tecnologías

| Tecnología     | Uso                                        |
| -------------- | ------------------------------------------ |
| Next.js 16     | Framework web con App Router               |
| React          | Construcción de la interfaz                |
| TypeScript     | Tipado estático                            |
| Tailwind CSS 4 | Sistema de estilos                         |
| Recharts       | Gráficas interactivas del dashboard        |
| Outfit         | Tipografía principal de la interfaz        |
| JetBrains Mono | Tipografía para datos técnicos y código    |
| Upstash Redis  | Persistencia mediante API REST             |
| Zod            | Validación de datos y variables de entorno |
| jose           | Creación y verificación de JWT             |
| bcryptjs       | Hash seguro de contraseñas                 |
| Vitest         | Pruebas automatizadas                      |
| GitHub Actions | Integración y entrega continua             |
| Vercel         | Hosting y despliegue de producción         |
| grammY         | Bot, webhook y entrega mediante Telegram   |
| pdf-lib        | Generación de reportes PDF en el servidor  |

## Arquitectura

La aplicación utiliza una arquitectura modular por capas. Las rutas y páginas se mantienen separadas de la lógica de negocio y del acceso a Redis.

```text
Navegador
   │
   ▼
Next.js App Router
   ├── Páginas y layouts
   ├── Componentes y formularios
   ├── Route Handlers / API
   └── Proxy y validación de sesión en API
             │
             ▼
        Servicios de dominio
             │
             ▼
          Repositorios
             │
             ▼
        Upstash Redis

Perfil del usuario
   │ sesión autenticada
   ▼
Route Handler /api/profile
   ├── Consulta de cuenta y preferencias
   └── Actualización validada
             │
             ▼
       Servicio de perfil
             │
             ▼
        Repositorio Redis

Telegram
   │ webhook autenticado
   ▼
Route Handler del bot
   ├── Vinculación mediante desafío temporal
   └── Confirmación del chat autorizado

Vercel Cron
   │ Bearer CRON_SECRET
   ▼
Procesador de recordatorios
   ├── Canal IN_APP
   └── Canal TELEGRAM ──► API de Telegram

Dashboard de reportes
   │ filtros validados
   ▼
Route Handlers protegidos
   ├── Resumen JSON
   ├── Exportación CSV UTF-8
   └── Exportación PDF con pdf-lib
             │
             ▼
       Servicio de reportes
             │
             ▼
        Datos consolidados
```

### Principios aplicados

- Separación entre presentación, lógica de negocio y persistencia.
- Validación de entradas antes de procesar o guardar información.
- Respuestas API consistentes.
- Acceso centralizado a Redis.
- Variables de entorno validadas.
- Componentes visuales reutilizables.
- Compatibilidad responsive y modo oscuro.
- Automatización de controles antes del despliegue.

## Estructura del proyecto

```text
breast-health-tracker/
├── scripts/
│   ├── migrate-patient-created-index.ts # Migración del índice cronológico
│   └── seed.ts                  # Creación de datos iniciales
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Login, logout y sesión actual
│   │   │   ├── calendar/        # Proyección global autenticada del calendario
│   │   │   ├── internal/        # Procesamiento interno protegido por secreto
│   │   │   ├── patients/        # Pacientes, recordatorios y vinculación
│   │   │   ├── reports/         # Resumen y exportaciones CSV/PDF
│   │   │   └── telegram/        # Webhook autenticado del bot
│   │   ├── dashboard/           # Layout, calendario y páginas protegidas
│   │   ├── login/               # Inicio de sesión
│   │   └── layout.tsx           # Layout raíz y tipografías
│   ├── components/
│   │   ├── calendar/            # Cuadrícula mensual y agenda móvil
│   │   ├── dashboard/           # Header, Sidebar y StatCard
│   │   ├── findings/            # Formularios y tarjetas BI-RADS
│   │   ├── forms/               # LoginForm y PatientForm
│   │   ├── patients/            # Filtros, tabla y paginación
│   │   ├── reminders/           # Gestión visual de recordatorios
│   │   ├── reports/             # Filtros, indicadores, tabla y descargas
│   │   ├── profile/             # Perfil, preferencias y sincronización del tema
│   │   ├── telegram/            # Gestión visual de la vinculación
│   │   ├── timeline/             # Timeline y eventos clínicos
│   │   └── ui/                  # Controles reutilizables
│   ├── config/                  # Validación de entorno
│   ├── features/
│   │   ├── auth/                # API pública del módulo de autenticación
│   │   ├── calendar/            # Contratos, proyección y utilidades mensuales
│   │   ├── clinical-timeline/    # Contratos de eventos y timeline
│   │   ├── dashboard/           # Contratos y métricas del dashboard
│   │   ├── findings/            # Contratos del dominio BI-RADS
│   │   ├── patients/            # API pública del módulo de pacientes
│   │   ├── profile/             # Contratos, validación y reglas del perfil
│   │   ├── reminders/           # Contratos, identidad y entrega
│   │   ├── reports/             # Contratos, cálculos, filtros y exportación
│   │   └── telegram/            # Contratos, tokens y mensajes del bot
│   ├── lib/
│   │   ├── auth/                # JWT, contraseñas y sesión
│   │   ├── redis/               # Cliente y claves de Redis
│   │   ├── utils/               # Utilidades y respuestas API
│   │   └── validations/         # Esquemas Zod
│   ├── repositories/            # Acceso a datos
│   ├── services/                # Reglas de negocio
│   ├── types/                   # Tipos compartidos
│   └── proxy.ts                 # Protección de páginas del dashboard
├── tests/
│   └── unit/                    # Pruebas unitarias
└── docs/                        # Documentación complementaria
```

## Funcionalidades implementadas

### Autenticación

- Inicio de sesión con email y contraseña.
- Contraseñas almacenadas mediante hash con bcrypt.
- Sesión firmada con JWT.
- Cookie HTTP-only con expiración controlada.
- Proxy de Next.js para proteger `/dashboard`.
- Validación explícita de sesión en las API de pacientes y hallazgos.
- Acceso administrativo en la fase actual.

### Pacientes

- Registro de pacientes.
- Listado paginado mediante API.
- Búsqueda instantánea sin distinción de mayúsculas, minúsculas o acentos.
- Filtros por estado activo e inactivo.
- Ordenamiento por nombre, fecha de registro y fecha de actualización.
- Tamaños de página configurables.
- Tabla responsive con navegación al detalle.
- Consulta y perfil individual con avatar generado mediante iniciales.
- Actualización de información y estado.
- Confirmaciones visibles después de crear o actualizar.
- Validación de formularios y payloads con mensajes por campo.
- Validación estricta de fechas y rechazo de fechas futuras.
- Zona horaria predeterminada `America/La_Paz`.
- Índice cronológico de pacientes en Redis.
- Migración idempotente para datos existentes.
- Estrategia optimizada con fallback seguro cuando el índice está incompleto.
- Persistencia aislada en Redis.

### Dashboard analítico

- KPIs calculados con información real de pacientes.
- Tendencia de registros de los últimos seis meses.
- Distribución de pacientes por estado.
- Actividad reciente con acceso al perfil.
- Estados de carga, vacío y error.
- Gráficas interactivas con Recharts.
- Diseño responsive sin desbordamiento del documento.

### Hallazgos BI-RADS

- Registro de hallazgos asociados a una paciente.
- Categorías BI-RADS `0`, `1`, `2`, `3`, `4A`, `4B`, `4C`, `5` y `6`.
- Lateralidad izquierda, derecha o bilateral.
- Estudios de mamografía, ecografía y resonancia.
- Fecha del estudio y próximo control indicado por el profesional.
- Descripción y observaciones con validación por campo.
- Registro opcional de biopsia y su resultado.
- Estados registrado, en seguimiento y cerrado.
- Listado cronológico por fecha del estudio.
- Creación y edición desde el perfil de la paciente.
- Índice global e índice cronológico por paciente en Redis.
- Protección contra acceso cruzado entre pacientes.
- API autenticada mediante cookie de sesión.
- Normalización de categorías numéricas deserializadas por Upstash.
- La plataforma registra la clasificación profesional; no calcula ni interpreta BI-RADS.

### Timeline clínico

- Proyección cronológica unificada de hallazgos BI-RADS y eventos manuales.
- Eventos de tipo control, síntoma registrado y nota clínica.
- Estados programado, completado y cancelado para controles.
- Estado registrado para síntomas y notas.
- Fechas futuras permitidas únicamente para controles programados.
- Creación, consulta, edición y eliminación de eventos manuales.
- Hallazgos BI-RADS de solo lectura desde el timeline, sin duplicar su persistencia.
- Relación opcional y validada entre un evento y un hallazgo de la misma paciente.
- Índice cronológico por paciente en Redis.
- API anidada, autenticada y aislada por paciente.
- Orden estable cuando varios registros comparten la misma fecha.
- Interfaz responsive compatible con modo claro y oscuro.
- Validaciones por campo y confirmación antes de eliminar.
- Pruebas de dominio, repositorio, servicio y contrato API.
- La plataforma organiza información registrada; no interpreta síntomas ni emite diagnósticos.

### Calendario

- Vista global mensual de controles clínicos y próximos controles BI-RADS.
- Proyección de información existente sin duplicar la persistencia en Redis.
- Agenda responsive para dispositivos móviles y cuadrícula mensual en escritorio.
- Navegación entre meses y filtro por estado programado, completado o cancelado.
- Identificación del paciente y acceso directo a su perfil y timeline clínico.
- Indicador visible para pacientes inactivos.
- API global autenticada y de solo lectura en `/api/calendar`.
- Validación estricta del intervalo de fechas y de los parámetros de consulta.
- Prevención de duplicados cuando un control clínico está vinculado con un hallazgo.
- Estados de carga, error y resultados vacíos.
- Compatibilidad con modo claro y oscuro, sin desbordamiento horizontal.
- Pruebas de proyección, validación, servicio, contrato API y utilidades mensuales.
- El calendario organiza fechas registradas; no interpreta información clínica ni genera recomendaciones médicas.

### Recordatorios

- Creación desde controles programados y próximos controles BI-RADS.
- Programación con fecha, hora y zona horaria `America/La_Paz`.
- Gestión desde el perfil de la paciente.
- Estados pendiente, procesando, enviado, completado, cancelado y fallido.
- Reprogramación, finalización y cancelación mediante API autenticada.
- Identificadores deterministas para evitar duplicados por fuente, fecha y canal.
- Índices globales, por estado, por fecha programada y por paciente en Redis.
- Motor de procesamiento con reclamación protegida mediante bloqueo temporal.
- Reintentos limitados, registro de intentos y recuperación de procesos interrumpidos.
- Canales `IN_APP` y `TELEGRAM` desacoplados mediante adaptadores de entrega.
- Endpoint interno protegido mediante `CRON_SECRET`.
- Ejecución diaria configurada con Vercel Cron mediante `vercel.json`.
- Procesamiento idempotente ante ejecuciones repetidas o simultáneas.
- Pruebas de dominio, persistencia, servicio, API, interfaz y procesamiento.

### Telegram

- Vinculación de una paciente mediante un desafío temporal de un solo uso.
- Generación, consulta y revocación del enlace desde el perfil administrativo.
- Actualización automática del estado de vinculación sin recargar la página.
- Webhook del bot implementado con grammY y protegido mediante `TELEGRAM_WEBHOOK_SECRET`.
- Asociación del `chatId` únicamente después de validar el desafío pendiente.
- Entrega de recordatorios mediante el canal `TELEGRAM`.
- Mensajes breves que evitan incluir información clínica detallada.
- Validación previa de que la paciente esté activa y tenga Telegram vinculado.
- Registro del estado de entrega, intentos y errores mediante el motor de recordatorios.
- Formato determinista de fecha y hora para evitar diferencias de hidratación entre servidor y navegador.
- Visualización del canal real en cada tarjeta de recordatorio.
- Pruebas de contratos, validaciones, repositorio, servicio, webhook, mensajes y entrega.

### Reportes y exportaciones

- Dashboard disponible en `/dashboard/reports`.
- Filtros por fecha inicial, fecha final, estado e identificador de paciente.
- Estado de los filtros conservado en la URL para compartir y repetir consultas.
- Indicadores consolidados y tabla de resultados construidos desde una misma lógica de dominio.
- Endpoint de resumen JSON en `/api/reports/summary`.
- Exportación CSV con separador compatible con Excel y BOM UTF-8 para conservar tildes y `ñ`.
- Exportación PDF generada en el servidor mediante `pdf-lib`.
- Nombres de archivo basados en el periodo seleccionado.
- Encabezados de descarga y política `no-store` para evitar caché de información sensible.
- Exportaciones restringidas a los roles `ADMIN` y `PROFESSIONAL`.
- Estados de carga, error y resultados vacíos.
- Diseño responsive y compatible con modo claro y oscuro.
- Pruebas de cálculo, validación, filtros URL, servicio, exportación y contratos API.
- Validación local de ambas descargas y respuestas HTTP `200`.

### Perfil y preferencias del usuario

- Página protegida disponible en `/dashboard/profile`.
- Acceso “Mi perfil” incorporado al Sidebar.
- Consulta del nombre, correo, rol y estado de la cuenta autenticada.
- Edición permitida únicamente para el nombre dentro de los datos de cuenta.
- Preferencias persistentes de tema, idioma y zona horaria.
- Temas `LIGHT`, `DARK` y `SYSTEM`, aplicados inmediatamente en el navegador.
- Preferencias de notificación mediante tres controles independientes.
- Confirmación visible después de guardar los cambios.
- Estados de carga y error específicos para la página de perfil.
- Endpoint autenticado `GET /api/profile` para consultar el perfil.
- Endpoint autenticado `PATCH /api/profile` para actualizar datos y preferencias.
- Validación compartida entre dominio, API e interfaz.
- Sincronización inicial de la preferencia almacenada en Redis.
- Prioridad de la selección local después de inicializar el navegador, evitando que Redis sobrescriba cambios posteriores.
- Uso unificado de la clave `theme` de `next-themes`; la clave anterior `birads-tracker-theme` fue retirada.
- Cambio estable entre modo claro y oscuro desde el encabezado y el formulario de perfil.
- Persistencia del tema después de recargar y navegar entre páginas.
- Diseño responsive y compatible con los estilos globales del dashboard.
- Pruebas unitarias para las conversiones y funciones auxiliares del formulario.

### Interfaz

- Diseño inspirado en TailAdmin.
- Header responsive.
- Sidebar colapsable en escritorio.
- Sidebar tipo drawer con overlay en dispositivos móviles.
- Modo oscuro persistente.
- Tipografía Outfit aplicada globalmente.
- JetBrains Mono disponible para valores técnicos.
- Login renovado.
- Formularios compatibles con tema claro y oscuro.
- Componentes reutilizables para futuras fases.
- Tabla con desplazamiento horizontal contenido en dispositivos pequeños.
- Perfil de paciente adaptado a escritorio y móvil.
- Perfil del usuario con datos de cuenta y preferencias configurables.
- Sincronización consistente del tema entre encabezado, perfil, navegador y Redis.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Base de datos Upstash Redis.
- Cuenta de Vercel para el despliegue.
- Repositorio GitHub para CI/CD.
- Bot de Telegram creado mediante BotFather para habilitar la Fase 7.

## Instalación local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd breast-health-tracker

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de entorno local
cp .env.example .env.local

# 4. Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Variables de entorno

### Variables actuales

| Variable                      | Descripción                                                | Requerida  |
| ----------------------------- | ---------------------------------------------------------- | ---------- |
| `KV_REST_API_URL`             | URL REST de Upstash Redis                                  | Sí         |
| `KV_REST_API_TOKEN`           | Token de acceso a Upstash Redis                            | Sí         |
| `KV_REST_API_READ_ONLY_TOKEN` | Token opcional de solo lectura                             | No         |
| `HEALTH_APP_REDIS_PREFIX`     | Prefijo de aislamiento; recomendado: `bht:v1:`             | Sí         |
| `NEXT_PUBLIC_APP_URL`         | URL pública de la aplicación                               | Sí         |
| `AUTH_SECRET`                 | Clave para firmar JWT; mínimo recomendado de 32 caracteres | Sí         |
| `ADMIN_INITIAL_EMAIL`         | Email utilizado por el seed del administrador              | Para seed  |
| `ADMIN_INITIAL_PASSWORD`      | Contraseña inicial utilizada por el seed                   | Para seed  |
| `CRON_SECRET`                 | Secreto Bearer del procesador de recordatorios             | Producción |
| `TELEGRAM_BOT_TOKEN`          | Token privado del bot proporcionado por BotFather          | Telegram   |
| `TELEGRAM_WEBHOOK_SECRET`     | Secreto usado para autenticar solicitudes de Telegram      | Telegram   |
| `TELEGRAM_BOT_USERNAME`       | Nombre público del bot, sin el carácter `@`                | Telegram   |

Ejemplo local:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=reemplazar-por-un-secreto-seguro-de-al-menos-32-caracteres

KV_REST_API_URL=https://example.upstash.io
KV_REST_API_TOKEN=reemplazar-por-token-real
KV_REST_API_READ_ONLY_TOKEN=
HEALTH_APP_REDIS_PREFIX=bht:v1:

ADMIN_INITIAL_EMAIL=admin@example.com
ADMIN_INITIAL_PASSWORD=reemplazar-por-password-seguro
CRON_SECRET=reemplazar-por-un-secreto-aleatorio-de-al-menos-32-caracteres
TELEGRAM_BOT_TOKEN=reemplazar-por-el-token-del-bot
TELEGRAM_WEBHOOK_SECRET=reemplazar-por-un-secreto-aleatorio
TELEGRAM_BOT_USERNAME=nombre_publico_del_bot
```

> [!WARNING]
> No publiques `.env.local`, tokens, secretos ni credenciales reales en GitHub.

### Configuración del webhook de Telegram

Telegram envía las actualizaciones a `/api/telegram/webhook`. El webhook debe registrarse con una URL HTTPS y el mismo valor configurado en `TELEGRAM_WEBHOOK_SECRET` como `secret_token`.

En despliegues Preview protegidos de Vercel, el bypass puede incorporarse temporalmente como parámetro de la URL exclusivamente para las pruebas. Este valor no debe guardarse en Git, `.env.local`, documentación, capturas ni logs.

Después de promover la versión a `main`, el webhook debe apuntar a la URL estable de producción y verificarse mediante `getWebhookInfo`. La validación esperada es: URL correcta, cero actualizaciones pendientes y ausencia de `last_error_message`.

> [!IMPORTANT]
> El `chatId` no se configura como una variable global. Se almacena por paciente en Redis después de completar correctamente el flujo de vinculación.

## Configuración de Redis

1. Crear o seleccionar una base en Upstash.
2. Copiar la URL y el token REST a `.env.local`.
3. Definir `HEALTH_APP_REDIS_PREFIX=bht:v1:`.
4. Ejecutar el seed inicial.
5. Si existen pacientes anteriores al índice cronológico, ejecutar la migración.

```bash
npm run migrate:patient-index
```

El prefijo evita colisiones cuando una misma base Redis es compartida con otros proyectos.

### Persistencia de Telegram

La integración conserva la separación por responsabilidades y utiliza claves generadas centralmente en `src/lib/redis/keys.ts`:

- Registro de vinculación por paciente.
- Resolución del chat autorizado hacia la paciente vinculada.
- Desafío temporal utilizado durante el flujo de asociación.
- Expiración del desafío para impedir reutilizaciones posteriores.

Las claves heredan `HEALTH_APP_REDIS_PREFIX`; no deben construirse manualmente fuera del módulo central. Los tokens del bot y del webhook nunca se almacenan en Redis como parte del vínculo del paciente.

## Datos iniciales

El seed crea un administrador y pacientes ficticios para verificar el funcionamiento local.

```bash
npm run seed
```

Los datos generados son exclusivamente demostrativos y no deben representar pacientes reales.

## Scripts disponibles

| Comando                         | Descripción                                    |
| ------------------------------- | ---------------------------------------------- |
| `npm run dev`                   | Inicia el servidor de desarrollo               |
| `npm run build`                 | Genera el build de producción                  |
| `npm run start`                 | Inicia el build de producción                  |
| `npm run lint`                  | Ejecuta ESLint                                 |
| `npm run typecheck`             | Verifica TypeScript sin emitir archivos        |
| `npm run format`                | Aplica el formato configurado                  |
| `npm run format:check`          | Verifica el formato sin modificar archivos     |
| `npm run test`                  | Ejecuta las pruebas una vez                    |
| `npm run test:watch`            | Ejecuta Vitest en modo observación             |
| `npm run seed`                  | Carga datos iniciales en Redis                 |
| `npm run migrate:patient-index` | Reconstruye el índice cronológico de pacientes |

## Validación antes de un commit

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

El código solo debe integrarse cuando todos los controles finalicen correctamente.

## Endpoints actuales

| Método   | Ruta                                             | Descripción                         | Acceso           |
| -------- | ------------------------------------------------ | ----------------------------------- | ---------------- |
| `POST`   | `/api/auth/login`                                | Iniciar sesión                      | Público          |
| `POST`   | `/api/auth/logout`                               | Cerrar sesión                       | Autenticado      |
| `GET`    | `/api/auth/me`                                   | Consultar la sesión actual          | Autenticado      |
| `GET`    | `/api/patients`                                  | Buscar, filtrar y paginar pacientes | Autenticado      |
| `POST`   | `/api/patients`                                  | Registrar paciente                  | Autenticado      |
| `GET`    | `/api/patients/[id]`                             | Consultar un paciente               | Autenticado      |
| `PUT`    | `/api/patients/[id]`                             | Actualizar un paciente              | Autenticado      |
| `GET`    | `/api/patients/[id]/findings`                    | Listar hallazgos de una paciente    | Autenticado      |
| `POST`   | `/api/patients/[id]/findings`                    | Registrar un hallazgo               | Autenticado      |
| `GET`    | `/api/patients/[id]/findings/[findingId]`        | Consultar un hallazgo               | Autenticado      |
| `PUT`    | `/api/patients/[id]/findings/[findingId]`        | Actualizar un hallazgo              | Autenticado      |
| `GET`    | `/api/patients/[id]/timeline`                    | Consultar el timeline unificado     | Autenticado      |
| `POST`   | `/api/patients/[id]/timeline`                    | Registrar un evento clínico         | Autenticado      |
| `GET`    | `/api/patients/[id]/timeline/[eventId]`          | Consultar un evento clínico         | Autenticado      |
| `PUT`    | `/api/patients/[id]/timeline/[eventId]`          | Actualizar un evento clínico        | Autenticado      |
| `DELETE` | `/api/patients/[id]/timeline/[eventId]`          | Eliminar un evento clínico          | Autenticado      |
| `GET`    | `/api/calendar`                                  | Consultar el calendario global      | Autenticado      |
| `GET`    | `/api/patients/[id]/reminders`                   | Listar recordatorios y candidatos   | Autenticado      |
| `POST`   | `/api/patients/[id]/reminders`                   | Crear un recordatorio               | Autenticado      |
| `GET`    | `/api/patients/[id]/reminders/[reminderId]`      | Consultar un recordatorio           | Autenticado      |
| `PUT`    | `/api/patients/[id]/reminders/[reminderId]`      | Reprogramar o cambiar su estado     | Autenticado      |
| `GET`    | `/api/internal/reminders/process`                | Ejecutar el procesador programado   | Secreto interno  |
| `POST`   | `/api/internal/reminders/process`                | Ejecutar el procesador manualmente  | Secreto interno  |
| `GET`    | `/api/patients/[id]/telegram-link`               | Consultar el estado de vinculación  | Autenticado      |
| `POST`   | `/api/patients/[id]/telegram-link`               | Generar un desafío de vinculación   | Autenticado      |
| `DELETE` | `/api/patients/[id]/telegram-link`               | Desvincular Telegram                | Autenticado      |
| `GET`    | `/api/patients/[id]/telegram-link/[challengeId]` | Consultar un desafío pendiente      | Autenticado      |
| `POST`   | `/api/telegram/webhook`                          | Procesar actualizaciones del bot    | Secreto Telegram |
| `GET`    | `/api/reports/summary`                           | Consultar el resumen de reportes    | Autorizado       |
| `GET`    | `/api/reports/export/csv`                        | Descargar el reporte en CSV         | Autorizado       |
| `GET`    | `/api/reports/export/pdf`                        | Descargar el reporte en PDF         | Autorizado       |
| `GET`    | `/api/profile`                                   | Consultar perfil y preferencias      | Autenticado      |
| `PATCH`  | `/api/profile`                                   | Actualizar perfil y preferencias     | Autenticado      |

## Estrategia Git

El repositorio emplea un flujo basado en ramas:

| Rama        | Propósito                                              |
| ----------- | ------------------------------------------------------ |
| `main`      | Versión estable de producción                          |
| `develop`   | Integración de funcionalidades terminadas              |
| `feature/*` | Desarrollo aislado de cada módulo o mejora             |
| `fix/*`     | Correcciones no urgentes integradas mediante `develop` |
| `hotfix/*`  | Correcciones urgentes que parten de producción         |

Flujo recomendado para cada funcionalidad:

```text
develop
   └── feature/nombre-funcionalidad
             ├── desarrollo
             ├── pruebas locales
             ├── pull request hacia develop
             └── eliminación después del merge

develop
   └── pull request hacia main
             ├── GitHub Actions
             ├── build
             └── despliegue en Vercel
```

No se deben desarrollar funcionalidades directamente sobre `develop` ni `main`.

### Iteración actual

La Fase 8 permanece integrada en producción. La Fase 9 se desarrolla de forma incremental en `feature/phase-9`:

- Bloque 9.1: dominio, persistencia, servicio y API autenticada del perfil y sus preferencias.
- Bloque 9.2: página `/dashboard/profile`, formulario, navegación, preferencias de interfaz y sincronización del tema.
- Commit del Bloque 9.2: `9ee3221` (`feat: add profile preferences UI and theme synchronization`).
- Rama local y remota sincronizadas después del push.
- Validación final del bloque: 356 pruebas aprobadas en 59 archivos, TypeScript, ESLint y build de producción sin errores.
- Prueba manual completada para el cambio `DARK ↔ LIGHT`, navegación y persistencia local.

Estos cambios todavía deben pasar por pull request antes de integrarse en `develop` y posteriormente en `main`.

## CI/CD

GitHub Actions verifica la calidad del código antes de permitir su integración y despliegue.

```text
Push / Pull Request
        │
        ├── format:check
        ├── lint
        ├── typecheck
        ├── tests
        └── build
                │
                ▼
          Deploy en Vercel
```

Un fallo en cualquiera de los controles debe impedir la promoción del cambio a producción.

## Roadmap

### Fase 1 — Base técnica y diseño inicial

**Estado: completada**

- Arquitectura modular con Next.js y TypeScript.
- Configuración de Tailwind CSS.
- Persistencia con Upstash Redis.
- Aislamiento de claves mediante prefijo.
- Autenticación JWT y protección de rutas.
- CRUD inicial de pacientes.
- Seed de datos demostrativos.
- Dashboard base inspirado en TailAdmin.
- Layout responsive.
- Dark mode persistente.
- Tipografías Outfit y JetBrains Mono.
- Pruebas, lint, typecheck y build.
- GitHub Actions y despliegue en Vercel.

### Fase 2 — Dashboard analítico

**Estado: completada**

Objetivo: convertir el dashboard inicial en una vista operativa con información real y una experiencia visual consistente para los módulos posteriores.

- Cuatro tarjetas KPI alimentadas con datos reales.
- Total de pacientes registrados.
- Pacientes activos e inactivos.
- Nuevos registros de los últimos 30 días.
- Gráfica interactiva con Recharts.
- Tendencia de registros durante los últimos seis meses.
- Distribución porcentual de pacientes por estado.
- Tabla de actividad reciente con acceso al detalle del paciente.
- Estados de carga, vacío y error.
- Diseño responsive y compatibilidad con modo claro y oscuro.
- Cálculo de métricas separado del acceso a Redis.
- Una sola lectura de pacientes para generar los indicadores.
- Pruebas unitarias para totales, estados, fechas y agrupación mensual.
- Zona horaria predeterminada configurada como `America/La_Paz`.

Rama utilizada: `feature/dashboard-v2`.

### Fase 3 — Gestión avanzada de pacientes

**Estado: completada**

Objetivo: convertir el CRUD inicial en un módulo administrativo eficiente, validado y preparado para incorporar información clínica en las fases posteriores.

- Tabla moderna y responsive estilo TailAdmin.
- Búsqueda instantánea normalizada, compatible con nombres acentuados.
- Filtros por estado.
- Paginación y tamaños de página configurables.
- Ordenamiento por nombre y fechas.
- Estado de los filtros representado en la URL.
- Badges de estado activo e inactivo.
- Avatar con iniciales y perfil individual del paciente.
- Formularios de creación y edición con validación por campo.
- Fechas procesadas sin desplazamientos por zona horaria.
- Zona horaria boliviana predeterminada.
- API paginada y estrategia de consulta reutilizable.
- Índice cronológico en Redis y migración idempotente.
- Estados de carga y resultados vacíos.
- Compatibilidad con modo claro y oscuro.
- Corrección de overflow horizontal y scroll duplicado en móviles.
- Pruebas unitarias para consultas, parámetros URL, estrategia, índice y validaciones.

Rama utilizada: `feature/patients-v2`.

### Fase 4 — Hallazgos BI-RADS

**Estado: completada en su alcance inicial**

- Registro y consulta de hallazgos por paciente.
- Categorías BI-RADS válidas, ingresadas manualmente desde un informe profesional.
- Lateralidad izquierda, derecha o bilateral.
- Tipo de estudio: ecografía, mamografía o resonancia.
- Registro opcional de biopsia y resultado.
- Descripción y observaciones del hallazgo.
- Fecha del estudio y próximo control indicado por el profesional.
- Estados registrado, en seguimiento y cerrado.
- Edición con limpieza de campos opcionales.
- Índice cronológico por fecha de estudio.
- API anidada con autenticación y aislamiento por paciente.
- Interfaz responsive y compatible con modo oscuro.
- Pruebas de dominio, persistencia, servicio, API y seguridad.

Los archivos adjuntos y el historial inmutable de cambios quedan diferidos hasta definir almacenamiento privado, autorización, auditoría y políticas de retención.

Rama utilizada: `feature/findings`.

### Fase 5 — Timeline clínico y seguimiento

**Estado: completada**

- Línea de tiempo cronológica unificada por paciente.
- Proyección de estudios y hallazgos BI-RADS sin duplicar información.
- Controles programados, completados y cancelados.
- Síntomas comunicados y notas clínicas registradas.
- Creación, consulta, edición y eliminación de eventos manuales.
- Relación opcional con hallazgos de la misma paciente.
- Persistencia e índice cronológico en Redis.
- API autenticada con aislamiento por paciente.
- Visualización clara de registros y estados.
- Diseño responsive y compatibilidad con modo oscuro.
- Pruebas automatizadas y validación manual del flujo completo.

Rama utilizada: `feature/clinical-timeline`.

### Fase 6 — Calendario y recordatorios

**Estado: completada**

Bloque de calendario completado:

- Calendario mensual global de controles y seguimientos.
- Proyección de controles clínicos existentes.
- Proyección de próximos controles definidos en hallazgos BI-RADS abiertos.
- Prevención de duplicados entre eventos relacionados.
- Filtros por estado y navegación entre meses.
- Cuadrícula mensual en escritorio y agenda adaptada a móvil.
- Acceso directo al perfil y timeline de la paciente.
- API autenticada de solo lectura.
- Pruebas de contratos, proyección, servicio, API e interfaz mensual.

Bloque de recordatorios completado:

- Recordatorios configurables desde fuentes clínicas existentes.
- Estados pendiente, procesando, enviado, completado, cancelado y fallido.
- Interfaz de creación, reprogramación y control de estado.
- Persistencia e índices especializados en Redis.
- Procesamiento idempotente con bloqueo temporal.
- Reintentos limitados y recuperación de ejecuciones interrumpidas.
- Endpoint interno protegido mediante secreto Bearer.
- Procesamiento diario mediante Vercel Cron.
- Registro de intentos, entregas y errores controlados.
- Canal interno y canal Telegram integrados sin acoplar el dominio al proveedor de entrega.

Rama utilizada para el calendario: `feature/calendar`.

Rama utilizada para recordatorios: `feature/reminders`.

### Fase 7 — Bot de Telegram

**Estado: completada**

- Integración del bot mediante grammY.
- Webhook protegido mediante `TELEGRAM_WEBHOOK_SECRET`.
- Vinculación segura por desafío temporal de un solo uso.
- Consulta y desvinculación desde el perfil de la paciente.
- Actualización automática del estado después de completar `/start`.
- Persistencia del chat autorizado por paciente en Redis.
- Canal `TELEGRAM` integrado en el formulario de recordatorios.
- Adaptador de entrega conectado al procesador existente.
- Validación de paciente activa y vínculo vigente antes del envío.
- Reintentos y estados de entrega administrados por el motor de recordatorios.
- Mensajes limitados a información operativa para reducir exposición de datos sensibles.
- Formato de fechas determinista entre servidor y navegador.
- Pruebas unitarias y de contrato para tokens, validaciones, claves Redis, repositorios, servicios, endpoints, mensajes y entrega.
- Validación manual de vinculación, desvinculación, refresco automático y recordatorios en Vercel Preview.

Rama utilizada: `feature/telegram`.

Integración en `develop`: PR #16.

### Fase 8 — Reportes y exportación

**Estado: completada y publicada en producción**

Objetivo: ofrecer una vista administrativa consolidada y permitir la descarga controlada de la misma información, respetando los filtros activos.

- Página protegida `/dashboard/reports` incorporada al sidebar.
- Filtros por periodo, estado e identificador de paciente.
- Parámetros normalizados y conservados en la URL.
- Tarjetas de resumen y tabla de resultados.
- Cálculos de dominio separados de la interfaz y del acceso a datos.
- Endpoint `GET /api/reports/summary` para el resumen consolidado.
- Endpoint `GET /api/reports/export/csv` para descargas compatibles con Excel.
- Endpoint `GET /api/reports/export/pdf` para documentos generados con `pdf-lib`.
- CSV codificado en UTF-8 con BOM y separador `;`.
- PDF con periodo, indicadores y desglose del reporte.
- Nombres de archivo derivados del rango de fechas.
- Encabezados seguros de descarga y respuesta sin caché.
- Acceso restringido a `ADMIN` y `PROFESSIONAL`.
- Botones de exportación que reutilizan los filtros de la vista.
- Estados de carga, error y vacío.
- Pruebas de cálculo, URL, validación, servicio, generación de archivos y contrato HTTP.
- 347 pruebas aprobadas en 57 archivos, además de typecheck, lint y build.
- Descargas CSV/PDF verificadas localmente con estado HTTP `200`.

Ramas utilizadas: `feature/reports` y `feature/report-exports`.

Integraciones: PR #21 y PR #22 hacia `develop`; PR #23 de `develop` hacia `main`.

Mejora futura no bloqueante: incorporar procesamiento por lotes o generación asíncrona si el volumen de información supera la capacidad adecuada para una respuesta HTTP directa.

### Fase 9 — Perfil, configuración y auditoría

**Estado: en desarrollo**

Objetivo: incorporar un perfil administrativo persistente, preferencias personales y las bases necesarias para configuración, permisos, auditoría y observabilidad.

Bloque 9.1 — Dominio, persistencia y API de perfil:

- Modelo de perfil asociado al usuario autenticado.
- Datos de cuenta: nombre, correo, rol y estado.
- Preferencias de tema, idioma y zona horaria.
- Preferencias independientes de notificación.
- Validación de consultas y actualizaciones.
- Separación entre contratos, repositorio, servicio y Route Handler.
- Endpoints autenticados `GET /api/profile` y `PATCH /api/profile`.
- Conservación de los campos no enviados en actualizaciones parciales.

Bloque 9.2 — Interfaz y sincronización de preferencias:

- Página protegida `/dashboard/profile`.
- Entrada “Mi perfil” en el Sidebar.
- Formulario responsive con estados de carga, error y confirmación.
- Nombre editable; correo, rol y estado visibles como datos de cuenta.
- Selectores de tema, idioma y zona horaria.
- Tres interruptores independientes para notificaciones.
- Aplicación inmediata del tema desde el formulario y el encabezado.
- Modos claro, oscuro y sistema mediante `next-themes`.
- Sincronización inicial con la preferencia persistida en Redis.
- Respeto de la selección local después de inicializar el tema.
- Eliminación de la clave heredada `birads-tracker-theme`.
- Persistencia unificada mediante la clave local `theme`.
- Pruebas manuales del ciclo `DARK → LIGHT → DARK` y persistencia tras recargar.
- 356 pruebas aprobadas en 59 archivos, además de typecheck, lint y build.

Pendiente dentro de la Fase 9:

- Configuración administrativa.
- Gestión de roles y permisos.
- Registro de acciones relevantes.
- Observabilidad y trazabilidad de errores.
- Integración de la rama mediante pull request hacia `develop`.

Rama actual: `feature/phase-9`.

Commit del Bloque 9.2: `9ee3221`.

### Fase 10 — Asistencia con IA

**Estado: futura y sujeta a validación**

- Resúmenes de información registrada.
- Ayuda para organizar antecedentes y preguntas para una consulta médica.
- Detección de datos incompletos o seguimientos pendientes.
- Recomendaciones operativas dentro del sistema.
- Registro de las respuestas generadas.
- Revisión de privacidad, seguridad y cumplimiento antes de habilitarla.

La IA funcionará únicamente como apoyo informativo y organizativo. No emitirá diagnósticos, no sustituirá al profesional de salud y sus resultados deberán presentarse con advertencias visibles.

## Seguridad y privacidad

Por tratarse de información relacionada con salud, las siguientes medidas son obligatorias durante todas las fases:

- No almacenar credenciales en el repositorio.
- No utilizar datos personales reales en seeds, pruebas o capturas públicas.
- Aplicar autorización a todos los endpoints privados.
- Validar datos tanto en cliente como en servidor.
- Minimizar la información incluida en logs.
- Evitar enviar información clínica detallada por Telegram.
- Registrar accesos y operaciones sensibles cuando se implemente auditoría.
- Definir políticas de respaldo, retención y eliminación antes de manejar datos reales.
- Revisar requisitos legales y de privacidad aplicables antes del uso productivo con pacientes reales.

## Criterios generales de aceptación

Cada fase deberá cumplir, como mínimo, con los siguientes criterios:

- Funcionalidad desarrollada en su propia rama `feature/*`.
- Interfaz responsive.
- Compatibilidad con tema claro y oscuro.
- Tipado estricto sin uso injustificado de `any`.
- Validaciones de entrada.
- Manejo visible de carga, errores y estados vacíos.
- Pruebas proporcionales al riesgo de la funcionalidad.
- Documentación actualizada.
- `format:check`, `lint`, `typecheck`, `test` y `build` aprobados.
- Pull request revisado antes del merge.

## Próximo paso

Los bloques 9.1 y 9.2 están implementados y publicados en `origin/feature/phase-9`. El siguiente paso es definir e implementar el próximo bloque de la Fase 9 en la misma rama o cerrar el alcance actual mediante un pull request hacia `develop`, según la estrategia acordada para la fase.

```bash
git status
git branch --show-current
git log -1 --oneline
```

Antes del pull request deben volver a ejecutarse los controles de calidad y confirmarse que la rama no contenga cambios sin registrar. No se debe afirmar que la Fase 9 está en producción hasta completar la integración `feature/phase-9 → develop → main` y verificar el despliegue.

Antes de trabajar con datos reales también deben definirse las políticas de privacidad, respaldo, retención, eliminación y auditoría indicadas en este documento.

## Licencia

Definir la licencia del proyecto antes de su distribución pública.
