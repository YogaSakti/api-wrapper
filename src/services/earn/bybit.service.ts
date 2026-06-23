/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'cross-fetch'
// @ts-ignore
import { SocksProxyAgent } from 'socks-proxy-agent'
import { EarnAprItem } from '../../types/api.types'

const proxyUrl = process.env.SOCKS5_AGENT
const proxyAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined

const BYBIT_HEADERS = {
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
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'usertoken': '',
    'x-user-agent': 'undefined',
    'cookie': process.env.BYBIT_COOKIE || '',
}

/**
 * Fetch data from Bybit.
 */
export const data_Bybit = async (): Promise<EarnAprItem[]> => {
    try {
        const response = await fetch(
            'https://api2.bybit.com/s1/byfi/get-saving-homepage-product-cards',
            {
                headers: {
                    ...BYBIT_HEADERS,
                    'guid': '9f3ecb05-d2c1-facf-9baa-b1a12546df95',
                    'traceparent': '00-54aeda26e5ff90870be888effe4a1f5b-b8682f9a572ea8cb-00',
                    'referer': 'https://www.bybit.com/',
                    'referrer-policy': 'strict-origin-when-cross-origin',
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
export const data_Bybit_USDe = async (): Promise<EarnAprItem[]> => {
    try {
        // Get date range - from 7 days ago to 7 days ahead to ensure we capture today's data
        const now = new Date()
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead

        const start_at = Math.floor(startDate.getTime() / 1000)
        const end_at = Math.floor(endDate.getTime() / 1000)

        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/airdrop/get-apr', {
            headers: {
                ...BYBIT_HEADERS,
                'referer': 'https://www.bybit.com/en/earn/usde-page',
                'traceparent': '00-f2c93bf876a5fce34d3d6cc5f153a583-c8e288e645f396a5-01',
            },
            'body': JSON.stringify({
                'start_at': start_at,
                'end_at': end_at,
                'coin': 624
            }),
            'method': 'POST',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        })

        const json = await response.json()

        if (!json?.result?.daily_aprs || json.result.daily_aprs.length === 0) {
            return []
        }

        // Get the most recent APR (last item in the array or closest to today)
        const todayTimestamp = Math.floor(Date.now() / 1000)
        const closestApr = json.result.daily_aprs.reduce((closest: any, current: any) => {
            const currentDiff = Math.abs(parseInt(current.timestamp) - todayTimestamp)
            const closestDiff = Math.abs(parseInt(closest.timestamp) - todayTimestamp)
            return currentDiff < closestDiff ? current : closest
        })

        const apr_e8 = parseInt(closestApr.apr_e8, 10)

        return [{
            name: 'USDe',
            APR: apr_e8 / 100000000,
        }]
    } catch (error) {
        console.error('Bybit Airdrop fetch error:', error)
        return []
    }
}

/**
 * Fetch data from Bybit USD1.
 */
export const data_Bybit_USD1 = async (): Promise<EarnAprItem[]> => {
    try {
        // Get date range - from 7 days ago to 7 days ahead to ensure we capture today's data
        const now = new Date()
        const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead

        const start_at = Math.floor(startDate.getTime() / 1000)
        const end_at = Math.floor(endDate.getTime() / 1000)

        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/airdrop/get-apr', {
            headers: {
                ...BYBIT_HEADERS,
                'referer': 'https://www.bybit.com/en/earn/usd1-page',
                'traceparent': '00-f2c93bf876a5fce34d3d6cc5f153a583-c8e288e645f396a5-01',
            },
            'body': JSON.stringify({
                'start_at': start_at,
                'end_at': end_at,
                'coin': 920
            }),
            'method': 'POST',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        })

        const json = await response.json()

        if (!json?.result?.daily_aprs || json.result.daily_aprs.length === 0) {
            return []
        }

        // Get the most recent APR (last item in the array or closest to today)
        const todayTimestamp = Math.floor(Date.now() / 1000)
        const closestApr = json.result.daily_aprs.reduce((closest: any, current: any) => {
            const currentDiff = Math.abs(parseInt(current.timestamp) - todayTimestamp)
            const closestDiff = Math.abs(parseInt(closest.timestamp) - todayTimestamp)
            return currentDiff < closestDiff ? current : closest
        })

        const apr_e8 = parseInt(closestApr.apr_e8, 10)

        return [{
            name: 'USD1',
            APR: apr_e8 / 100000000,
        }]
    } catch (error) {
        console.error('Bybit Airdrop fetch error:', error)
        return []
    }
}

/**
 * Fetch BYUSDT airdrop product data from Bybit.
 * @param tier - 1 (default, ≤100k, full APR) or 2 (>100k, base APR only)
 */
export const data_Bybit_BYUSDT = async (tier?: number): Promise<EarnAprItem[]> => {
    try {
        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/get-airdrop-product', {
            headers: {
                ...BYBIT_HEADERS,
                'referer': 'https://www.bybit.com/en/earn/byusdt-page',
            },
            method: 'GET',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        })

        const json = await response.json()

        if (!Array.isArray(json?.result?.products)) {
            throw new Error('Unexpected Bybit BYUSDT response structure.')
        }

        const product = json.result.products.find((p: any) => p.coin_name === 'BYUSDT')
        if (!product) {
            return []
        }

        if (tier === 2) {
            // Tier 2: >100k, only base apy (no bonus)
            const tierData = product.bonus_apr_list?.find((t: any) => t.to_amount === '-1')
            const apy_e8 = parseInt(tierData?.apy_e8 ?? '0', 10)
            return [{ name: 'BYUSDT', APR: apy_e8 / 100000000 }]
        }

        // Tier 1 (default): full APR (base + bonus)
        const tierData = product.bonus_apr_list?.find((t: any) => t.from_amount === '0')
        const total_e8 = parseInt(tierData?.apy_e8 ?? '0', 10) + parseInt(tierData?.bonus_apr_e8 ?? '0', 10)
        return [{ name: 'BYUSDT', APR: total_e8 / 100000000 }]
    } catch (error) {
        console.error('Bybit BYUSDT fetch error:', error)
        return []
    }
}

/**
 * Fetch On-chain data from Bybit.
 */
export const data_Bybit_OnChain = async (): Promise<EarnAprItem[]> => {
    try {
        const response = await fetch('https://www.bybit.com/x-api/s1/byfi/pos-staking/homepage-product-cards', {
            headers: {
                ...BYBIT_HEADERS,
                'guid': '9f3ecb05-d2c1-facf-9baa-b1a12546df95',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
                'origin': 'https://www.bybit.com',
                'referer': 'https://www.bybit.com/en/earn/pos',
                'traceparent': '00-43d0dd7262b18e644dc97846df830d5a-9b8ce1a83e1e55a4-01',
            },
            body: JSON.stringify({ coin_name: 'USD' }),
            method: 'POST',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        })

        const json = await response.json()
        // Defensive: check structure
        if (!json?.result?.coin_products) {
            throw new Error('Unexpected Bybit OnChain response structure.')
        }

        // coin=5 => USDT, coin=16 => USDC
        return json.result.coin_products
            .filter((i: any) => i.coin === 5 || i.coin === 16)
            .flatMap((item: any) => {
                // Only products with name 'Mantle Vault'
                if (!Array.isArray(item.products)) return []
                return item.products
                    .filter((prod: any) => prod.name === 'Mantle Vault')
                    .map((prod: any) => ({
                        name: item.coin === 5 ? 'USDT' : 'USDC',
                        APR: parseInt(prod.display_apy_e8, 10) / 100000000,
                    }))
            })
    } catch (error) {
        console.error('Bybit OnChain fetch error:', error)
        return []
    }
}