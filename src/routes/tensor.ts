/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'cross-fetch';
import { nftsFilter, nftList, nftsRequest } from '../utils/nfts.interface';
import CacheService from '../utils/cache.service';

// cache for 30 minutes
const ttl = 60 * 30;
const cache = new CacheService(ttl); // Create a new cache service instance

/**
 * Query Tensor GraphQL for listings
 */
const getListedTensor = async (slug: string, filters: nftsFilter): Promise<Array<nftList>> => {
  const defaultNftsFilter: nftsFilter = {
    sources: ['TENSORSWAP', 'TCOMP', 'HYPERSPACE', 'MAGICEDEN_V2', 'SOLANART'],
    prices: null,
    rarities: null,
    traits: null,
    traitCount: null,
    nameFilter: null,
    ownerFilter: null,
  };

  const variables: nftsRequest = {
    slug,
    sortBy: 'PriceAsc',
    limit: 10,
    filters: {
      ...defaultNftsFilter,
      ...filters,
    },
  };

  try {
    const response = await fetch('https://graphql.tensor.trade/graphql', {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
      body: JSON.stringify({
        query: `
          query ActiveListingsV2(
            $slug: String!,
            $sortBy: ActiveListingsSortBy!,
            $filters: ActiveListingsFilters,
            $cursor: ActiveListingsCursorInputV2,
            $limit: Int
          ) {
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
        variables,
      }),
      method: 'POST',
    });

    const json = await response.json();
    // If the shape isn't what we expect, you may want to throw or return an empty array
    if (!json?.data?.activeListingsV2?.txs) {
      throw new Error('Unexpected response structure from Tensor API.');
    }

    // Now map the data to your desired shape
    const txs = json.data.activeListingsV2.txs;
    return txs.map((nft: any) => ({
      owner: nft.mint.owner,
      name: nft.mint.name,
      attributes: nft.mint.attributes,
      txType: nft.tx.txType,
      listPrice: (nft.tx.grossAmount / 1_000_000_000).toFixed(4),
    }));
  } catch (err) {
    console.error('Error fetching from Tensor:', err);
    // Return an empty array (or rethrow the error) based on your preference
    return [];
  }
};

/**
 * Cached wrapper around getListedTensor
 */
const getListed = async (slug: string, filters: nftsFilter): Promise<Array<nftList>> => {
  const key = `getListed-${slug}-${JSON.stringify(filters)}`;
  return cache.get(key, async () => {
    return getListedTensor(slug, filters);
  });
};

export default getListed;
