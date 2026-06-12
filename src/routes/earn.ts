import express from 'express'
import asyncHandler from 'express-async-handler'
import CacheService from '../utils/cache.service'
import { getSingleParam, isSafeAddress, parseIndexFilter, parseIntegerInRange } from '../utils/validation'
import {
    data_OKX,
    data_Bybit,
    data_Bybit_USDe,
    data_Bybit_OnChain,
    data_Bybit_BYUSDT,
    data_Binance,
    data_Binance_All,
    data_Bitget,
    data_Kamino,
} from '../services/earn'

const ttl = 60 * 0.5 // 0.5 minutes
const cache = new CacheService(ttl)
const router = express.Router()

/**
 * Basic welcome route
 */
router.get('/', (req, res) => {
    res.status(200).send({
        message: 'Welcome to Earn API! Use /okx, /bybit, /binance, /bitget, or /kamino/:vault/:address',
    })
})

/**
 * Bitget route - cached
 * Filter param: /bitget?filter=2,3,4,5
 * Index: [1] USDT, [2] USDT-VIP, [3] USDT-VIP-14, [4] USDC, [5] USDC-VIP, [6] USDGO
 */
router.get(
    '/bitget',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bitget data...')
        const allData = await cache.get('bitget', async () => data_Bitget())

        const filterParam = req.query.filter as string
        if (filterParam) {
            const indices = parseIndexFilter(filterParam, allData.length)
            if (!indices) {
                res.status(400).json({ error: 'Invalid Filter', message: `Filter must be a comma-separated list of indexes between 1 and ${allData.length}` })
                return
            }

            const filtered = indices.map(i => allData[i - 1])
            res.status(200).json(filtered)
            return
        }

        res.status(200).json(allData)
    }),
)

/**
 * OKX route - cached
 */
router.get(
    '/okx',
    asyncHandler(async (req, res) => {
        console.log('Fetching OKX data...')
        let cachedData = await cache.get('okx', async () => await data_OKX())

        // break the cache if the data is empty 
        if (cachedData.length === 0) {
            let attempts = 0
            do {
                cachedData = await data_OKX()
                attempts++
            } while (cachedData.length === 0 && attempts < 10)
        }

        res.status(200).json(cachedData)
    }),
)

/**
 * Bybit route - cached
 */
router.get(
    '/bybit',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit data...')
        const cachedData = await cache.get('bybit', async () => data_Bybit())
        res.status(200).json(cachedData)
    }),
)

/**
 * Bybit USDE route - cached
 */
router.get(
    '/bybit-usde',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit USDE data...')
        // const cachedData = await cache.get('bybit-usde', async () => data_Bybit_USDe())
        const data = await data_Bybit_USDe()
        res.status(200).json(data)
    }),
)

/**
 * Bybit BYUSDT route - cached
 * Optional tier param: ?tier=1 (default, ≤100k, full APR) or ?tier=2 (>100k, base APR only)
 */
router.get(
    '/bybit-byusdt',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit BYUSDT data...')
        const tier = req.query.tier ? parseIntegerInRange(req.query.tier, 1, 2) : undefined
        if (req.query.tier && !tier) {
            res.status(400).json({ error: 'Invalid Tier', message: 'Tier must be 1 or 2' })
            return
        }

        const cacheKey = `bybit-byusdt:${tier ?? 1}`
        const data = await cache.get(cacheKey, async () => data_Bybit_BYUSDT(tier))
        res.status(200).json(data)
    }),
)

/**
 * Bybit On-Chain route - cached
 */
router.get(
    '/bybit-onchain',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit On-Chain data...')
        const cachedData = await cache.get('bybit-onchain', async () => data_Bybit_OnChain())
        res.status(200).json(cachedData)
    }),
)

/**
 * Binance route - cached
 */
router.get(
    '/binance',
    asyncHandler(async (req, res) => {
        console.log('Fetching Binance data...')
        const cachedData = await cache.get('binance', async () => data_Binance())
        res.status(200).json(cachedData)
    }),
)

/**
 * Binance all route - cached
 */
router.get(
    '/binance-stable',
    asyncHandler(async (req, res) => {
        console.log('Fetching Binance all data...')
        const noLimit = (req.query.noLimit as string) || ''
        const cacheKey = `binance-all:${noLimit}`
        const cachedData = await cache.get(cacheKey, () => data_Binance_All(noLimit))
        res.status(200).json(cachedData)
    }),
)

/**
 * Kamino route - cached
 */
router.get(
    '/kamino/:vault/:address',
    asyncHandler(async (req, res) => {
        console.log('Fetching Kamino data...')
        const vault = getSingleParam(req.params.vault)
        const address = getSingleParam(req.params.address)
        if (!vault || !address) {
            res.status(400).json({ error: 'Invalid Parameters', message: 'Vault and address are required' })
            return
        }

        if (!isSafeAddress(vault) || !isSafeAddress(address)) {
            res.status(400).json({ error: 'Invalid Parameters', message: 'Vault and address contain unsupported characters or are too long' })
            return
        }

        const cacheKey = `kamino:${vault}:${address}`
        const cachedData = await cache.get(cacheKey, async () => data_Kamino(vault, address))
        res.status(200).json(cachedData)
    }),
)

export default router