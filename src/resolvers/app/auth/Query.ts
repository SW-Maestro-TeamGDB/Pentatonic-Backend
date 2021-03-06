import { ApolloError } from "apollo-server-express"
import {
    IsValidIdInput,
    IsValidUsernameInput,
    FindIdInput,
    GetUserInfoInput,
    QueryUserInput,
} from "resolvers/app/auth/models"
import { Context } from "config/types"

export const isValidUsername = async (
    parent: void,
    args: IsValidUsernameInput,
    context: any
) => {
    const { username } = args
    const result = await context.db.collection("user").findOne({ username })
    if (result) {
        throw new ApolloError("중복인 username 입니다")
    }
    return true
}

export const isValidId = async (
    parent: void,
    args: IsValidIdInput,
    context: Context
) => {
    const { id } = args
    const result = await context.db.collection("user").findOne({ id })
    if (result) {
        throw new ApolloError("중복인 id 입니다")
    }
    return true
}

export const findId = async (
    parent: void,
    args: FindIdInput,
    context: Context
) => {
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
        db.collection("user").findOne({ phoneNumber }),
    ])
    return {
        id: validArgs[1].id,
    }
}

export const getUserInfo = (
    parent: void,
    args: GetUserInfoInput,
    context: Context
) => context.db.collection("user").findOne({ id: args.userId })

export const checkAuthCode = async (
    parent: void,
    args: FindIdInput,
    context: Context
) => {
    const { phoneNumber, authCode } = args
    const result = await context.redis.get(phoneNumber)
    return result === authCode.toString()
}

export const queryUser = async (
    parent: void,
    args: QueryUserInput,
    context: Context
) => {
    const { username } = args
    const result = await context.db
        .collection("user")
        .find({
            username: { $regex: new RegExp(username, "i") },
        })
        .limit(10)
        .toArray()
    return result
}

export const getMyInfo = async (parent: void, args: void, context: Context) => {
    const { id } = context.user
    return context.db.collection("user").findOne({ id })
}
