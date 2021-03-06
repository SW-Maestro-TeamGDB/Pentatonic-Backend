import { ApolloError } from "apollo-server-express"
import { Context } from "config/types"
import env from "config/env"
import {
    ChangeProfileInput,
    UploadImageInput,
    ChangeProfileQuery,
    Social,
} from "resolvers/app/auth/models"
import { isValidUsername } from "resolvers/app/auth/Query"
import { isValidImage, uploadS3 } from "lib"

export const uploadImageFile = async (parent: void, file: UploadImageInput) => {
    const img = await file.input.file
    if (isValidImage(img.filename) === false) {
        throw new ApolloError(`파일 확장자가 올바르지 않습니다`)
    }
    const stream = img.createReadStream()
    const fileName = `${Date.now()}-${img.filename}`
    return uploadS3(stream, fileName, img.mimetype)
}

export const changeProfile = async (
    parent: void,
    args: ChangeProfileInput,
    context: Context
) => {
    const { db } = context
    if (Object.keys(args.input.user).length === 0) {
        return db.collection("user").findOne({ id: context.user.id })
    }
    const { profileURI, username, social, ...user } = args.input.user
    const query: ChangeProfileQuery = {
        $set: user,
    }
    if (username !== undefined) {
        await isValidUsername(undefined, { username }, { db })
        query.$set.username = username
    }
    if (profileURI !== undefined) {
        query.$set.profileURI = profileURI.href
    }
    if (social !== undefined) {
        query.$set.social = {
            facebook: social?.facebook?.href,
            twitter: social?.twitter?.href,
            instagram: social?.instagram?.href,
            kakao: social?.kakao?.href,
        }
    }
    return db
        .collection("user")
        .findOneAndUpdate({ id: context.user.id }, query, {
            returnDocument: "after",
        })
        .then(({ value }) => value)
}
