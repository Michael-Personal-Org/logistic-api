import { createApp } from '@/app'
import { userTokens, users } from '@/features/users/infrastructure/db/user.schema'
import { ResendEmailService } from '@/features/users/infrastructure/services/resend.email.service'
import { desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// ----- Mock del email service -----
// vi.mock('@/features/users/infrastructure/services/resend.email.service', () => ({
//   ResendEmailService: vi.fn().mockImplementation(() => ({
//     sendWelcome: vi.fn().mockResolvedValue(undefined),
//     sendPasswordReset: vi.fn().mockResolvedValue(undefined),
//   })),
// }))

vi.mock('@/features/users/infrastructure/services/resend.email.service', () => ({
  ResendEmailService: vi.fn(
    class ResendEmailService {
      sendWelcome = vi.fn().mockResolvedValue(undefined)
      sendPasswordReset = vi.fn().mockResolvedValue(undefined)
    }
  ),
}))

// ─── Setup ───────────────────────────────────────────────
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL no está definida')

const client = postgres(databaseUrl)
const db = drizzle(client, { schema: { users, userTokens } })
const app = createApp()

beforeAll(async () => {
  await migrate(db, { migrationsFolder: './src/db/migrations' })
})

beforeEach(async () => {
  await db.delete(userTokens)
  await db.delete(users)
})

afterAll(async () => {
  await client.end()
})

// ─── Helpers ─────────────────────────────────────────────
const validUser = {
  email: 'john@example.com',
  password: 'Password1!',
  firstName: 'John',
  lastName: 'Doe',
}

async function registerAndActivate() {
  // Registrar
  await request(app).post('/api/v1/auth/register').send(validUser)

  // Obtener token de activación directo desde DB
  const result = await db.select().from(userTokens).limit(1)
  const token = result[0]?.token
  if (!token) throw new Error('Token no encontrado')

  // Activar
  await request(app).get(`/api/v1/auth/activate?token=${token}`)

  return token
}

async function registerActivateAndLogin() {
  await registerAndActivate()

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: validUser.email, password: validUser.password })

  const accessToken = loginRes.body.data.accessToken
  const userId = loginRes.body.data.user.id
  return { accessToken, userId }
}

// ─── Tests ───────────────────────────────────────────────
describe('Auth E2E', () => {
  describe('POST /api/v1/auth/register', () => {
    it('debe registrar un usuario y retornar 201', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(validUser)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe('john@example.com')
      expect(res.body.data.userId).toBeDefined()
    })

    it('debe retornar 409 si el email ya existe', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser)

      const res = await request(app).post('/api/v1/auth/register').send(validUser)

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
    })

    it('debe retornar 400 si el body es invalido', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: '123' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/auth/activate', () => {
    it('debe activar la cuenta con token valido', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser)

      const result = await db.select().from(userTokens).limit(1)
      const token = result[0]?.token

      const res = await request(app).get(`/api/v1/auth/activate?token=${token}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 400 con token invalido', async () => {
      const res = await request(app).get('/api/v1/auth/activate?token=invalid-token')

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('debe retornar tokens con credenciales validas', async () => {
      await registerAndActivate()

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })

      expect(res.status).toBe(200)
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.refreshToken).toBeDefined()
      expect(res.body.data.requiresTwoFactor).toBe(false)
    })

    it('debe retornar 401 con contraseña incorrecta', async () => {
      await registerAndActivate()

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'WrongPassword1!' })

      expect(res.status).toBe(401)
    })

    it('debe retornar 401 si la cuenta no esta activada', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser)

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('debe cerrar sesion correctamente', async () => {
      const { accessToken } = await registerActivateAndLogin()

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 401 sin token', async () => {
      const res = await request(app).post('/api/v1/auth/logout')

      expect(res.status).toBe(401)
    })

    it('el token no debe funcionar despues del logout', async () => {
      const { accessToken } = await registerActivateAndLogin()

      await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`)

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/forgot-password', () => {
    it('debe retornar 200 aunque el email no exista', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'noexiste@example.com' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 200 con email existente', async () => {
      await registerAndActivate()

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: validUser.email })

      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/v1/auth/reset-password', () => {
    it('debe resetear la contraseña con token valido', async () => {
      await registerAndActivate()

      // 1. Solicitar reset de contraseña
      await request(app).post('/api/v1/auth/forgot-password').send({ email: validUser.email })

      // 2. Obtener el token MÁS RECIENTE (el de reset)
      const tokens = await db
        .select()
        .from(userTokens)
        .orderBy(desc(userTokens.createdAt)) // ← importante: el más nuevo primero
        .limit(1)

      const token = tokens[0]?.token
      if (!token) throw new Error('No se encontró token de reset en la base de datos')

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'NewPassword1!' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe poder login con la nueva contraseña', async () => {
      await registerAndActivate()

      await request(app).post('/api/v1/auth/forgot-password').send({ email: validUser.email })

      // Obtener el token más reciente
      const tokens = await db.select().from(userTokens).orderBy(desc(userTokens.createdAt)).limit(1)

      const token = tokens[0]?.token
      if (!token) throw new Error('No se encontró token de reset')

      // Resetear contraseña
      await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword: 'NewPassword1!' })

      // Intentar login con la nueva contraseña
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'NewPassword1!' })

      expect(loginRes.status).toBe(200)
      expect(loginRes.body.data.accessToken).toBeDefined()
    })
  })

  describe('DELETE /api/v1/auth/account', () => {
    it('debe eliminar la cuenta correctamente', async () => {
      const { accessToken } = await registerActivateAndLogin()

      const res = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: validUser.password })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('debe retornar 401 con contraseña incorrecta', async () => {
      const { accessToken } = await registerActivateAndLogin()

      const res = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'WrongPassword1!' })

      expect(res.status).toBe(401)
    })

    it('debe retornar 401 sin token de autenticacion', async () => {
      const res = await request(app)
        .delete('/api/v1/auth/account')
        .send({ password: validUser.password })

      expect(res.status).toBe(401)
    })
  })
})
