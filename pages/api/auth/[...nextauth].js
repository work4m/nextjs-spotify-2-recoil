import NextAuth from "next-auth"
import SpotyfyProvider from "next-auth/providers/spotify"

import spotifyApi, { LOGIN_URL } from "../../../LIB/spotify"

function refreshAccessToken() {
    try {
        spotifyApi.setAccessToken(toke.accessToken);
        spotifyApi.setRefreshToken(toke.accessToken);

        const { body: refreshToken } = await spotifyApi.refreshAccessToken();

        console.log("refreshed token is :", refreshToken);

        return {
            ...token,
            accessToken: refreshToken.access_token,
            accessTokenExpires: Date.now() + (refreshToken.expires_in * 1000),
            refreshToken: refreshToken.refresh_token ?? token.refreshToken,
        };

    } catch (error) {
        console.error(error);

        return {
            ...token,
            error: 'RefreshAccessTokenError'
        };
    }
}

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
        SpotyfyProvider({
            clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
            clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
            authorization: LOGIN_URL,
        }),
        // ...add more providers here
    ],
    secret: process.env.JWT_SECRET,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, account, user }) {
            // iniitial sign in
            if (account && user) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    username: account.providerAccountId,
                    accessTokenExpires: account.expires_at * 1000,
                }
            }

            // return provider token if the access token not expierd yet
            if (Date.now() < token.accessTokenExpires) {
                console.log("existing token is valid");
                return token;
            }

            // access token has expired
            console.log("access token has expierd");
            return await refreshAccessToken(token);
        }
    }
})