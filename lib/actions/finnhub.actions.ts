'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch failed ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }
        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        // If we have symbols, try to fetch company news per symbol and round-robin select
        if (cleanSymbols.length > 0) {
            const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

            await Promise.all(
                cleanSymbols.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                        const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                        perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        perSymbolArticles[sym] = [];
                    }
                })
            );

            const collected: MarketNewsArticle[] = [];
            // Round-robin up to 6 picks
            for (let round = 0; round < maxArticles; round++) {
                for (let i = 0; i < cleanSymbols.length; i++) {
                    const sym = cleanSymbols[i];
                    const list = perSymbolArticles[sym] || [];
                    if (list.length === 0) continue;
                    const article = list.shift();
                    if (!article || !validateArticle(article)) continue;
                    collected.push(formatArticle(article, true, sym, round));
                    if (collected.length >= maxArticles) break;
                }
                if (collected.length >= maxArticles) break;
            }

            if (collected.length > 0) {
                // Sort by datetime desc
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
            // If none collected, fall through to general news
        }

        // General market news fallback or when no symbols provided
        const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

        const seen = new Set<string>();
        const unique: RawNewsArticle[] = [];
        for (const art of general || []) {
            if (!validateArticle(art)) continue;
            const key = `${art.id}-${art.url}-${art.headline}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(art);
            if (unique.length >= 20) break; // cap early before final slicing
        }

        const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
        return formatted;
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
    try {
        const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
        if (!token) {
            // If no token, log and return empty to avoid throwing per requirements
            console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
            return [];
        }

        const trimmed = typeof query === 'string' ? query.trim() : '';

        let results: FinnhubSearchResult[] = [];

        if (!trimmed) {
            // Fetch top 10 popular symbols' profiles
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
            const profiles = await Promise.all(
                top.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
                        // Revalidate every hour
                        const profile = await fetchJSON<any>(url, 3600);
                        return { sym, profile } as { sym: string; profile: any };
                    } catch (e) {
                        console.error('Error fetching profile2 for', sym, e);
                        return { sym, profile: null } as { sym: string; profile: any };
                    }
                })
            );

            results = profiles
                .map(({ sym, profile }) => {
                    const symbol = sym.toUpperCase();
                    const name: string | undefined = profile?.name || profile?.ticker || undefined;
                    const exchange: string | undefined = profile?.exchange || undefined;
                    if (!name) return undefined;
                    const r: FinnhubSearchResult = {
                        symbol,
                        description: name,
                        displaySymbol: symbol,
                        type: 'Common Stock',
                    };
                    // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
                    // To keep pipeline simple, attach exchange via closure map stage
                    // We'll reconstruct exchange when mapping to final type
                    (r as any).__exchange = exchange; // internal only
                    return r;
                })
                .filter((x): x is FinnhubSearchResult => Boolean(x));
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data?.result) ? data.result : [];
        }

        const mapped: StockWithWatchlistStatus[] = results
            .map((r) => {
                const upper = (r.symbol || '').toUpperCase();
                const name = r.description || upper;
                const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
                const exchangeFromProfile = (r as any).__exchange as string | undefined;
                const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
                const type = r.type || 'Stock';
                const item: StockWithWatchlistStatus = {
                    symbol: upper,
                    name,
                    exchange,
                    type,
                    isInWatchlist: false,
                };
                return item;
            })
            .slice(0, 15);

        return mapped;
    } catch (err) {
        console.error('Error in stock search:', err);
        return [];
    }
});


export async function getDetailedStockDatas(
    symbols: string[]
): Promise<StockDataResult[]> {
    try {
        // Fetch all stocks in parallel
        const dataPromises = symbols.map(async (symbol) => {
            try {
                const data = await getDetailedStockData(symbol);
                return {
                    symbol,
                    data,
                };
            } catch (error) {
                return {
                    symbol,
                    data: null,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        });

        return await Promise.all(dataPromises);
    } catch (error) {
        console.error('Failed to get detailed stock data:', error);
        return [];
    }
}

export async function getDetailedStockData(
    symbol: string
): Promise<Omit<DetailedStockData, 'symbol' | 'company' > | null> {
    const apiKey = process.env.FINNHUB_API_KEY??NEXT_PUBLIC_FINNHUB_API_KEY;

    if (!apiKey) {
        throw new Error('Finnhub API key not configured');
    }

    try {
        // Fetch multiple endpoints in parallel
        const [quoteData, profileData, metricsData] = await Promise.all([
            fetchQuoteData(symbol, apiKey),
            fetchProfileData(symbol, apiKey),
            fetchMetricsData(symbol, apiKey),
        ]);

        return {
            ...quoteData,
            ...profileData,
            ...metricsData,
        };
    } catch (error) {
        console.error(`Failed to get detailed data for ${symbol}:`, error);
        return null;
    }
}

export async function fetchQuoteData(
    symbol: string,
    apiKey: string
): Promise<{
    currentPrice: number;
    change: number;
    changePercent: number;
}> {
    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Quote API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            currentPrice: data.c || 0,
            change: data.d || 0,
            changePercent: data.dp || 0,
        };
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return {
            currentPrice: 0,
            change: 0,
            changePercent: 0,
        };
    }
}

export async function fetchProfileData(
    symbol: string,
    apiKey: string
): Promise<{
    country: string;
    industry: string;
    website: string;
    description: string;
}> {
    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Profile API error: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            country: data.country || 'N/A',
            industry: data.finnhubIndustry || 'N/A',
            website: data.weburl || '',
            description: data.description || '',
        };
    } catch (error) {
        console.error(`Failed to fetch profile for ${symbol}:`, error);
        return {
            country: 'N/A',
            industry: 'N/A',
            website: '',
            description: '',
        };
    }
}

export async function fetchMetricsData(
    symbol: string,
    apiKey: string
): Promise<{
    marketCap: number | null;
    peRatio: number | null;
    dividendYield: number | null;
    eps: number | null;
}> {
    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Metrics API error: ${response.statusText}`);
        }

        const data = await response.json();
        const metrics = data.metric || {};

        return {
            marketCap: metrics.marketCapitalization || null,
            peRatio: metrics.peNormalizedAnnual || null,
            dividendYield: metrics.dividendYieldIndicatedAnnual || null,
            eps: metrics.epsBasicExclExtraord || null,
        };
    } catch (error) {
        console.error(`Failed to fetch metrics for ${symbol}:`, error);
        return {
            marketCap: null,
            peRatio: null,
            dividendYield: null,
            eps: null,
        };
    }
}