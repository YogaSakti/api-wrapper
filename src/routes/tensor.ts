/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch'
import { nftsFilter, nftList, nftsRequest } from '../utils/nfts.interface'

import CacheService from '../utils/cache.service'

// cache for 10 minutes
const ttl = 60 * 30
const cache = new CacheService(ttl) // Create a new cache service instance


const getListedTensor = async (slug: string, filters: nftsFilter): Promise<Array<nftList>> => {

    const defaultNftsFilter: nftsFilter = {
        sources: [
            'TENSORSWAP',
            'TCOMP',
            'HYPERSPACE',
            'MAGICEDEN_V2',
            'SOLANART',
        ],
        prices: null,
        rarities: null,
        traits: null,
        traitCount: null,
        nameFilter: null,
        ownerFilter: null,
    }

    const variables: nftsRequest = {
        slug: slug,
        sortBy: 'PriceAsc',
        limit: 10,
        filters: {
            ...defaultNftsFilter,
            ...filters
        },
    }

    return fetch('https://graphql.tensor.trade/graphql', {
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site'
        },
        body: JSON.stringify({
            query: `query ActiveListingsV2($slug: String!, $sortBy: ActiveListingsSortBy!, $filters: ActiveListingsFilters, $cursor: ActiveListingsCursorInputV2, $limit: Int) {
                activeListingsV2(
                    slug: $slug
                    sortBy: $sortBy
                    filters: $filters
                    cursor: $cursor
                    limit: $limit
                ) {
                    txs {
                        ...ReducedLinkedTx
                    }
                    page {
                        endCursor {
                            str
                        }
                        hasMore
                    }
                }
            }
            
            fragment ReducedLinkedTx on LinkedTransactionTV2 {
                tx {
                    ...ReducedParsedTx
                }
                mint {
                    ...ReducedMint
                }
            }
            
            fragment ReducedParsedTx on ParsedTransaction {
                txType
                grossAmount
                sellerId
            }
            
            fragment ReducedMint on TLinkedTxMintTV2 {
                owner
                name
                attributes
            }`,
            variables: variables
        }),
        method: 'POST'
    })
        .then((res) => res.json())
        .then((json) => {
            // console.log(json)

            return json.data.activeListingsV2.txs
        })
        .then((txs) => txs.map((nft: { mint: { owner: any; name: any; sellRoyaltyFeeBPS: any; attributes: any; }; tx: { txType: any; grossAmount: any; }; }) => ({
            owner: nft.mint.owner,
            name: nft.mint.name,
            attributes: nft.mint.attributes,
            txType: nft.tx.txType,
            listPrice: (nft.tx.grossAmount / 1000000000).toFixed(4)
        })))
        .catch((err) => err)
}

const getListed = async (slug: string, filters: nftsFilter): Promise<Array<nftList>> => {
    const key = `getListed-${slug}-${JSON.stringify(filters)}`
    const cachedData = await cache.get(key, async () => await getListedTensor(slug, filters))
    return cachedData
}

export default getListed