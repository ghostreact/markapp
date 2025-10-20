export const runtime = 'nodejs';

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials";
import { comparePassword } from "./tools/hashpassword";


export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            authorize: async (credentials) => {

                if (!credentials?.username || !credentials?.password) return null;
                try {
                    await mongoConnect();
                    const getUsers = await User.findOne({ username: credentials.username }).lean();
                    if (!getUsers) return null;

                    const isValid = await comparePassword(credentials.password, getUsers.passwordHash);
                    if (!isValid) return null;

                    return {
                        id: getUsers._id.toString(),
                        username: getUsers.username,
                        role: getUsers.role
                    };

                } catch (error) {

                }

            }
        })
    ],

})