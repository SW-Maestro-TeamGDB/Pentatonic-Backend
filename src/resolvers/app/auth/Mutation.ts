import { Db } from "mongodb"
import { ApolloError } from "apollo-server-express"
import { Redis } from "config/connectRedis"
import { smsRequest, changePhoneNumber } from "lib"
import { genSaltSync, hashSync, compareSync } from "bcrypt"
import jwt from "jsonwebtoken"
import env from "config/env"

import { checkUsername, checkId } from "resolvers/app/auth/Query"

const createHashedPassword = (password: string) => {
    const saltRounds = 10
    const salt = genSaltSync(saltRounds)
    const hashedPassword = hashSync(password, salt)
    return hashedPassword
}

const checkPassword = (password: string, hashedPassword: string) => compareSync(password, hashedPassword)

const specialCharacters = "\"'\\!@#$%^&*()_-=+/?.><,[{]}|;:"
const isValidPw = (pw: string) => {
    if (pw.length < 6) return false
    for (const c of pw) {
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
        pw,
        username,
        phoneNumber,
        position,
        level,
        type
    }: {
        id: string,
        pw: string,
        username: string,
        phoneNumber: string,
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
    if (isValidPw(pw) === false) {
        return new ApolloError("pw 가 조건에 맞지 않습니다.")
    }
    const validArgs = await Promise.all([
        redis.get(phoneNumber),
        checkUsername(undefined, { username }, { db }),
        checkId(undefined, { id }, { db })
    ])
    if (validArgs[0] === null) {
        return new ApolloError("휴대번호 인증을 다시해야합니다.")
    }
    if (validArgs[1] !== true || validArgs[2] !== true) {
        return new ApolloError("id 혹은 username 이 조건에 맞지 않습니다.")
    }
    const hash = createHashedPassword(pw)
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
        return false
    }
    await redis.del(phoneNumber)
    return true
}

export const login = async (
    parent: void, {
        id,
        pw
    }: {
        id: string,
        pw: string
    }, {
        db
    }: {
        db: Db
    }
) => {
    const user = await db.collection("user").findOne({ id })
    if (user !== null && checkPassword(pw, user.hash)) {
        return jwt.sign({
            id: user.id,
            username: user.username
        }, env.JWT_SECRET)
    }
    return new ApolloError("잘못된 아이디 또는 비밀번호를 입력하셨습니다.")
}
export const sendSMS = async (
    parent: void, {
        phoneNumber
    }: {
        phoneNumber: string
    }, {
        redis
    }: {
        redis: Redis
    }
) => {
    if (phoneNumber.startsWith("+82") === false) {
        return new ApolloError("한국 번호가 아닙니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber)
    if (result === false) {
        return false
    }
    await redis.setex(smsNumber, 180, result)
    return true
}

export const checkSMS = async (
    parent: void, {
        phoneNumber,
        authenticationNumber
    }: {
        phoneNumber: string,
        authenticationNumber: number
    }, {
        redis
    }: {
        redis: Redis
    }
) => {
    const smsNumber = changePhoneNumber(phoneNumber)
    const authNumber = await redis.get(smsNumber)
    if (authNumber !== null && authNumber === authenticationNumber.toString()) {
        await Promise.all([
            redis.del(smsNumber),
            redis.setex(phoneNumber, 600, "")
        ])
        return true
    }
    return false
}