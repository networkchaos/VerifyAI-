import pool from '../db/init.js'
import { v4 as uuidv4 } from 'uuid'

export const createAuditLog = async ({ voterId, action, actor, details }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, voter_id, action, actor, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), voterId, action, actor || 'system', JSON.stringify(details || {})]
    )
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit logging should not break the main flow
  }
}
