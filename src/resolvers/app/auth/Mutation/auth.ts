import { ApolloError } from "apollo-server-express"
import jwt from "jsonwebtoken"
import { createHashedPassword, checkPassword, isValidImage, uploadS3 } from "lib"
import env from "config/env"
import { InputUser, InputResetPassword, InputLogin, InputChangePassword, InputFile, InputChangeProfile, InputPassword } from "resolvers/app/auth/models"
import { checkUsername, checkId } from "resolvers/app/auth/Query"
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

export const register = async (parent: void, args: InputUser, context: Context) => {
    const { id, password, username, phone, spec, type } = args
    if (isValidPassword(password) === false) {
        return new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const { phoneNumber } = phone
    const { db, redis } = context
    const validArgs = await Promise.all([
        redis.get(phoneNumber),
        checkUsername(undefined, { username }, { db }),
        checkId(undefined, { id }, context)
    ])
    if (validArgs[0] === null) {
        return new ApolloError("휴대번호 인증을 다시해야합니다")
    }
    if (validArgs[1] !== true || validArgs[2] !== true) {
        return new ApolloError("id 혹은 username 이 조건에 맞지 않습니다")
    }
    const hash = createHashedPassword(password)
    await redis.del(phoneNumber)
    return await db.collection("user").insertOne({
        id,
        hash,
        username,
        phoneNumber,
        spec: [...spec],
        prime: false,
        introduce: "자기소개글이 아직 비어있습니다!",
        profileURI: "https://kr.seaicons.com/wp-content/uploads/2016/05/Letter-P-blue-icon.png",
        type
    }).then(({ result }) => result.n === 1)
}

export const login = async (parent: void, args: InputLogin, context: Context) => {
    const { id, password } = args
    const { db } = context
    const user = await db.collection("user").findOne({ id })
    if (user !== null && checkPassword(password, user.hash)) {
        return jwt.sign({
            id: user.id
        }, env.JWT_SECRET)
    }
    return new ApolloError("잘못된 아이디 또는 비밀번호를 입력하셨습니다")
}

export const resetPassword = async (parent: void, args: InputResetPassword, context: Context) => {
    const { token, resetPassword } = args
    if (isValidPassword(resetPassword) === false) {
        return new ApolloError("비밀번호가 조건에 맞지 않습니다")
    }
    const { redis, db } = context
    const user = await redis.get(token)
    if (user === null) {
        return new ApolloError("다시 시도해 주세요")
    }
    await redis.del(token)
    await db.collection("user").updateOne({ phoneNumber: user }, { $set: { hash: createHashedPassword(resetPassword) } })
    return true
}

export const changePassword = async (parent: void, args: InputChangePassword, context: Context) => {
    const { db, user } = context
    const { password, changePassword } = args
    const userResult = await db.collection("user").findOne({ id: user.id })
    if (checkPassword(password, userResult.hash) === false) {
        return new ApolloError("비밀번호가 올바르지 않습니다")
    }
    if (isValidPassword(changePassword) === false) {
        return new ApolloError("새 비밀번호가 양식에 맞지 않습니다")
    }
    await db.collection("user").updateOne({ id: user.id }, { $set: { hash: createHashedPassword(changePassword) } })
    return true
}

export const uploadProfile = async (parent: void, file: InputFile) => {
    const img = await file.file
    if (isValidImage(img.filename) === false) {
        return new ApolloError(`파일 확장자가 올바르지 않습니다`)
    }
    const stream = img.createReadStream()
    const fileName = `${Date.now()}-${img.filename}`
    await uploadS3(stream, fileName, img.mimetype)
    return `${env.S3_URI}/${fileName}`
}

export const changeProfile = async (parent: void, args: InputChangeProfile, context: Context) => {
    const { username, profileURI, introduce, spec, type } = args
    const { db, user } = context
    const result = await db.collection("user").findOne({ id: user.id })
    const updateArgs = { ...result }
    delete updateArgs._id
    delete updateArgs.hash
    if (profileURI !== undefined) {
        updateArgs.profileURI = profileURI.href
    }
    if (introduce !== undefined) {
        updateArgs.introduce = introduce
    }
    if (spec !== undefined) {
        updateArgs.spec = [...spec]
    }
    if (type !== undefined) {
        updateArgs.type = type
    }
    if (username !== undefined) {
        if (await checkUsername(undefined, { username }, { db }) === true) {
            updateArgs.username = username
        } else {
            return new ApolloError("username 이 올바르지 않습니다")
        }
    }
    await db.collection("user").updateOne({ id: user.id }, { $set: updateArgs })
    return updateArgs
}

export const deleteAccount = async (parent: void, args: InputPassword, context: Context) => {
    const { db, user } = context
    const result = await db.collection("user").findOne({ id: user.id })
    const { password } = args
    if (checkPassword(password, result.hash) === false) {
        return new ApolloError("비밀번호가 올바르지 않습니다")
    }
    return db.collection("user").deleteOne({ id: user.id }).then(({ result }) => result.n === 1)
}