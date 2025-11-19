'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    if (!email) return [];

    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if (!db) throw new Error('MongoDB connection not found');

        // Better Auth stores users in the "user" collection
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

        if (!user) return [];

        const userId = (user.id as string) || String(user._id || '');
        if (!userId) return [];

        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((i) => String(i.symbol));
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function addToWatchlist(symbol: string): Promise<{ success: boolean; error?: string }>
{
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        // Upsert to avoid duplicates if called repeatedly
        await Watchlist.updateOne(
            { userId: session.user.id, symbol: symbol.toUpperCase() },
            {
                $setOnInsert: {
                    userId: session.user.id,
                    symbol: symbol.toUpperCase(),
                    company: symbol.trim() || symbol.toUpperCase(),
                    addedAt: new Date(),
                },
            },
            { upsert: true }
        );

        return { success: true };
    } catch (err) {
        console.error('addToWatchlist error:', err);
        return { success: false, error: 'Failed to add to watchlist' };
    }
}

export async function removeFromWatchlist(symbol: string): Promise<{ success: boolean; error?: string }>
{
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) {
            return { success: false, error: 'Unauthorized' };
        }

        await connectToDatabase();

        await Watchlist.deleteOne({ userId: session.user.id, symbol: symbol.toUpperCase() });

        return { success: true };
    } catch (err) {
        console.error('removeFromWatchlist error:', err);
        return { success: false, error: 'Failed to remove from watchlist' };
    }
}

export async function onWatchlistChange(symbol: string, isAdded: boolean): Promise<{ success: boolean; error?: string }>
{
    if (isAdded) {
        return await addToWatchlist(symbol);
    } else {
        return await removeFromWatchlist(symbol);
    }
}