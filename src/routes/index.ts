import express from 'express'
import fetch from 'cross-fetch'

export const router = express.Router()

// Home page route.
router.get('/', function (req, res) {
    res.status(200).send({ status: 'ok' })
})

router.get('/tensor', (req, res, next) => fetch('https://search.tensor.trade/multi_search?sort_by=statsV2.volume24h:desc&filter_by=creator:%3Ddrip+%7C%7C+teamId:%3Dea7b5d4a-24d9-493c-b5fa-43bc1869cd48&infix=fallback,off,off&page=1&per_page=250&split_join_tokens=off&exhaustive_search=true&prioritize_exact_match=true', {
    'headers': {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7',
        'content-type': 'application/json',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'x-typesense-api-key': 'DOCUMENT_SEARCH_ONLY_KEY',
        'Referer': 'https://drip.tensor.trade/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    'body': '{"searches":[{"collection":"nft_collections","q":"*","query_by":"name,slugDisplay,acronym"}]}',
    'method': 'POST'
}).then((response) => response.json())
    .then(response => response.results[0])
    .then(response => response.hits)
    .then(response => {
        res.status(200)
            .send(response.map(({ document: x }) => {
                return {
                    name: x.name,
                    slug: x.slug
                }
            }))
    })
    .catch(next))

import dripRoute from './drip'
router.use('/drip', dripRoute)

export default router