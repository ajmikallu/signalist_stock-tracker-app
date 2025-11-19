"use client"

import { Trash2, Bell } from 'lucide-react';
import { useState } from 'react';
import {Button} from "@/components/ui/button";
import {removeFromWatchlist} from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";




export default function WatchlistTable({stocks= []}: WatchlistTableProps) {
    const [watchlist, setWatchlist] = useState(stocks);
    // Track which symbols are currently being removed to avoid duplicate actions
    const [removingSymbols, setRemovingSymbols] = useState<Set<string>>(new Set());

    const handleRemove = async (symbol: string) => {
        // If already removing this symbol, ignore further clicks
        if (removingSymbols.has(symbol)) return;

        setRemovingSymbols((prev) => new Set(prev).add(symbol));
        try {
            const res = await removeFromWatchlist(symbol);
            if (res?.success) {
                setWatchlist((prev) => prev.filter((stock) => stock.symbol !== symbol));
                toast.success(`${symbol} removed from watchlist`);
            } else {
                const message = res?.error || 'Failed to remove from watchlist';
                toast.error(message);
                // On failure, keep item in state (no change)
            }
        } catch (error) {
            toast.error('An unexpected error occurred while removing the stock');
        } finally {
            setRemovingSymbols((prev) => {
                const next = new Set(prev);
                next.delete(symbol);
                return next;
            });
        }
    };

    const handleAddAlert = (symbol : string) => {
        // alert(`Alert added for ${symbol}`);
        //TODO: Add alert functionality
    };

    const processedStocks = watchlist.map((stock: any) => {
        // Handle both formats: direct data or nested in data property
        const data = stock.data || stock;

        return {
            symbol: stock.symbol,
            company: stock.company || data.country || 'N/A',
            price: data.currentPrice || stock.price || 0,
            change: data.changePercent || stock.change || 0,
            marketCap: stock.marketCap || formatMarketCap(data.marketCap),
            peRatio: data.peRatio || stock.peRatio || 0,
        };
    });

    // Format market cap
    function formatMarketCap(value: number | null): string {
        if (!value) return 'N/A';
        if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
        return `$${value.toFixed(2)}`;
    }


    return (
        <div className="bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Watchlist</h1>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">Add stock</Button>
                </div>

                {/* Empty State */}
                {processedStocks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">Your watchlist is empty</p>
                        <a
                            href="/search"
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Add stocks to get started →
                        </a>
                    </div>
                ) : (
                    /* Table */
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {/* Table Header */}
                                <thead>
                                <tr className="bg-gray-100 border-b-2 border-gray-200">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Stock
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Company
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                        Symbol
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        Change
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        Market Cap
                                    </th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                        P/E Ratio
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                                        Action
                                    </th>
                                </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody>
                                {processedStocks.map((stock) => (
                                    <tr
                                        key={stock.symbol}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        {/* Stock Logo/Symbol */}
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold text-sm">
                                                        {stock.symbol.slice(0, 2)}
                                                    </span>
                                            </div>
                                        </td>

                                        {/* Company */}
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {stock.company}
                                            </p>
                                        </td>

                                        {/* Symbol */}
                                        <td className="px-6 py-4">
                                            <a
                                                href={`/stock/${stock.symbol.toLowerCase()}`}
                                                className="text-sm font-bold text-blue-600 hover:underline"
                                            >
                                                {stock.symbol}
                                            </a>
                                        </td>

                                        {/* Price */}
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-semibold text-gray-900">
                                                ${stock.price.toFixed(2)}
                                            </p>
                                        </td>

                                        {/* Change */}
                                        <td className="px-6 py-4 text-right">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    stock.change >= 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {stock.change >= 0 ? '+' : ''}
                                                {stock.change.toFixed(2)}%
                                            </p>
                                        </td>

                                        {/* Market Cap */}
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {stock.marketCap}
                                            </p>
                                        </td>

                                        {/* P/E Ratio */}
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {stock.peRatio
                                                    ? stock.peRatio.toFixed(2)
                                                    : 'N/A'}
                                            </p>
                                        </td>

                                        {/* Action Buttons */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() =>
                                                        handleAddAlert(stock.symbol)
                                                    }
                                                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                                                    title="Add Alert"
                                                >
                                                    <Bell size={18} />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleRemove(stock.symbol)
                                                    }
                                                    className={`p-2 rounded-lg transition ${removingSymbols.has(stock.symbol) ? 'text-red-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                    disabled={removingSymbols.has(stock.symbol)}
                                                    title="Remove from Watchlist"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}