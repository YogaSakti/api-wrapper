import express from 'express';
import fetch from 'cross-fetch';
import asyncHandler from 'express-async-handler'

const router = express.Router();

// Home page route.
router.get("/", function (req, res) {
    res.status(200).send({ 
        status: 'ok',
        endpoints: [
            'one',
            'two',
            'owned/:address'
        ]
     });
});

router.get("/owned/:address", asyncHandler(async (req, res, next) => {
    const address = req.params.address
    let nfts = await fetch('https://api.phantom.app/collectibles/v1', {
        headers: {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,id;q=0.8,id-ID;q=0.7',
            'content-type': 'application/json',
            'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'none'
        },
        'referrerPolicy': 'strict-origin-when-cross-origin',
        body: JSON.stringify({
            addresses: [
                {
                    chainId: 'solana:101',
                    address
                }
            ]
        }),
        method: 'POST'
    }).then((res) => res.json())

    nfts = nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => !nft.collection.name.includes('Compass Rose'))
    // nfts = nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => !nft.collection.name.includes('Compass'))
    // nfts = nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => !nft.collection.name.includes('Rose'))

    let formatedData = {
        seasonOne: nfts.collectibles.filter((nft: { collection: { name: string; }; }) => nft.collection.name === 'DRiP').length,
        seasonTwo: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('#2')).length,
        degen: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Degen')).length,
        daa: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('DAA')).length,
        vault: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Vault')).length,
        faceless: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Faceless')).length,
        names: nfts.collectibles.map((nft: { name: string; attributes: any[]; }) => {
            if (nft.name.includes('Faceless')) {
                const rarity = nft.attributes.find((x: { trait_type: string; }) => x.trait_type === 'Rarity')?.value || ''
                nft.name = nft.name.replace('Faceless', `Faceless ${rarity}`).split(' #')[0]
            }

            return nft.name
        })
    }

    res.status(200).send(formatedData);
}));

const seasonOneWL = [
    'TELEPORT2',
    'Ascension of Toonies',
    'iSolmetric',
    'Non-fungible Portrait',
    'The Nova',
    'The Solana Sorcerer',
    'The Nova - Special Edition',
    'The Tarsier Viking',
    'O',
    'Corrupted Mask',
    'Chimera'
]

router.get("/one", asyncHandler(async (req, res, next) => {
    const one = await fetch("https://drip-value.herokuapp.com/season1_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = one.data;
    if (seasonOneWL.length >= 1) data = data.filter((item: { name: string; }) => seasonOneWL.includes(item.name));

    data.sort((a: any, b: any) => (a.drop < b.drop) ? 1 : -1)

    let formatedData = []

    data.forEach((item: any) => {
        formatedData.push({
            name: item.name,
            rarity: item.rarity,
            listed: item.count,
            floor: item.price
        })
    })

    res.status(200).send(formatedData);
}));


const seasonTwoWL = []

router.get("/two", asyncHandler(async (req, res, next) => {
    const two = await fetch("https://drip-value.herokuapp.com/season2_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = two.data;
    if (seasonTwoWL.length >= 1) data = data.filter((item: { name: string; }) => seasonTwoWL.includes(item.name));

    data.sort((a: any, b: any) => (a.drop < b.drop) ? 1 : -1)

    let formatedData = []

    data.forEach((item: any) => {
        formatedData.push({
            name: item.name.trim().replace(/\\/g, '').replace(/"/g, ''),
            rarity: item.rarity,
            listed: item.count,
            floor: item.price
        })
    })

    res.status(200).send(formatedData);
}));


router.get("/degen", asyncHandler(async (req, res, next) => {
    const degen = await fetch("https://drip-value.herokuapp.com/degen_poet_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = degen.data;

    data.sort((a: any, b: any) => (a.drop < b.drop) ? 1 : -1)

    let formatedData = []

    data.forEach((item: any) => {
        formatedData.push({
            name: item.name.trim().replace(/\\/g, '').replace(/"/g, ''),
            rarity: item.rarity,
            listed: item.count,
            floor: item.price
        })
    })

    res.status(200).send(formatedData);
}));

router.get("/daa", asyncHandler(async (req, res, next) => {
    const daa = await fetch("https://drip-value.herokuapp.com/daa_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = daa.data;

    data.sort((a: any, b: any) => (a.drop < b.drop) ? 1 : -1)

    let formatedData = []

    data.forEach((item: any) => {
        formatedData.push({
            name: item.name.trim().replace(/\\/g, '').replace(/"/g, ''),
            rarity: item.rarity,
            listed: item.count,
            floor: item.price
        })
    })

    res.status(200).send(formatedData);
}));

router.get("/vault", asyncHandler(async (req, res, next) => {
    const vault = await fetch("https://drip-value.herokuapp.com/vault_all", {
        headers: {
            "accept": "application/json"
        },
        method: "GET"
    }).then(res => res.json());

    let data = vault.data;

    data.sort((a: any, b: any) => (a.drop < b.drop) ? 1 : -1)

    let formatedData = []

    data.forEach((item: any) => {
        formatedData.push({
            name: item.name.trim().replace(/\\/g, '').replace(/"/g, ''),
            rarity: item.rarity,
            listed: item.count,
            floor: item.price
        })
    })

    res.status(200).send(formatedData);
}));


export default router;