import { z } from 'zod'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.url('DATABASE_URL debe ser una URL válida'),

  // Redis
  REDIS_URL: z.url('REDIS_URL debe ser una URL válida'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email (Resend)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY es requerida'),
  EMAIL_FROM: z.email('EMAIL_FROM debe ser un email válido'),

  // App
  APP_URL: z.url('APP_URL debe ser una URL válida'),
})

export type Env = z.infer<typeof envSchema>

// IIFE para que TypeScript entienda que el módulo siempre exporta `env` definido
function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Variables de entorno inválidas:\n')
    const errors = parsed.error.flatten().fieldErrors

    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  ${field}: ${messages?.join(', ')}`)
    }

    process.exit(1)
  }

  return parsed.data
}

export const env: Env = loadEnv()
