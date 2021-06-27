import { GraphQLJSON } from "graphql-scalars"
import { Db } from "mongodb"
import { ApolloError } from "apollo-server-express"
export const register = async (
    parent: void,
) => {

}

export const test = async (
    parent: void, {
        data
    }: {
        data: any
    }
) => {

    return true
}

export const checkUsername = async (
    parent: void, {
        username
    }: {
        username: string
    }, {
        db
    }: {
        db: Db,
    }
) => {
    if (username.length < 2) return new ApolloError("username 길이는 2 이상이여야합니다.")
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
export const checkId = async (
    parent: void, {
        id
    }: {
        id: string
    }, {
        db
    }: {
        db: Db
    }
) => {
    if (id.length < 6) {
        return new ApolloError("id는 길이는 6 이상이여야합니다.")
    }
    if (isValidId(id) === false) {
        return new ApolloError("id 형식이 올바르지 않습니다.")
    }
    const result = await db.collection("user").findOne({ id })
    return result === null ? true : new ApolloError("중복인 id 입니다.")
}