import { pool } from "../db.js"
import jwt from "jsonwebtoken"
import config from "../config.js"

let auditTableChecked = false

const ACTION_BY_METHOD = {
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
}

const ENTITY_TYPE_BY_SEGMENT = {
  users: "USER",
  roles: "ROLE",
  provinces: "PROVINCE",
  vehicles: "VEHICLE",
  "vehicle-inspections": "VEHICLE_INSPECTION",
  parts: "PART",
  drivers: "DRIVER",
  clients: "CLIENT",
  "exit-orders": "EXIT_ORDER",
  milages: "MILEAGE",
  "workshop-reports": "WORKSHOP_REPORT",
  routes: "ROUTE",
  observations: "OBSERVATION",
  contacts: "CONTACT",
  locations: "LOCATION",
  owners: "OWNER",
  accounts: "ACCOUNT",
}

const AUTO_AUDIT_EXCLUDED_PATHS = [
  "/audit-logs",
  "/users/signin",
  "/users/signup",
  "/users/user/token",
  "/account/",
]

const AUTO_AUDIT_MANUAL_SEGMENTS = new Set(["vehicles", "vehicle-inspections"])

function sanitizeAuditValue(value) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `[buffer:${value.length}]`
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeAuditValue(item))
      .filter((item) => item !== undefined)
  }
  if (typeof value === "object") {
    const cleaned = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      if (["user_password", "password", "token", "auth", "decode"].includes(key)) continue
      const sanitized = sanitizeAuditValue(nestedValue)
      if (sanitized !== undefined) {
        cleaned[key] = sanitized
      }
    }
    return cleaned
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  return value
}

function getRequestPath(req) {
  return String(req?.originalUrl || req?.url || "").split("?")[0]
}

function getPrimarySegment(req) {
  const path = getRequestPath(req)
  return path.split("/").filter(Boolean)[0] || ""
}

function shouldAutoAudit(req) {
  const action = ACTION_BY_METHOD[req?.method]
  if (!action) return false

  const path = getRequestPath(req)
  if (AUTO_AUDIT_EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded))) {
    return false
  }

  const segment = getPrimarySegment(req)
  if (!segment || AUTO_AUDIT_MANUAL_SEGMENTS.has(segment)) {
    return false
  }

  return true
}

function shouldRequireAuthenticatedMutation(req) {
  const action = ACTION_BY_METHOD[req?.method]
  if (!action) return false

  const path = getRequestPath(req)
  if (AUTO_AUDIT_EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded))) {
    return false
  }

  return true
}

function inferEntityType(req) {
  const segment = getPrimarySegment(req)
  return ENTITY_TYPE_BY_SEGMENT[segment] || segment.toUpperCase() || "SYSTEM"
}

function coerceNumericId(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeToken(rawToken) {
  if (typeof rawToken !== "string") return null
  const trimmed = rawToken.trim().replace(/^"|"$/g, "")
  return trimmed.length ? trimmed : null
}

function inferEntityId(req, responseBody) {
  const candidates = [
    responseBody?.id,
    responseBody?.insertId,
    responseBody?.entity_id,
    req?.params?.id,
    req?.params?.entityId,
    req?.body?.id,
    req?.body?.vehicle_id,
    req?.body?.client_id,
    req?.body?.driver_id,
    req?.body?.user_id,
  ]

  for (const candidate of candidates) {
    const parsed = coerceNumericId(candidate)
    if (parsed !== null) return parsed
  }

  return null
}

function inferEntityName(req, responseBody, entityType) {
  const source = {
    ...(typeof responseBody === "object" && responseBody ? responseBody : {}),
    ...(typeof req?.body === "object" && req.body ? req.body : {}),
    ...(typeof req?.params === "object" && req.params ? req.params : {}),
  }

  const candidateKeys = [
    "placa",
    "entity_name",
    "client_name",
    "owner_name",
    "location_name",
    "route_name",
    "person_fullname",
    "vehicle_license_plate",
    "driver_name",
    "driver_control_number",
    "part_name",
    "contact_name",
    "user_email",
    "email",
    "nif",
    "account_nif",
    "account_name",
    "name",
    "id",
  ]

  for (const key of candidateKeys) {
    const value = sanitizeAuditValue(source[key])
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value)
    }
  }

  const entityId = inferEntityId(req, responseBody)
  return entityId !== null ? `${entityType} #${entityId}` : entityType
}

function inferChanges(req, action) {
  const sanitizedBody = sanitizeAuditValue(req?.body)

  if (action === "DELETE") {
    return sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : null
  }

  if (sanitizedBody && typeof sanitizedBody === "object" && Object.keys(sanitizedBody).length > 0) {
    return sanitizedBody
  }

  return null
}

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
  const bodyUserId = coerceNumericId(req?.body?.user_id)

  if (req?.user) {
    return {
      userId: req.user.id || bodyUserId || null,
      userEmail: req.user.user_email || req.user.email || null,
    }
  }

  const bearer = req?.headers?.authorization
  const xAccessToken = req?.headers?.["x-access-token"]
  const cookieToken = req?.cookies?.token
  const authToken = normalizeToken(
    typeof bearer === "string"
      ? bearer.replace(/^Bearer\s+/i, "")
      : null
  )
  const token =
    authToken ||
    normalizeToken(typeof xAccessToken === "string" ? xAccessToken : null) ||
    normalizeToken(cookieToken)

  if (!token) {
    return { userId: null, userEmail: null }
  }

  try {
    const decoded = jwt.verify(token, config.secret)
    return {
      userId: decoded?.id || bodyUserId || null,
      userEmail: decoded?.user_email || decoded?.email || null,
    }
  } catch {
    const decodedUnsafe = jwt.decode(token)
    return {
      userId: coerceNumericId(decodedUnsafe?.id) || bodyUserId || null,
      userEmail: decodedUnsafe?.user_email || decodedUnsafe?.email || null,
    }
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

export function requireAuthenticatedMutation(req, res, next) {
  if (!shouldRequireAuthenticatedMutation(req)) {
    return next()
  }

  const actor = extractActorFromRequest(req)
  if (!actor.userId) {
    return res.status(401).json({
      message: "Acción bloqueada: usuario no identificado. Inicia sesión nuevamente.",
    })
  }

  req.user = {
    ...(req.user || {}),
    id: actor.userId,
    email: actor.userEmail,
    user_email: actor.userEmail,
  }

  next()
}

export function autoAuditMiddleware(req, res, next) {
  if (!shouldAutoAudit(req)) {
    return next()
  }

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    res.locals.auditResponseBody = body
    return originalJson(body)
  }

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return

    const action = ACTION_BY_METHOD[req.method]
    if (!action) return

    const actor = extractActorFromRequest(req)
    const entityType = inferEntityType(req)
    const entityId = inferEntityId(req, res.locals.auditResponseBody)
    const entityName = inferEntityName(req, res.locals.auditResponseBody, entityType)
    const changes = inferChanges(req, action)

    createAuditLog({
      userId: actor.userId,
      userEmail: actor.userEmail,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    }).catch((error) => {
      console.error("Error en auditoría automática:", error)
    })
  })

  next()
}
