import { config } from 'dotenv'

config()

process.env.NODE_ENV ??= 'test'
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/logistic_api_test'
process.env.REDIS_URL ??= 'redis://localhost:6379'
process.env.JWT_ACCESS_SECRET ??= 'test_secret_access_muy_largo_de_al_menos_32_chars'
process.env.JWT_REFRESH_SECRET ??= 'test_secret_refresh_muy_largo_de_al_menos_32_chars'
process.env.JWT_ACCESS_EXPIRES_IN ??= '15m'
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d'
process.env.RESEND_API_KEY ??= 're_test_dummy_key'
process.env.EMAIL_FROM ??= 'test@test.com'
process.env.APP_URL ??= 'http://localhost:3000'
