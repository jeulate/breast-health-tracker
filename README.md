# Breast Health Tracker

Plataforma web para el seguimiento organizado de pacientes, hallazgos mamarios, controles clínicos y recordatorios asociados a casos BI-RADS.

El proyecto combina un dashboard administrativo, persistencia en Redis, autenticación segura, automatización de calidad y una futura integración con Telegram.

> [!IMPORTANT]
> Breast Health Tracker es una herramienta de registro, seguimiento y acompañamiento. No realiza diagnósticos, no prescribe tratamientos y no sustituye la evaluación de un profesional de salud.

## Estado del proyecto

La fase de arquitectura base e interfaz inicial se encuentra terminada y desplegada.

| Área | Estado | Implementación |
| --- | --- | --- |
| Arquitectura inicial | Completada | Next.js 16, App Router y TypeScript |
| Persistencia | Completada | Upstash Redis con aislamiento por prefijo |
| Autenticación | Completada | JWT, cookie HTTP-only y rutas protegidas |
| Gestión inicial de pacientes | Completada | Listado, creación, consulta y edición |
| Dashboard base | Completada | Header, sidebar y tarjetas reutilizables |
| Diseño responsive | Completada | Sidebar colapsable en escritorio y drawer móvil |
| Modo oscuro | Completada | Tema persistente y componentes adaptados |
| Calidad | Completada | Formato, lint, typecheck, tests y build |
| CI/CD | Completada | GitHub Actions y despliegue en Vercel |
| Dashboard analítico | Próxima fase | KPIs, gráficas y actividad reciente |
| Módulos clínicos | Planificados | Hallazgos, timeline, controles y recordatorios |
| Telegram | Planificado | Notificaciones y recordatorios automatizados |

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| Next.js 16 | Framework web con App Router |
| React | Construcción de la interfaz |
| TypeScript | Tipado estático |
| Tailwind CSS 4 | Sistema de estilos |
| Outfit | Tipografía principal de la interfaz |
| JetBrains Mono | Tipografía para datos técnicos y código |
| Upstash Redis | Persistencia mediante API REST |
| Zod | Validación de datos y variables de entorno |
| jose | Creación y verificación de JWT |
| bcryptjs | Hash seguro de contraseñas |
| Vitest | Pruebas automatizadas |
| GitHub Actions | Integración y entrega continua |
| Vercel | Hosting y despliegue de producción |
| grammY | Integración futura con Telegram |

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
   └── Middleware de autenticación
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
│   └── seed.ts                  # Creación de datos iniciales
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Login, logout y sesión actual
│   │   │   └── patients/        # Operaciones de pacientes
│   │   ├── dashboard/           # Layout y páginas protegidas
│   │   ├── login/               # Inicio de sesión
│   │   └── layout.tsx           # Layout raíz y tipografías
│   ├── components/
│   │   ├── dashboard/           # Header, Sidebar y StatCard
│   │   ├── forms/               # LoginForm y PatientForm
│   │   └── ui/                  # Controles reutilizables
│   ├── config/                  # Validación de entorno
│   ├── features/
│   │   ├── auth/                # API pública del módulo de autenticación
│   │   └── patients/            # API pública del módulo de pacientes
│   ├── lib/
│   │   ├── auth/                # JWT, contraseñas y sesión
│   │   ├── redis/               # Cliente, claves y mapeadores
│   │   ├── utils/               # Utilidades y respuestas API
│   │   └── validations/         # Esquemas Zod
│   ├── repositories/            # Acceso a datos
│   ├── services/                # Reglas de negocio
│   ├── types/                   # Tipos compartidos
│   └── middleware.ts            # Protección de rutas
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
- Middleware para proteger `/dashboard`.
- Acceso administrativo en la fase actual.

### Pacientes

- Registro de pacientes.
- Listado de pacientes.
- Consulta individual.
- Actualización de información.
- Validación de formularios y payloads.
- Persistencia aislada en Redis.

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

| Variable | Descripción | Requerida |
| --- | --- | --- |
| `KV_REST_API_URL` | URL REST de Upstash Redis | Sí |
| `KV_REST_API_TOKEN` | Token de acceso a Upstash Redis | Sí |
| `KV_REST_API_READ_ONLY_TOKEN` | Token opcional de solo lectura | No |
| `HEALTH_APP_REDIS_PREFIX` | Prefijo de aislamiento; recomendado: `bht:v1:` | Sí |
| `NEXT_PUBLIC_APP_URL` | URL pública de la aplicación | Sí |
| `AUTH_SECRET` | Clave para firmar JWT; mínimo recomendado de 32 caracteres | Sí |
| `ADMIN_INITIAL_EMAIL` | Email utilizado por el seed del administrador | Para seed |
| `ADMIN_INITIAL_PASSWORD` | Contraseña inicial utilizada por el seed | Para seed |

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
```

> [!WARNING]
> No publiques `.env.local`, tokens, secretos ni credenciales reales en GitHub.

### Variables previstas para Telegram

Estas variables formarán parte de la fase de notificaciones y no deben considerarse activas hasta implementar el módulo correspondiente.

| Variable | Propósito futuro |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token entregado por BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | Validación de solicitudes del webhook |
| `TELEGRAM_CHAT_ID` | Chat autorizado para notificaciones |

## Configuración de Redis

1. Crear o seleccionar una base en Upstash.
2. Copiar la URL y el token REST a `.env.local`.
3. Definir `HEALTH_APP_REDIS_PREFIX=bht:v1:`.
4. Ejecutar el seed inicial.

El prefijo evita colisiones cuando una misma base Redis es compartida con otros proyectos.

## Datos iniciales

El seed crea un administrador y pacientes ficticios para verificar el funcionamiento local.

```bash
npm run seed
```

Los datos generados son exclusivamente demostrativos y no deben representar pacientes reales.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run start` | Inicia el build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Verifica TypeScript sin emitir archivos |
| `npm run format` | Aplica el formato configurado |
| `npm run format:check` | Verifica el formato sin modificar archivos |
| `npm run test` | Ejecuta las pruebas una vez |
| `npm run test:watch` | Ejecuta Vitest en modo observación |
| `npm run seed` | Carga datos iniciales en Redis |

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

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | Iniciar sesión | Público |
| `POST` | `/api/auth/logout` | Cerrar sesión | Autenticado |
| `GET` | `/api/auth/me` | Consultar la sesión actual | Autenticado |
| `GET` | `/api/patients` | Listar pacientes | Autenticado |
| `POST` | `/api/patients` | Registrar paciente | Autenticado |
| `GET` | `/api/patients/[id]` | Consultar un paciente | Autenticado |
| `PUT` | `/api/patients/[id]` | Actualizar un paciente | Autenticado |

## Estrategia Git

El repositorio emplea un flujo basado en ramas:

| Rama | Propósito |
| --- | --- |
| `main` | Versión estable de producción |
| `develop` | Integración de funcionalidades terminadas |
| `feature/*` | Desarrollo aislado de cada módulo o mejora |
| `fix/*` | Correcciones no urgentes integradas mediante `develop` |
| `hotfix/*` | Correcciones urgentes que parten de producción |

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

### Última iteración terminada

La rama `feature/dark-mode` completó correctamente el siguiente flujo:

- Desarrollo y ajustes visuales.
- Formato, lint, typecheck, tests y build aprobados.
- Merge hacia `develop`.
- Eliminación de la rama feature.
- Pull request de `develop` hacia `main`.
- GitHub Actions aprobado.
- Despliegue correcto en Vercel.
- Producción estable.

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

**Estado: siguiente fase**

Objetivo: convertir el dashboard inicial en una vista operativa con información real y una experiencia visual consistente para los módulos posteriores.

- Tarjetas KPI con datos reales.
- Total de pacientes registrados.
- Pacientes con controles próximos.
- Seguimientos pendientes.
- Distribución de hallazgos por categoría BI-RADS.
- Gráficas interactivas con ApexCharts o Recharts.
- Tendencias por periodo.
- Timeline de actividad reciente.
- Estados de carga, vacío y error.
- Animaciones sutiles.
- Diseño responsive y compatibilidad completa con dark mode.
- Servicios y repositorios para agregar métricas sin duplicar lógica.
- Pruebas unitarias para cálculos y transformaciones del dashboard.

Rama prevista: `feature/dashboard-v2`.

### Fase 3 — Gestión avanzada de pacientes

**Estado: planificada**

- Tabla moderna estilo TailAdmin.
- Buscador instantáneo.
- Filtros avanzados.
- Paginación.
- Ordenamiento por columnas.
- Badges de estado.
- Fotografía o avatar del paciente.
- Estados clínicos y administrativos diferenciados.
- Historial de modificaciones relevantes.

Rama prevista: `feature/patients-v2`.

### Fase 4 — Hallazgos BI-RADS

**Estado: planificada**

- Registro de hallazgos por paciente.
- Categoría BI-RADS.
- Identificación de mama izquierda o derecha.
- Tipo de estudio: ecografía, mamografía o resonancia.
- Registro de biopsias cuando corresponda.
- Descripción y observaciones del hallazgo.
- Fecha del estudio y próximo control sugerido por el profesional.
- Archivos o referencias documentales, sujetos a controles de privacidad.
- Historial de cambios en la categoría BI-RADS.

Rama prevista: `feature/findings`.

### Fase 5 — Timeline clínico y seguimiento

**Estado: planificada**

- Línea de tiempo cronológica por paciente.
- Estudios y hallazgos relacionados.
- Controles programados y realizados.
- Síntomas y observaciones registrados.
- Comparación histórica de seguimientos.
- Visualización clara de eventos pendientes y completados.

Rama prevista: `feature/clinical-timeline`.

### Fase 6 — Calendario y recordatorios

**Estado: planificada**

- Calendario de controles.
- Próximas citas y estudios.
- Recordatorios configurables.
- Estados pendiente, enviado, completado y cancelado.
- Procesamiento programado mediante cron.
- Prevención de notificaciones duplicadas.
- Registro de ejecución y errores.

Ramas previstas: `feature/calendar` y `feature/reminders`.

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

La siguiente iteración corresponde a la **Fase 2 — Dashboard analítico** y deberá comenzar desde `develop` en una nueva rama:

```bash
git switch develop
git pull origin develop
git switch -c feature/dashboard-v2
```

Antes de implementar componentes visuales se definirán los KPIs, las fuentes de datos, los contratos de servicio y los estados de interfaz necesarios.

## Licencia

Definir la licencia del proyecto antes de su distribución pública.