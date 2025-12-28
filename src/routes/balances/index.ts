import express from 'express'
import { getBybitBalances } from './bybit'
import { getOkxBalances } from './okx'
import { getBinanceBalances } from './binance'

export const balancesRouter = express.Router()

// Hardcoded access key for this endpoint
const ACCESS_KEY = process.env.ACCESS_KEY
if (!ACCESS_KEY || typeof ACCESS_KEY !== 'string' || ACCESS_KEY.length < 10) {
    // Fail fast if key is not set or too short
    throw new Error('ACCESS_KEY environment variable must be set and at least 10 characters')
}

// Supported exchanges and coins
const SUPPORTED_EXCHANGES = ['bybit', 'okx', 'binance']
const SUPPORTED_COINS = ['usde', 'usdt', 'usdc', 'usd1']

// Middleware to validate key
const validateKey = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const { key } = req.params
    // Constant time comparison to prevent timing attacks
    if (!key || typeof key !== 'string' || key.length < 10 || key.length !== ACCESS_KEY.length || !cryptoSafeEquals(key, ACCESS_KEY)) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Access denied'
        })
        return
    }
    next()
}

// Constant time string comparison
function cryptoSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
}

// Middleware to validate exchange
const validateExchange = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const { exchange } = req.params
    if (!exchange || typeof exchange !== 'string' || !SUPPORTED_EXCHANGES.includes(exchange.toLowerCase())) {
        res.status(400).json({
            error: 'Invalid Exchange',
            message: 'Exchange not supported'
        })
        return
    }
    next()
}

// Middleware to validate coin
const validateCoin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const { coin } = req.params
    if (!coin || typeof coin !== 'string' || !SUPPORTED_COINS.includes(coin.toLowerCase())) {
        res.status(400).json({
            error: 'Invalid Coin',
            message: 'Coin not supported'
        })
        return
    }
    next()
}

/**
 * GET /balances/:key/:exchange/:coin
 * Protected endpoint that requires key, exchange, and coin parameters
 */
balancesRouter.get('/:key/:exchange/:coin', validateKey, validateExchange, validateCoin, async (req, res, next) => {
    try {
        const { exchange, coin } = req.params
        const coinUpper = coin.toUpperCase()
        const exchangeLower = exchange.toLowerCase()

        // Remove sensitive logging in production
        // console.log(`Fetching ${coinUpper} balance from ${exchangeLower}...`);

        let balance = 0

        // Handle different exchanges
        switch (exchangeLower) {
        case 'bybit':
            const bybitBalances = await getBybitBalances()
            balance = bybitBalances[coinUpper as keyof typeof bybitBalances] || 0
            break

        case 'okx':
            const okxBalances = await getOkxBalances()
            balance = okxBalances[coinUpper as keyof typeof okxBalances] || 0
            break

        case 'binance':
            const binanceBalances = await getBinanceBalances()
            balance = binanceBalances[coinUpper as keyof typeof binanceBalances] || 0
            break

        default:
            return res.status(400).json({
                error: 'Exchange Not Implemented',
                message: `${exchange} integration is not yet implemented`
            })
        }

        return res.status(200).json({
            amount: balance
        })

    } catch (error) {
        console.error('Error fetching balance:', error)
        return next(error)
    }
})

/**
 * GET /balances/:key/:exchange
 * Get all balances for a specific exchange
 */
balancesRouter.get('/:key/:exchange', validateKey, validateExchange, async (req, res, next) => {
    // Do not reveal any sensitive info
    return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Missing coin parameter.'
    })
})

/**
 * GET /balances/:key
 * Error response - missing exchange and coin parameters
 */
balancesRouter.get('/:key', validateKey, (req, res) => {
    return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Missing exchange and coin parameters.'
    })
})

/**
 * GET /balances
 * Basic endpoint information (no sensitive data)
 */
balancesRouter.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Private balances API. Access requires a valid key.'
    })
})

// Export as default to match the import pattern
export default balancesRouter