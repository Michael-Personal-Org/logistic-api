<div align="center">
  <h1>🚛 LogiTrack API</h1>
  <p>API REST para sistema de gestión logística y transporte de carga (TMS)</p>

  ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
  ![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?style=flat&logo=bun)
  ![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat&logo=express)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)
  ![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis)
  ![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat&logo=docker)
  ![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat&logo=github-actions)
</div>

---

## 📋 Descripción

**LogiTrack** es una plataforma de logística y transporte de carga desarrollada para la República Dominicana. Permite gestionar órdenes de transporte, conductores, camiones y el rastreo en tiempo real de envíos.

La API está diseñada para ser consumida por:
- 🌐 **Web App** — para clientes y operadores/administradores
- 📱 **App Móvil** — para conductores (próximamente)

---

## 🏗️ Arquitectura y Diseño

Aplicamos **Clean Architecture** combinada con **Vertical Slicing** para mantener un código desacoplado y escalable por funcionalidades:

```text
├── src/
│   ├── features/          # Lógica de dominio organizada por módulos
│   │   ├── users/         # Auth, usuarios y RBAC
│   │   ├── profiles/      # Perfiles de cliente y conductor
│   │   ├── audit/         # Logs de auditoría
│   │   └── trucks/        # Gestión de la flota de camiones
│   └── shared/            # Componentes reutilizables (DB, middle, utils)
```

## 🚀 Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Bun 1.3 |
| Framework | Express 5 |
| Lenguaje | TypeScript 5 |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL 16 |
| Cache/Sessions | Redis 7 |
| Emails | Resend |
| Autenticación | JWT + 2FA (TOTP) |
| Validación | Zod 4 |
| Logging | Winston |
| Testing | Vitest |
| Linting | Biome |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deploy | VPS (RackNerd) |

---

## 📦 Módulos actuales (v1.0.0-beta)

- ✅ **Auth** — Registro, login, logout, 2FA, forgot/reset password
- ✅ **Users** — Gestión completa con RBAC (CLIENT, DRIVER, OPERATOR, ADMIN)
- ✅ **Profiles** — Perfiles de cliente (empresa/RNC) y conductor (licencia/placa)
- ✅ **Audit Logs** — Trazabilidad de todas las acciones del sistema
- ✅ **Trucks** — CRUD de camiones, tipos de carga, asignación de conductor

## 🔜 Próximos módulos

- ⬜ **Orders** — Creación, estados, asignación y tracking de órdenes
- ⬜ **Real-time Tracking** — Socket.IO + Redis Pub/Sub
- ⬜ **Notifications** — BullMQ + push notifications
- ⬜ **Digital Signatures** — Firma de recepción y entrega

---

## 🛠️ Instalación local

### Prerequisitos
- [Bun](https://bun.sh) >= 1.3
- [Docker](https://docker.com) >= 24

### Setup

```bash
# Clonar el repositorio
git clone git@github.com:Michael-Personal-Org/logistic-api.git
cd logistic-api

# Instalar dependencias
bun install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Levantar servicios (PostgreSQL + Redis)
bun run docker:up

# Correr migraciones
bun run db:migrate

# Iniciar en modo desarrollo
bun run dev
```

---

## 🧪 Testing

```bash
# Unit tests
bun run test:unit

# Integration tests
bun run test:integration

# E2E tests
bun run test:e2e

# Todos los tests
bun run test:unit && bun run test:integration && bun run test:e2e
```

---

## 📡 API Endpoints

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registro de cliente |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/activate` | Activar cuenta |
| POST | `/api/v1/auth/forgot-password` | Solicitar reset |
| POST | `/api/v1/auth/reset-password` | Resetear contraseña |
| POST | `/api/v1/auth/2fa/enable` | Habilitar 2FA |
| POST | `/api/v1/auth/2fa/verify` | Verificar código 2FA |

### Profiles
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/profiles/client` | Crear perfil de cliente |
| GET | `/api/v1/profiles/client` | Ver mi perfil |
| PUT | `/api/v1/profiles/client` | Actualizar perfil |
| PATCH | `/api/v1/profiles/client/:userId/approve` | Aprobar perfil |
| POST | `/api/v1/profiles/driver` | Crear perfil de conductor |
| GET | `/api/v1/profiles/driver` | Ver mi perfil |

### Trucks
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/trucks` | Listar camiones |
| POST | `/api/v1/trucks` | Crear camión |
| GET | `/api/v1/trucks/:id` | Ver camión |
| PUT | `/api/v1/trucks/:id` | Actualizar camión |
| PATCH | `/api/v1/trucks/:id/assign-driver` | Asignar conductor |
| DELETE | `/api/v1/trucks/:id` | Eliminar camión |

### Health
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado general |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

---

## 🌿 Gitflow
main      → producción
develop   → integración
feature/* → nuevos features
fix/*     → bug fixes
release/* → preparación de releases


---

## 📄 Licencia

© 2026 LogiTrack. Proyecto privado.
