import express from 'express'
import { getPintuPrice, getBinanceOrderBookPrice } from '../services/price.service'
import { isSafeSymbol, parseIntegerInRange } from '../utils/validation'

const priceRouter = express.Router()

priceRouter.get('/pintu', async (req, res) => {
    try {
        const price = await getPintuPrice()
        res.status(200).json({ price })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch price from Pintu' })
    }
})

priceRouter.get('/binance', async (req, res) => {
    const symbol = (req.query.symbol as string)?.toUpperCase() || 'USD1USDC'
    const limit = req.query.limit ? parseIntegerInRange(req.query.limit, 1, 100) : 10
    if (!isSafeSymbol(symbol)) {
        return res.status(400).json({ error: 'Invalid Symbol', message: 'Symbol must be 2-30 uppercase alphanumeric characters' })
    }
    if (!limit) {
        return res.status(400).json({ error: 'Invalid Limit', message: 'Limit must be an integer between 1 and 100' })
    }

    try {
        const price = await getBinanceOrderBookPrice(symbol, limit)
        if (price === null) {
            return res.status(500).json({ error: 'Failed to fetch order book from Binance' })
        }
        return res.status(200).json({ price })
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch order book from Binance' })
    }
})

export default priceRouter
