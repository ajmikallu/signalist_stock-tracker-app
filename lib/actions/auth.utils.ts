import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export interface CurrentUser {
    id: string;
    email: string;
    name: string;
}

/**
 * Get the current logged-in user
 * @returns {Promise<CurrentUser | null>}
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return null;
        }

        return {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
        };
    } catch (error) {
        console.error("Failed to get current user:", error);
        return null;
    }
}

/**
 * Get current user email (convenience function)
 */
export async function getCurrentUserEmail(): Promise<string> {
    const user = await getCurrentUser();
    return user?.email ?? '';
}

/**
 * Get current user or throw error if not authenticated
 */
export async function getCurrentUserOrThrow(): Promise<CurrentUser> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    return user;
}