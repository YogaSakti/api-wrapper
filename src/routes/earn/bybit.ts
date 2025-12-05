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
        // Get date range - from 7 days ago to 7 days ahead to ensure we capture today's data
        const now = new Date()
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead
        
        const start_at = Math.floor(startDate.getTime() / 1000)
        const end_at = Math.floor(endDate.getTime() / 1000)

        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/airdrop/get-apr', {
            'headers': {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8',
                'content-type': 'application/json',
                'guid': '9e1542d6-d26f-515f-043c-575398b7c3b1',
                'lang': 'en',
                'platform': 'pc',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'traceparent': '00-f2c93bf876a5fce34d3d6cc5f153a583-c8e288e645f396a5-01',
                'usertoken': '',
                'x-user-agent': 'undefined',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
                'cookie': process.env.BYBIT_COOKIE || '',
            },
            'referrer': 'https://www.bybit.com/en/earn/usde-page',
            'body': JSON.stringify({
                'start_at': start_at,
                'end_at': end_at,
                'coin': 624
            }),
            'method': 'POST',
            // @ts-ignore
            agent: proxyAgent
        })

        const json = await response.json()
        
        if (!json?.result?.daily_aprs || json.result.daily_aprs.length === 0) {
            return {
                name: 'USDe',
                APR: 0,
            }
        }

        // Get the most recent APR (last item in the array or closest to today)
        const todayTimestamp = Math.floor(Date.now() / 1000)
        const closestApr = json.result.daily_aprs.reduce((closest: any, current: any) => {
            const currentDiff = Math.abs(parseInt(current.timestamp) - todayTimestamp)
            const closestDiff = Math.abs(parseInt(closest.timestamp) - todayTimestamp)
            return currentDiff < closestDiff ? current : closest
        })
        
        const apr_e8 = parseInt(closestApr.apr_e8, 10)

        return {
            name: 'USDe',
            APR: apr_e8 / 100000000,
        }
    } catch (error) {
        console.error('Bybit Airdrop fetch error:', error)
        return {}
    }
}