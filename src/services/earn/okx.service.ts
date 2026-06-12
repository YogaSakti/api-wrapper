/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'cross-fetch'
// @ts-ignore
import { SocksProxyAgent } from 'socks-proxy-agent'
import { EarnAprItem } from '../../types/api.types'

const proxyUrl = process.env.SOCKS5_AGENT
const proxyAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined

import tls from 'tls'
tls.DEFAULT_CIPHERS = 'TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES256-GCM-SHA384'
tls.DEFAULT_MIN_VERSION = 'TLSv1.2'

/**
 * Fetch data from OKX.
 */
export const data_OKX = async (): Promise<EarnAprItem[]> => {
    try {
        const response = await fetch('https://www.okx.com/priapi/v1/earn/simple-earn/all-products?limit=100&type=all', {
            'headers': {
                'accept': 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'app-type': 'web',
                'devid': '1d689401-801b-4dc2-ba49-7cededbf1957',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-cdn': 'https://www.okx.com',
                'x-id-group': '2120884786626340002-c-4',
                'x-locale': 'en_US',
                'x-simulated-trading': 'undefined',
                'x-site-info': '==QfxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsICRJJiOi42bpdWZyJye',
                'x-utc': '7',
                'x-zkdex-env': '0',
                'Referer': 'https://www.okx.com/earn/simple-earn',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                'cookie': `${process.env.OKX_COOKIE || ''}`,
                'authorization': `${process.env.OKX_AUTHORIZATION || ''}`
            },
            'method': 'GET',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        })

        const json = await response.json()
        if (!json?.data?.allProducts?.currencies) {
            throw new Error('Unexpected OKX response structure.')
        }

        // filter out only USDT and USDC
        const filtered = json.data.allProducts.currencies.filter(
            (item: any) =>
                item?.investCurrency?.currencyName === 'USDT' ||
                item?.investCurrency?.currencyName === 'USDC',
        )

        // map the desired fields
        return filtered.map((item: any) => ({
            name: item.investCurrency.currencyName,
            APR: parseFloat(item.rate.rateNum.value[0]) / 100,
        }))
    } catch (error) {
        console.error('OKX fetch error:', error)
        // Return an empty array or null if you want to handle gracefully
        return []
    }
}