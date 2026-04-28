/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import { getBybitBalances, getOkxBalances, getBinanceBalances, getBitgetBalances } from '../services/balances'
import Cache from '../utils/cache.service'
import { NumericBalanceMap } from '../types/api.types'

export const balancesRouter = express.Router()

// Cache with 15 minutes TTL (900 seconds)
const balanceCache = new Cache(900)
export const clearBalanceCache = () => balanceCache.flush()

// Hardcoded access key for this endpoint
const ACCESS_KEY = process.env.ACCESS_KEY
if (!ACCESS_KEY || typeof ACCESS_KEY !== 'string' || ACCESS_KEY.length < 10) {
    // Fail fast if key is not set or too short
    throw new Error('ACCESS_KEY environment variable must be set and at least 10 characters')
}

// Supported exchanges and coins
const SUPPORTED_EXCHANGES = ['bybit', 'okx', 'binance', 'bitget']
const SUPPORTED_COINS = ['usde', 'usdt', 'usdc', 'usd1', 'byusdt']
// Bitget supports additional coin formats like for fixed savings
const BITGET_FIXED_PATTERN = /^[A-Z]+-[A-Z]+-\d+$/
// Bybit supports on-chain balances with -ONCHAIN suffix
const BYBIT_ONCHAIN_PATTERN = /^(USDT|USDC)-ONCHAIN$/

const getBearerToken = (authorization: string | undefined): string | undefined => {
    if (!authorization) return undefined

    const [scheme, token] = authorization.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined

    return token
}

const getRequestKey = (req: express.Request): string | undefined => {
    const headerKey = req.header('x-api-key')
    const bearerToken = getBearerToken(req.header('authorization'))
    const pathKey = typeof req.params.key === 'string' ? req.params.key : undefined

    return headerKey || bearerToken || pathKey
}

// Middleware to validate key
const validateKey = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const key = getRequestKey(req)
    if (!key || typeof key !== 'string') {
        res.status(401).json({ error: 'Unauthorized', message: 'Access denied' })
        return
    }

    const sanitizedKey = key.trim()
    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedKey) || sanitizedKey.length < 10 || !cryptoSafeEquals(sanitizedKey, ACCESS_KEY)) {
        res.status(401).json({ error: 'Unauthorized', message: 'Access denied' })
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
    if (!exchange || typeof exchange !== 'string') {
        res.status(400).json({ error: 'Invalid Exchange', message: 'Exchange parameter is required' })
        return
    }

    const sanitizedExchange = exchange.trim().toLowerCase()
    if (!SUPPORTED_EXCHANGES.includes(sanitizedExchange) || !/^[a-z]+$/.test(sanitizedExchange)) {
        res.status(400).json({ error: 'Invalid Exchange', message: `Exchange not supported. Supported exchanges: ${SUPPORTED_EXCHANGES.join(', ')}` })
        return
    }

    req.params.exchange = sanitizedExchange
    next()
}

// Middleware to validate coin
const validateCoin = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const { coin } = req.params
    if (!coin || typeof coin !== 'string') {
        res.status(400).json({ error: 'Invalid Coin', message: 'Coin parameter is required' })
        return
    }

    const sanitizedCoin = coin.trim().toUpperCase()
    const coinLower = sanitizedCoin.toLowerCase()

    // Check if it's a standard coin, Bitget fixed savings format, or Bybit on-chain format
    const isValidStandardCoin = SUPPORTED_COINS.includes(coinLower) && /^[A-Z0-9]+$/.test(sanitizedCoin)
    const isValidBitgetFixed = BITGET_FIXED_PATTERN.test(sanitizedCoin)
    const isValidBybitOnChain = BYBIT_ONCHAIN_PATTERN.test(sanitizedCoin)

    if (!isValidStandardCoin && !isValidBitgetFixed && !isValidBybitOnChain) {
        res.status(400).json({
            error: 'Invalid Coin',
            message: `Coin not supported. Supported coins: ${SUPPORTED_COINS.join(', ')}. Bitget fixed format: COIN-LEVEL-PERIOD. Bybit on-chain format: USDT-ONCHAIN, USDC-ONCHAIN`
        })
        return
    }

    req.params.coin = sanitizedCoin
    next()
}

/**
 * GET /balances/:key/:exchange/:coin
 * Protected endpoint that requires key, exchange, and coin parameters.
 * Key can be provided through x-api-key, Authorization: Bearer, or the legacy path key.
 */
balancesRouter.get('/:key/:exchange/:coin', validateKey, validateExchange, validateCoin, async (req, res) => {
    try {
        const exchange = req.params.exchange as string
        const coin = req.params.coin as string
        const exchangeLower = exchange.toLowerCase()

        const balanceFunctions: Record<string, () => Promise<NumericBalanceMap>> = {
            bybit: () => balanceCache.get(`balances:bybit`, getBybitBalances),
            okx: () => balanceCache.get(`balances:okx`, getOkxBalances),
            binance: () => balanceCache.get(`balances:binance`, getBinanceBalances),
            bitget: () => balanceCache.get(`balances:bitget`, getBitgetBalances),
        }

        const getBalance = balanceFunctions[exchangeLower]
        if (!getBalance) {
            return res.status(400).json({ error: 'Exchange Not Implemented', message: `${exchange} integration is not yet implemented` })
        }

        const balances = await getBalance()
        const balance = balances[coin as keyof typeof balances] || 0
        const validatedBalance = typeof balance === 'number' && !isNaN(balance) && isFinite(balance) ? balance : 0

        return res.status(200).json({ amount: validatedBalance })
    } catch (error) {
        console.error('Error fetching balance:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return res.status(500).json({
            error: 'Internal Server Error',
            message: process.env.NODE_ENV !== 'production' ? errorMessage : 'An error occurred processing your request'
        })
    }
})

/**
 * GET /balances/:key/:exchange
 * Get all balances for a specific exchange
 */
balancesRouter.get('/:key/:exchange', validateKey, validateExchange, async (req, res) => {
    return res.status(400).json({ error: 'Missing Parameters', message: 'Missing coin parameter.' })
})

/**
 * GET /balances/:key
 * Error response - missing exchange and coin parameters
 */
balancesRouter.get('/:key', validateKey, (req, res) => {
    return res.status(400).json({ error: 'Missing Parameters', message: 'Missing exchange and coin parameters.' })
})

/**
 * GET /balances
 * Basic endpoint information (no sensitive data)
 */
balancesRouter.get('/', (req, res) => {
    return res.status(200).json({
        message: 'Private balances API. Access requires a valid key.',
        supportedExchanges: SUPPORTED_EXCHANGES,
        supportedCoins: SUPPORTED_COINS
    })
})

// Export as default to match the import pattern
export default balancesRouter