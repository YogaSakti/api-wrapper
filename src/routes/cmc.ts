/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { getTokenPrice } from '../services/coinmarketcap.service'

const router = express.Router()

/**
 * GET /api/v1/cmc/:slug?convert=USD
 * Get token price from CoinMarketCap, optional fiat currency via ?convert= (default: USD)
 */
router.get('/:slug', async (req, res, next) => {
    try {
        const fiat = (req.query.convert as string) || 'USD'
        const response = await getTokenPrice(req.params.slug, fiat)
        return res.status(200).send(response)
    } catch (error) {
        return next(error)
    }
})

export default router