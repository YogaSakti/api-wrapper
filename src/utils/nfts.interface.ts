/* eslint-disable @typescript-eslint/no-explicit-any */
export interface nftList {
    owner: string;
    name: string;
    attributes: string;
    txType: string;
    listPrice: any;
}

export interface nftsFilter {
    sources?: string[];
    prices?: {
        min: string | null;
        max: string;
    };
    rarities?: {
        min: number | null;
        max: number;
        system: string;
    };
    traits?: object[] | null;
    traitCount?: {
        min: number | null;
        max: number;
    };
    nameFilter?: string;
    ownerFilter?: {
        include?: string[];
        exclude?: string[];
    };
}

export interface nftsRequest {
    slug: string;
    sortBy: string;
    limit: number;
    filters: nftsFilter;
}
