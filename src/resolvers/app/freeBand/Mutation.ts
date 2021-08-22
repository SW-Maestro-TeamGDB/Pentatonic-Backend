import {
    CreateFreeBandInput
} from "resolvers/app/freeBand/models"
import {
    SessionInformation
} from "resolvers/app/band/models"
import { Context } from "config/types"
import {
    getAudioDuration,
    sessionParse
} from "lib"
import { ApolloError } from "apollo-server-express"
export const createFreeBand = async (parent: void, args: CreateFreeBandInput, context: Context) => {
    const { name, artist, songURI } = args.input.song
    const duration = await getAudioDuration(songURI.href)
    const sessionArr: SessionInformation = sessionParse(args.input.sessionConfig)
    const song = await context.db.collection("song").insertOne({
        name,
        artist,
        songURI: songURI.href,
        isFreeSong: true,
        duration
    }).then(({ ops }) => ops[0])
    return context.db.collection("freeBand").insertOne({
        songId: song._id,
        creatorId: context.user.id,
        name: args.input.band.name,
        introduce: args.input.band.introduce,
        backGroundURI: args.input.band.backGroundURI.href,
        sessions: sessionArr,
        createDate: new Date()
    }).then(({ ops }) => ops[0])
}