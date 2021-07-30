import { Context } from "config/types"
import {
    CreateBandInput,
    SessionInformation,
    UpdateBandInput,
    JoinBandInput
} from "resolvers/app/band/models"
import {
    sessionParse,
    snakeToCamel
} from "lib"
import { ObjectID } from "mongodb"
import { ApolloError } from "apollo-server-express"

export const createBand = async (parent: void, args: CreateBandInput, context: Context) => {
    const sessionArr: SessionInformation = sessionParse(args.input.sessionConfig)
    return await context.db.collection("band").insertOne({
        creatorId: context.user.id,
        name: args.input.band.name,
        introduce: args.input.band.introduce,
        songId: new ObjectID(args.input.band.songId),
        backGroundURI: args.input.band.backGroundURI.href,
        sessions: { ...sessionArr },
        createDate: new Date()
    }).then(({ ops }) => ops[0])
}


export const joinBand = async (parent: void, args: JoinBandInput, context: Context) => {
    const data = await Promise.all([
        context.db.collection("band").findOne({ _id: new ObjectID(args.input.band.bandId) }),
        context.db.collection("session").find({
            bandId: new ObjectID(args.input.band.bandId),
            position: args.input.session.position
        }).toArray(),
        context.db.collection("library").findOne({
            _id: new ObjectID(args.input.session.coverId),
            position: args.input.session.position
        })
    ])
    if (data[0] === null) {
        throw new ApolloError("밴드가 존재하지 않습니다")
    }
    if (data[2] === null) {
        throw new ApolloError("커버내역이 존재하지 않습니다")
    }
    if (data[1].find(x => x.coverId.toString() === args.input.session.coverId)) {
        throw new ApolloError("이미 참여한 유저입니다")
    }
    const myPosition = snakeToCamel(args.input.session.position)
    try {
        if (!data[0]["sessions"][myPosition] || data[1].length >= data[0]["sessions"][myPosition]) {
            throw new Error()
        }
        return await context.db.collection("session").insertOne({
            bandId: new ObjectID(args.input.band.bandId),
            position: args.input.session.position,
            coverId: new ObjectID(args.input.session.coverId)
        }).then(({ result }) => result.n === 1)
    } catch {
        throw new ApolloError("세션이 가득찾거나 존재하지 않습니다")
    }
}