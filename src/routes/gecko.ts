/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { getSimpleTokenPrice, getFilteredPrice } from '../services/coingecko.service'

const router = express.Router()

/**
 * GET /gecko/filtered/:slug
 * Get filtered token price by market/trust_score
 */
router.get('/filtered/:slug', async (req, res, next) => {
    try {
        const response = await getFilteredPrice(req.params.slug)
        return res.status(200).send(response)
    } catch (error: any) {
        try {
            const parsed = JSON.parse(error.message)
            if (parsed.status) {
                return res.status(parsed.status).send(parsed.data)
            }
        } catch {
            // Not a JSON error message, fall through to next
        }
        return next(error)
    }
})

/**
 * GET /gecko/:slug
 * Get token price from coingecko
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const response = await getSimpleTokenPrice(req.params.slug)
        return res.status(200).send(response)
    } catch (error) {
        return next(error)
    }
})

export default router