import {
    UploadCoverFileInput,
    UploadCoverInput
} from "resolvers/app/library/models"
import { Context } from "config/types"
import { ApolloError } from "apollo-server-express"
import { uploadS3, getAudioDuration } from "lib"


const isValidAudio = (name: string) => {
    for (const extension of ["mp3", "m4a"]) {
        if (name.endsWith(extension)) {
            return true
        }
    }
    return false
}

export const uploadCoverFile = async (parent: void, args: UploadCoverFileInput, context: Context) => {
    const file = await args.input.file
    if (isValidAudio(file.filename) === false) {
        return new ApolloError("mp3, m4a 파일이 아닙니다")
    }
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    return uploadS3(stream, fileName, file.mimetype)
}

export const uploadCover = async (parent: void, args: UploadCoverInput, context: Context) => {
    const {
        name,
        songId,
        coverURI,
    } = args.input.cover
    const duration = await getAudioDuration(coverURI.href)
    if (duration === 0) {
        return new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
    const creatorId = context.user.id
    return context.db.collection("library").insertOne({
        name,
        songId,
        coverURI: coverURI.href,
        duration,
        creatorId
    }).then(({ ops }) => ops[0])
}