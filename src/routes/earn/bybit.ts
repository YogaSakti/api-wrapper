/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'cross-fetch'
// @ts-ignore
import { SocksProxyAgent } from 'socks-proxy-agent'
import { config } from 'dotenv'
if (process.env.NODE_ENV !== 'production') config()

const proxyAgent = new SocksProxyAgent(process.env.SOCKS5_AGENT || 'socks5h://blabla.blabla:9999')

/**
 * Fetch data from Bybit.
 */
export const data_Bybit = async () => {
    try {
        const response = await fetch(
            'https://api2.bybit.com/s1/byfi/get-saving-homepage-product-cards',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    guid: '9f3ecb05-d2c1-facf-9baa-b1a12546df95',
                    lang: 'en',
                    platform: 'pc',
                    priority: 'u=1, i',
                    'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    traceparent: '00-54aeda26e5ff90870be888effe4a1f5b-b8682f9a572ea8cb-00',
                    usertoken: '',
                    cookie: process.env.BYBIT_COOKIE || '',
                    Referer: 'https://www.bybit.com/',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                },
                body: JSON.stringify(
                    {
                        'product_area': [0],
                        'page': 1,
                        'limit': 10,
                        'product_type': 4,
                        'coin_name': 'USD',
                        'sort_apr': 0,
                        'show_available': false,
                        'fixed_saving_version': 1
                    }),
                method: 'POST',
            },
        )

        const json = await response.json()
        if (!json?.result?.coin_products) {
            throw new Error('Unexpected Bybit response structure.')
        }

        // coin=5 => USDT, coin=16 => USDC
        const filtered = json.result.coin_products.filter(
            (i: any) => i.coin === 5 || i.coin === 16,
        )

        return filtered.map((item: any) => {
            const savingProd = item.saving_products.find(
                (x: { coin: number }) => x.coin === item.coin,
            )
            const apy_e8 = parseInt(savingProd.tiered_non_reward_apy_e8, 10)

            return {
                name: item.coin === 5 ? 'USDT' : 'USDC',
                APR: apy_e8 / 100000000,
            }
        })
    } catch (error) {
        console.error('Bybit fetch error:', error)
        return []
    }
}

/**
 * Fetch data from Bybit USDE.
 */
export const data_Bybit_USDe = async () => {
    try {
        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/get-airdrop-product', {
            'headers': {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'guid': '9f3ecb05-d2c1-facf-9baa-b1a12546df95',
                'lang': 'en',
                'platform': 'pc',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'sec-gpc': '1',
                'traceparent': '00-3dbf426f92cf6d3edb563a8298275bc8-bb4b4b8b3fa8efba-01',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
                'usertoken': '',
                'x-user-agent': 'undefined',
                'cookie': process.env.BYBIT_COOKIE || '',
                'Referer': 'https://www.bybit.com/en/earn/usde-page'
            },
            'method': 'GET',
            // @ts-ignore
            agent: proxyAgent
        })

        console.log('Bybit USDe response status:', response.status)

        const json = await response.json()
        if (!json?.result?.product) {
            throw new Error('Unexpected Bybit Airdrop response structure.')
        }

        const product = json.result.product
        const apr_e8 = parseInt(product.apr_e8, 10)

        return {
            name: product.coin_name,
            APR: apr_e8 / 100000000,
        }
    } catch (error) {
        console.error('Bybit Airdrop fetch error:', error)
        return {}
    }
}