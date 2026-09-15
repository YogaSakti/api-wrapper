import express from 'express'
import CacheService from '../utils/cache.service'
import { eventList, extractTicket, checkHealth } from '../services/artatix.service'
import { getSingleParam } from '../utils/validation'

// cache for 5 minutes
const ttl = 60 * 5
const cache = new CacheService(ttl)

const router = express.Router()

router.get('/', async (_req, res) => {
    const isHealthy = await checkHealth()
    if (isHealthy) {
        res.status(200).json({ status: 'ok' })
    } else {
        res.status(500).json({ status: 'error' })
    }
})

router.get('/tickets/:slug', async (req, res) => {
    const slug = getSingleParam(req.params.slug)
    if (!slug) {
        res.status(400).json({ error: 'Invalid Slug', message: 'Slug parameter is required' })
        return
    }

    const data = await extractTicket(slug)
    res.status(200).send(data)
})

router.get('/events', async (_req, res) => {
    const data = await cache.get('artatix-events', eventList)
    res.status(200).send(data)
})

export default router
