import { ApolloError } from "apollo-server-express"
import { InputUsername, InputId } from "resolvers/app/auth/models"
import { Context } from "config/types"

export const checkUsername = async (parent: void, args: InputUsername, context: any) => {
    const { username } = args
    if (username.length < 2) return new ApolloError("username 길이는 2 이상이여야합니다.")
    const { db } = context
    const result = await db.collection("user").findOne({ username })
    return result === null ? true : new ApolloError("중복인 username 입니다.")
}


const isValidId = (id: string) => {
    for (const c of id) {
        if ('a' <= c && c <= 'z') continue
        if ('A' <= c && c <= 'Z') continue
        if ('0' <= c && c <= '9') continue
        return false
    }
    return true
}

export const checkId = async (parent: void, args: InputId, context: Context) => {
    const { id } = args
    if (id.length < 6) {
        return new ApolloError("id는 길이는 6 이상이여야합니다.")
    }
    if (isValidId(id) === false) {
        return new ApolloError("id 형식이 올바르지 않습니다.")
    }
    const result = await context.db.collection("user").findOne({ id })
    return result === null ? true : new ApolloError("중복인 id 입니다.")
}

export const getPersonalInformation = (parent: void, args: void, context: Context) => context.db.collection("user").findOne({ id: context.user.id })