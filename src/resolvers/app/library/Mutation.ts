import {
    UploadCoverFileInput,
    UploadCoverInput,
    UpdateCoverInput,
    DeleteCoverInput
} from "resolvers/app/library/models"
import { Context } from "config/types"
import { ApolloError } from "apollo-server-express"
import { uploadS3, getAudioDuration } from "lib"
import { ObjectID } from "mongodb"


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
        throw new ApolloError("mp3, m4a 파일이 아닙니다")
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
        throw new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
    const coverBy = context.user.id
    return context.db.collection("library").insertOne({
        name,
        songId: new ObjectID(songId),
        coverURI: coverURI.href,
        duration,
        coverBy
    }).then(({ ops }) => ops[0])
}

export const updateCover = async (parent: void, args: UpdateCoverInput, context: Context) => {
    const {
        coverId,
        name
    } = args.input.cover
    if (name !== undefined) {
        return context.db.collection("library").findOneAndUpdate({
            _id: new ObjectID(coverId),
            coverBy: context.user.id
        }, { $set: { name } }, { returnDocument: "after" }).then(({ value }) => value)
    }
    return context.db.collection("library").findOne({
        _id: new ObjectID(coverId),
        coverBy: context.user.id
    })
}

export const deleteCover = async (parent: void, args: DeleteCoverInput, context: Context) =>
    context.db.collection("library").deleteOne({
        _id: new ObjectID(args.input.cover.coverId),
        coverBy: context.user.id
    }).then(({ deletedCount }) => deletedCount === 1)
