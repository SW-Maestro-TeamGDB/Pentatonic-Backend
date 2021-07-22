import {
    UploadSongInput,
    UploadDefaultImgInput,
    SongKeys,
    UpdateSongInput,
    UploadInstrumentInput,
    UpdateInstrumentInput,
    InstrumentKeys,
    DeleteSongInput,
    DeleteInstrumentInput
} from "resolvers/app/song/models"
import { Context } from "config/types"
import { uploadS3, getAudioDuration } from "lib"
import { ObjectID } from "mongodb"
import { ApolloError } from "apollo-server-express"
export const uploadDefaultFile = async (parent: void, args: UploadDefaultImgInput, context: Context) => {
    const file = await args.input.file
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    return uploadS3(stream, fileName, file.mimetype)
}

export const uploadSong = async (parent: void, args: UploadSongInput, context: Context) => {
    const { name, songImg, genre, artist, songURI, weeklyChallenge, level, releaseDate, album } = args.input.song
    const { db } = context
    const duration = await getAudioDuration(songURI.href)
    if (duration === 0) {
        return new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
    return db.collection("song").insertOne({
        name,
        genre,
        artist,
        releaseDate,
        album,
        songURI: songURI.href,
        songImg: songImg.href,
        weeklyChallenge,
        level,
        duration
    }).then(({ ops }) => ops[0])
}

export const updateSong = async (parent: void, args: UpdateSongInput, context: Context) => {
    const _id = new ObjectID(args.input.song.songId)
    delete args.input.song.songId
    const req = args.input.song
    const { db } = context
    const song = await db.collection("song").findOne({ _id })
    for (const key in req) {
        if (key === "songURI") {
            song.duration = await getAudioDuration(req.songURI.href as string)
            if (song.duration === 0) {
                return new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
            }
            song.songURI = req.songURI.href
        }
        else if (key === "songImg") {
            song.songImg = req.songImg.href
        }
        else {
            song[key] = req[key as SongKeys]
        }
    }
    delete song._id
    return db.collection("song").findOneAndUpdate({ _id }, { $set: song }, { returnDocument: "after" }).then(({ value }) => value)
}

export const uploadInstrument = async (parent: void, args: UploadInstrumentInput, context: Context) => {
    const { name, instrumentURI, songId } = args.input.instrument
    const { db } = context
    const duration = await getAudioDuration(instrumentURI.href)
    if (duration === 0) {
        return new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
    return db.collection("instrument").insertOne({
        name,
        instrumentURI: instrumentURI.href,
        songId: new ObjectID(songId),
        duration
    }).then(({ ops }) => ops[0])
}

export const updateInstrument = async (parent: void, args: UpdateInstrumentInput, context: Context) => {
    const { db } = context
    const _id = new ObjectID(args.input.instrument.instId)
    const instrument = await db.collection("instrument").findOne({ _id })
    delete instrument._id
    delete args.input.instrument.instId
    for (const key in args.input.instrument) {
        if (key === "instrumentURI") {
            instrument.duration = await getAudioDuration(args.input.instrument.instrumentURI.href as string)
            instrument.instrumentURI = args.input.instrument.instrumentURI.href
            if (instrument.duration === 0) {
                return new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
            }
        }
        else if (key === "songId") {
            instrument.songId = new ObjectID(args.input.instrument.songId)
        }
        else {
            instrument[key] = args.input.instrument[key as InstrumentKeys]
        }
    }
    return db.collection("instrument").findOneAndUpdate({ _id }, { $set: instrument }, { returnDocument: "after" }).then(({ value }) => value)
}

export const deleteSong = async (parent: void, args: DeleteSongInput, context: Context) => {
    const { db } = context
    const _id = new ObjectID(args.input.song.songId)
    return db.collection("song").deleteOne({ _id }).then(({ deletedCount }) => deletedCount === 1)
}

export const deleteInstrument = async (parent: void, args: DeleteInstrumentInput, context: Context) => {
    const { db } = context
    const _id = new ObjectID(args.input.instrument.instId)
    return db.collection("instrument").deleteOne({ _id }).then(({ deletedCount }) => deletedCount === 1)
}