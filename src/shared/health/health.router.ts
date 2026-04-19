import { Router } from 'express'
import { getHealthReport } from './health.service'

export const healthRouter = Router()

// Health check publico - usado por load balancers y monitoreo
healthRouter.get('/', async (_req, res) => {
  const report = await getHealthReport()

  // 200 = healthy / degraded, 503 unhealthy
  const statusCode = report.status === 'unhealthy' ? 503 : 200

  res.status(statusCode).json(report)
})

// Liveness - verifica que el proceso responde
healthRouter.get('/live', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

// Readiness = verifica que puede recibir trafico
healthRouter.get('/ready', async (_req, res) => {
  const report = await getHealthReport()
  const isReady = report.status !== 'unhealthy'

  res.status(isReady ? 200 : 503).json({ ready: isReady, services: report.services })
})
