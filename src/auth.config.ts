import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    pages: { signIn: "/login" },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/watchlist") ||
                nextUrl.pathname.startsWith("/alerts") ||
                nextUrl.pathname.startsWith("/market");
            if (isOnDashboard) return isLoggedIn;
            if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
            return true;
        },
    },
    providers: [],
};
