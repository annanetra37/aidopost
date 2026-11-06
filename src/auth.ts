// Auth.js (NextAuth v5): Google, Microsoft Entra ID (personal + work), email + password.
import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { grantTrial, normaliseEmail } from "@/lib/credits";

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/en/login", error: "/en/login" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    MicrosoftEntraID({
      issuer:
        process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER ??
        "https://login.microsoftonline.com/common/v2.0",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
          return null;
        if (!user.emailVerified) throw new EmailNotVerified();
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.id || !account || account.provider === "credentials") return;
      // OAuth providers verify the email; grant the free trial once per identity.
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), authProvider: account.provider },
      });
      await grantTrial(user.id, [
        user.email ? normaliseEmail(user.email) : "",
        `${account.provider}:${account.providerAccountId}`,
      ]);
    },
  },
});
