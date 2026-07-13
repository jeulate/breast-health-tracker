# BI-RADS Tracker

Plataforma de seguimiento y acompa�amiento de salud mamaria para pacientes con hallazgos BI-RADS 3.

> **Aviso m�dico:** Esta plataforma es una herramienta de seguimiento y acompa�amiento. **No realiza diagn�sticos ni sustituye la consulta m�dica.** Ante cualquier duda consulte siempre a un profesional de la salud.

---

## Stack

| Tecnolog�a    | Versi�n          | Rol           |
| ------------- | ---------------- | ------------- |
| Next.js       | 16 (App Router)  | Framework     |
| TypeScript    | 5                | Lenguaje      |
| Tailwind CSS  | 4                | Estilos       |
| Upstash Redis | `@upstash/redis` | Base de datos |
| Zod           | 4                | Validaciones  |
| jose          | 6                | JWT           |
| bcryptjs      | 3                | Hashing       |
| Vitest        | 4                | Tests         |

---

## Instalaci�n

```bash
# 1. Clonar el repositorio
git clone <url>
cd breast-health-tracker

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores
```

---

## Variables de entorno

| Variable                      | Descripci�n                           | Requerida |
| ----------------------------- | ------------------------------------- | --------- |
| `NEXT_PUBLIC_APP_URL`         | URL p�blica de la aplicaci�n          | S�        |
| `AUTH_SECRET`                 | Secret para firmar JWT (min 32 chars) | S�        |
| `ADMIN_INITIAL_EMAIL`         | Email del admin inicial (seed)        | Seed      |
| `ADMIN_INITIAL_PASSWORD`      | Contrase�a del admin inicial (seed)   | Seed      |
| `KV_REST_API_URL`             | URL de Upstash Redis                  | S�        |
| `KV_REST_API_TOKEN`           | Token de Upstash Redis                | S�        |
| `KV_REST_API_READ_ONLY_TOKEN` | Token de solo lectura (opcional)      | No        |

---

## Configuraci�n de Redis

1. Crear una base de datos en [console.upstash.com](https://console.upstash.com).
2. Copiar `KV_REST_API_URL` y `KV_REST_API_TOKEN` al `.env.local`.
3. La aplicaci�n usa el cliente REST de Upstash (compatible con Edge Runtime).

---

## Ejecuci�n local

```bash
npm run dev
# Abre http://localhost:3000
```

---

## Seed

Crea un administrador ficticio y dos pacientes de prueba:

```bash
npm run seed
```

Las credenciales del admin se muestran en la consola.

---

## Pruebas

```bash
npm run test          # una sola vez
npm run test:watch    # modo watch
```

---

## Scripts disponibles

| Script                 | Descripci�n                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Servidor de desarrollo           |
| `npm run build`        | Compilar para producci�n         |
| `npm run start`        | Iniciar servidor de producci�n   |
| `npm run lint`         | ESLint                           |
| `npm run typecheck`    | TypeScript sin emitir            |
| `npm run format`       | Prettier (corrige)               |
| `npm run format:check` | Prettier (solo verifica)         |
| `npm run test`         | Vitest (una vez)                 |
| `npm run test:watch`   | Vitest (watch)                   |
| `npm run seed`         | Poblar Redis con datos iniciales |

---

## Estructura de carpetas

```
src/
  app/
    api/auth/        ? Endpoints de autenticaci�n
    api/patients/    ? Endpoints de pacientes
    dashboard/       ? P�ginas del panel
    login/           ? P�gina de inicio de sesi�n
  components/
    dashboard/       ? Sidebar, Header, StatCard, MedicalDisclaimer
    forms/           ? LoginForm, PatientForm
    ui/              ? Button, Input
  features/
    auth/            ? Barril p�blico del dominio auth
    patients/        ? Barril p�blico del dominio patients
  lib/
    auth/            ? JWT, password hashing, session
    redis/           ? Cliente Redis singleton
    validations/     ? Schemas Zod
    utils/           ? Helpers de ApiResponse
  repositories/      ? Acceso a Redis
  services/          ? L�gica de negocio
  config/            ? Validaci�n de variables de entorno
  types/             ? Tipos TypeScript globales
  middleware.ts      ? Protecci�n de rutas (Edge)

scripts/
  seed.ts            ? Datos iniciales

tests/
  unit/              ? Pruebas unitarias

docs/
  architecture.md    ? Documentaci�n t�cnica
  copilot-next-steps.md ? Roadmap de fases
```

---

## Autenticaci�n

- Login con email y contrase�a (bcrypt + JWT).
- Cookie HTTP-only con expiraci�n de 8 horas.
- Middleware Edge protege `/dashboard`.
- Solo rol `ADMIN` puede acceder en esta fase.

---

## Endpoints actuales

| M�todo | Ruta                 | Descripci�n         |
| ------ | -------------------- | ------------------- |
| `POST` | `/api/auth/login`    | Iniciar sesi�n      |
| `POST` | `/api/auth/logout`   | Cerrar sesi�n       |
| `GET`  | `/api/auth/me`       | Usuario actual      |
| `GET`  | `/api/patients`      | Listar pacientes    |
| `POST` | `/api/patients`      | Crear paciente      |
| `GET`  | `/api/patients/[id]` | Detalle de paciente |
| `PUT`  | `/api/patients/[id]` | Actualizar paciente |

---

## Funciones pendientes

- Hallazgos BI-RADS, s�ntomas y ciclos (Fase 2)
- H�bitos y controles m�dicos (Fase 3)
- Bot de Telegram y m�quina de estados (Fase 4)
- Recordatorios, cron y alertas (Fase 5)
- Exportaciones, gr�ficas y observabilidad (Fase 6)
- Deploy de producci�n (Fase 7)

Ver [`docs/copilot-next-steps.md`](docs/copilot-next-steps.md) para el roadmap completo.
