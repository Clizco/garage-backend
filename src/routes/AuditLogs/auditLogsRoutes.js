import { Router } from "express"
import { getAuditLogs, getAuditLogsByEntity, getLogsByUser } from "../../services/auditLogService.js"

const auditLogsRouter = Router()

// Obtener todos los logs (con paginación)
auditLogsRouter.get("/all", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100
    const offset = parseInt(req.query.offset) || 0

    const logs = await getAuditLogs(limit, offset)
    res.json(logs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener logs" })
  }
})

// Obtener logs de una entidad específica
auditLogsRouter.get("/entity/:entityType/:entityId", async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    const logs = await getAuditLogsByEntity(entityType, parseInt(entityId))
    res.json(logs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener logs de entidad" })
  }
})

// Obtener logs de un usuario
auditLogsRouter.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit) || 100
    const logs = await getLogsByUser(parseInt(userId), limit)
    res.json(logs)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener logs del usuario" })
  }
})

export default auditLogsRouter
