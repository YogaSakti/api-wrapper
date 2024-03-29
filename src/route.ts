/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express'
import fetch from 'cross-fetch'
import asyncHandler from 'express-async-handler'

const router = express.Router()

// Home page route.
router.get('/', function (req, res) {
    res.status(200).send({ status: 'ok' })
})

router.get('/winner/:id', asyncHandler(async (req, res, next) => {
    console.log(`Fetching winner for ${req.params.id}`)
    const id = req.params.id
    let string = ['YmFjaw==', 'b2ZmaWNl', 'bmV3', 'ZGFwcA==', 'cmFkYXI=', 'YWlyZHJvcHM=']
    string = string.map((str) => Buffer.from(str, 'base64').toString('ascii'))

    const request = await fetch(`https://${string[0]}${string[1]}-${string[2]}.${string[3]}${string[4]}.com/${string[5]}/${id}/winners?fiat=USD`, {
        headers: {
            'accept': 'application/json',
            'Referer': `https://${string[3]}${string[4]}.com/hub/${string[5]}/`,
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        },
        method: 'GET'
    })

    const json = await request.json()

    // convert from array ['',''] to array of objects [{address},{address},{address}]
    // json = json.map((address: String) => ({ address }))
    res.status(200).send(json)
}))

router.get('/events', (req, res, next) => {
    console.log('Fetching events...')
    let string = ['YmFjaw==', 'b2ZmaWNl', 'bmV3', 'ZGFwcA==', 'cmFkYXI=', 'YWlyZHJvcHM=']
    string = string.map((str) => Buffer.from(str, 'base64').toString('ascii'))

    fetch(`https://${string[0]}${string[1]}-${string[2]}.${string[3]}${string[4]}.com/${string[5]}?page=1&resultsPerPage=50`, {
        headers: {
            'accept': 'application/json',
            'Referer': `https://${string[3]}${string[4]}.com/hub/${string[5]}/`,
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
    }).then(response => response.json())
        .then(json => res.status(200)
            .send(
                json.results
                    .filter((event: any) => !/nft|nfts/i.test(event.title))
                    .map((event: any) => ({ id: event.id, tokenName: event.tokenName, tokenAmount: event.tokenAmount }))
                    .filter((event: any) => event.id >= 86)
                    .sort((a: any, b: any) => a.id - b.id)
            )
        )
        .catch(next)
})


router.get('/tensor', (req, res, next) => {
    console.log('Fetching tensor market data...')

    fetch('https://search.tensor.trade/multi_search?sort_by=statsV2.volume24h:desc&filter_by=creator:%3Ddrip+%7C%7C+teamId:%3Dea7b5d4a-24d9-493c-b5fa-43bc1869cd48&infix=fallback,off,off&page=1&per_page=250&split_join_tokens=off&exhaustive_search=true&prioritize_exact_match=true', {
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
    }).then(response => response.json())
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
        .catch(next)
})





export default router