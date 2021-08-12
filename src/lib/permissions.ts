import { rule, shield, not, and } from "graphql-shield"
import { ApolloError } from "apollo-server-express"
import { JWTUser, Context } from "config/types"
import { Db, ObjectID } from "mongodb"
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

const isValidCode = rule()((parent: void, args: { input: { code: string } }) => {
    if (args.input.code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    return true
})

const hasApolloError = (object: any): false | ApolloError => {
    if (typeof object !== "object" || object === null || object instanceof Boolean || object instanceof Date || object instanceof Number || object instanceof RegExp || object instanceof String)
        return false

    if (object instanceof ApolloError) {
        return object
    }
    if (Array.isArray(object)) {
        for (const key of object) {
            const value = hasApolloError(key)
            if (value === false) continue
            return value
        }
        return false
    }

    for (const key in object) {
        const value = hasApolloError(object[key])
        if (value !== false) {
            return value
        }
    }
    return false
}

const isValidInput = rule()((parent: void, args: any) => {
    if (JSON.stringify(args).includes("\"extensions\":{\"code\":\"400\"}")) {
        const errorMessage = hasApolloError(args)
        if (errorMessage === false) {
            return new ApolloError("invalid Input")
        }
        return errorMessage
    }
    else {
        return true
    }
})
export const permissions = shield({
    Mutation: {
        changePassword: and(isLogin, isValidInput),
        changeProfile: and(isLogin, isValidInput),
        createBand: and(isLogin, isValidInput),
        deleteAccount: and(isLogin, isValidInput),
        deleteCover: and(isLogin, isValidInput),
        deleteBand: and(isLogin, isValidInput),
        joinBand: and(isLogin, isValidInput),
        leaveBand: and(isLogin, isValidInput),
        like: and(isLogin, isValidInput),
        login: and(isValidInput),
        register: isValidInput,
        resetPassword: and(not(isLogin), canSend),
        sendAuthCode: and(not(isLogin), canSend, isValidInput),
        uploadImageFile: and(isLogin, isValidInput),
        uploadDefaultFile: isValidCode,
        uploadSong: and(isValidCode, isValidInput),
        updateSong: and(isValidCode, isValidInput),
        uploadInstrument: and(isValidCode, isValidInput),
        updateInstrument: and(isValidCode, isValidInput),
        uploadCoverFile: and(isLogin, isValidInput),
        uploadCover: and(isLogin, isValidInput),
        updateCover: and(isLogin, isValidInput),
        updateBand: and(isLogin, isValidInput),
    },
    Query: {
        findId: and(not(isLogin), canSend, isValidInput),
        getUserInfo: and(isLogin, isValidInput),
        queryCover: and(isLogin, isValidInput),
        getCover: and(isLogin, isValidInput),
        likeStatus: and(isLogin, isValidInput),
        isValidUsername: isValidInput,
        isValidId: isValidInput
    }
}, { allowExternalErrors: true })