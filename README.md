# Breast Health Tracker

Plataforma web para el seguimiento organizado de pacientes, hallazgos mamarios, controles clínicos y recordatorios asociados a casos BI-RADS.

El proyecto combina un dashboard administrativo, persistencia en Redis, autenticación segura, automatización de calidad y una futura integración con Telegram.

> [!IMPORTANT]
> Breast Health Tracker es una herramienta de registro, seguimiento y acompañamiento. No realiza diagnósticos, no prescribe tratamientos y no sustituye la evaluación de un profesional de salud.

## Estado del proyecto

Las fases de arquitectura base, dashboard analítico, gestión avanzada de pacientes, hallazgos BI-RADS, timeline clínico y calendario se encuentran desplegadas. El bloque de recordatorios de la Fase 6 está terminado en `feature/reminders` y listo para integrarse mediante pull request hacia `develop`.

| Área                          | Estado      | Implementación                                  |
| ----------------------------- | ----------- | ----------------------------------------------- |
| Arquitectura inicial          | Completada  | Next.js 16, App Router y TypeScript             |
| Persistencia                  | Completada  | Upstash Redis con aislamiento por prefijo       |
| Autenticación                 | Completada  | JWT, cookie HTTP-only y rutas protegidas        |
| Gestión avanzada de pacientes | Completada  | Búsqueda, filtros, ordenamiento y paginación    |
| Dashboard base                | Completada  | Header, sidebar y tarjetas reutilizables        |
| Diseño responsive             | Completada  | Sidebar colapsable en escritorio y drawer móvil |
| Modo oscuro                   | Completada  | Tema persistente y componentes adaptados        |
| Calidad                       | Completada  | Formato, lint, typecheck, tests y build         |
| CI/CD                         | Completada  | GitHub Actions y despliegue en Vercel           |
| Dashboard analítico           | Completada  | KPIs reales, gráfica y actividad reciente       |
| Perfil de paciente            | Completada  | Avatar, datos, estado y edición validada        |
| Hallazgos BI-RADS             | Completada  | Registro, consulta, edición y seguimiento       |
| Timeline clínico              | Completada  | Hallazgos, controles, síntomas y notas          |
| Calendario                    | Completada  | Vista mensual, agenda móvil y filtros           |
| Recordatorios                 | Completada  | Programación, ejecución y control de estados    |
| Telegram                      | Planificado | Notificaciones y recordatorios automatizados    |

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
| grammY         | Integración futura con Telegram            |

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
│   │   │   └── patients/        # Operaciones de pacientes
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
│   │   └── reminders/           # Contratos, identidad y entrega
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
- Canal interno `IN_APP` desacoplado para futuras integraciones.
- Endpoint interno protegido mediante `CRON_SECRET`.
- Ejecución diaria configurada con Vercel Cron mediante `vercel.json`.
- Procesamiento idempotente ante ejecuciones repetidas o simultáneas.
- Pruebas de dominio, persistencia, servicio, API, interfaz y procesamiento.
- Telegram permanece fuera de este alcance y se implementará de forma independiente.

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

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Base de datos Upstash Redis.
- Cuenta de Vercel para el despliegue.
- Repositorio GitHub para CI/CD.

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
```

> [!WARNING]
> No publiques `.env.local`, tokens, secretos ni credenciales reales en GitHub.

### Variables previstas para Telegram

Estas variables formarán parte de la fase de notificaciones y no deben considerarse activas hasta implementar el módulo correspondiente.

| Variable                  | Propósito futuro                      |
| ------------------------- | ------------------------------------- |
| `TELEGRAM_BOT_TOKEN`      | Token entregado por BotFather         |
| `TELEGRAM_WEBHOOK_SECRET` | Validación de solicitudes del webhook |
| `TELEGRAM_CHAT_ID`        | Chat autorizado para notificaciones   |

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

| Método   | Ruta                                        | Descripción                         | Acceso          |
| -------- | ------------------------------------------- | ----------------------------------- | --------------- |
| `POST`   | `/api/auth/login`                           | Iniciar sesión                      | Público         |
| `POST`   | `/api/auth/logout`                          | Cerrar sesión                       | Autenticado     |
| `GET`    | `/api/auth/me`                              | Consultar la sesión actual          | Autenticado     |
| `GET`    | `/api/patients`                             | Buscar, filtrar y paginar pacientes | Autenticado     |
| `POST`   | `/api/patients`                             | Registrar paciente                  | Autenticado     |
| `GET`    | `/api/patients/[id]`                        | Consultar un paciente               | Autenticado     |
| `PUT`    | `/api/patients/[id]`                        | Actualizar un paciente              | Autenticado     |
| `GET`    | `/api/patients/[id]/findings`               | Listar hallazgos de una paciente    | Autenticado     |
| `POST`   | `/api/patients/[id]/findings`               | Registrar un hallazgo               | Autenticado     |
| `GET`    | `/api/patients/[id]/findings/[findingId]`   | Consultar un hallazgo               | Autenticado     |
| `PUT`    | `/api/patients/[id]/findings/[findingId]`   | Actualizar un hallazgo              | Autenticado     |
| `GET`    | `/api/patients/[id]/timeline`               | Consultar el timeline unificado     | Autenticado     |
| `POST`   | `/api/patients/[id]/timeline`               | Registrar un evento clínico         | Autenticado     |
| `GET`    | `/api/patients/[id]/timeline/[eventId]`     | Consultar un evento clínico         | Autenticado     |
| `PUT`    | `/api/patients/[id]/timeline/[eventId]`     | Actualizar un evento clínico        | Autenticado     |
| `DELETE` | `/api/patients/[id]/timeline/[eventId]`     | Eliminar un evento clínico          | Autenticado     |
| `GET`    | `/api/calendar`                             | Consultar el calendario global      | Autenticado     |
| `GET`    | `/api/patients/[id]/reminders`              | Listar recordatorios y candidatos   | Autenticado     |
| `POST`   | `/api/patients/[id]/reminders`              | Crear un recordatorio               | Autenticado     |
| `GET`    | `/api/patients/[id]/reminders/[reminderId]` | Consultar un recordatorio           | Autenticado     |
| `PUT`    | `/api/patients/[id]/reminders/[reminderId]` | Reprogramar o cambiar su estado     | Autenticado     |
| `GET`    | `/api/internal/reminders/process`           | Ejecutar el procesador programado   | Secreto interno |
| `POST`   | `/api/internal/reminders/process`           | Ejecutar el procesador manualmente  | Secreto interno |

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

La rama `feature/reminders` completó el bloque de recordatorios de la Fase 6:

- Contratos, validaciones e identidad determinista.
- Persistencia e índices especializados en Redis.
- Servicio de candidatos, creación, reprogramación y control de estados.
- API administrativa autenticada y aislada por paciente.
- Interfaz responsive integrada en el perfil de la paciente.
- Motor idempotente con bloqueo, reintentos y recuperación.
- Endpoint interno autenticado mediante `CRON_SECRET`.
- Programación diaria mediante Vercel Cron.
- Pruebas automatizadas y validación manual de autorización e idempotencia.

El siguiente paso es abrir un pull request hacia `develop` y verificar GitHub Actions y Vercel Preview. Telegram continuará posteriormente y de forma aislada en `feature/telegram`.

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
- Canal interno preparado para incorporar Telegram sin acoplar el dominio.

Rama utilizada para el calendario: `feature/calendar`.

Rama utilizada para recordatorios: `feature/reminders`.

### Fase 7 — Bot de Telegram

**Estado: planificada**

- Integración mediante grammY.
- Webhook protegido con secreto.
- Asociación segura entre usuario y chat autorizado.
- Envío de recordatorios.
- Confirmación o actualización del estado de una actividad.
- Manejo de errores y reintentos controlados.
- Auditoría básica de mensajes enviados.
- Protección de información sensible en las notificaciones.

Rama prevista: `feature/telegram`.

### Fase 8 — Reportes y exportación

**Estado: planificada**

- Reportes por paciente y periodo.
- Resumen de seguimientos.
- Indicadores administrativos.
- Exportación a formatos definidos por el proyecto.
- Filtros y rangos de fechas.
- Controles de acceso a información exportada.

Ramas previstas: `feature/reports` y `feature/export`.

### Fase 9 — Perfil, configuración y auditoría

**Estado: planificada**

- Perfil del usuario.
- Preferencias de interfaz y notificación.
- Configuración administrativa.
- Gestión futura de roles y permisos.
- Registro de acciones relevantes.
- Observabilidad y trazabilidad de errores.

Ramas previstas: `feature/profile`, `feature/settings` y `feature/audit-log`.

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

El bloque de recordatorios de la Fase 6 está terminado en `feature/reminders`. El siguiente paso es completar su integración mediante un pull request hacia `develop`:

```bash
git status
git log --oneline origin/develop..HEAD
git diff --check origin/develop...HEAD
```

Después del merge y la validación en `develop`, se podrá promover el cambio a `main`. La siguiente iteración funcional prevista es la integración de **Telegram**, que deberá comenzar en `feature/telegram` desde un `develop` actualizado.

## Licencia

Definir la licencia del proyecto antes de su distribución pública.
