import fetch from 'cross-fetch'
import express from 'express'
import asyncHandler from 'express-async-handler';
import CacheService from '../utils/cache.service'

// // cache for 10 minutes
const ttl = 60 * 5
const cache = new CacheService(ttl) // Create a new cache service instance
const router = express.Router()


const data_OKX = async () => {
    return fetch("https://www.okx.com/priapi/v1/earn/simple-earn/all-products?productsType=all&t=1736145194620", {
        "headers": {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9",
            "app-type": "web",
            "devid": "bd43f0b2-6764-4951-8ed1-f6a090f503ad",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-cdn": "https://www.okx.com",
            "x-id-group": "2130861432456730007-c-28",
            "x-locale": "en_US",
            "x-site-info": "==QfxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsICRJJiOi42bpdWZyJye",
            "x-utc": "7",
            "x-zkdex-env": "0",
            "cookie": "ok_site_info===QfxojI5RXa05WZiwiIMFkQPx0Rfh1SPJiOiUGZvNmIsICRJJiOi42bpdWZyJye; preferLocale=en_US; ok_prefer_udColor=0; devId=bd43f0b2-6764-4951-8ed1-f6a090f503ad; u_pid=D6D6lm9rEC5jB70; _ym_uid=1706704498806345210; finger_test_cookie=1706704739272; ftID=521023117765481.011bbc2cd48f74422a0219d19159b31e97a81.1000L7o0.53ABF4E293EB9969; x-lid=f1fd8ad2e6c1a334b7d90e6300ce63369c7db3afc406701e3b4dbfe315d98499a1857c51; ok_prefer_udTimeZone=1; ok_prefer_currency=%7B%22currencyId%22%3A0%2C%22isDefault%22%3A1%2C%22isPremium%22%3Afalse%2C%22isoCode%22%3A%22USD%22%2C%22precision%22%3A2%2C%22symbol%22%3A%22%24%22%2C%22usdToThisRate%22%3A1%2C%22usdToThisRatePremium%22%3A1%2C%22displayName%22%3A%22USD%22%7D; _ym_d=1725595439; connected=1; amp_669cbf=bd43f0b2-6764-4951-8ed1-f6a090f503ad.YmQ0M2YwYjItNjc2NC00OTUxLThlZDEtZjZhMDkwZjUwM2Fk..1i72o1c1s.1i72o66ht.c.0.c; locale=en_US; ok-exp-time=1736143200680; AMP_MKTG_56bf9d43d5=JTdCJTdE; _gid=GA1.2.1771528173.1736143171; first_ref=https%3A%2F%2Fwww.okx.com%2F; okg.currentMedia=sm; tmx_session_id=bo4kjqyrmvf_1736143181458; fingerprint_id=bd43f0b2-6764-4951-8ed1-f6a090f503ad; intercom-id-ny9cf50h=c44eff74-fb76-4a5e-a578-f42c5f168f6e; intercom-session-ny9cf50h=; intercom-device-id-ny9cf50h=22e79ca6-60ce-4a1b-a86d-094da8b340bb; traceId=2130861432456730007; _ga=GA1.1.1200313425.1704426161; _ga_G0EKWWQGTZ=GS1.1.1736143170.6.1.1736143220.10.0.0; _monitor_extras={\"deviceId\":\"qC5BBFbaCCD0m229dJXrMD\",\"eventId\":114,\"sequenceNumber\":114}; AMP_56bf9d43d5=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJiZDQzZjBiMi02NzY0LTQ5NTEtOGVkMS1mNmEwOTBmNTAzYWQlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM2MTQzMTcwNjExJTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczNjE0MzIyMjA1NyUyQyUyMmxhc3RFdmVudElkJTIyJTNBNzUlMkMlMjJwYWdlQ291bnRlciUyMiUzQTAlN0Q=; __cf_bm=yVb1mGxwCMBC8bB1rrr_NTjC9k431pd8xNJjSZBD76Q-1736145022-1.0.1.1-JeJoGfyiJwl3dxk31F3uEMcImX0tCnNW9J4uoA_nsLM.8SIhoF4huixPIztTkmLoiqkwQsCIWHV3cev.S7_A2w",
            "Referer": "https://www.okx.com/earn/simple-earn",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    }).then((response: { json: () => any }) => response.json())
        .then((json: any) => json.data.allProducts.currencies)
        // filter USDT and USDC inside investCurrency.currencyName
        .then((json: any) => json.filter((i: { investCurrency: { currencyName: string; }; }) => i.investCurrency.currencyName === 'USDT' || i.investCurrency.currencyName === 'USDC'))
        .then((json: any) => json.map((i: { investCurrency: { currencyName: any; }; rate: { rateNum: { value: any[]; }; }; }) => {
            return {
                name: i.investCurrency.currencyName,
                APR: parseFloat(i.rate.rateNum.value[0]).toFixed(2)
            }
        }))

}

const data_Bybit = async () => {
    return fetch("https://api2.bybit.com/s1/byfi/get-saving-homepage-product-cards", {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "guid": "15b1bccb-9cc3-0a15-3bf4-3c698202505b",
            "lang": "en",
            "platform": "pc",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "traceparent": "00-840759c0c04361e90def36f751a9b952-7ade765288fa7afd-00",
            "usertoken": "",
            "cookie": "deviceId=5e99c56c-68b6-7e3d-0669-3050cf423011; _ga=GA1.1.364028277.1705645316; _tt_enable_cookie=1; _ym_uid=1705645318592704300; _fwb=112IGNBiqvT1XaqH2WzwjGk.1706704813863; tmr_lvid=a9a06205669dded7aeaab70accebd3d2; tmr_lvidTS=1716358010139; _by_l_g_d=15b1bccb-9cc3-0a15-3bf4-3c698202505b; _fbp=fb.1.1726721152898.29353534736270968; _ym_d=1726721154; sensorsdata2015session=%7B%7D; _ttp=s4Bm06qVAK92cMK2nnO-YPQ_wzf.tt.1; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%2213161013%22%2C%22first_id%22%3A%2218d20620d5315e-0d9d1c95bcb773-26001851-2073600-18d20620d54821%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%2C%22_a_u_v%22%3A%220.0.6%22%2C%22%24latest_utm_source%22%3A%22tiktok%22%2C%22%24latest_utm_medium%22%3A%22organic_social%22%2C%22c%22%3A%22card1111_17309801555344486%22%2C%22dtpid%22%3A%2217309801555344486%22%2C%22pid%22%3A%22bytedanceglobal_int%22%2C%22sa_utm_channel%22%3A%22pr_%22%2C%22sa_utm_ci%22%3A%222850%22%2C%22sa_utm_tcn%22%3A%2217309801555344486%22%2C%22utm_medium%22%3A%22organic_social%22%2C%22utm_source%22%3A%22tiktok%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMThkMjA2MjBkNTMxNWUtMGQ5ZDFjOTViY2I3NzMtMjYwMDE4NTEtMjA3MzYwMC0xOGQyMDYyMGQ1NDgyMSIsIiRpZGVudGl0eV9sb2dpbl9pZCI6IjEzMTYxMDEzIn0%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%24identity_login_id%22%2C%22value%22%3A%2213161013%22%7D%2C%22%24device_id%22%3A%2218d20620d5315e-0d9d1c95bcb773-26001851-2073600-18d20620d54821%22%7D; _abck=3F629ABEE5727D7B86F5C34C67249DF1~0~YAAQh3UyF5u35iaUAQAALZxiOg2QzlyK2p7LD2FsUlB5n9Tbu2eYa5uh38ihiaJssO0DYUZdTbYqbreVcE064f61S/aov9cSi+q+CyWTfq+5WqB8EJRQFXAi8QA8KgeS/Jeh7RhjKDt6ZveznKqy7b3hQoff+M7mmHUyrjbM7wNdMTb9nmNgfMkMT9b7B66hErMC52di5sjYuGnwe/08t3euSqNQkLbpVKDrfQnzZITfGo8J6TdKvUAVYDyyWFWLxWwPk7CXLB6/HZ0e835RmgVX4xKt62GML9iMNRSiJTGNq0Ne4rVe/wds/KPDJy87zU7J3u/vvuH4yKdS9S9ZXqH3L7X3ROH4Ob3BZGHC5L7NS9GW1cFnKScDdCEqRHf4JIyevPNLvKM5OF25NfD0hSpj2YG3dy95e7BCLdY9kv+OaD9x+4wS9SJWdSObQR9hGrov8n7L3PXA1ngyipJfSVV+5INHfGofyGr8/u5XidOt9LicoloSB0ZxmOZyt13cFMsEs1SqIHX+aHM+XpCFzM9FVpsH07AMD4fj1SpUugKlmqqcMiPuAx18kE628hqQAod+DFBtbvf85RrqGqoohQ9niGog/5ZhwYZHrmGiig7kdF9I2Qm+TKY3hDKx5+p+4ucDPxuaYoyXMdPGRQ==~-1~-1~-1; bm_mi=344E87838154C70060A7D493D91B71A1~YAAQh3UyF6y35iaUAQAA5qBiOhqIrIuRtjwkMiu7INLAObFenHHXUB2Pb/hTDh3uMR1/cNytEkY79mMXrebg/98Rbq4u9Si90EKtBqJzvVF34Ml5fm68AqH2I3dBHxAzIOYZ6jXuGpMMxrLR2vIXgypNBywaP2PRQG67bqlUehfpf1/KefRwEMpNmH8TnVm6vc4v/NiTyrXgOw4sLc/nk2daKvTctgDIkg1ST+kJZzPej18WlxCw7Z6Su1CAnZBXJ1e1KdhvYH9bibmlXdCjpYiDvTRo6Ef3XOakZe8BAPtfcrjFgPr8v08xgnkED6VL~1; ak_bmsc=5E34FCE7FCDEC6CC72A1A3B3150D9309~000000000000000000000000000000~YAAQh3UyF8635iaUAQAAbahiOhpNEe8oU0joY6ccviMgBLTrOLTQawmZiOvy1ri1GM3HhMMBcBGdlWF5yTmU4HYQS1wHdz3QYEhFqNOF77OifN36yN9vjSPoH/EFTr0qD2/JN2DqMjCgAbi2ncuyOIoa7fscn5ccPEyWWesDkJDNGWMFMW6qc0EMkq6p7CynQmuHkEeK7SE+imNrzgLubRBjIxRs+l8FHYb0qYvott2XNgPlRBW8FO9wbHFwsbsJCUJUy8GfMcsx2NweppRiw2nzQUWBgSh59ka+oM9lMRocCqR9gp6Uae/ZHCfW3+Jvva07I+9IsKAZPlttpHIdHOXsrc/pY/B+hU6BJatvWCoaVF1PrNSRqXh6azxHkpKaP8S57oKadt/VdlkKjQ2sX3ohnmVH/Ct4KquzaqnbZqJDf4xnk4pqVLBzZ5ue9Y3KrfqaQITrgn4iZXgrwXcBqtP5r98t5K/gKcuSRIlaoLbQ; _gcl_au=1.1.699694746.1736146317; _ym_isad=2; bm_sz=B319A4690F4F522B1DAAD616CC9C08EF~YAAQX3UyFzgroyaUAQAA7BBoOhrYS2JFwIQW7/UboS6XzoElwhjIKBCV693/8OAYoX+0UUTPv3RGeBZT+5ocR2bJxIbI6lsrjgO95Co5bpF/JxmwxOGM4sqF97SLIPkptzbtVbQpTHt6TITNzz20eN27h5t8f9AzZPoMoNzJg2N8iVuOJDj0r/C8JR2dUogfXZ77dN32vguTKw/dvgKkw7vGJeePBq8OZ3LZikAPgHHAm22wrf+QTm4YO4YKMpNkV5VrZmawm2T71fekk3UingXBrE7lkRMl+xQMG4g61PE4uIQkyW5qUYQkyu8vr5lfvTZLXXjJbE4pxzKPjrkndYlO40UP+5n6s42q06Y2bzCOvpuGvt9asEMLLgYW6Oetso+b3IkH8opnK5qE5C+pOgodY1ScVwTKuMTo~3228473~3360309; _ga_SPS4ND2MGC=GS1.1.1736146317.29.1.1736146673.39.0.0; bm_sv=ED988A2882A14B3394DA23C2E026A7F7~YAAQnTLdFy3WHgCUAQAACnFoOhpYPm6LNh8Aaj2C3GahPEhZEmln87C/fYFq/qpGLweAAXrJMQCIRhTJsHJDLwK+pW7AtrjJG9lQYF59GSJFfMM8Ht5I2vOw0Bi+CI2UIxoXnjO8YkVNecMIkpvChzXfh4hUBG8/3ktBF3A9uHN7mIEWUlCNK063fownS7+PLcUrS/xU/fQLjH9Mxy4E5kqXOsHweAD1p8Uf7XiK9BzrNkLpPbM1PMvddzo8x/aJ~1",
            "Referer": "https://www.bybit.com/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": "{\"product_area\":[0],\"page\":1,\"limit\":10,\"product_type\":0,\"coin_name\":\"USD\",\"sort_apr\":0,\"show_available\":false}",
        "method": "POST"
    })
        .then((response: { json: () => any }) => response.json())
        .then((json: any) => json.result.coin_products.filter((i: { coin: number; }) => i.coin === 5 || i.coin === 16))
        .then((json: any) => json.map((i: { coin: number; apy: any; }) => {
            return {
                name: i.coin === 5 ? 'USDT' : 'USDC',
                APR: parseFloat(i.apy).toFixed(2)
            }
        }))
}

router.get('/', async (req, res, next) => {
    res.status(200).send({
        message: "Welcome to stable API! Use /okx or /bybit to get the data"
    })
})
router.get('/okx', asyncHandler(async (req, res) => {
    console.log(`Fetching OKX data...`)
    const cachedData = await cache.get('okx', async () => await data_OKX())
    res.status(200).send(cachedData)
}))

router.get('/bybit', asyncHandler(async (req, res) => {
    console.log(`Fetching Bybit data...`)
    const cachedData = await cache.get('bybit', async () => await data_Bybit())
    res.status(200).send(cachedData)
}))

export default router;