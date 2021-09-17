import { Context } from "config/types"
import {
    QueryBandInput,
    BandQuery,
    GetBandInput,
    DefaultBandQuery
} from "resolvers/app/band/models"
import { snakeToCamel } from "lib"
import { ObjectID } from "mongodb"

export const queryBand = async (parent: void, args: QueryBandInput, context: Context) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const text = new RegExp(content || "", "ig")
    const query: BandQuery | DefaultBandQuery = type !== "ALL"
        ? { [snakeToCamel(type)]: { $regex: text } }
        : {
            $or: [
                { "creatorId": { $regex: text } },
                { "introduce": { $regex: text } },
                { "name": { $regex: text } },
                {
                    "songId": {
                        $in: await context.db.collection("song").find({ name: { $regex: text } }).toArray().then((x) => x.map((y) => y._id))
                    }
                }
            ]
        }
    return context.db.collection("band").find(query).sort({ _id }).toArray()

}

export const getBand = (parent: void, args: GetBandInput, context: Context) =>
    context.db.collection("band").findOne({ _id: new ObjectID(args.bandId) })

export const getRankedBands = async (parent: void, args: void, context: Context) => {
    const likeCounts = await context.db.collection("like").aggregate([
        {
            $group: {
                _id: "$bandId",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]).limit(100).toArray()
    const bandIds = likeCounts.map(x => x._id)
    const [bands, freeBands] = await Promise.all([
        context.db.collection("band").find({ _id: { $in: bandIds } }).toArray(),
        context.db.collection("freeBand").find({ _id: { $in: bandIds } }).toArray()
    ])
    const mp = likeCounts.reduce((acc, cur, index) => {
        acc[cur._id.toString()] = index
        return acc
    }, {})
    return bands.concat(freeBands).sort((a, b) => mp[a._id.toString()] - mp[b._id.toString()]).slice(0, 99)
}

export const getTrendBands = async (parent: void, args: void, context: Context) => {
    const likeCounts = await context.db.collection("trend").aggregate([
        {
            $group: {
                _id: "$bandId",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]).limit(100).toArray()
    const bandIds = likeCounts.map(x => x._id)
    const [bands, freeBands] = await Promise.all([
        context.db.collection("band").find({ _id: { $in: bandIds } }).toArray(),
        context.db.collection("freeBand").find({ _id: { $in: bandIds } }).toArray()
    ])
    const mp = likeCounts.reduce((acc, cur, index) => {
        acc[cur._id.toString()] = index
        return acc
    }, {})
    return bands.concat(freeBands).sort((a, b) => mp[a._id.toString()] - mp[b._id.toString()]).slice(0, 99)
}