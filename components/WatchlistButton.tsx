"use client";
import React, { useMemo, useState } from "react";
const WatchlistButton =  ({
                              symbol,
                              company,
                              isInWatchlist,
                              showTrashIcon = false,
                              type = "button",
                              onWatchlistChange,
                          }: WatchlistButtonProps) => {
    const [added, setAdded] = useState<boolean>(!!isInWatchlist);
    const label = useMemo(() => {
        if (type === "icon") return added ? "" : "";
        return added ? "Remove from Watchlist" : "Add to Watchlist";
    }, [added, type]);

    const handleClick = () => {
        const next = !added;
        setAdded(next);
        onWatchlistChange?.(symbol, next);
    };
    return (
        <button className={`watchlist-btn ${added ? "watchlist-remove" : ""}`} onClick={handleClick}>
            {showTrashIcon && added ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
                </svg>
            ) : null}
            <span>{label}</span>
        </button>
    )
}
export default WatchlistButton
