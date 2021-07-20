import {
    UploadSongInput,
    UploadDefaultImgInput,
    SongKeys,
    UpdateSongInput,
    UploadInstrumentInput,
    UpdateInstrumentInput,
    InstrumentKeys
} from "resolvers/app/song/models"
import { Context } from "config/types"
import env from "config/env"
import { uploadS3, getAudioDuration } from "lib"
export const uploadDefaultFile = async (parent: void, args: UploadDefaultImgInput, context: Context) => {
    const file = await args.input.file
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    await uploadS3(stream, fileName, file.mimetype)
    return `${env.S3_URI}/${fileName}`
}

export const uploadSong = async (parent: void, args: UploadSongInput, context: Context) => {
    const { name, songImg, genre, artist, songURI, weeklyChallenge, level, release, album } = args.input.song
    const { db } = context
    return db.collection("song").insertOne({
        name,
        genre,
        artist,
        release,
        album,
        songURI: songURI.href,
        songImg: songImg.href,
        weeklyChallenge,
        level,
        duration: await getAudioDuration(songURI.href),
    }).then(({ ops }) => ops[0])
}

export const updateSong = async (parent: void, args: UpdateSongInput, context: Context) => {
    const req = args.input.song
    const { db } = context
    const song = await db.collection("song").findOne({ _id: req.songId })
    for (const key in req) {
        if (key === "songURI") {
            song.duration = await getAudioDuration(req?.songURI?.href as string)
            song.songURI = req?.songURI?.href
        }
        else if (key === "songImg") {
            song.songImg = req?.songImg?.href
        }
        else {
            song[key] = req[key as SongKeys]
        }
    }
    delete song._id
    await db.collection("song").updateOne({ _id: req.songId }, { $set: song })
    return await db.collection("song").findOne({ _id: req.songId })
}

export const uploadInstrument = async (parent: void, args: UploadInstrumentInput, context: Context) => {
    const { name, instrumentURI, songId } = args.input.instrument
    const { db } = context
    return await db.collection("instrument").insertOne({
        name,
        instrumentURI: instrumentURI.href,
        songId,
        duration: await getAudioDuration(instrumentURI.href)
    }).then(({ ops }) => ops[0])
}

export const updateInstrument = async (parent: void, args: UpdateInstrumentInput, context: Context) => {
    const { db } = context
    const instrument = await db.collection("instrument").findOne({ _id: args.input.instrument.instId })
    delete instrument._id
    delete args.input.instrument.instId
    for (const key in args.input.instrument) {
        if (key === "instrumentURI") {
            instrument.duration = await getAudioDuration(args.input.instrument?.instrumentURI?.href as string)
            instrument.instrumentURI = args.input.instrument?.instrumentURI?.href
        }
        else {
            instrument[key] = args.input.instrument[key as InstrumentKeys]
        }
    }
    await db.collection("instrument").updateOne({
        _id: args.input.instrument.instId
    }, { $set: instrument })
    return await db.collection("instrument").findOne({ _id: args.input.instrument.instId })
}