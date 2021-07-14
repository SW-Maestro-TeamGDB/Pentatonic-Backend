import { ApolloError } from "apollo-server-express"
import { Context } from "config/types"
import { smsRequest, changePhoneNumber } from "lib"
import { InputSMSSend, IdPwSearchResult, InputSMSCheck, InputFindPasswordSMSSend, InputFindPasswordSMSCheck } from "resolvers/app/auth/models"
import cryptoRandomString from 'crypto-random-string'

export const registerSMSSend = async (parent: void, args: InputSMSSend, context: Context) => {
    const { phoneNumber } = args.phone
    if (phoneNumber.startsWith("+82") === false) {
        return new ApolloError("한국 번호가 아닙니다")
    }
    const { db, redis } = context
    const user = await db.collection("user").findOne({ phoneNumber })
    if (user !== null) {
        return new ApolloError("이미 해당 전화번호로 가입한 유저가 있습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber)
    if (result === false) return false
    await redis.setex(smsNumber, 180, result)
    return true
}

export const registerSMSCheck = async (parent: void, args: InputSMSCheck, context: Context) => {
    const { phoneNumber, authenticationNumber } = args.phone
    const smsNumber = changePhoneNumber(phoneNumber)
    const { redis } = context
    const authNumber = await redis.get(smsNumber)
    if (authNumber === null) {
        return new ApolloError("인증번호를 다시 요청해야합니다")
    }
    if (authNumber !== authenticationNumber.toString()) {
        return new ApolloError("인증번호가 일치하지 않습니다")
    }
    await Promise.all([
        redis.del(smsNumber),
        redis.setex(phoneNumber, 600, "")
    ])
    return true
}

export const findIdSMSSend = async (parent: void, args: InputSMSSend, context: Context) => {
    const { phoneNumber } = args.phone
    const { db, redis } = context
    const user = await db.collection("user").findOne({ phoneNumber })
    if (user === null) {
        return new ApolloError("해당 번호로 가입한 유저가 존재하지 않습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber)
    if (result === false) return false
    await redis.setex(smsNumber, 180, result)
    return true
}

export const findIdSMSCheck = async (parent: void, args: InputSMSCheck, context: Context): Promise<ApolloError | IdPwSearchResult> => {
    const { phoneNumber, authenticationNumber } = args.phone
    const { db, redis } = context
    const user = await db.collection("user").findOne({ phoneNumber })
    if (user === null) {
        return new ApolloError("해당 번호로 가입한 유저가 존재하지 않습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const authNumber = await redis.get(smsNumber)
    if (authNumber === null) {
        return new ApolloError("인증 요청이 유효하지 않습니다")
    } else if (authNumber !== authenticationNumber.toString()) {
        return new ApolloError("인증번호가 유효하지 않습니다")
    }
    await redis.del(smsNumber)
    return {
        message: "아이디 찾기 성공",
        id: user.id
    }
}

export const findPasswordSMSSend = async (parent: void, args: InputFindPasswordSMSSend, context: Context) => {
    const { phoneNumber } = args.phone
    const { id } = args
    const { db, redis } = context
    const user = await db.collection("user").findOne({ phoneNumber, id })
    if (user === null) {
        return new ApolloError("해당 정보로 가입한 유저가 존재하지 않습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber)
    if (result === false) return false
    await redis.setex(smsNumber, 180, result)
    return true
}

export const findPasswordSMSCheck = async (parent: void, args: InputFindPasswordSMSCheck, context: Context) => {
    const { phoneNumber, authenticationNumber } = args.phone
    const { id } = args
    const { db, redis } = context
    const user = await db.collection("user").findOne({ id, phoneNumber })
    if (user === null) {
        return new ApolloError("해당 정보의 유저를 찾을 수 없습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const authNumber = await redis.get(smsNumber)
    if (authNumber === null) {
        return new ApolloError("인증 요청이 유효하지 않습니다")
    } else if (authNumber !== authenticationNumber.toString()) {
        return new ApolloError("인증번호가 유효하지 않습니다")
    }
    await redis.del(smsNumber)
    const token = cryptoRandomString({ length: 24, type: 'alphanumeric' })
    await redis.setex(token, 6000, phoneNumber)
    return {
        message: "인증번호가 유효합니다",
        token
    }
}