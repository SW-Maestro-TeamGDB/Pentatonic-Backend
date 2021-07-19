import { ApolloError } from "apollo-server-express"
import { Context } from "config/types"
import env from "config/env"
import {
    ChangeProfileInput,
    UploadImageInput
} from "resolvers/app/auth/models"
import { checkUsername } from "resolvers/app/auth/Query"
import { isValidImage, uploadS3 } from "lib"

export const uploadImageFile = async (parent: void, file: UploadImageInput) => {
    const img = await file.input.file
    if (isValidImage(img.filename) === false) {
        return new ApolloError(`파일 확장자가 올바르지 않습니다`)
    }
    const stream = img.createReadStream()
    const fileName = `${Date.now()}-${img.filename}`
    await uploadS3(stream, fileName, img.mimetype)
    return `${env.S3_URI}/${fileName}`
}

export const changeProfile = async (parent: void, args: ChangeProfileInput, context: Context) => {
    const { username, profileURI, introduce, type } = args.input.user
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