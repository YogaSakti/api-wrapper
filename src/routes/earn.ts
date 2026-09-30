import express from 'express'
import CacheService from '../utils/cache.service'
import { getSingleParam, isSafeAddress, parseChoiceFilter, parseIntegerInRange } from '../utils/validation'
import { data_OKX, data_Bybit, data_Bybit_USDe, data_Bybit_USD1, data_Bybit_OnChain, data_Bybit_BYUSDT, data_Binance, data_Binance_All, data_Bitget, data_BitgetAuto, data_Kamino } from '../services/earn'
import { BitgetAmounts } from '../services/earn/bitget.service'

const ttl = 60 * 0.5 // 0.5 minutes
const cache = new CacheService(ttl)
const router = express.Router()
const OKX_COINS = ['USDT', 'USDC', 'USDG', 'RLUSD'] as const

/**
 * Basic welcome route
 */
router.get('/', (_req, res) => {
    res.status(200).send({
        message: 'Welcome to Earn API! Use /okx, /bybit, /binance, /bitget, or /kamino/:vault/:address'
    })
})

/**
 * Bitget route - cached
 * Set auto=true to calculate APR from the account's current live Earn positions.
 */
router.get('/bitget', async (req, res) => {
    const rawAuto = req.query.auto
    if (rawAuto !== undefined && rawAuto !== 'true' && rawAuto !== 'false') {
        res.status(400).json({ error: 'Invalid Auto', message: 'Auto must be true or false' })
        return
    }

    if (rawAuto === 'true') {
        if (req.query.amount !== undefined) {
            res.status(400).json({ error: 'Invalid Parameters', message: 'Amount cannot be combined with auto=true' })
            return
        }

        const data = await cache.get('bitget:auto', data_BitgetAuto)
        res.status(200).json(data)
        return
    }

    const rawAmount = req.query.amount
    if (rawAmount !== undefined && typeof rawAmount !== 'string') {
        res.status(400).json({ error: 'Invalid Amount', message: 'Amount must contain three positive numbers for USDT, USDC, and USDGO' })
        return
    }

    const amountParam = typeof rawAmount === 'string' ? rawAmount : undefined
    const parsedAmounts = amountParam?.split(',').map(Number)
    const amounts = parsedAmounts?.length === 3 && parsedAmounts.every(amount => Number.isFinite(amount) && amount > 0)
        ? parsedAmounts as BitgetAmounts
        : undefined

    if (amountParam !== undefined && !amounts) {
        res.status(400).json({ error: 'Invalid Amount', message: 'Amount must contain three positive numbers for USDT, USDC, and USDGO' })
        return
    }

    const cacheKey = `bitget:${amounts?.join(',') ?? 'default'}`
    const data = await cache.get(cacheKey, () => data_Bitget(amounts))
    res.status(200).json(data)
})

/**
 * OKX route - cached
 * Optional amount param calculates the effective USDG/RLUSD APR above the 10,000 limit.
 */
router.get('/okx', async (req, res) => {
    const rawCoins = req.query.coins
    const coins = rawCoins === undefined ? undefined : parseChoiceFilter(rawCoins, OKX_COINS)
    if (rawCoins !== undefined && !coins) {
        res.status(400).json({ error: 'Invalid Coins', message: `Coins must be a comma-separated list selected from: ${OKX_COINS.join(', ')}` })
        return
    }

    const rawAmount = req.query.amount
    if (rawAmount !== undefined && typeof rawAmount !== 'string') {
        res.status(400).json({
            error: 'Invalid Amount',
            message: 'Amount must be a positive number'
        })
        return
    }

    const amountParam = rawAmount
    const amount = amountParam === undefined ? undefined : Number(amountParam)
    if (amountParam !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
        res.status(400).json({
            error: 'Invalid Amount',
            message: 'Amount must be a positive number'
        })
        return
    }

    const cacheKey = `okx:${amount ?? 'default'}`
    let cachedData = await cache.get(cacheKey, () => data_OKX(amount))

    // break the cache if the data is empty
    if (cachedData.length === 0) {
        let attempts = 0
        do {
            cachedData = await data_OKX(amount)
            attempts++
        } while (cachedData.length === 0 && attempts < 10)
    }

    if (!coins) {
        res.status(200).json(cachedData)
        return
    }

    const dataByCoin = new Map(cachedData.map(item => [item.name.toUpperCase(), item]))
    res.status(200).json(coins.map(coin => dataByCoin.get(coin)).filter(item => item !== undefined))
})

/**
 * Bybit route - cached
 */
router.get('/bybit', async (_req, res) => {
    const cachedData = await cache.get('bybit', data_Bybit)
    res.status(200).json(cachedData)
})

/**
 * Bybit USDE route - cached
 */
router.get('/bybit-usde', async (_req, res) => {
    const data = await data_Bybit_USDe()
    res.status(200).json(data)
})

/**
 * Bybit USD1 route - uncached (matches /bybit-usde)
 */
router.get('/bybit-usd1', async (_req, res) => {
    const data = await data_Bybit_USD1()
    res.status(200).json(data)
})

/**
 * Bybit BYUSDT route - cached
 * Optional tier param: ?tier=1 (default, ≤100k, full APR) or ?tier=2 (>100k, base APR only)
 */
router.get('/bybit-byusdt', async (req, res) => {
    const tier = req.query.tier ? parseIntegerInRange(req.query.tier, 1, 2) : undefined
    if (req.query.tier && !tier) {
        res.status(400).json({ error: 'Invalid Tier', message: 'Tier must be 1 or 2' })
        return
    }

    const cacheKey = `bybit-byusdt:${tier ?? 1}`
    const data = await cache.get(cacheKey, async () => data_Bybit_BYUSDT(tier))
    res.status(200).json(data)
})

/**
 * Bybit On-Chain route - cached
 */
router.get('/bybit-onchain', async (_req, res) => {
    const cachedData = await cache.get('bybit-onchain', data_Bybit_OnChain)
    res.status(200).json(cachedData)
})

/**
 * Binance route - cached
 */
router.get('/binance', async (_req, res) => {
    const cachedData = await cache.get('binance', data_Binance)
    res.status(200).json(cachedData)
})

/**
 * Binance all route - cached
 */
router.get('/binance-stable', async (req, res) => {
    const noLimit = (req.query.noLimit as string) || ''
    const cacheKey = `binance-all:${noLimit}`
    const cachedData = await cache.get(cacheKey, () => data_Binance_All(noLimit))
    res.status(200).json(cachedData)
})

/**
 * Kamino route - cached
 */
router.get('/kamino/:vault/:address', async (req, res) => {
    const vault = getSingleParam(req.params.vault)
    const address = getSingleParam(req.params.address)
    if (!vault || !address) {
        res.status(400).json({
            error: 'Invalid Parameters',
            message: 'Vault and address are required'
        })
        return
    }

    if (!isSafeAddress(vault) || !isSafeAddress(address)) {
        res.status(400).json({
            error: 'Invalid Parameters',
            message: 'Vault and address contain unsupported characters or are too long'
        })
        return
    }

    const cacheKey = `kamino:${vault}:${address}`
    const cachedData = await cache.get(cacheKey, async () => data_Kamino(vault, address))
    res.status(200).json(cachedData)
})

export default router
