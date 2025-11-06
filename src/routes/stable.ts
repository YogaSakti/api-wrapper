import express from 'express'
import asyncHandler from 'express-async-handler'
import CacheService from '../utils/cache.service'
import {
    data_OKX,
    data_Bybit,
    data_Bybit_USDe,
    data_Binance,
    data_Binance_All,
    data_Flipster,
    data_Bitget,
    data_BitgetV2,
    data_pintu
} from './earn'

const ttl = 60 * 1 // 1 minutes
const cache = new CacheService(ttl)
const router = express.Router()

/**
 * Basic welcome route
 */
router.get('/', (req, res) => {
    res.status(200).send({
        message: 'Welcome to stable API! Use /okx, /bybit, or /binance to get the data',
    })
})

/**
 * Bitget route - cached
 */
router.get(
    '/bitget',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bitget data...')
        const cachedData = await cache.get('bitget', async () => data_Bitget())
        const cachedDataV2 = await cache.get('bitget-v2', async () => data_BitgetV2())

        const combinedData = [...cachedData, ...cachedDataV2]
        res.status(200).json(combinedData)
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

        // f#ck // break the cache if the data is empty 
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
 * Bybit Airdrop route - cached
 */
router.get(
    '/bybit-usde',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit USDe data...')
        const cachedData = await cache.get('bybit-usde', async () => data_Bybit_USDe())
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
 * Flipster route - cached
 */
router.get(
    '/flipster',
    asyncHandler(async (req, res) => {
        console.log('Fetching Flipster data...')
        const cachedData = await cache.get('flipster', async () => data_Flipster())
        res.status(200).json(cachedData)
    }),
)

/**
 * Pintu route - cached
 */
router.get(
    '/pintu',
    asyncHandler(async (req, res) => {
        console.log('Fetching Pintu data...')
        const cachedData = await cache.get('pintu', async () => data_pintu())
        res.status(200).json(cachedData)
    }),
)

export default router
