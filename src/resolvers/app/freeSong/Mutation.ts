import { UploadFreeSongInput } from "resolvers/app/freeSong/models"
import { Context } from "config/types"
import { getAudioDuration } from "lib"
import { ApolloError } from "apollo-server-express"
export const uploadFreeSong = async (parent: void, args: UploadFreeSongInput, context: Context) => {
    const { name, artist, songURI } = args.input
    const duration = await getAudioDuration(songURI.href)
    if (duration === 0) {
        throw new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
    return context.db.collection("song").insertOne({
        name,
        artist,
        songURI: songURI.href,
        isFreeSong: true,
        duration
    }).then(({ ops }) => ops[0])
}

