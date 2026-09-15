import express from 'express'
import CacheService from '../utils/cache.service'
import { getSingleParam, isSafeAddress, parseIndexFilter, parseIntegerInRange } from '../utils/validation'
import { data_OKX, data_Bybit, data_Bybit_USDe, data_Bybit_USD1, data_Bybit_OnChain, data_Bybit_BYUSDT, data_Binance, data_Binance_All, data_Bitget, data_Kamino } from '../services/earn'

const ttl = 60 * 0.5 // 0.5 minutes
const cache = new CacheService(ttl)
const router = express.Router()

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
 * Filter param: /bitget?filter=2,3,4,5
 * Index: [1] USDT, [2] USDT-VIP, [3] USDT-VIP-14, [4] USDC, [5] USDC-VIP, [6] USDGO
 */
router.get('/bitget', async (req, res) => {
    const allData = await cache.get('bitget', data_Bitget)

    const filterParam = req.query.filter as string
    if (filterParam) {
        const indices = parseIndexFilter(filterParam, allData.length)
        if (!indices) {
            res.status(400).json({
                error: 'Invalid Filter',
                message: `Filter must be a comma-separated list of indexes between 1 and ${allData.length}`
            })
            return
        }

        const filtered = indices.map((i) => allData[i - 1])
        res.status(200).json(filtered)
        return
    }

    res.status(200).json(allData)
})

/**
 * OKX route - cached
 * Optional amount param calculates the effective USDG/RLUSD APR above the 10,000 limit.
 */
router.get('/okx', async (req, res) => {
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

    res.status(200).json(cachedData)
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
