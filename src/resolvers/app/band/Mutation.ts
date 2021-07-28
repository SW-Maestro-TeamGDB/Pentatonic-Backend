import { Context } from "config/types"
import {
    CreateBandInput,
    SessionInformation
} from "resolvers/app/band/models"
import { sessionParse } from "lib"
import { ObjectID } from "mongodb"

export const createBand = async (parent: void, args: CreateBandInput, context: Context) => {
    const sessionArr: SessionInformation = sessionParse(args.input.sessionConfig)
    await context.db.collection("band").insertOne({
        creatorId: context.user.id,
        name: args.input.band.name,
        introduce: args.input.band.introduce,
        songId: new ObjectID(args.input.band.songId),
        backGroundURI: args.input.band.backGroundURI.href,
        ...sessionArr,
        createDate: new Date()
    }).then(({ ops }) => ops[0])
}