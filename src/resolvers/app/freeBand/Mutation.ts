import {
    CreateFreeBandInput
} from "resolvers/app/freeBand/models"
import {
    SessionInformation,
    UpdateBandInput as UpdateFreeBandInput,
    UpdateBandQuery
} from "resolvers/app/band/models"
import { Context } from "config/types"
import {
    getAudioDuration,
    sessionParse
} from "lib"
import {
    ObjectID
} from "mongodb"
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

export const updateFreeBand = async (parent: void, args: UpdateFreeBandInput, context: Context) => {
    const bandInfo = await context.db.collection("freeBand").findOne({ _id: new ObjectID(args.input.band.bandId) })
    if (bandInfo === null || bandInfo.creatorId !== context.user.id) {
        throw new ApolloError("권한이 없거나 밴드가 올바르지 않습니다")
    }
    const { bandId, ...data } = args.input.band
    const query: UpdateBandQuery = {
        $set: data
    }
    if (Object.keys(data).length === 0) {
        return context.db.collection("freeBand").findOne({
            _id: new ObjectID(args.input.band.bandId)
        })
    }
    if (args.input.sessionConfig !== undefined) {
        const nowSession = await context.db.collection("session")
            .find({ bandId: new ObjectID(args.input.band.bandId) })
            .toArray()
        const session = args.input.sessionConfig
        const mp = new Map()
        nowSession.forEach(x => {
            const mpResult = mp.get(x.position)
            if (mpResult === undefined) {
                mp.set(x.position, 1)
            }
            else {
                mp.set(x.position, mpResult + 1)
            }
        })
        session.forEach(x => {
            const result = mp.get(x.session)
            if (result === undefined) {
                return
            }
            if (result <= x.maxMember) {
                mp.delete(x.session)
                return
            }
            throw new ApolloError("현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요")
        })
        if ([...mp].length > 0) {
            throw new ApolloError("현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요")
        }
        (query.$set.sessions as SessionInformation) = sessionParse(args.input.sessionConfig)
    }
    return context.db.collection("freeBand").findOneAndUpdate({
        _id: new ObjectID(args.input.band.bandId)
    }, query, { returnDocument: "after" }).then(({ value }) => value)
}