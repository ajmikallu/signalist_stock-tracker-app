

import WatchlistTable from '@/components/WatchListTable';
import {getDetailedStockDatas} from "@/lib/actions/finnhub.actions";
import {getWatchlistSymbolsByEmail} from "@/lib/actions/watchlist.actions";
import {getCurrentUserEmail} from "@/lib/actions/auth.utils";
const  WatchList = async () => {

    const email = await getCurrentUserEmail()
    const watchlist = await getWatchlistSymbolsByEmail(email)
    const detailedStockData: StockDataResult[] = await getDetailedStockDatas(watchlist);
    console.log(detailedStockData);
    return (

        <div className="flex min-h-screen flex-col p-4 md:p-6 lg:p-8">
            <section className=" grid w-full grid-cols-5 gap-8">
                <div className="flex flex-col md:col-span-4">
                    <WatchlistTable stocks={detailedStockData}/>
                </div>
                <div className="flex flex-col md:col-span-1">
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
                <div className="flex flex-col md:col-span-1 gap-6">
                    <h2 className="text-2xl font-semibold mb-4">Watchlist Stats</h2>
                    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">Total Stocks</p>
                            <p className="text-lg font-semibold">{watchlist.length}</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
export default WatchList
