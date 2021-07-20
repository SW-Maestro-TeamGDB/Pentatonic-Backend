import AWS from "aws-sdk"
import { ReadStream } from "fs-capacitor"
import { createReadStream } from "fs"
import env from "config/env"
import { ApolloError } from "apollo-server-express"
const region = env.AWS_REGION as string

const S3 = new AWS.S3({
    region,
    accessKeyId: env.AWS_ID as string,
    secretAccessKey: env.AWS_PW as string
})
const Bucket = env.AWS_BUCKET as string
export const uploadS3 = async (fileStream: ReadStream | string, Key: string, ContentType: string) => {
    const params = {
        Bucket,
        Key,
        Body: typeof fileStream === "string" ? createReadStream(fileStream) : fileStream,
        ACL: "public-read",
        ContentType
    }
    try {
        await S3.upload(params).promise()
        return `${env.S3_URI}/${Key}`
    } catch (e) {
        return new ApolloError(e)
    }
}

export const isValidImage = (fileName: String) => {
    for (const extension of [".jpg", ".jpeg", ".png"]) {
        if (fileName.endsWith(extension) === true) {
            return true
        }
    }
    return false
}
