/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'
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
})
    .then(response => response.json())
    .then(json => json.results
        .filter((event: any) => !/nft|nfts/i.test(event.title))
        .map((event: any) => ({ id: event.id, tokenName: event.tokenName, tokenAmount: event.tokenAmount }))
        .filter((event: any) => event.id >= 86)
        .sort((a: any, b: any) => a.id - b.id)
    ).then((events) => {
        events.forEach(element => {
            console.log(`${element.id},${element.tokenName},${element.tokenAmount}`)
            
            
        })
    })