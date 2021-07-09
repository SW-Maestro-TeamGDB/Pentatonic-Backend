import { rule, shield, not, and } from "graphql-shield"
import { ApolloError } from "apollo-server-express"
import { JWTUser } from "config/types"
import { Db } from "mongodb"
import { File, Redis } from "config/types"

const canSMSRequest = rule()(async (parent: void, args: void, { redis, ip }: { redis: Redis, ip: string }) => {
    const result = await redis.get(`canSMSRequest-${ip}`)
    if (result === null) {
        await redis.setex(`canSMSRequest-${ip}`, 60, `[${Date.now()},1]`)
        return true
    }
    const data = JSON.parse(result)
    if (Date.now() - parseInt(data[0], 10) <= 1000 * 60) {
        const t = parseInt(data[1], 10)
        if (t < 5) {
            await redis.setex(`canSMSRequest-${ip}`, 60, `[${data[0]},${t + 1}]`)
            return true
        } else {
            return new ApolloError("잠시 뒤에 시도해주세요")
        }
    }
    await redis.setex(`canSMSRequest-${ip}`, 60, `[${Date.now()},1]`)
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

export const permissions = shield({
    Mutation: {
        changePassword: isLogin,
        uploadProfile: isLogin,
        changeProfile: isLogin,
        deleteAccount: isLogin,
        registerSMSSend: and(not(isLogin), canSMSRequest),
        findPasswordSMSSend: and(not(isLogin), canSMSRequest),
        findIdSMSSend: and(not(isLogin), canSMSRequest)
    },
    Query: {
        getPersonalInformation: isLogin
    }
})