import { Context } from "config/types"
import {
    LikeStatusInput,
    QueryBandInput,
    BandQuery,
    GetBandInput
} from "resolvers/app/band/models"
import { snakeToCamel } from "lib"
import { ObjectID } from "mongodb"

export const queryBand = (parent: void, args: QueryBandInput, context: Context) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const query: BandQuery = {
        [snakeToCamel(type)]: {
            $regex: new RegExp(content || "", "ig"),
        }
    }
    return context.db.collection("band").find(query).sort({ _id }).toArray()

}

export const getBand = (parent: void, args: GetBandInput, context: Context) =>
    context.db.collection("band").findOne({ _id: new ObjectID(args.bandId) })

export const likeStatus = (parent: void, args: LikeStatusInput, context: Context) =>
    context.db.collection("like").find({
        bandId: new ObjectID(args.bandId),
        userId: context.user.id
    }).count().then(x => x === 1)

export const getRankedBands = async (parent: void, args: any, context: Context) => {
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
    ]).toArray()
    const bandIds = likeCounts.map(x => x._id)
    const [bands, freeBands] = await Promise.all([
        context.db.collection("band").find({ _id: { $in: bandIds } }).limit(100).toArray(),
        context.db.collection("freeBand").find({ _id: { $in: bandIds } }).limit(100).toArray()
    ])
    const mp = likeCounts.reduce((acc, cur, index) => {
        acc[cur._id.toString()] = index
        return acc
    }, {})
    return bands.concat(freeBands).sort((a, b) => mp[a._id.toString()] - mp[b._id.toString()]).slice(0, 99)
}