import express from 'express'

export const router = express.Router()

// Home page route.
router.get('/', (req, res) => {
    return res.status(200).send({ status: 'ok' })
})

// Import routes
import geckoRouter from './gecko'
router.use('/gecko', geckoRouter)

import artatixRoute from './artatix'
router.use('/artatix', artatixRoute)

import earnRouter from './earn'
router.use('/earn', earnRouter)

import balancesRouter from './balances'
router.use('/balances', balancesRouter)

import priceRouter from './price'
router.use('/price', priceRouter)

export default router
