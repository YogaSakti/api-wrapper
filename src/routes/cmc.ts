/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { getTokenPrice, getDexTokenPrice } from '../services/coinmarketcap.service'
import { isFiatCode, isSafeAddress, isSafePlatform, isSafeSlug } from '../utils/validation'

const router = express.Router()

/**
 * GET /api/v1/cmc/dex/:platform/:address
 * Get DEX token price by contract address (uses CMC_DEX_API_KEY)
 */
router.get('/dex/:platform/:address', async (req, res, next) => {
    try {
        if (!isSafePlatform(req.params.platform) || !isSafeAddress(req.params.address)) {
            return res.status(400).json({ error: 'Invalid Parameters', message: 'Platform or address contains unsupported characters or is too long' })
        }

        const response = await getDexTokenPrice(req.params.platform, req.params.address)
        return res.status(200).send(response)
    } catch (error) {
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
        if (!isSafeSlug(req.params.slug) || !isFiatCode(fiat.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid Parameters', message: 'Slug or convert parameter is invalid' })
        }

        const response = await getTokenPrice(req.params.slug, fiat)
        return res.status(200).send(response)
    } catch (error) {
        return next(error)
    }
})

export default router