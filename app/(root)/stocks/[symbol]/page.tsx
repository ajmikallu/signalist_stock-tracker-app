import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { getWatchlistSymbolsByEmail, onWatchlistChange } from "@/lib/actions/watchlist.actions";
import { getCurrentUserEmail } from '@/lib/actions/auth.utils';

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await  params;
    const upperSymbol = symbol.toUpperCase();
    const company = upperSymbol;

    // Determine initial watchlist status for the current user
    const email = await getCurrentUserEmail();
    const userSymbols = await getWatchlistSymbolsByEmail(email);
    const isInWatchlist = userSymbols.includes(upperSymbol);

    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                <div className="flex flex-col gap-6">
                   <TradingViewWidget
                       scriptUrl={`${scriptUrl}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={170}
                   />
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />
                </div>
                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <WatchlistButton
                            symbol={upperSymbol}
                            company={company}
                            isInWatchlist={isInWatchlist}
                            onWatchlistChange={onWatchlistChange}
                        />
                    </div>

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}company-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                        height={440}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                        height={464}
                    />

                </div>
            </section>
        </div>
    )
}