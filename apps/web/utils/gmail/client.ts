import { google } from "googleapis";
import type { EmailAccount } from "@prisma/client";
import { saveRefreshToken } from "@/utils/auth";
import { env } from "@/env.mjs";
import prisma from "@/utils/prisma";

type ClientOptions = {
  accessToken?: string;
};

const getClient = (session: ClientOptions & { refreshToken?: string }) => {
  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  });
  // not passing refresh_token when next-auth handles it
  auth.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  return auth;
};

export const getGmailClient = (session: ClientOptions) => {
  const auth = getClient(session);
  const gmail = google.gmail({ version: "v1", auth });

  return gmail;
};

export const getContactsClient = (session: ClientOptions) => {
  const auth = getClient(session);
  const contacts = google.people({ version: "v1", auth });

  return contacts;
};

export const getGmailAccessToken = (session: ClientOptions) => {
  const auth = getClient(session);
  return auth.getAccessToken();
};

export const getGmailClientWithRefresh = async (
  session: ClientOptions & { refreshToken: string; expiryDate?: number | null },
  providerAccountId: string,
) => {
  const auth = getClient(session);
  const gmail = google.gmail({ version: "v1", auth });

  if (session.expiryDate && session.expiryDate > Date.now()) return gmail;

  const tokens = await auth.refreshAccessToken();

  if (tokens.credentials.access_token !== session.accessToken) {
    await saveRefreshToken(
      {
        access_token: tokens.credentials.access_token ?? undefined,
        expires_at: tokens.credentials.expiry_date
          ? Math.floor(tokens.credentials.expiry_date / 1000)
          : undefined,
      },
      {
        refresh_token: session.refreshToken,
        providerAccountId,
      },
    );
  }

  return gmail;
};

export const getGmailClientForEmailAccount = async (
  emailAccount: Pick<
    EmailAccount,
    "id" | "gmailAccessToken" | "gmailRefreshToken" | "gmailExpiresAt"
  >,
) => {
  const auth = getClient({
    accessToken: emailAccount.gmailAccessToken ?? undefined,
    refreshToken: emailAccount.gmailRefreshToken ?? undefined,
  });
  const gmail = google.gmail({ version: "v1", auth });

  if (
    emailAccount.gmailAccessToken &&
    emailAccount.gmailExpiresAt &&
    emailAccount.gmailExpiresAt.getTime() > Date.now() + 10_000
  ) {
    return { gmail, accessToken: emailAccount.gmailAccessToken };
  }

  if (!emailAccount.gmailRefreshToken) {
    return { gmail, accessToken: emailAccount.gmailAccessToken ?? undefined };
  }

  const tokens = await auth.refreshAccessToken();
  const accessToken =
    tokens.credentials.access_token ??
    emailAccount.gmailAccessToken ??
    undefined;

  await prisma.emailAccount.update({
    where: { id: emailAccount.id },
    data: {
      gmailAccessToken: tokens.credentials.access_token,
      gmailExpiresAt: tokens.credentials.expiry_date
        ? new Date(tokens.credentials.expiry_date)
        : emailAccount.gmailExpiresAt,
    },
  });

  return { gmail, accessToken };
};
