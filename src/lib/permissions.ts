import { rule, shield, not, and } from "graphql-shield"
import { ApolloError } from "apollo-server-express"
import { JWTUser } from "config/types"
import { Db } from "mongodb"
import { Redis } from "config/types"
import env from "config/env"

const canSend = rule()(async (parent: void, args: void, { redis, ip }: { redis: Redis, ip: string }) => {
    const result = await redis.get(`canSend-${ip}`)
    if (result === null) {
        await redis.setex(`canSend-${ip}`, 60, `[${Date.now()},1]`)
        return true
    }
    const data = JSON.parse(result)
    if (Date.now() - parseInt(data[0], 10) <= 1000 * 60) {
        const t = parseInt(data[1], 10)
        if (t < 5) {
            await redis.setex(`canSend-${ip}`, 60, `[${data[0]},${t + 1}]`)
            return true
        } else {
            return new ApolloError("잠시 뒤에 시도해주세요")
        }
    }
    await redis.setex(`canSend-${ip}`, 60, `[${Date.now()},1]`)
    return true
})
const isLogin = rule()(async (parent: void, args: void, { user, db }: { user: JWTUser, db: Db }) => {
    if (user === null) {
        return new ApolloError("Authorization Error")
    }
    if (await db.collection("user").findOne({ id: user.id }) === null) {
        return new ApolloError("인증 정보가 유효하지 않습니다")
    }
    return true
})

const isValidCode = rule()(async (parent: void, args: { input: { code: string } }) => {
    if (args.input.code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    return true
})

export const permissions = shield({
    Mutation: {
        changePassword: isLogin,
        uploadImageFile: isLogin,
        changeProfile: isLogin,
        deleteAccount: isLogin,
        sendAuthCode: and(not(isLogin), canSend),
        resetPassword: and(not(isLogin), canSend),
        uploadDefaultFile: isValidCode,
        uploadSong: isValidCode,
        updateSong: isValidCode,
        uploadInstrument: isValidCode,
        updateInstrument: isValidCode,
        uploadCoverFile: isLogin,
        uploadCover: isLogin,
        updateCover: isLogin,
        deleteCover: isLogin
    },
    Query: {
        findId: and(not(isLogin), canSend),
        getPersonalInformation: isLogin
    }
}, { allowExternalErrors: true })