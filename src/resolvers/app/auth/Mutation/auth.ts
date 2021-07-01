import { Db } from "mongodb"
import { ApolloError } from "apollo-server-express"
import { Redis } from "config/connectRedis"
import jwt from "jsonwebtoken"
import { createHashedPassword, checkPassword } from "lib"
import env from "config/env"
import { SMSSend } from "resolvers/app/auth/models"
import { checkUsername, checkId } from "resolvers/app/auth/Query"
import { JWTUser } from "config/types"

const specialCharacters = "\"'\\!@#$%^&*()_-=+/?.><,[{]}|;:"
const isValidPassword = (password: string) => {
    if (password.length < 6) return false
    for (const c of password) {
        if ('a' <= c && c <= 'z') continue
        if ('A' <= c && c <= 'Z') continue
        if ('0' <= c && c <= '9') continue
        if (specialCharacters.includes(c)) continue
        return false
    }
    return true
}

export const register = async (
    parent: void, {
        id,
        password,
        username,
        phone,
        position,
        level,
        type
    }: {
        id: string,
        password: string,
        username: string,
        phone: SMSSend,
        position: string,
        level: number,
        type: number
    }, {
        db,
        redis
    }: {
        db: Db,
        redis: Redis
    }
) => {
    if (isValidPassword(password) === false) {
        return new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const { phoneNumber } = phone
    const validArgs = await Promise.all([
        redis.get(phoneNumber),
        checkUsername(undefined, { username }, { db }),
        checkId(undefined, { id }, { db })
    ])
    if (validArgs[0] === null) {
        return new ApolloError("휴대번호 인증을 다시해야합니다")
    }
    if (validArgs[1] !== true || validArgs[2] !== true) {
        return new ApolloError("id 혹은 username 이 조건에 맞지 않습니다")
    }
    const hash = createHashedPassword(password)
    const result = await db.collection("user").insertOne({
        id,
        hash,
        username,
        phoneNumber,
        position,
        level,
        type
    }).then(({ result }) => result.n === 1)
    if (result === false) {
        throw new ApolloError("DB 연결 오류")
    }
    await redis.del(phoneNumber)
    return true
}

export const login = async (
    parent: void, {
        id,
        password
    }: {
        id: string,
        password: string
    }, {
        db
    }: {
        db: Db
    }
) => {
    const user = await db.collection("user").findOne({ id })
    if (user !== null && checkPassword(password, user.hash)) {
        return jwt.sign({
            id: user.id
        }, env.JWT_SECRET)
    }
    return new ApolloError("잘못된 아이디 또는 비밀번호를 입력하셨습니다")
}

export const resetPassword = async (
    parent: void, {
        token,
        resetPassword
    }: {
        token: string,
        resetPassword: string
    }, {
        db,
        redis
    }: {
        db: Db,
        redis: Redis
    }
) => {
    if (isValidPassword(resetPassword) === false) {
        return new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const user = await redis.get(token)
    if (user === null) {
        return new ApolloError("다시 시도해 주세요")
    }
    await redis.del(token)
    await db.collection("user").updateOne({ phoneNumber: user }, { $set: { hash: createHashedPassword(resetPassword) } })
    return true
}

export const changePassword = async (
    parent: void, {
        password,
        changePassword
    }: {
        password: string,
        changePassword: string
    }, {
        db,
        user
    }: {
        db: Db,
        user: JWTUser
    }
) => {
    const userResult = await db.collection("user").findOne({ id: user.id })
    if (userResult === null) {
        return new ApolloError("인증 정보가 유효하지 않습니다")
    }
    if (checkPassword(password, userResult.hash) === false) {
        return new ApolloError("비밀번호가 올바르지 않습니다")
    }
    if (isValidPassword(changePassword) === false) {
        return new ApolloError("새 비밀번호가 양식에 맞지 않습니다")
    }
    await db.collection("user").updateOne({ id: user.id }, { $set: { hash: createHashedPassword(changePassword) } })
    return true
}