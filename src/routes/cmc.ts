/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { getTokenPrice, getDexTokenPrice } from '../services/coinmarketcap.service'

const router = express.Router()

/**
 * GET /api/v1/cmc/dex/:platform/:address
 * Get DEX token price by contract address (uses CMC_DEX_API_KEY)
 */
router.get('/dex/:platform/:address', async (req, res, next) => {
    try {
        const response = await getDexTokenPrice(req.params.platform, req.params.address)
        return res.status(200).send(response)
    } catch (error: any) {
        try {
            const parsed = JSON.parse(error.message)
            if (parsed.status) return res.status(parsed.status).send(parsed.data)
        } catch { /* fall through */ }
        return next(error)
    }
})

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