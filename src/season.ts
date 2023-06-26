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

router.get("/channels", asyncHandler(async (req, res, next) => {
    let  nftChannels = await fetch("https://nox.solanaspaces.com/drip/channels", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
    .then(res => res.json()).then(({ results }) => results);

    nftChannels = nftChannels.filter(({ slug }) => slug !== 'showcase');

    nftChannels.unshift({ name: 'Showcase S2', slug: 'Seasons 2' })
    nftChannels.unshift({ name: 'Showcase S1', slug: 'Seasons 1' })
    

    const categories = nftChannels.map(({ name, slug }) => {
        //change slug from 'bork' to 'Bork'
        const slugNew = slug.charAt(0).toUpperCase() + slug.slice(1);

        return { name, slug: slugNew }
    })

    res.status(200).json(categories);
}));

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

    nfts.collectibles = nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => !nft.collection.name.includes('Compass Rose'))

    let formatedData = {
        seasonOne: nfts.collectibles.filter((nft: { collection: { name: string; }; }) => nft.collection.name === 'DRiP').length,
        seasonTwo: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('#2')).length,
        degen: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Degen')).length,
        daa: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('DAA')).length,
        vault: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Vault')).length,
        faceless: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Faceless')).length,
        floor: nfts.collectibles.filter((nft: { collection: { name: string | string[]; }; }) => nft.collection.name?.includes('Floor')).length,
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

    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/showcase?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results.filter(({ attributes }) => attributes.Season == "1").map(({ name }) => name));

    nftList.map((name: string) => {
        if (seasonOneWL.includes(name)) formatedData.push({ name })
    })

    let daa = await fetch("https://drip-value.herokuapp.com/season1_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = daa.find((nft: any) => nft.name === item.name)?.rarity || '';
        item.listed = daa.find((nft: any) => nft.name === item.name)?.count || 0;
        item.floor = daa.find((nft: any) => nft.name === item.name)?.price || 0;
    })

    formatedData.forEach((item: any) => item.name = item.name.trim().replace(/\\/g, '').replace(/"/g, ''))

    res.status(200).send(formatedData);
}));

router.get("/two", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/showcase?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results.filter(({ attributes }) => attributes.Season == "2").map(({ name }) => name));

    nftList.map((name: string) => formatedData.push({ name }))

    let daa = await fetch("https://drip-value.herokuapp.com/season2_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    // exclude name include Faceless && Compass Rose 
    formatedData = formatedData.filter((item: any) => !item.name.includes('Faceless') && !item.name.includes('Compass Rose'))

    // add Faceless Common, Rare, Legendary
    formatedData.unshift({ name: 'Compass Rose' })
    formatedData.unshift({ name: 'Faceless (l)' })
    formatedData.unshift({ name: 'Faceless (r)' })
    formatedData.unshift({ name: 'Faceless (c)' })

    formatedData.forEach((item: any) => {
        item.rarity = daa.find((nft: any) => nft.name === item.name)?.rarity || "";
        item.listed = daa.find((nft: any) => nft.name === item.name)?.count || 0;
        item.floor = daa.find((nft: any) => nft.name === item.name)?.price || 0;
    })

    formatedData.forEach((item: any) => item.name = item.name.trim().replace(/\\/g, '').replace(/"/g, ''))
    formatedData.forEach((item: any) => {
        if (item.name == 'Faceless (l)') item.rarity = 'legendary'
        if (item.name == 'Faceless (r)') item.rarity = 'rare'
        if (item.name == 'Faceless (c)') item.rarity = 'common'
    })

    res.status(200).send(formatedData);
}));

router.get("/degen", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/degenpoet?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
    .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: "N/A",
        listed: "N/A",
        floor: "N/A"
    }))

    let daa = await fetch("https://drip-value.herokuapp.com/degen_poet_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = daa.find((nft: any) => nft.name === item.name)?.rarity || '';
        item.listed = daa.find((nft: any) => nft.name === item.name)?.count || 0;
        item.floor = daa.find((nft: any) => nft.name === item.name)?.price || 0;
    })

    res.status(200).send(formatedData);
}));

router.get("/daa", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/daa?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: "N/A",
        listed: "N/A",
        floor: "N/A"
    }))

    let daa = await fetch("https://drip-value.herokuapp.com/daa_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = daa.find((nft: any) => nft.name === item.name)?.rarity || nftList.find((nft: any) => nft.name === item.name)?.attributes?.Rarity.toLowerCase() || '';
        item.listed = daa.find((nft: any) => nft.name === item.name)?.count || 0;
        item.floor = daa.find((nft: any) => nft.name === item.name)?.price || 0;
    })

    formatedData.forEach((item: any) => item.name = item.name.trim().replace(/\\/g, '').replace(/"/g, '').replace(/’/g, '\''))

    res.status(200).send(formatedData);
}));

router.get("/vault", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/vaultmusic?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name, attributes: { rarity } }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: rarity,
        listed: "N/A",
        floor: "N/A"
    }))

    let daa = await fetch("https://drip-value.herokuapp.com/vault_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = item.rarity ? item.rarity : daa.find((nft: any) => nft.name === item.name)?.rarity || '';
        item.listed = daa.find((nft: any) => nft.name === item.name)?.count || 0;
        item.floor = daa.find((nft: any) => nft.name === item.name)?.price || 0;
    })

    res.status(200).send(formatedData);
}));

router.get("/floor", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/floor?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name, attributes: { Rarity } }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: Rarity,
        listed: "N/A",
        floor: "N/A"
    }))

    let floor = await fetch("https://drip-value.herokuapp.com/floor_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = item.rarity ? item.rarity.toLowerCase() : floor.find((nft: any) => nft.name === item.name)?.rarity.toLowerCase() || '';
        item.listed = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.count || 0;
        item.floor = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.price || 0;
    })

    // add rarity on nft name in formatedData
    formatedData.forEach((item: any) => {
        // add rarity in name from item.rarity add first char from rarity
        if (item.name.includes('SEC')) item.name = `${item.name} (${item.rarity.charAt(0)})`
    })

    res.status(200).send(formatedData);
}));

router.get("/bork", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/bork?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name, attributes: { Rarity } }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: Rarity,
        listed: "N/A",
        floor: "N/A"
    }))

    let floor = await fetch("https://drip-value.herokuapp.com/bork_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = item.rarity ? item.rarity.toLowerCase() : floor.find((nft: any) => nft.name === item.name)?.rarity.toLowerCase() || '';
        item.listed = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.count || 0;
        item.floor = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.price || 0;
    })

    // add rarity on nft name in formatedData

    res.status(200).send(formatedData);
}));

router.get("/tiiinydenise", asyncHandler(async (req, res, next) => {
    let formatedData = []
    const nftList = await fetch("https://nox.solanaspaces.com/drip/v2/channels/tiiinydenise?limit=100", { headers: { accept: "application/json", Referer: "https://drip.haus/", }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results);

    nftList.map(({ name, attributes: { Rarity } }) => formatedData.push({
        name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
        rarity: Rarity,
        listed: "N/A",
        floor: "N/A"
    }))

    let floor = await fetch("https://drip-value.herokuapp.com/tiiinydenise_all", { headers: { accept: "application/json" }, method: "GET" })
        .then(res => res.json()).then(res => res.data)

    formatedData.forEach((item: any) => {
        item.rarity = item.rarity ? item.rarity.toLowerCase() : floor.find((nft: any) => nft.name === item.name)?.rarity.toLowerCase() || '';
        item.listed = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.count || 0;
        item.floor = floor.find((nft: any) => nft.name === item.name && nft.rarity == item.rarity)?.price || 0;
    })

    // add rarity on nft name in formatedData

    res.status(200).send(formatedData);
}));


export default router;