/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import fetch from 'cross-fetch'
import express from 'express'
import asyncHandler from 'express-async-handler'
import CacheService from '../utils/cache.service'
// @ts-ignore
import { HttpsProxyAgent } from 'https-proxy-agent'
// @ts-ignore
import { SocksProxyAgent } from 'socks-proxy-agent'
import { config } from 'dotenv'
if (process.env.NODE_ENV !== 'production') config()

import tls from 'tls'
tls.DEFAULT_CIPHERS = 'TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES256-GCM-SHA384'
tls.DEFAULT_MIN_VERSION = 'TLSv1.2'

// @ts-ignore
// const proxyAgent = new HttpsProxyAgent(process.env.PROXY_AGENT || 'http://blabla.blabla:9999');
const proxyAgent = new SocksProxyAgent(process.env.SOCKS5_AGENT || 'socks5h://blabla.blabla:9999')

const ttl = 60 * 1 // 1 minutes
const cache = new CacheService(ttl)
const router = express.Router()

/**
 * Fetch data from OKX.
 */

const data_OKX = async () => {
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
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
            },
            'method': 'GET',
            // @ts-ignore
            agent: proxyAgent
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

/**
 * Fetch data from Bybit.
 */
const data_Bybit = async () => {
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
                    cookie: 'deviceId=aa6520e0-ff41-d176-fad4-e57de01e3091; ...',
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
 * Fetch data from Binance.
 */
const data_Binance = async () => {
    try {
        const response = await fetch(
            'https://www.binance.com/bapi/earn/v1/friendly/finance-earn/homepage/overview?searchCoin=FDUSD&pageSize=100',
            {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'bnc-currency': 'USD_USD',
                    'bnc-location': 'BINANCE',
                    'bnc-uuid': '9c7f4b6f-b75f-41d5-9872-98e1e1827126',
                    clienttype: 'web',
                    'content-type': 'application/json',
                    csrftoken: 'd41d8cd98f00b204e9800998ecf8427e',
                    lang: 'en',
                    priority: 'u=1, i',
                    'sec-ch-ua':
                        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-passthrough-token': '',
                    'x-trace-id': 'e3b264c3-6475-4876-8751-573290b8cffb',
                    'x-ui-request-trace': 'e3b264c3-6475-4876-8751-573290b8cffb',
                    Referer: 'https://www.binance.com/en/earn',
                    'Referrer-Policy': 'origin-when-cross-origin',
                },
                method: 'GET'
            },
        )

        const json = await response.json()
        if (!json?.data?.list) {
            throw new Error('Unexpected Binance response structure.')
        }

        // find FDUSD
        const fdusdData = json.data.list.find(
            (item: { asset: string }) => item.asset === 'FDUSD',
        )
        if (!fdusdData?.productSummary) {
            throw new Error('FDUSD data not found in Binance response.')
        }

        const simpleEarn = fdusdData.productSummary.find(
            (p: { productType: string }) => p.productType === 'SIMPLE_EARN',
        )

        if (!simpleEarn) {
            throw new Error('SIMPLE_EARN for FDUSD not found in Binance response.')
        }

        // e.g. maxApr is in decimal form like "0.10" => 10%
        return {
            name: 'FDUSD',
            APR: (parseFloat(simpleEarn.maxApr) * 100) / 100,
        }
    } catch (error) {
        console.error('Binance fetch error:', error)
        return {}
    }
}

/**
 * Fetch FDUSD, USDT, and USDC data from Binance.
 */
const data_Binance_All = async (noLimit: string) => {
    try {
        const listCurrency = ['FDUSD', 'USDT', 'USDC']
        const getData = (currency: any) => fetch(`https://www.binance.com/bapi/earn/v3/friendly/finance-earn/calculator/product/list?asset=${currency}&type=Flexible`, {
            'headers': {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'bnc-currency': 'USD',
                'bnc-location': '',
                'bnc-uuid': '3f4df1c8-cd33-4b91-8e24-93ed8338275b',
                'clienttype': 'web',
                'content-type': 'application/json', 'lang': 'en',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-passthrough-token': '',
                'x-trace-id': '735af735-42db-47c7-8feb-68272939852b',
                'x-ui-request-trace': '735af735-42db-47c7-8feb-68272939852b',
                'Referer': 'https://www.binance.com/en/earn',
                'Referrer-Policy': 'origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const jsons = await Promise.all(listCurrency.map(c => getData(c).then(r => r.json())))

        return jsons.map(json => {
            const data = json?.data?.savingFlexibleProduct?.[0]
            if (!data) throw new Error('No data found.')
            return {
                name: data.asset,
                APR: parseFloat(
                    noLimit && data.asset === noLimit
                        ? data.apy
                        : data.marketApr
                )
            }
        }) || []
    } catch (error) {
        console.error('Binance fetch error:', error)
        return []
    }
}

/**
 * Fetch data from Flipster.
 */
const data_Flipster = async () => {
    try {
        const response = await fetch('https://api.flipster.io/api/v1/earn', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'traceparent': '00-00000000000000004d2c1ad42bc86059-088f1775c63659c0-01',
                'x-datadog-origin': 'rum',
                'x-datadog-parent-id': '616737468577110464',
                'x-datadog-sampling-priority': '1',
                'x-datadog-trace-id': '5560849138465661017',
                'x-prex-client-platform': 'web',
                'x-prex-client-version': 'release-web-2.2.105',
                'Referer': 'https://flipster.io/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const json = await response.json()
        if (json?.currencies?.length <= 0) {
            throw new Error('Unexpected Flipster response structure.')
        }

        // filter out only USDT
        const filtered = json.currencies.find(
            (item: any) => item.currency === 'USDT',
        )

        // sum the base and vip APRs
        const baseApr = parseFloat(filtered.aprs.base)
        const vipApr = parseFloat(filtered.maximalAchievableAprs.aprs.find((item: any) => item.title === 'VIP').apr) || 0

        // return is 0.16 not 16 or 16% or "16"
        return {
            name: 'USDT',
            APR: (baseApr + vipApr) / 100,
        }
    } catch (error) {
        console.error('Flipster fetch error:', error)
        // Return an empty array or null if you want to handle gracefully
        return []
    }
}

/**
 * Fetch data from Bybit USDE.
 */
const data_Bybit_USDe = async () => {
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
                'cookie': '_by_l_g_d=9f3ecb05-d2c1-facf-9baa-b1a12546df95; _by_l_g_d=9f3ecb05-d2c1-facf-9baa-b1a12546df95; _tt_enable_cookie=1; _fwb=223ajaNHGCNZEmN6b6evTLN.1728477751601; _ttp=ZFdaryi7el1zQFxWZJKUL6CaJha.tt.1; wcs_bt=17470ac91156420:1746000634; deviceId=1fc248f1-fbf0-144b-d181-58c041722505; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2213161013%22%2C%22first_id%22%3A%2218f9920f60c1fa8-027e7d6fbdb32a4-26001d51-2073600-18f9920f60d2a90%22%2C%22props%22%3A%7B%22_a_u_v%22%3A%220.0.6%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%2C%22%24latest_utm_content%22%3A%22web3Menu_dexPro%22%2C%22%24latest_utm_source%22%3A%22uj_header%22%2C%22%24latest_utm_medium%22%3A%22organic_comm%22%2C%22utm_content%22%3A%22web3Menu_dexPro%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMThmOTkyMGY2MGMxZmE4LTAyN2U3ZDZmYmRiMzJhNC0yNjAwMWQ1MS0yMDczNjAwLTE4Zjk5MjBmNjBkMmE5MCIsIiRpZGVudGl0eV9sb2dpbl9pZCI6IjEzMTYxMDEzIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%2213161013%22%7D%2C%22%24device_id%22%3A%2218f99211110a98-0533d5046cb892c-26001d51-2073600-18f992111111719%22%7D; sensorsdatacard={"source":"globalSearch"}; sensorsdata2015jssdkchannel=%7B%22prop%22%3A%7B%22_sa_channel_landing_url%22%3A%22%22%7D%7D; BYBIT_REG_REF_prod={"lang":"en-US","g":"9f3ecb05-d2c1-facf-9baa-b1a12546df95","referrer":"www.bybit.com/","source":"bybit.com","medium":"other","url":"https://www.bybit.com/en/","last_refresh_time":"Mon, 28 Jul 2025 08:40:41 GMT","ext_json":{"dtpid":null}}; tx_token_current=BNE; cookies_uuid_report=305911e9-522c-4bca-a11f-08bd5cc824a6; first_collect=true; trace_id_report=dab25c95-b667-4364-b9cc-272977f6f6fa; bm_mi=64DC36074FF053A57F9715F3C2DC1495~YAAQw3w2F2p8NEGYAQAAbWYxUBwFT8VaJkWOAsQPiGKVj2C3vSLzaRpSlMS5c0xM5LB9LDLtoeTB6ruCyqiDheY24ipiAPD+0WheTQoa1k6i0HMrXPVTtND5BGOoHJVygts7jFXbh5VH3CvHmsXBAuQkoNBRqWiwvExRisMpdSihduo/anCM5UwORHiQZbfppRtq5j4+uI9gjUQe+aBMPxnws2FmL+IpDOSqh1rnZlzlLbLtcjf0SYTgyxpVtaEKP7STRFNW4A0j0k28toH//qgZf3OHIzK28gyLi1jdZ8ag3PhisKFaSZH3rr66Zb6x0yim1nsbKpsnf7czxh5p422SOCyZCPit4Vv2HiX1LYtKnoBwHkE0JSsb/S0=~1; _abck=4DD7222D69A408DDDD14E02252F165C3~0~YAAQw3w2F4J8NEGYAQAA7WcxUA6oY2arsItU4Z7+H1ULaifMxy+cI2P8TCM+p/ns5PEJaS8IY9mvIwoLm2Wl0JFUCsR2PfNMxldrNrnFJg0UVQiIq2eizbyzG7dHsK+v6nFVm1e0QtGNKhURlni4W8yYMbKvLGbLActRJVh5ym7d7zB/YJ5kOpeQheXPoKq6MLwILZdUSu5RinpKs7xaV85Kz7TGcXbT5fNTqEAPNkMjJZD/hELwQghtC7auzP12cGaAabiz07jrL4VXQx4fJJTD7jy3JU+7x7zWJRBCcpqFYuHsaYR8sxcbMEpuNpYQFf2tNTnvVyibcY1kPoVq8LOAIBEpAyXQ+34cC9VxpDz98OXvXHCeydR08+zCrUAEVGt4NRV8Kw8OQx4HnWGEZxUjTM+xn4QojX0gmYPUMjS/DgkOIl4TGG/2ikveeTAvfCV8JB0N3yrhh+/nVAuNLi8GCiW9BhdE3SMV2eDRcVeFCelErSMf1qyUNmcXBE52I9BjWdRvcM7sInM6XFzYTWLAsAgiZogETDmMahFOvBnWnyuI3+sA78B1+jHKzPmpeNbUll/qivfN4FX2V74k9kB73p6fT16dn0ZQuLlHGvOanMs14k4YEocFFfGJTS/qSFGEHEOhRUESQ86/qL2XYx5WFsAorTUYUojGxaat4HHIQUlTKvRApY5ac/Odxoi0+/0opoTXEdecHu73tsVoL6H4ABMpZBCxLGzQCOcal5crEPZEfYvBBXUI7wrYTL9HgL5SC1S3MiPWqrmyz0hSpEOqJGlcUdZrmQ==~-1~-1~-1; bm_sv=ECC7CFD66CCF90A88414975978D54F8B~YAAQw3w2F2t9NEGYAQAArXgxUBxW8W/TDhPOkKftVkFJGyFx43RM4bm5E5kP3AVAJHVPd05rVdlNUZcOUBshnUUfRx8gOPGbsYbX5AaC3qUCpmzArSLM1tWSPF+Yi6Z6L5/Enyb8CFZqtNWRfeFgrr8Aa16QsXbmhLYwalWWMjXAvbjM6dGk0UcBZh6sZqoc2KIkBRRegKlSHh9eKeqalVrpH6FhY32/2OLslsmyK7pi7D/vMp0DFibQZUw+xER/~1; ak_bmsc=BABDE9CD3EA20CE422B88B588EE1CF56~000000000000000000000000000000~YAAQw3w2F26ENEGYAQAAv94xUBwY6n1ySxF071cHCXP1rhtz0TuDvKxHLaqTVihTwC8QiMhCXBM6Bv8lkgMfkwRXGm5BB5DV8m3XTZmNw1mE7uPenns+29Ery8qFnmI7NyUeK24vdLMEhydX1n9ODAZOSNfnjxfDP39BCkSRm+GnWIoJPKlbKaXBALaGYGNSQPnq4FxGB8GHPETHVR2hz0x18sSaRQm/u3POw8goF+S/WQesCxsnBa+vpYZ/lM7QhpxzxGOkufVeL1UhVb1WCe9tK5gwIYguJKIhnNdVw8GkA+fY63D72+HZTT7QdkhXRfV+0IPNqIDWMCj4IKUye7eFjVlb5Ges5v6/ZqRPyOzyBt9aFNCdg+8zUgEW4tusIznIlNE7F15rkZxViz2RgEono/Vh15Hsu3X9dI7JoiF70Ep6JsPwrgFugydHNRB96nKpj7OITRSevnvmxPHFnEi+50OsE5oNGHH6; by_token_print=9bac916397m0zl9n7wllqpd7482abdd45; deviceCodeExpire=1753692164915; bm_sz=58A9D62206F88D2430897BAA94A6D6B1~YAAQw3w2FziXNEGYAQAAWAYzUBza/DgWiWWzS3n2zQo++bvKdhq/7QQ2QswLFwHJY7D4TVJ+PrM0LOevjOP3bPO4NLH4lrJn6Cvd+H+Taoi85ZVx5svTwjrcpV0PGabZOPUrDQBRgYEm0nD+GkMtOP2k7cL/2DvNcMIfwyETTGhrTa7Y97RCqagspkVGqGHHr5uioXHBYfNz+71kb8QLHJ8wzi6nBNL5sG64/Y1lRFECdZ2d+QUfn7jmZDgUTbF06udNA3ZkHNW4oGZJlPnFO9zXPpq/gONzTklr8NRnqpqf41rrDanUEqNUavdY1Jw0sys26Z/Q79sWxmpy+gC9lRCP+D7+oPy6YpjUQToQLLnwPEyOokMlFdh1HhFKV77F30gRXI0o4E5CRYN/q0DGyuBBdf6qacijgiYmnhYfUXj13u8PD5UcQFX5q1kl7VQcN8b8y8y1/a9E~3163458~3224901; tx_token_time=1753692179355; trace_id_time=1753692179478',
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

/**
 * Fetch data from Bitget.
 */
const data_Bitget = async () => {
    try {
        const response = await fetch('https://www.bitgetapp.com/v1/finance/savings/product/list', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json;charset=UTF-8',
                'language': 'en_US',
                'locale': 'en_US',
                'priority': 'u=1, i',
            },
            'referrer': 'https://www.bitgetapp.com/earning/savings?source1=earn&source2=savings',
            'referrerPolicy': 'unsafe-url',
            'body': '{"coinName":"USDT","matchUserAssets":false,"matchVipProduct":false,"savingsReq":true,"searchObj":{},"locale":"en"}',
            'method': 'POST',
            'mode': 'cors',
            'credentials': 'include'
        })

        const json = await response.json()
        if (!json?.data?.length) {
            throw new Error('Unexpected Bitget response structure.')
        }

        const data = json.data[0].bizLineProductList[0].productList.find((item: any) => item.period === 0)
        if (!data) {
            throw new Error('No data found for period = 0.')
        }

        const apy = data.apyList.find((item: any) => item.rateLevel === 1)
        if (!apy) {
            throw new Error('No data found for rateLevel = 1.')
        }

        const vipData = json.data[0].bizLineProductList.find((item: any) => item.productLevel === 2).productList.find((item: any) => item.period == 14)
        if (!vipData) {
            throw new Error('No data found for VIP.')
        }

        const vipApy = vipData.apyList.find((item: any) => item.rateLevel === 0)
        if (!vipApy) {
            throw new Error('No data found for VIP rateLevel = 0.')
        }

        return [
            {
                name: data.coinName,
                APR: parseFloat(apy.apy) / 100,
            },
            {
                name: `${vipData.coinName}-VIP-14`,
                APR: parseFloat(vipApy.apy) / 100,
            },
        ]
    } catch (error) {
        console.error('Bitget fetch error:', error)
        return []
    }
}

const data_pintu = async () => {
    try {
        const response = await fetch('https://api.pintu.pro/v1/public/get-candlesticks?symbol=USDT-IDR&interval=1m', {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'Referer': 'https://pintu.co.id/',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            'body': null,
            'method': 'GET'
        })

        const json = await response.json()

        if (!json?.data) {
            throw new Error('Unexpected Pintu response structure.')
        }

        const candlesData = json.data.candlesticks

        // check if candlesData is empty
        if (!candlesData || candlesData.length === 0) {
            throw new Error('No data found in Pintu response.')
        }

        // get first data
        const firstData = candlesData[0] || {}
        const currentPrice = firstData?.c || 0

        return parseFloat(currentPrice) || 0

    } catch (error) {
        console.error('Pintu fetch error:', error)
        return null
    }
}

/**
 * Basic welcome route
 */
router.get('/', (req, res) => {
    res.status(200).send({
        message: 'Welcome to stable API! Use /okx, /bybit, or /binance to get the data',
    })
})

/**
 * Bitget route - cached
 */
router.get(
    '/bitget',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bitget data...')
        const cachedData = await cache.get('bitget', async () => data_Bitget())
        res.status(200).json(cachedData)
    }),
)

/**
 * OKX route - cached
 */
router.get(
    '/okx',
    asyncHandler(async (req, res) => {
        console.log('Fetching OKX data...')
        let cachedData = await cache.get('okx', async () => await data_OKX())

        // f#ck // break the cache if the data is empty 
        if (cachedData.length === 0) {
            let attempts = 0
            do {
                cachedData = await data_OKX()
                attempts++
            } while (cachedData.length === 0 && attempts < 10)
        }

        res.status(200).json(cachedData)
    }),
)

/**
 * Bybit route - cached
 */
router.get(
    '/bybit',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit data...')
        const cachedData = await cache.get('bybit', async () => data_Bybit())
        res.status(200).json(cachedData)
    }),
)

/**
 * Bybit Airdrop route - cached
 */
router.get(
    '/bybit-usde',
    asyncHandler(async (req, res) => {
        console.log('Fetching Bybit USDe data...')
        const cachedData = await cache.get('bybit-usde', async () => data_Bybit_USDe())
        res.status(200).json(cachedData)
    }),
)

/**
 * Binance route - cached
 */
router.get(
    '/binance',
    asyncHandler(async (req, res) => {
        console.log('Fetching Binance data...')
        const cachedData = await cache.get('binance', async () => data_Binance())
        res.status(200).json(cachedData)
    }),
)

/**
 * Binance all route - cached
 */
router.get(
    '/binance-stable',
    asyncHandler(async (req, res) => {
        console.log('Fetching Binance all data...')
        const noLimit = (req.query.noLimit as string) || ''
        const cacheKey = `binance-all:${noLimit}`
        const cachedData = await cache.get(cacheKey, () => data_Binance_All(noLimit))
        res.status(200).json(cachedData)
    }),
)

/**
 * Flipster route - cached
 */
router.get(
    '/flipster',
    asyncHandler(async (req, res) => {
        console.log('Fetching Flipster data...')
        const cachedData = await cache.get('flipster', async () => data_Flipster())
        res.status(200).json(cachedData)
    }),
)

/**
 * Pintu route - cached
 */
router.get(
    '/pintu',
    asyncHandler(async (req, res) => {
        console.log('Fetching Pintu data...')
        const cachedData = await cache.get('pintu', async () => data_pintu())
        res.status(200).json(cachedData)
    }),
)

export default router
