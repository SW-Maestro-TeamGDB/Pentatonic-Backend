import AWS from "aws-sdk"
import { ReadStream } from "fs-capacitor"
import env from "config/env"

const region = env.AWS_REGION as string

const S3 = new AWS.S3({
    region,
    accessKeyId: env.AWS_ID as string,
    secretAccessKey: env.AWS_PW as string
})
const Bucket = env.AWS_BUCKET as string
export const uploadS3 = async (fileStream: ReadStream, Key: string, ContentType: string) => {
    const params = {
        Bucket,
        Key,
        Body: fileStream,
        ACL: "public-read",
        ContentType
    }
    try {
        await S3.upload(params).promise()
        return true
    } catch (e) {
        console.log(e)
        return false
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
