/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import fetch from 'cross-fetch'

export const router = express.Router()

// Home page route.
router.get('/', (req, res) => {
    return res.status(200).send({ status: 'ok' })
})

/**
 * Simple Token Price
 */
const getSimpleTokenPrice = async (ids: string) => {
    const url = `https://pro-api.coingecko.com/api/v3/simple/price/?ids=${ids}&vs_currencies=usd&x_cg_pro_api_key=${process.env.CG_API_KEY}`
    const response = await fetch(url, {
        headers: { accept: 'application/json' },
        method: 'GET',
    })
    return response.json()
}

/**
 * Price by Market
 */
const getPriceByMarket = async (ids: string) => {
    const url = `https://pro-api.coingecko.com/api/v3/coins/${ids}/tickers?&vs_currencies=usd&x_cg_pro_api_key=${process.env.CG_API_KEY}`
    const response = await fetch(url, {
        headers: { accept: 'application/json' },
        method: 'GET',
    })
    return response.json()
}

/**
 * GET /gecko/:slug
 * Get token price from coingecko
 */
router.get('/gecko/:slug', async (req, res, next) => {
    try {
        const response = await getSimpleTokenPrice(req.params.slug)
        return res.status(200).send(response)
    } catch (error) {
        return next(error)
    }
})

/**
 * GET /geckoFiltered/:slug
 * Get filtered token price by market/trust_score
 */
router.get('/geckoFiltered/:slug', async (req, res, next) => {
    try {
        const response = await getPriceByMarket(req.params.slug)

        // If there's an error in the response
        if (response.error || response.status) {
            // coin not found
            if (response?.error?.includes('coin not found')) {
                const fallback = await getSimpleTokenPrice(req.params.slug)
                return res.status(200).send(fallback)
            }
            // other errors from CG
            if (response?.status?.error_message || response?.status?.error_code) {
                return res.status(400).send(response.status)
            }
            // any other error
            return res.status(400).send(response)
        }

        // Filter out unwanted LATOKEN, then trust_score=green
        const filteredTickersByMarket = response.tickers.filter(
            ({ market: { name } }: any) => name !== 'LATOKEN'
        )
        const filteredTickersByTrust = filteredTickersByMarket.filter(
            ({ trust_score }: any) => trust_score === 'green'
        )

        const filteredData = filteredTickersByTrust.length
            ? filteredTickersByTrust[0]
            : filteredTickersByMarket[0]

        // If not an array, fallback to simple price
        if (!Array.isArray(filteredData)) {
            const fallback = await getSimpleTokenPrice(req.params.slug)
            return res.status(200).send(fallback)
        }
        // If we have an array
        if (filteredData.length > 0) {
            return res
                .status(200)
                .send({ [filteredData[0].target_coin_id]: { usd: filteredData[0].converted_last.usd } })
        }
        // No data found
        return res.status(404).send('No data found')
    } catch (error) {
        return next(error)
    }
})

// Additional routes
import artatixRoute from './artatix'
router.use('/artatix', artatixRoute)

import stable from './stable'
router.use('/stable', stable)

// balance route from index in balances folder
import balancesRoute from './balances'
router.use('/balances', balancesRoute)

export default router
