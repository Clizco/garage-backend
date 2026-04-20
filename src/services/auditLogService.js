import { pool } from "../db.js"
import jwt from "jsonwebtoken"
import config from "../config.js"

let auditTableChecked = false

async function ensureAuditLogsTable() {
  if (auditTableChecked) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      user_email VARCHAR(100),
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT,
      entity_name VARCHAR(255),
      changes JSON,
      ip_address VARCHAR(50),
      user_agent VARCHAR(500),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_entity_type (entity_type),
      INDEX idx_timestamp (timestamp)
    )
  `)

  auditTableChecked = true
}

export function extractActorFromRequest(req) {
  if (req?.user) {
    return {
      userId: req.user.id || null,
      userEmail: req.user.user_email || req.user.email || null,
    }
  }

  const bearer = req?.headers?.authorization
  const xAccessToken = req?.headers?.["x-access-token"]
  const token =
    (typeof bearer === "string" && bearer.startsWith("Bearer ")
      ? bearer.slice(7).trim()
      : null) ||
    (typeof xAccessToken === "string" ? xAccessToken : null)

  if (!token) {
    return { userId: null, userEmail: null }
  }

  try {
    const decoded = jwt.verify(token, config.secret)
    return {
      userId: decoded?.id || null,
      userEmail: decoded?.user_email || decoded?.email || null,
    }
  } catch {
    return { userId: null, userEmail: null }
  }
}

export async function createAuditLog({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  entityName,
  changes = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    await ensureAuditLogsTable()
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, entity_name, changes, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userEmail,
        action,
        entityType,
        entityId,
        entityName,
        changes ? JSON.stringify(changes) : null,
        ipAddress,
        userAgent,
      ]
    )
  } catch (error) {
    console.error("Error registrando log de auditoría:", error)
  }
}

export async function getAuditLogs(limit = 100, offset = 0) {
  try {
    await ensureAuditLogsTable()
    const [logs] = await pool.query(
      `SELECT al.*, u.user_firstname, u.user_lastname
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.timestamp DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    return logs
  } catch (error) {
    console.error("Error obteniendo logs:", error)
    return []
  }
}

export async function getAuditLogsByEntity(entityType, entityId) {
  try {
    await ensureAuditLogsTable()
    const [logs] = await pool.query(
      `SELECT al.*, u.user_firstname, u.user_lastname
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.entity_type = ? AND al.entity_id = ?
       ORDER BY al.timestamp DESC`,
      [entityType, entityId]
    )
    return logs
  } catch (error) {
    console.error("Error obteniendo logs de entidad:", error)
    return []
  }
}

export async function getLogsByUser(userId, limit = 100) {
  try {
    await ensureAuditLogsTable()
    const [logs] = await pool.query(
      `SELECT *
       FROM audit_logs
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [userId, limit]
    )
    return logs
  } catch (error) {
    console.error("Error obteniendo logs del usuario:", error)
    return []
  }
}
