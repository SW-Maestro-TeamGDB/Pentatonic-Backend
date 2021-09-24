import {
    UploadSongInput,
    UploadDefaultImgInput,
    UpdateSongQurey,
    UpdateSongInput,
    UploadInstrumentInput,
    UpdateInstrumentInput,
    UpdateInstrumentQuery,
    DeleteSongInput,
    DeleteInstrumentInput,
    UploadFreeSongInput
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

export const uploadFreeSong = async (parent: void, args: UploadFreeSongInput, context: Context) => {
    const duration = await getAudioDuration(args.input.song.songURI.href)
    return await context.db.collection("song").insertOne({
        name: args.input.song.name,
        artist: args.input.song.artist,
        songURI: args.input.song.songURI,
        isFreeSong: true,
        duration
    }).then(({ insertedId }) => insertedId)
}

export const uploadSong = async (parent: void, args: UploadSongInput, context: Context) => {
    const { name, songImg, genre, artist, songURI, weeklyChallenge, level, releaseDate, album } = args.input.song
    const { db } = context
    const duration = await getAudioDuration(songURI.href)
    return db.collection("song").insertOne({
        name,
        genre,
        artist,
        releaseDate,
        album,
        songURI: songURI.href,
        songImg: songImg.href,
        isFreeSong: false,
        weeklyChallenge,
        level,
        duration
    }).then(({ ops }) => ops[0])
}

export const updateSong = async (parent: void, args: UpdateSongInput, context: Context) => {
    const _id = new ObjectID(args.input.song.songId)
    delete args.input.song.songId
    if (Object.keys(args.input.song).length === 0) {
        return context.db.collection("song").findOne({ _id })
    }
    const { songURI, songImg, ...song } = args.input.song
    const { db } = context
    const query: UpdateSongQurey = {
        $set: song
    }
    if (songURI !== undefined) {
        const duration = await getAudioDuration(songURI.href)
        query.$set.duration = duration
        query.$set.songURI = songURI.href
    }
    if (songImg !== undefined) {
        query.$set.songImg = songImg.href
    }
    return db.collection("song").findOneAndUpdate({ _id }, query, { returnDocument: "after" }).then(({ value }) => value)
}

export const uploadInstrument = async (parent: void, args: UploadInstrumentInput, context: Context) => {
    const { name, instURI, songId, position } = args.input.instrument
    const { db } = context
    const duration = await getAudioDuration(instURI.href)
    return db.collection("instrument").insertOne({
        name,
        instURI: instURI.href,
        songId: new ObjectID(songId),
        duration,
        position
    }).then(({ ops }) => ops[0])
}

export const updateInstrument = async (parent: void, args: UpdateInstrumentInput, context: Context) => {
    const { db } = context
    const _id = new ObjectID(args.input.instrument.instId)
    delete args.input.instrument.instId
    if (Object.keys(args.input.instrument).length === 0) {
        return context.db.collection("instrument").findOne({ _id })
    }
    const { instURI, songId, ...instrument } = args.input.instrument
    const query: UpdateInstrumentQuery = {
        $set: instrument
    }
    if (instURI !== undefined) {
        query.$set.duration = await getAudioDuration(instURI.href as string)
        query.$set.instURI = instURI.href
    }
    if (songId !== undefined) {
        query.$set.songId = new ObjectID(songId)
    }
    return db.collection("instrument").findOneAndUpdate({ _id }, query, { returnDocument: "after" }).then(({ value }) => value)
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