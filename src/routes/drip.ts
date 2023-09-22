/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express'
import fetch from 'cross-fetch'
import asyncHandler from 'express-async-handler'
import getListed from './tensor'
// import { nftsFilter } from './utils/nfts.interface';

const router = express.Router()

const convertKeysToLowercase = (obj: any) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (typeof value === 'object' && value !== null) {
            acc[key.toLowerCase().trim()] = convertKeysToLowercase(value)
        } else {
            acc[key.toLowerCase().trim()] = value
        }
        return acc
    }, {})
}

const updateFloor = async (slug: string, filter: any) => {
    const listedNft = await getListed(slug, filter)
    return parseFloat(listedNft[0]?.listPrice) || 0
}

const appendRarityToDuplicates = (formatedData: any[]): void => {
    const nameCounts: { [name: string]: number } = {}
    const seen: Set<string> = new Set()

    formatedData.forEach((item: any) => {
        // Clean the name
        item.name = item.name.trim().replace(/[\\"]/g, '').replace(/’/g, '\'')

        // Count occurrences
        nameCounts[item.name] = (nameCounts[item.name] || 0) + 1
    })

    formatedData.forEach((item: any) => {
        if (nameCounts[item.name] > 1 && !seen.has(item.name)) {
            item.name = `${item.name} (${item.rarity.charAt(0)})`
            seen.add(item.name)
        }
    })
}

// Home page route.
router.get('/', function (req, res) {
    const endpoints = [
        'channels',
        'allNFTs',
        'one',
        'two',
        'degen',
        'daa',
        'vault',
        'floor',
        'bork',
        'tiiinydenise',
        'bangerz',
        'betdex',
        'maquin',
        'geneftee',
        'andrewmason',
        '0xgrime',
        '0xstoek',
        'pog',
        'portals',
        'nofacenocase',
        'findingsathosi',
        'madhouse',
        'designz',
        'silicons',
        'ottr',
        'awag',
        'radiant',
        'bad',
        'enigma',
        'nation',
        'cactus'
    ].map(endpoint => `<a href="/api/v1/drip/${endpoint}">${endpoint}</a>`).join('<br/>')

    res.status(200).send(`
        <div>
            <h1>Status: ok</h1>
            <div>Endpoints:</div>
            <div>${endpoints}</div>
        </div>
    `)
})

router.get('/channels', asyncHandler(async (req, res, next) => {
    const filters = ((req.query.filters as string) || '').split(';').map(f => f.toLowerCase()) // retrieve filters from query params

    let nftChannels = await fetch('https://nox.solanaspaces.com/drip/channels', { headers: { accept: 'application/json', Referer: 'https://drip.haus/', }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results.map(convertKeysToLowercase))

    nftChannels = nftChannels.filter(({ slug }) => slug.toLowerCase() !== 'showcase')

    nftChannels.unshift({ name: 'Showcase S2', slug: 'Seasons 2' })
    nftChannels.unshift({ name: 'Showcase S1', slug: 'Seasons 1' })

    let categories = nftChannels.map(({ name, slug }) => {
        //change slug from 'bork' to 'Bork'
        const slugNew = slug.charAt(0).toUpperCase() + slug.slice(1)
        return { name, slug: slugNew }
    })

    // default filters
    categories = categories.filter(({ slug }) => slug !== 'Soljakey' && slug !== 'Stepn' && slug !== 'Jakey')

    // categories slug is not contain filters array value
    categories = categories.filter(({ slug }) => !filters.includes(slug.toLowerCase()))

    res.status(200).json(categories)
}))

router.get('/allNFTs', asyncHandler(async (req, res, next) => {
    let nftChannels = await fetch('https://nox.solanaspaces.com/drip/channels', { headers: { accept: 'application/json', Referer: 'https://drip.haus/', }, method: 'GET' })
        .then(res => res.json()).then(({ results }) => results.map(convertKeysToLowercase))

    // remove Soljakey and Stepn and Jakey from channels
    nftChannels = nftChannels.filter(({ slug }) => slug.toLowerCase() !== 'soljakey' && slug.toLowerCase() !== 'stepn')

    // fetch all nfts by slug
    const nftsFetch = await Promise.all(nftChannels.map(({ slug }) => fetch(`https://nox.solanaspaces.com/drip/v2/channels/${slug}?limit=1000`, { headers: { Referer: 'https://drip.haus/' } }).then(res => res.json()).then(({ results }) => results.map(convertKeysToLowercase))))

    // combine all nfts into one array
    const nfts = nftsFetch.reduce((acc, val) => acc.concat(val), [])

    // split name inside object in nfts if contain '#' and use the first part only
    nfts.forEach((nft: any) => {
        if (nft.name.includes('#')) nft.name = nft.name.split('#')[0].trim()
    })
    
    res.status(200).json(nfts)
}))

router.get('/one', asyncHandler(async (req, res, next) => {
    try {
        let formatedData = []

        const [season1] = await Promise.all([
            fetch('https://drip-value.herokuapp.com/all?channel=s1').then(response => response.json()).then(({ data }) => data)
        ])

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

        // push to formatedData if name is in seasonOneWL
        season1.forEach((nft: any) => {
            if (seasonOneWL.includes(nft.name)) {
                formatedData.push({
                    name: nft.name,
                })
            }
        })


        formatedData.forEach((item: any) => {
            const nft = season1.find((nft: any) => nft.name.includes(item.name))
            item.name = item.name.trim().replace(/\\/g, '').replace(/"/g, '')
            item.rarity = nft?.rarity || ''
            item.listed = nft?.count || 0

            const floor = parseFloat(nft?.price || 0).toFixed(4)
            item.floor = floor
            // item.floor = floor > 0.0105 ? floor.toFixed(4) : '0.0105';
        })

        // sort by lowest floor
        formatedData = formatedData.sort((a: any, b: any) => parseFloat(a.floor) - parseFloat(b.floor))

        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }
}))

//@ts-ignore
const specialDrop = async () => {
    const formatedData = []

    const manualData = [
        'Faceless (l)',
        'Faceless (r)',
        'Faceless (c)',
        'The Dashers (l)',
        'The Dashers (r)',
        'The Dashers (c)',
        'Binary Force (l)',
        'Binary Force (r)',
        'Binary Force (c)',
        'Moonshiners (l)',
        'Moonshiners (r)',
        'Moonshiners (c)',
    ]

    manualData.forEach((name: string) => formatedData.push({
        name,
        rarity: name.includes('(l)') ? 'Legendary' : name.includes('(r)') ? 'Rare' : 'Common',
        listed: 0,
        floor: 0
    }))

    for (let i = 0; i < formatedData.length; i++) {
        const item = formatedData[i]
        const rarity = item.rarity
        const name = item.name.split(' (')[0]
        let slug = ''
        if (name.includes('Faceless')) slug = '64d4ab62-64f7-4963-b95a-114d2a574979'
        if (name.includes('The Dashers')) slug = '05c52d84-2e49-4ed9-a473-b43cab41e129'
        if (name.includes('MOOAR Cat')) slug = '40d3fc20-f3f7-47a3-b8b0-18a90b6719d6'
        if (name.includes('Binary Force')) slug = '01142ee4-bb23-4d66-9806-f10672a1fbfe'
        if (name.includes('Moonshiners')) slug = '207ac744-558a-4811-9206-ac321e995adf'

        if (!slug) {
            item.floor = 0
            item.rarity = rarity.toLowerCase()
            continue
        }

        const listedNft = await getListed(slug, { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] })
        item.floor = parseFloat(listedNft[0]?.listPrice) || 0
        item.rarity = rarity.toLowerCase()

    }

    return formatedData
}

router.get('/two', asyncHandler(async (req, res, next) => {
    try {
        let formatedData = []

        const [nftList, season2] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/showcase?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(res => res.json()).then(({ results }) => results.filter(({ attributes }) => attributes.Season == '2').map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=s2').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = season2.find((nft: any) => nft.name === name)
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = '40d3fc20-f3f7-47a3-b8b0-18a90b6719d6'
                if (!tensorSlug) return
                const listedNft = await getListed(tensorSlug, { nameFilter: name })
                floor = parseFloat(listedNft[0]?.listPrice) || 0
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        // exclude name include Faceless & Compass Rose & The Dashers 
        formatedData = formatedData.filter((item: any) => !item.name.includes('Faceless') && !item.name.includes('Compass Rose') && !item.name.includes('The Dashers') && !item.name.includes('Binary Force') && !item.name.includes('Moonshiners'))

        const special = await specialDrop()

        formatedData = [...special, ...formatedData]

        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }

}))

router.get('/degen', asyncHandler(async (req, res, next) => {
    try {

        const formatedData = []
        const [nftList, degenpoet] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/degenpoet?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=dp').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            console.log(`name: ${name} rarity: ${rarity}`)


            const nft = degenpoet.find((nft: any) => nft.name === name)
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = 'e83d8eba-269e-4af8-889b-e26d4287fd52'
                if (!tensorSlug) return
                const listedNft = await getListed(tensorSlug, { nameFilter: name })
                floor = parseFloat(listedNft[0].listPrice) || 0
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }
}))

router.get('/daa', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, daa] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/daa?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=daa').then(response => response.json()).then(({ data }) => data)
        ])



        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = daa.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor || floor == 0) {
                const tensorSlug = 'bbec8d70-1abd-479d-9478-2b17ade33996'
                if (!tensorSlug) return
                // @ts-ignore
                const filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }
                floor = await updateFloor(tensorSlug, filter)
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }
}))

router.get('/vault', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, vault] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/vaultmusic?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=vault').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = vault.find((nft: any) => nft.name === name)
            let floor = nft?.price
            if (!floor || name.includes('LIVE')) {
                const tensorSlug = 'de8231fa-1d86-4d7b-9660-480e3311bee9'
                if (!tensorSlug) return
                // const listedNft = await getListed(tensorSlug, { nameFilter: name });
                // floor = parseFloat(listedNft[0].listPrice) || 0
                const filter = { nameFilter: name, traits: [{ 'traitType': 'rarity', 'values': [rarity] }] }

                floor = await updateFloor(tensorSlug, filter)
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name

        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }
}))

router.get('/floor', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, floorDrip] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/floor?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=floor').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = floorDrip.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = '6949da77-2c23-459c-b24c-d841d7ea0e0a'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }



            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }


        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name

        res.status(200).send(formatedData)
    } catch (error) {
        console.log(error)

        res.status(500).send(error)
    }
}))

router.get('/bork', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, bork] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/bork?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=bork').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity }, count } = nftList[i]
            const nft = bork.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = 'a22ba196-e970-4778-aaca-badd0a8fd0f1'
                if (!tensorSlug) return
                let filter = { nameFilter: name }
                if (!name.includes('Rare') || !name.includes('Legendary')) {
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    if (count == 5) {
                        // @ts-ignore
                        filter = { nameFilter: name, traits: [{ 'traitType': 'Misprint', 'values': 'True' }] }
                    }
                }

                floor = await updateFloor(tensorSlug, filter)
            }



            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        // custom rarity in name
        formatedData.forEach((item: any) => {
            if (!item.name.includes('Rare') && !item.name.includes('Legendary')) item.name = `${item.name} (${item.rarity.charAt(0)})`
        })

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }
}))
// trying new way to get floor and implement caching 
router.get('/tiiinydenise', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, tiiiny] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/tiiinydenise?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=tiiinydenise').then(response => response.json()).then(({ data }) => data)
        ])

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = tiiiny.find((nft: any) => nft.name === name)
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = '6e0b7232-7f50-4752-834e-62a4c2e14540'
                if (!tensorSlug) return
                const listedNft = await getListed(tensorSlug, { nameFilter: name })
                floor = parseFloat(listedNft[0].listPrice) || 0
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }
}))

router.get('/bangerz', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []
        const [nftList, bangerz] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/bangerz?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=bangerz').then(response => response.json()).then(({ data }) => data)
        ])

        const indexNewSlug = nftList.findIndex((nft: any) => nft.name === 'WAGMI SHOT')

        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // new slug is if index is smaller or equal to index of new slug
            const newSlug = nftList.slice(0, indexNewSlug + 1).map((nft: any) => nft.name)

            const nft = bangerz.find((nft: any) => nft.name === name)
            let floor = nft?.price
            if (!floor) {
                let tensorSlug = '4c92b023-73ae-420f-bea6-d7b9dffe6bd3'
                if (newSlug.includes(name)) tensorSlug = '7be28d58-9fc9-438f-b5f0-6c0b3a9c6d60'
                if (!tensorSlug) return
                const listedNft = await getListed(tensorSlug, { nameFilter: name })

                floor = parseFloat(listedNft[0]?.listPrice) || 0
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor
            })
        }

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }
}))

router.get('/betdex', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, betdex] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/betdex?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=betdex').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = betdex.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = '1d5fb1ab-b9af-447f-978f-2ab8e261efb2'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }


                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/maquin', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, betdex] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/maquin?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=maquin').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = betdex.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = 'fbe5dc57-bd13-4a0d-9777-d5a361a98ef1'
                if (tensorSlug) {
                    const listedNft = await getListed(tensorSlug, { nameFilter: name })
                    floor = parseFloat(listedNft[0].listPrice) || 0
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/geneftee', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, betdex] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/geneftee?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=geneftee').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = betdex.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = 'd27a9a43-dac2-4377-8a7c-9746259acc84'
                let filter = { nameFilter: name }
                // @ts-ignore
                filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                floor = await updateFloor(tensorSlug, filter)
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/andrewmason', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, andrew] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/andrewmason?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=andrewmason').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = andrew.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = null // nft?.price;
            if (!floor) {
                const tensorSlug = 'bf654cd0-0d4c-4e87-a26f-f9228db45232'
                let filter = { nameFilter: name }
                // if (name.includes('Pierspective')) {
                // @ts-ignore
                filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }
                // }

                floor = await updateFloor(tensorSlug, filter)
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/0xgrime', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, xgrime] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/0xgrime?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=xgrime').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = xgrime.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = null // nft?.price;
            if (!floor) {
                const tensorSlug = '3f52ef5a-929d-4977-8742-c7ed701814e3'
                if (tensorSlug) {
                    const listedNft = await getListed(tensorSlug, { nameFilter: name })
                    floor = parseFloat(listedNft[0].listPrice) || 0
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/0xstoek', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, xStoek] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/0xStoek?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=xStoek').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = xStoek.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '2e5d7df4-fcd9-435e-b795-884409ca787e'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/pog', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, pog] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/pog?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=pog').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = pog.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = nft?.price
            if (!floor) {
                const tensorSlug = '953574ea-f764-4356-bcb3-c95c3afd10d5'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/portals', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, portals] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/portals?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=portals').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = portals.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '3169c34c-eb74-4e69-ad90-2bed56e46c66'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/nofacenocase', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList, nofacenocase] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/nofacenocase?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase)),
            fetch('https://drip-value.herokuapp.com/all?channel=nofacenocase').then(response => response.json()).then(({ data }) => data)
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase())
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'e078dbdf-7c28-4982-b4ad-a7556d031ac2'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase() || nft?.rarity,
                listed: nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/findingsathosi', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/fs?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity, variation } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '602e1be7-16f7-4894-981a-8c65414707a3'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }, { 'traitType': 'Variation', 'values': [variation] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: variation, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // custom rarity in name
        formatedData.forEach((item: any) => {
            item.name = item.name.trim().replace(/[\\"]/g, '').replace(/’/g, '\'')
            item.name = `${item.name} ${item.listed} (${item.rarity.charAt(0)})`
        })


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/madhouse', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/madhouse?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '9c70fb5d-7d18-47ca-9c16-bf8dfb0cd884'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/designz', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/designz?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'acef96f4-17ff-4ec0-a2fc-261b2a0b989b'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/silicons', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/silicons?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'e5866d80-0b4b-4d9b-8436-f9397e505cc5'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/ottr', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/ottr?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '80ca0e18-4269-43e5-a87f-e81d0c81889a'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/awag', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/awag?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '18cb29df-1976-4c75-adb6-5982aa5f0a70'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }

                if (floor === 0) {
                    const filter = { nameFilter: name }
                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/radiant', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/radiant?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'e3d26e24-6ebd-4cf3-8b32-d2a1627975ec'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }

                if (floor === 0) {
                    const filter = { nameFilter: name }
                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/bad', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/bad?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity, variation } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                let tensorSlug = '664e08cd-2b9d-4343-a4dd-ae3b5920e217'
                if (!name.includes('Trading')) tensorSlug = '1dd6df8d-f3f9-46d1-91c1-2b69d6d7b659'

                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }, { 'traitType': 'Variation', 'values': [variation] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: variation, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/enigma', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/enigma?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '78e62be0-7625-4e9e-9e57-e8cafed7331a'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }

                if (floor === 0) {
                    const filter = { nameFilter: name }
                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, '').replace(/;/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/nation', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/dropnation?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]

            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'a12fcd5d-2067-4e10-8ca2-e7ab4b342e32'
                if (tensorSlug) {
                    let filter = { nameFilter: name }
                    // @ts-ignore
                    filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }

                    floor = await updateFloor(tensorSlug, filter)
                }

                if (floor === 0) {
                    const filter = { nameFilter: name }
                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, '').replace(/;/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/cactus', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/kevthecactus?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]
            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = '077397a6-cd06-4b9c-821b-97dc9128a588'
                if (tensorSlug) {
                    let filter = { nameFilter: name }

                    // if has rarity
                    if (rarity) {
                        // @ts-ignore
                        filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }
                    }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, '').replace(/;/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

router.get('/vfxfreek', asyncHandler(async (req, res, next) => {
    try {
        const formatedData = []

        const [nftList] = await Promise.all([
            fetch('https://nox.solanaspaces.com/drip/v2/channels/vfxfreek?limit=100', { headers: { Referer: 'https://drip.haus/' } }).then(response => response.json()).then(({ results }) => results.map(convertKeysToLowercase))
        ])


        for (let i = 0; i < nftList.length; i++) {
            const { name, attributes: { rarity } } = nftList[i]
            // const nft = nofacenocase.find((nft: any) => nft.name === name && nft.rarity?.toLowerCase() === rarity?.toLowerCase());
            let floor = null //nft?.price;
            if (!floor) {
                const tensorSlug = 'de5c4653-3314-4db1-8929-c9c34df35b26'
                if (tensorSlug) {
                    let filter = { nameFilter: name }

                    // if has rarity
                    if (rarity) {
                        // @ts-ignore
                        filter = { nameFilter: name, traits: [{ 'traitType': 'Rarity', 'values': [rarity] }] }
                    }

                    floor = await updateFloor(tensorSlug, filter)
                }
            }

            formatedData.push({
                name: name.trim().replace(/\\/g, '').replace(/"/g, '').replace(/;/g, ''),
                rarity: rarity?.toLowerCase(), // || nft?.rarity,
                listed: 0, //nft?.count || 0,
                floor: floor || 0
            })

        }

        // this is for custom rarity in name
        await appendRarityToDuplicates(formatedData)
        // end of custom rarity in name


        res.status(200).send(formatedData)
    } catch (error) {
        res.status(500).send(error)
    }

}))

export default router

