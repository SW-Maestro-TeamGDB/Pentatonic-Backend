import { InputUploadSong, InputUploadDefaultImg } from "resolvers/app/song/models"
import { Context } from "config/types"
import env from "config/env"
import { ApolloError } from "apollo-server-errors"
import { uploadS3, isValidImage, getAudioDuration } from "lib"
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
    const { name, songImg, genre, artist, songURI, weeklyChallenge, level } = args.song
    if (args.code !== env.JWT_SECRET) {
        return new ApolloError("관리자 코드가 알맞지 않습니다")
    }
    const { db } = context
    return db.collection("song").insertOne({
        name,
        songImg,
        genre,
        artist,
        songURI: songURI.href,
        weeklyChallenge,
        level,
        duration: await getAudioDuration(args.song.songURI.href),
    }).then(({ ops }) => ops[0])
}
