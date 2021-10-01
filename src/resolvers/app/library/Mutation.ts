import {
    UploadCoverFileInput,
    UploadCoverInput,
    UpdateCoverInput,
    DeleteCoverInput,
    ChangeCoverQuery,
} from "resolvers/app/library/models"
import { Context } from "config/types"
import { ApolloError } from "apollo-server-express"
import { uploadS3, getAudioDuration, denoiseFilter } from "lib"
import { ObjectID } from "mongodb"

const isValidAudio = (name: string) => {
    for (const extension of ["mp3"]) {
        if (name.endsWith(extension)) {
            return true
        }
    }
    return false
}

export const uploadCoverFile = async (
    parent: void,
    args: UploadCoverFileInput,
    context: Context
) => {
    const file = await args.input.file
    if (isValidAudio(file.filename) === false) {
        throw new ApolloError("mp3 파일이 아닙니다")
    }
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    return uploadS3(stream, fileName, file.mimetype)
}

export const uploadCover = async (
    parent: void,
    args: UploadCoverInput,
    context: Context
) => {
    const { name, songId, coverURI, position } = args.input.cover
    const [duration, type] = await Promise.all([
        getAudioDuration(coverURI.href),
        context.db.collection("song").findOne({ _id: new ObjectID(songId) }),
    ])
    if (type === null) {
        throw new ApolloError("올바르지 않은 songId 입니다")
    }
    if (position !== "DRUM") {
        coverURI.href = (await denoiseFilter(coverURI.href)) as string
    }
    const coverBy = context.user.id
    return context.db
        .collection("library")
        .insertOne({
            name,
            songId: new ObjectID(songId),
            coverURI: coverURI.href,
            duration,
            date: new Date(),
            position,
            coverBy,
            isFreeSong: type.isFreeSong === true,
        })
        .then(({ ops }) => ops[0])
}

export const updateCover = async (
    parent: void,
    args: UpdateCoverInput,
    context: Context
) => {
    const { coverId, ...cover } = args.input.cover
    if (0 === Object.keys(cover).length) {
        return context.db.collection("library").findOne({
            _id: new ObjectID(coverId),
            coverBy: context.user.id,
        })
    }
    const query: ChangeCoverQuery = {
        $set: {
            ...cover,
        },
    }
    return context.db
        .collection("library")
        .findOneAndUpdate(
            {
                _id: new ObjectID(coverId),
                coverBy: context.user.id,
            },
            query,
            { returnDocument: "after" }
        )
        .then(({ value }) => value)
}

export const deleteCover = async (
    parent: void,
    args: DeleteCoverInput,
    context: Context
) => {
    const deleteDocument = await context.db
        .collection("library")
        .deleteOne({
            _id: new ObjectID(args.input.cover.coverId),
            coverBy: context.user.id,
        })
        .then(({ result }) => result.n === 1)
    if (deleteDocument) {
        await context.db.collection("join").deleteMany({
            coverId: new ObjectID(args.input.cover.coverId),
            userId: context.user.id,
        })
        return true
    } else {
        throw new ApolloError("삭제하는데 실패하였습니다")
    }
}
