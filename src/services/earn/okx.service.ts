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

const MAX_REWARD_AMOUNT = 10_000
const MAX_REWARD_APY = 0.1

interface OkxSimpleCurrency {
    investCurrency: { currencyName: string }
    rate: { rateNum: { value: unknown[] } }
}

interface OkxStableReward {
    currencyId: Array<{ currencyName: string }>
    campaign: { vipApy: string }
}

const getSimpleCurrencies = (json: unknown): unknown[] | null => {
    if (typeof json !== 'object' || json === null || !('data' in json)) return null
    const data = json.data
    if (typeof data !== 'object' || data === null || !('allProducts' in data)) return null
    const allProducts = data.allProducts
    if (typeof allProducts !== 'object' || allProducts === null || !('currencies' in allProducts)) return null
    return Array.isArray(allProducts.currencies) ? allProducts.currencies : null
}

const parseSimpleEarn = (item: unknown): EarnAprItem | null => {
    if (typeof item !== 'object' || item === null || !('investCurrency' in item) || !('rate' in item)) return null
    const candidate = item as OkxSimpleCurrency
    if (!candidate.investCurrency || !candidate.rate?.rateNum || !Array.isArray(candidate.rate.rateNum.value)) return null

    const name = candidate.investCurrency.currencyName
    const values = candidate.rate.rateNum.value
    const rate = Array.isArray(values) ? Number(values[0]) : NaN
    if ((name !== 'USDT' && name !== 'USDC') || !Number.isFinite(rate)) return null

    return { name, APR: rate / 100 }
}

const parseStableReward = (item: unknown, amount?: number): EarnAprItem | null => {
    if (typeof item !== 'object' || item === null || !('currencyId' in item) || !('campaign' in item)) return null
    const candidate = item as OkxStableReward
    if (!Array.isArray(candidate.currencyId) || !candidate.currencyId[0] || !candidate.campaign) return null

    const name = candidate.currencyId[0].currencyName
    const vipApy = Number(candidate.campaign.vipApy)
    if ((name !== 'USDG' && name !== 'RLUSD') || !Number.isFinite(vipApy)) return null

    const APR = amount && amount > MAX_REWARD_AMOUNT ? (MAX_REWARD_AMOUNT * MAX_REWARD_APY + (amount - MAX_REWARD_AMOUNT) * vipApy) / amount : MAX_REWARD_APY

    return { name, APR }
}

/**
 * Fetch data from OKX.
 */
export const data_OKX = async (amount?: number): Promise<EarnAprItem[]> => {
    try {
        const requestOptions = {
            headers: {
                accept: 'application/json',
                'accept-language': 'en-US,en;q=0.9',
                'app-type': 'web',
                devid: '1d689401-801b-4dc2-ba49-7cededbf1957',
                priority: 'u=1, i',
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
                Referer: 'https://www.okx.com/earn/simple-earn',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
                cookie: `${process.env.OKX_COOKIE || ''}`,
                authorization: `${process.env.OKX_AUTHORIZATION || ''}`
            },
            method: 'GET',
            ...(proxyAgent ? { agent: proxyAgent } : {})
        }

        const [simpleResponse, rewardsResponse] = await Promise.all([
            fetch('https://www.okx.com/priapi/v1/earn/simple-earn/all-products?limit=100&type=all', requestOptions),
            fetch(`https://www.okx.com/priapi/v1/earn/stable-rewards/landing?t=${Date.now()}`, requestOptions)
        ])

        const [simpleJson, rewardsJson]: unknown[] = await Promise.all([simpleResponse.json(), rewardsResponse.json()])
        const simpleCurrencies = getSimpleCurrencies(simpleJson)
        const stableRewards = typeof rewardsJson === 'object' && rewardsJson !== null && 'data' in rewardsJson && Array.isArray(rewardsJson.data) ? rewardsJson.data : null
        if (!simpleCurrencies || !stableRewards) {
            throw new Error('Unexpected OKX response structure.')
        }

        return [
            ...simpleCurrencies.map(parseSimpleEarn).filter((item): item is EarnAprItem => item !== null),
            ...stableRewards.map((item) => parseStableReward(item, amount)).filter((item): item is EarnAprItem => item !== null)
        ]
    } catch (error) {
        console.error('OKX fetch error:', error)
        return []
    }
}
