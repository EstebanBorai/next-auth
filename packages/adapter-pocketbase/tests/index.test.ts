import { runBasicTests } from "@next-auth/adapter-test"
import { PocketbaseAdapter } from "../src"
import { format } from "../src/pocketbase.utils"
import type {
  AdapterAccount,
  VerificationToken,
  AdapterUser,
  AdapterSession,
} from "next-auth/src/adapters"
import type {
  PocketBaseAccount,
  PocketBaseSession,
  PocketBaseUser,
  PocketBaseVerificationToken,
} from "../src/pocketbase.types"

import "cross-fetch/polyfill"

import Pocketbase from "pocketbase"
const pb = new Pocketbase("http://127.0.0.1:8090")

runBasicTests({
  adapter: PocketbaseAdapter(pb, {
    username: "test@test.com",
    password: "pocketbase1234",
  }),
  db: {
    async session(sessionToken) {
      try {
        const pb_session = await pb
          .collection("next_auth_session")
          .getFirstListItem<PocketBaseSession>(`sessionToken="${sessionToken}"`)

        if (pb_session.code) throw new Error("could not find session")

        return format<AdapterSession>(pb_session)
      } catch (_) {
        return null
      }
    },
    async user(id) {
      try {
        const pb_user = await pb
          .collection("next_auth_user")
          .getOne<PocketBaseUser>(id)
        if (pb_user.code) throw new Error("could not find user")

        return format<AdapterUser>(pb_user)
      } catch (_) {
        return null
      }
    },
    async account({ provider, providerAccountId }) {
      try {
        const pb_account = await pb
          .collection("next_auth_account")
          .getFirstListItem<PocketBaseAccount>(
            `provider="${provider}" && providerAccountId="${providerAccountId}"`
          )

        if (pb_account.code) throw new Error("could not find account")

        // Token and Token Secret are a part of the docs' adapter models schema but not expected to be included with the adapter-test account object
        const { oauth_token, oauth_token_secret, ...adapterAccount } =
          format<AdapterAccount>(pb_account)

        return adapterAccount
      } catch (_) {
        return null
      }
    },
    async verificationToken({ identifier, token }) {
      try {
        const pb_veriToken = await pb
          .collection("next_auth_verificationToken")
          .getFirstListItem<PocketBaseVerificationToken>(
            `identifier="${identifier}" && token="${token}"`
          )

        if (pb_veriToken.code)
          throw new Error("could not find verificationToken")

        // @ts-expect-error
        const { id, ...verificationToken } =
          format<VerificationToken>(pb_veriToken)

        return verificationToken
      } catch (_) {
        return null
      }
    },
  },
})