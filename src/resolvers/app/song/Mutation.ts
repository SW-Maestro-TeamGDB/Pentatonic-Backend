import { Db } from "mongodb"
import { Redis } from "config/types"
import { Song } from "resolvers/app/song/models"
import { File } from "config/types"
import env from "config/env"
import { ApolloError } from "apollo-server-errors"
import { uploadS3 } from "lib"

export const uploadDefaultAR = async (
    args: void, {
        code,
        file
    }: {
        code: string
        file: File
    }, {
        db
    }: {
        db: Db
    }
) => {
    if (code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    const song = await file
    const stream = await file.createReadStream()
    const fileName = `${Date.now()}-${song.filename}`
    await uploadS3(stream, fileName, song.mimetype)
    return `${env.S3_URI}/${fileName}`
}