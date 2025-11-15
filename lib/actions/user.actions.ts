'use server'
import {connectToDatabase} from "@/database/mongoose";

export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
    try{
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Database connection not established');
        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();
        return users
            .filter((user) => user.email && user.name)
            .map((user) => {
                const id = user.id || user._id?.toString() || '';
                if (!id) return null;
                return {
                    id,
                    email: user.email,
                    name: user.name,
                    country: user.country ?? '',
                } satisfies UserForNewsEmail;
            })
            .filter((u): u is UserForNewsEmail => u !== null);

    } catch (e) {
        console.error('Error fetching users', e);
        return [];
    }
}
export const getAllUsersForNewsEmail = async (): Promise<UserForNewsEmail[]> => {
    try {
        const db = await connectToDatabase();
        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 }}
        ).toArray();
        return users
            .filter((user) => user.email && user.name)
            .map((user) => {
                const id = user.id || user._id?.toString() || '';
                if (!id) return null;
                return {
                    id,
                    email: user.email,
                    name: user.name,
                    country: user.country ?? '',
                } satisfies UserForNewsEmail;
            })
            .filter((u): u is UserForNewsEmail => u !== null);
    } catch (e) {
        console.error('Error fetching users', e);
        return [];
    }
}
