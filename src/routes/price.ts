import express, { Request, Response } from 'express'
import { isSafeSymbol, isSafeInstId, parseIntegerInRange } from '../utils/validation'
import {
    getPintuPrice,
    getBinanceOrderBookPrice,
    getBybitOrderBookPrice,
    getOkxOrderBookPrice,
    getBitgetOrderBookPrice,
    isSupportedPintuCurrency,
} from '../services/price.service'

const priceRouter = express.Router()

priceRouter.get(['/pintu', '/pintu/:currency'], async (req, res) => {
    try {
        const rawCurrency = Array.isArray(req.params.currency) ? req.params.currency[0] : req.params.currency
        const currency = (rawCurrency || 'usdt').toLowerCase()
        if (!isSupportedPintuCurrency(currency)) {
            return res.status(400).json({ error: 'Unsupported Pintu currency. Use usdt or usdc.' })
        }

        const price = await getPintuPrice(currency)
        return res.status(200).json({ price })
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch price from Pintu' })
    }
})

interface OrderBookRouteConfig {
    exchange: string
    defaultSymbol: string
    isValidSymbol: (symbol: string) => boolean
    symbolMessage: string
    fetchPrice: (symbol: string, limit: number) => Promise<number | null>
}

const makeOrderBookHandler = ({ exchange, defaultSymbol, isValidSymbol, symbolMessage, fetchPrice }: OrderBookRouteConfig) =>
    async (req: Request, res: Response) => {
        const symbol = (req.query.symbol as string)?.toUpperCase() || defaultSymbol
        const limit = req.query.limit ? parseIntegerInRange(req.query.limit, 1, 100) : 10
        if (!isValidSymbol(symbol)) {
            return res.status(400).json({ error: 'Invalid Symbol', message: symbolMessage })
        }
        if (!limit) {
            return res.status(400).json({ error: 'Invalid Limit', message: 'Limit must be an integer between 1 and 100' })
        }

        try {
            const price = await fetchPrice(symbol, limit)
            if (price === null) {
                return res.status(500).json({ error: `Failed to fetch order book from ${exchange}` })
            }
            return res.status(200).json({ price })
        } catch (error) {
            return res.status(500).json({ error: `Failed to fetch order book from ${exchange}` })
        }
    }

priceRouter.get('/binance', makeOrderBookHandler({
    exchange: 'Binance',
    defaultSymbol: 'USD1USDC',
    isValidSymbol: isSafeSymbol,
    symbolMessage: 'Symbol must be 2-30 uppercase alphanumeric characters',
    fetchPrice: getBinanceOrderBookPrice,
}))

priceRouter.get('/bybit', makeOrderBookHandler({
    exchange: 'Bybit',
    defaultSymbol: 'USD1USDC',
    isValidSymbol: isSafeSymbol,
    symbolMessage: 'Symbol must be 2-30 uppercase alphanumeric characters',
    fetchPrice: getBybitOrderBookPrice,
}))

priceRouter.get('/bitget', makeOrderBookHandler({
    exchange: 'Bitget',
    defaultSymbol: 'USD1USDC',
    isValidSymbol: isSafeSymbol,
    symbolMessage: 'Symbol must be 2-30 uppercase alphanumeric characters',
    fetchPrice: getBitgetOrderBookPrice,
}))

priceRouter.get('/okx', makeOrderBookHandler({
    exchange: 'OKX',
    defaultSymbol: 'USD1-USDC',
    isValidSymbol: isSafeInstId,
    symbolMessage: 'Symbol must be a dash-separated instrument id, e.g. USD1-USDC',
    fetchPrice: getOkxOrderBookPrice,
}))

export default priceRouter
