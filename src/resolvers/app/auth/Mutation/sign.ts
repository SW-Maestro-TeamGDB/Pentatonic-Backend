import { ApolloError } from "apollo-server-express"
import jwt from "jsonwebtoken"
import {
    createHashedPassword,
    checkPassword,
    smsRequest,
    changePhoneNumber
} from "lib"
import env from "config/env"
import {
    RegisterInput,
    ResetPasswordInput,
    LoginInput,
    ChangePasswordInput,
    SendAuthCodeInput,
    DeleteAccountInput
} from "resolvers/app/auth/models"
import { isValidId, isValidUsername } from "resolvers/app/auth/Query"
import { Context } from "config/types"
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

export const sendAuthCode = async (parent: void, args: SendAuthCodeInput, context: Context) => {
    const { phoneNumber } = args.input
    if (phoneNumber.startsWith("+82") === false) {
        throw new ApolloError("한국 번호가 아닙니다")
    }
    const { db, redis } = context
    const user = await db.collection("user").findOne({ phoneNumber })
    if (args.input.isRegistration === true) {
        if (user !== null) {
            throw new ApolloError("이미 해당 전화번호로 가입한 유저가 있습니다")
        }
    }
    else {
        if (user === null) {
            throw new ApolloError("해당 전화번호로 가입한 유저가 없습니다")
        }
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber) as string
    await redis.setex(phoneNumber, 180, result)
    return true
}

export const register = async (parent: void, args: RegisterInput, context: Context) => {
    const { id, password, username, type } = args.input.user
    if (isValidPassword(password) === false) {
        throw new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const { db, redis } = context
    const { phoneNumber, authCode } = args.input
    const validArgs = await Promise.all([
        redis.get(phoneNumber),
        isValidUsername(undefined, { username }, { db }),
        isValidId(undefined, { id }, context)
    ])
    if (validArgs[0] === null) {
        throw new ApolloError("휴대번호 인증을 다시해야합니다")
    }
    if (validArgs[0] !== authCode.toString()) {
        throw new ApolloError("인증번호가 일치하지 않습니다")
    }
    const hash = createHashedPassword(password)
    await Promise.all([
        redis.del(phoneNumber),
        db.collection("user").insertOne({
            id,
            hash,
            username,
            phoneNumber,
            prime: false,
            introduce: "자기소개글이 아직 비어있습니다!",
            profileURI: "https://kr.seaicons.com/wp-content/uploads/2016/05/Letter-P-blue-icon.png",
            type
        })
    ])
    return jwt.sign({
        id
    }, env.JWT_SECRET)
}

export const login = async (parent: void, args: LoginInput, context: Context) => {
    const { id, password } = args.input.user
    const { db } = context
    const user = await db.collection("user").findOne({ id })
    if (user !== null && checkPassword(password, user.hash)) {
        return jwt.sign({
            id: user.id
        }, env.JWT_SECRET)
    }
    throw new ApolloError("잘못된 아이디 또는 비밀번호를 입력하셨습니다")
}

export const resetPassword = async (parent: void, args: ResetPasswordInput, context: Context) => {
    const { user, phoneNumber, authCode } = args.input
    if (isValidPassword(user.password) === false) {
        throw new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const { redis, db } = context
    const result = await redis.get(phoneNumber)
    if (result === null) {
        throw new ApolloError("휴대번호 인증을 다시해야합니다")
    }
    if (result !== authCode.toString()) {
        throw new ApolloError("인증번호가 일치하지 않습니다")
    }
    await Promise.all([
        redis.del(phoneNumber),
        db.collection("user").updateOne({ phoneNumber }, { $set: { hash: createHashedPassword(user.password) } })
    ])
    return true
}

export const changePassword = async (parent: void, args: ChangePasswordInput, context: Context) => {
    const { db, user } = context
    const { password, changePassword } = args.input.user
    const userResult = await db.collection("user").findOne({ id: user.id })
    if (checkPassword(password, userResult.hash) === false) {
        throw new ApolloError("비밀번호가 올바르지 않습니다")
    }
    if (isValidPassword(changePassword) === false) {
        throw new ApolloError("비밀번호가 양식에 맞지 않습니다")
    }
    await db.collection("user").updateOne({ id: user.id }, { $set: { hash: createHashedPassword(changePassword) } })
    return true
}

export const deleteAccount = async (parent: void, args: DeleteAccountInput, context: Context) => {
    const { db, user } = context
    const result = await db.collection("user").findOne({ id: user.id })
    const { password } = args.input.user
    if (checkPassword(password, result.hash) === false) {
        throw new ApolloError("비밀번호가 올바르지 않습니다")
    }
    return db.collection("user").deleteOne({ id: user.id }).then(({ result }) => result.n === 1)
}