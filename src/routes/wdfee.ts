import express from 'express'
import Cache from '../utils/cache.service'
import {
    getWdfeeMaster,
    getWdfeeRoute,
    type WdfeeDestination,
    type WdfeeExchange,
} from '../services/wdfee.service'

const cache = new Cache(60)
export const clearWdfeeCache = () => cache.flush()
const sources: WdfeeExchange[] = ['bybit', 'pintu', 'tokocrypto']
const destinations: WdfeeDestination[] = [...sources, 'p2p']

const isSupportedFrom = (value: string): value is WdfeeExchange => sources.includes(value as WdfeeExchange)
const isSupportedTo = (value: string): value is WdfeeDestination => destinations.includes(value as WdfeeDestination)

const wdfeeRouter = express.Router()

wdfeeRouter.get('/', async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from.trim().toLowerCase() : undefined
    const to = typeof req.query.to === 'string' ? req.query.to.trim().toLowerCase() : undefined

    if ((req.query.from !== undefined && typeof req.query.from !== 'string') || (req.query.to !== undefined && typeof req.query.to !== 'string') || req.query['from[]'] !== undefined || req.query['to[]'] !== undefined) {
        return res.status(400).json({
            error: 'Invalid Route',
            message: 'Use a supported from/to exchange pair.',
        })
    }

    if (req.query.from === undefined && req.query.to === undefined) {
        try {
            return res.status(200).json(await cache.get('master', getWdfeeMaster))
        } catch {
            return res.status(502).json({ error: 'Failed to fetch withdrawal fee data' })
        }
    }

    if (!from || !to || from === 'p2p' || !isSupportedFrom(from) || !isSupportedTo(to) || from === to) {
        return res.status(400).json({
            error: 'Invalid Route',
            message: 'Use a supported from/to exchange pair.',
        })
    }

    try {
        return res.status(200).json(await cache.get(`route:${from}:${to}`, () => getWdfeeRoute(from, to)))
    } catch {
        return res.status(502).json({ error: 'Failed to fetch withdrawal fee data' })
    }
})

export default wdfeeRouter
