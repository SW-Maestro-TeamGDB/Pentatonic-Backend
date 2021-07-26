import { ApolloError } from "apollo-server-express"
import {
    IsValidIdInput,
    IsValidUsernameInput,
    FindIdInput
} from "resolvers/app/auth/models"
import { Context } from "config/types"

export const isValidUsername = async (parent: void, args: IsValidUsernameInput, context: any) => {
    const { username } = args
    if (username.length < 2) throw new ApolloError("username 길이는 2 이상이여야합니다")
    const { db } = context
    const result = await db.collection("user").findOne({ username })
    if (result) {
        throw new ApolloError("중복인 username 입니다")
    }
    return true
}


const checkId = (id: string) => {
    for (const c of id) {
        if ('a' <= c && c <= 'z') continue
        if ('A' <= c && c <= 'Z') continue
        if ('0' <= c && c <= '9') continue
        return false
    }
    return true
}

export const isValidId = async (parent: void, args: IsValidIdInput, context: Context) => {
    const { id } = args
    if (id.length < 6) {
        throw new ApolloError("id는 길이는 6 이상이여야합니다")
    }
    if (checkId(id) === false) {
        throw new ApolloError("id 형식이 올바르지 않습니다")
    }
    const result = await context.db.collection("user").findOne({ id })
    if (result) {
        throw new ApolloError("중복인 id 입니다")
    }
    return true
}

export const findId = async (parent: void, args: FindIdInput, context: Context) => {
    const { phoneNumber, authCode } = args
    const { redis, db } = context
    const result = await redis.get(phoneNumber)
    if (result === null) {
        throw new ApolloError("휴대번호 인증을 다시해야합니다")
    }
    if (result !== authCode.toString()) {
        throw new ApolloError("인증번호가 일치하지 않습니다")
    }
    const validArgs = await Promise.all([
        redis.del(phoneNumber),
        db.collection("user").findOne({ phoneNumber })
    ])
    return {
        id: validArgs[1].id
    }
}

export const getPersonalInformation = (parent: void, args: void, context: Context) => context.db.collection("user").findOne({ id: context.user.id })