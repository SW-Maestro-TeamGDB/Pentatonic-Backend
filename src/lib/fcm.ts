import * as admin from "firebase-admin"
import env from "config/env"
import { BandJoinMessageInput } from "lib/models"

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&") // $& means the whole matched string
}
const replaceAll = (str: string, find: string, replace: string) => {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace)
}

admin.initializeApp({
    credential: admin.credential.cert({
        type: env.FIREBASE_TYPE,
        project_id: env.FIREBASE_PROJECT_ID,
        private_key_id: env.FIREBASE_PRIVATE_KEY_ID,
        private_key: replaceAll(
            env.FIREBASE_PRIVATE_KEY as string,
            "\\n",
            "\n"
        ),
        client_email: env.FIREBASE_CLIENT_EMAIL,
        client_id: env.FIREBASE_CLIENT_ID,
        auth_uri: env.FIREBASE_AUTH_URI,
        token_uri: env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: env.FIREBASE_CLIENT_X509_CERT_URL,
    } as any),
})

export const followMessage = async (
    username: string,
    userId: string,
    token: string
) => {
    const message = {
        notification: {
            title: `${username}님이 팔로우했습니다`,
            body: `탭 하여 자세히 보기`,
        },
        token: token,
        body: {
            userId: userId,
        },
    }
    admin.messaging().send(message)
}

export const bandJoinMessage = async (args: BandJoinMessageInput[]) => {
    const messages = args.map((item) => {
        return {
            notification: {
                title: `${item.username} 님이 ${item.bandname} 밴드에 참가했습니다.`,
                body: `탭 하여 자세히 보기`,
            },
            token: item.token,
            body: {
                bandId: item.bandId,
            },
        }
    })
    admin.messaging().sendAll(messages)
}
