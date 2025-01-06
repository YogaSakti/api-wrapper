/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import fetch from 'cross-fetch'

export const router = express.Router()

// Home page route.
router.get('/', (req, res) => {
    return res.status(200).send({ status: 'ok' })
})

/**
 * GET /events
 */
router.get('/events', async (req, res, next) => {
    try {
        console.log('Fetching events...')
        let string = ['YmFjaw==', 'b2ZmaWNl', 'bmV3', 'ZGFwcA==', 'cmFkYXI=', 'YWlyZHJvcHM=']
        string = string.map((str) => Buffer.from(str, 'base64').toString('ascii'))

        const url = `https://${string[0]}${string[1]}-${string[2]}.${string[3]}${string[4]}.com/${string[5]}?page=1&resultsPerPage=50`
        const response = await fetch(url, {
            headers: {
                accept: 'application/json',
                Referer: `https://${string[3]}${string[4]}.com/hub/${string[5]}/`,
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            },
        })
        const json = await response.json()

        const results = json.results
            .filter((event: any) => !/nft|nfts/i.test(event.title)) // exclude 'nft' in title
            .map((event: any) => ({
                id: event.id,
                tokenName: event.tokenName,
                tokenAmount: event.tokenAmount,
            }))
            .filter((event: any) => event.id >= 86)
            .filter((event: any) => event.id !== 126)
            .sort((a: any, b: any) => a.id - b.id)

        return res.status(200).send(results)
    } catch (error) {
        return next(error)
    }
})

/**
 * GET /tensor
 */
router.get('/tensor', async (req, res, next) => {
    try {
        const response = await fetch(
            'https://search.tensor.trade/multi_search?sort_by=statsV2.volume24h:desc&filter_by=creator:%3Ddrip+%7C%7C+teamId:%3Dea7b5d4a-24d9-493c-b5fa-43bc1869cd48&infix=fallback,off,off&page=1&per_page=250&split_join_tokens=off&exhaustive_search=true&prioritize_exact_match=true',
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7',
                    'content-type': 'application/json',
                    'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'x-typesense-api-key': 'DOCUMENT_SEARCH_ONLY_KEY',
                    Referer: 'https://drip.tensor.trade/',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                },
                body: '{"searches":[{"collection":"nft_collections","q":"*","query_by":"name,slugDisplay,acronym"}]}',
                method: 'POST',
            }
        )

        const json = await response.json()
        const hits = json.results[0]?.hits ?? []

        const mapped = hits.map(({ document: x }: any) => ({
            name: x.name,
            slug: x.slug,
        }))

        return res.status(200).send(mapped)
    } catch (error) {
        return next(error)
    }
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
import dripRoute from './drip'
router.use('/drip', dripRoute)

import artatixRoute from './artatix'
router.use('/artatix', artatixRoute)

import stable from './stable'
router.use('/stable', stable)

export default router
