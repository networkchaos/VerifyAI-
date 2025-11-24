// API endpoint to get all verifications/history
import express from 'express'
import pool from '../db/init.js'

const router = express.Router()

/**
 * GET /api/verifications
 * Returns all verification records with their status
 * Query params: status (optional) - filter by status
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    
    let query = `
      SELECT 
        id,
        id_number,
        name,
        dob,
        phone,
        address,
        verification_status,
        flagged_reason,
        face_similarity,
        validation_errors,
        id_image_url,
        selfie_image_url,
        id_ocr,
        created_at
      FROM voters
    `
    
    const params = []
    
    if (status) {
      query += ` WHERE verification_status = $1`
      params.push(status)
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit), parseInt(offset))
    
    const result = await pool.query(query, params)
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM voters'
    const countParams = []
    if (status) {
      countQuery += ' WHERE verification_status = $1'
      countParams.push(status)
    }
    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)
    
    res.json({
      status: 'success',
      verifications: result.rows.map(row => {
        // Handle validation_errors - JSONB is already parsed by PostgreSQL
        let validationErrors = null
        if (row.validation_errors) {
          if (typeof row.validation_errors === 'string') {
            // If it's a string, try to parse it
            try {
              validationErrors = JSON.parse(row.validation_errors)
            } catch (e) {
              // If parsing fails, treat it as a single error message
              validationErrors = [row.validation_errors]
            }
          } else if (Array.isArray(row.validation_errors)) {
            // Already an array
            validationErrors = row.validation_errors
          } else if (typeof row.validation_errors === 'object') {
            // Already an object, convert to array if needed
            validationErrors = Array.isArray(row.validation_errors) ? row.validation_errors : [row.validation_errors]
          }
        }
        
        // Handle id_ocr - JSONB is already parsed by PostgreSQL
        let ocrData = null
        if (row.id_ocr) {
          if (typeof row.id_ocr === 'string') {
            try {
              ocrData = JSON.parse(row.id_ocr)
            } catch (e) {
              ocrData = null
            }
          } else {
            ocrData = row.id_ocr
          }
        }
        
        return {
          id: row.id,
          idNumber: row.id_number,
          name: row.name,
          dateOfBirth: row.dob,
          phone: row.phone,
          address: row.address,
          status: row.verification_status,
          flaggedReason: row.flagged_reason,
          faceSimilarity: row.face_similarity,
          validationErrors,
          idImageUrl: row.id_image_url,
          selfieImageUrl: row.selfie_image_url,
          idBackImageUrl: ocrData?.idBackImageUrl || null,
          ocrData: ocrData,
          createdAt: row.created_at,
          isApproved: row.verification_status === 'verified',
          isFailed: row.verification_status === 'flagged' || row.verification_status === 'rejected',
        }
      }),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error) {
    console.error('Error fetching verifications:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch verifications',
    })
  }
})

/**
 * GET /api/verifications/stats
 * Returns statistics about verifications
 * NOTE: Must come before /:id route to avoid conflicts
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        verification_status,
        COUNT(*) as count
      FROM voters
      GROUP BY verification_status
    `)
    
    const stats = {
      total: 0,
      verified: 0,
      flagged: 0,
      pending: 0,
      rejected: 0,
    }
    
    result.rows.forEach(row => {
      stats.total += parseInt(row.count)
      if (row.verification_status === 'verified') {
        stats.verified = parseInt(row.count)
      } else if (row.verification_status === 'flagged') {
        stats.flagged = parseInt(row.count)
      } else if (row.verification_status === 'pending') {
        stats.pending = parseInt(row.count)
      } else if (row.verification_status === 'rejected') {
        stats.rejected = parseInt(row.count)
      }
    })
    
    res.json({
      status: 'success',
      stats,
    })
  } catch (error) {
    console.error('Error fetching verification stats:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch statistics',
    })
  }
})

/**
 * GET /api/verifications/:id
 * Returns detailed information about a specific verification
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `SELECT 
        id,
        id_number,
        name,
        dob,
        phone,
        address,
        verification_status,
        flagged_reason,
        face_similarity,
        validation_errors,
        id_image_url,
        selfie_image_url,
        id_ocr,
        created_at
      FROM voters
      WHERE id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Verification not found',
      })
    }
    
    const row = result.rows[0]
    
    // Handle validation_errors
    let validationErrors = null
    if (row.validation_errors) {
      if (typeof row.validation_errors === 'string') {
        try {
          validationErrors = JSON.parse(row.validation_errors)
        } catch (e) {
          validationErrors = [row.validation_errors]
        }
      } else if (Array.isArray(row.validation_errors)) {
        validationErrors = row.validation_errors
      } else if (typeof row.validation_errors === 'object') {
        validationErrors = Array.isArray(row.validation_errors) ? row.validation_errors : [row.validation_errors]
      }
    }
    
    // Handle id_ocr
    let ocrData = null
    if (row.id_ocr) {
      if (typeof row.id_ocr === 'string') {
        try {
          ocrData = JSON.parse(row.id_ocr)
        } catch (e) {
          ocrData = null
        }
      } else {
        ocrData = row.id_ocr
      }
    }
    
    res.json({
      status: 'success',
      verification: {
        id: row.id,
        idNumber: row.id_number,
        name: row.name,
        dateOfBirth: row.dob,
        phone: row.phone,
        address: row.address,
        status: row.verification_status,
        flaggedReason: row.flagged_reason,
        faceSimilarity: row.face_similarity,
        validationErrors,
        idImageUrl: row.id_image_url,
        selfieImageUrl: row.selfie_image_url,
        idBackImageUrl: ocrData?.idBackImageUrl || null,
        ocrData: ocrData,
        createdAt: row.created_at,
        isApproved: row.verification_status === 'verified',
        isFailed: row.verification_status === 'flagged' || row.verification_status === 'rejected',
      },
    })
  } catch (error) {
    console.error('Error fetching verification details:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch verification details',
    })
  }
})

export default router

