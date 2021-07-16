import { InputUploadSong, InputUploadDefaultImg, SongKeys } from "resolvers/app/song/models"
import { Context } from "config/types"
import env from "config/env"
import { ApolloError } from "apollo-server-errors"
import { uploadS3, getAudioDuration } from "lib"
export const uploadDefaultFile = async (parent: void, args: InputUploadDefaultImg, context: Context) => {
    const { code } = args
    const file = await args.file
    if (code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    const stream = file.createReadStream()
    const fileName = `${Date.now()}-${file.filename}`
    await uploadS3(stream, fileName, file.mimetype)
    return `${env.S3_URI}/${fileName}`
}

export const uploadSong = async (parent: void, args: InputUploadSong, context: Context) => {
    const { name, songImg, genre, artist, songURI, weeklyChallenge, level, release, album } = args.song
    if (args.code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
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
        duration: await getAudioDuration(args.song.songURI.href),
    }).then(({ ops }) => ops[0])
}

export const updateSong = async (parent: void, args: InputUploadSong, context: Context) => {
    if (args.code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    const req = args.song
    const { db } = context
    const song = await db.collection("song").findOne({ _id: req.id })
    for (const key in req) {
        if (key === "songURI") {
            song.duration = await getAudioDuration(req.songURI.href)
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
    return db.collection("song").updateOne({ _id: req.id }, { $set: song })
}