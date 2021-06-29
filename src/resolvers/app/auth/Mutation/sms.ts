import { Db } from "mongodb"
import { ApolloError } from "apollo-server-express"
import { Redis } from "config/connectRedis"
import { smsRequest, changePhoneNumber } from "lib"
import { SMSCheck, SMSSend } from "resolvers/app/auth/models"

export const registerSMSSend = async (
    parent: void, {
        phone
    }: {
        phone: SMSSend
    }, {
        redis,
        db
    }: {
        redis: Redis,
        db: Db
    }
) => {
    const { phoneNumber } = phone
    if (phoneNumber.startsWith("+82") === false) {
        return new ApolloError("한국 번호가 아닙니다")
    }
    const user = await db.collection("user").findOne({ phoneNumber })
    if (user !== null) {
        return new ApolloError("이미 해당 전화번호로 가입한 유저가 있습니다")
    }
    const smsNumber = changePhoneNumber(phoneNumber)
    const result = await smsRequest(smsNumber)
    if (result === false) {
        return false
    }
    await redis.setex(smsNumber, 180, result)
    return true
}

export const registerSMSCheck = async (
    parent: void, {
        phone
    }: {
        phone: SMSCheck
    }, {
        redis
    }: {
        redis: Redis
    }
) => {
    const { phoneNumber, authenticationNumber } = phone
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