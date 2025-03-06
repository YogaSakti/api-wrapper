import fetch from 'cross-fetch'
import express from 'express'
import asyncHandler from 'express-async-handler'
import CacheService from '../utils/cache.service'
import { HttpsProxyAgent } from 'https-proxy-agent';
import { config } from 'dotenv'
if (process.env.NODE_ENV !== 'production') config()

const proxyAgent = new HttpsProxyAgent(process.env.PROXY_AGENT || 'http://blabla.blabla:9999');

const ttl = 60 * 1 // 5 minutes
const cache = new CacheService(ttl)
const router = express.Router()

/**
 * Fetch data from OKX.
 */
const data_OKX = async () => {
    try {
        const response = await fetch("https://www.okx.com/priapi/v1/earn/simple-earn/all-products?limit=100&type=all", {
            "headers": {
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9",
                "app-type": "web",
                "cache-control": "no-cache",
                "devid": "1d689401-801b-4dc2-ba49-7cededbf1957",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-cdn": "https://www.okx.com",
                "x-locale": "en_US",
                "x-utc": "7",
                "x-zkdex-env": "0",
                "Referer": "https://www.okx.com/earn/simple-earn",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "method": "GET",
            // @ts-ignore
            agent: proxyAgent
        });

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
                        "product_area": [0],
                        "page": 1,
                        "limit": 10,
                        "product_type": 4,
                        "coin_name": "USD",
                        "sort_apr": 0,
                        "show_available": false,
                        "fixed_saving_version": 1
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
                method: 'GET',
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
const data_Binance_All = async () => {
    try {
        let listCurrency = ['FDUSD', 'USDT', 'USDC'];
        const getData = (currency: any) => fetch(`https://www.binance.com/bapi/earn/v3/friendly/finance-earn/calculator/product/list?asset=${currency}&type=Flexible`, {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "bnc-currency": "USD",
                "bnc-location": "",
                "bnc-uuid": "3f4df1c8-cd33-4b91-8e24-93ed8338275b",
                "clienttype": "web",
                "content-type": "application/json", "lang": "en",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-passthrough-token": "",
                "x-trace-id": "735af735-42db-47c7-8feb-68272939852b",
                "x-ui-request-trace": "735af735-42db-47c7-8feb-68272939852b",
                "Referer": "https://www.binance.com/en/earn",
                "Referrer-Policy": "origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        });

        const promises = listCurrency.map(currency => getData(currency));
        const responses = await Promise.all(promises);
        const jsons = await Promise.all(responses.map(response => response.json()));
        const result = jsons.map((json: any) => {
            if (!json?.data?.savingFlexibleProduct?.length) {
                throw new Error('No data found for savingFlexibleProduct.');
            }
            const data = json.data.savingFlexibleProduct[0];
            return {
                name: data.asset,
                APR: parseFloat(data.marketApr),
            };
        });

        return result || [];
    } catch (error) {
        console.error('Binance fetch error:', error);
        return [];
    }
}

/**
 * Fetch data from Flipster.
 */
const data_Flipster = async () => {
    try {
        const response = await fetch("https://api.flipster.io/api/v1/earn", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "traceparent": "00-00000000000000004d2c1ad42bc86059-088f1775c63659c0-01",
                "x-datadog-origin": "rum",
                "x-datadog-parent-id": "616737468577110464",
                "x-datadog-sampling-priority": "1",
                "x-datadog-trace-id": "5560849138465661017",
                "x-prex-client-platform": "web",
                "x-prex-client-version": "release-web-2.2.105",
                "Referer": "https://flipster.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            },
            "body": null,
            "method": "GET"
        });

        const json = await response.json();
        if (json?.currencies?.length <= 0) {
            throw new Error('Unexpected Flipster response structure.');
        }

        // filter out only USDT
        const filtered = json.currencies.find(
            (item: any) => item.currency === 'USDT',
        );

        // sum the base and vip APRs
        const baseApr = parseFloat(filtered.aprs.base);
        const vipApr = parseFloat(filtered.maximalAchievableAprs.aprs.find((item: any) => item.title === 'VIP').apr);

        // return is 0.16 not 16 or 16% or "16"
        return {
            name: 'USDT',
            APR: (baseApr + vipApr) / 100,
        };
    } catch (error) {
        console.error('Flipster fetch error:', error);
        // Return an empty array or null if you want to handle gracefully
        return [];
    }
}

/**
 * Fetch data from Bitget.
 */
const data_Bitget = async () => {
    try {
        const response = await fetch("https://www.bitgetapp.com/v1/finance/savings/product/list", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json;charset=UTF-8",
                "language": "en_US",
                "locale": "en_US",
                "priority": "u=1, i",
            },
            "referrer": "https://www.bitgetapp.com/earning/savings?source1=earn&source2=savings",
            "referrerPolicy": "unsafe-url",
            "body": "{\"coinName\":\"USDT\",\"matchUserAssets\":false,\"matchVipProduct\":false,\"savingsReq\":true,\"searchObj\":{},\"locale\":\"en\"}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        const json = await response.json();
        if (!json?.data?.length) {
            throw new Error('Unexpected Bitget response structure.');
        }

        const data = json.data[0].bizLineProductList[0].productList.find((item: any) => item.period === 0)
        if (!data) {
            throw new Error('No data found for period = 0.');
        }

        const apy = data.apyList.find((item: any) => item.rateLevel === 1);
        if (!apy) {
            throw new Error('No data found for rateLevel = 1.');
        }

        const vipData = json.data[0].bizLineProductList.find((item: any) => item.productLevel === 2).productList.find((item: any) => item.period == 14) 
        if (!vipData) {
            throw new Error('No data found for VIP.');
        }

        const vipApy = vipData.apyList.find((item: any) => item.rateLevel === 0)
        if (!vipApy) {
            throw new Error('No data found for VIP rateLevel = 0.');
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
        ];
    } catch (error) {
        console.error('Bitget fetch error:', error);
        return [];
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
            let attempts = 0;
            do {
                cachedData = await data_OKX();
                attempts++;
            } while (cachedData.length === 0 && attempts < 10);
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
        const cachedData = await cache.get('binance-all', async () => data_Binance_All())
        res.status(200).json(cachedData)
    }),
)

/**
 * Flipster route - cached
 */
router.get(
    '/flipster',
    asyncHandler(async (req, res) => {
        console.log('Fetching Flipster data...');
        const cachedData = await cache.get('flipster', async () => data_Flipster());
        res.status(200).json(cachedData);
    }),
);

export default router
