import { Db } from "mongodb"
import { ApolloError } from "apollo-server-express"
import { Redis } from "config/connectRedis"
import { smsRequest } from "lib"
import bcrypt from "bcrypt"

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
    if (phoneNumber.includes("+82") === false) {
        return new ApolloError("한국 번호가 아닙니다")
    }
    const smsNumber = `010${phoneNumber.slice(5, phoneNumber.length)}`
    const result = await smsRequest(smsNumber)
    if (result === false) {
        return false
    }
    redis.setex(phoneNumber, 180, result)
    return true
}