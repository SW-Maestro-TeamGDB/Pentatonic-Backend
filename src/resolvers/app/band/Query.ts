import { Context } from "config/types"
import {
    QueryBandInput,
    BandQuery,
    GetBandInput,
    DefaultBandQuery,
    QueryBandsInput,
} from "resolvers/app/band/models"
import { snakeToCamel, shuffle } from "lib"
import { ObjectID } from "mongodb"

export const queryBand = async (
    parent: void,
    args: QueryBandInput,
    context: Context
) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const text = new RegExp(content || "", "ig")
    const query: BandQuery & DefaultBandQuery =
        type !== "ALL"
            ? { [snakeToCamel(type)]: { $regex: text } }
            : {
                  $or: [
                      { creatorId: { $regex: text } },
                      { introduce: { $regex: text } },
                      { name: { $regex: text } },
                      {
                          songId: {
                              $in: await context.db
                                  .collection("song")
                                  .find({ name: { $regex: text } })
                                  .toArray()
                                  .then((x) => x.map((y) => y._id)),
                          },
                      },
                  ],
              }
    return context.db.collection("band").find(query).sort({ _id }).toArray()
}

export const getBand = (parent: void, args: GetBandInput, context: Context) =>
    context.db.collection("band").findOne({ _id: new ObjectID(args.bandId) })

export const getRankedBands = async (
    parent: void,
    args: void,
    context: Context
) => {
    const likeCounts = await context.db
        .collection("like")
        .aggregate([
            {
                $group: {
                    _id: "$bandId",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
        ])
        .limit(100)
        .toArray()
    const bandIds = likeCounts.map((x) => x._id)
    const bands = await context.db
        .collection("band")
        .find({ _id: { $in: bandIds } })
        .toArray()
    const mp = likeCounts.reduce((acc, cur, index) => {
        acc[cur._id.toString()] = index
        return acc
    }, {})
    return bands.sort((a, b) => mp[a._id.toString()] - mp[b._id.toString()])
}

export const getTrendBands = async (
    parent: void,
    args: void,
    context: Context
) => {
    const likeCounts = await context.db
        .collection("trend")
        .aggregate([
            {
                $group: {
                    _id: "$bandId",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
        ])
        .limit(100)
        .toArray()
    const bandIds = likeCounts.map((x) => x._id)
    const bands = await context.db
        .collection("band")
        .find({ _id: { $in: bandIds } })
        .toArray()
    return shuffle(bands)
}

export const queryBands = async (
    parent: void,
    args: QueryBandsInput,
    context: Context
) => {
    const { first, after, filter } = args
    const _id = filter.sort === "DATE_ASC" ? 1 : -1
    const text = new RegExp(filter.content || "", "ig")
    const query: BandQuery & DefaultBandQuery = {}
    if (after) {
        query._id = { [_id === -1 ? "$lt" : "$gt"]: new ObjectID(after) }
    }
    if (filter.type !== "ALL") {
        query[snakeToCamel(filter.type) as "name" | "introduce"] = {
            $regex: text,
        }
    } else {
        query["$or"] = [
            { creatorId: { $regex: text } },
            { introduce: { $regex: text } },
            { name: { $regex: text } },
            {
                songId: {
                    $in: await context.db
                        .collection("song")
                        .find({ name: { $regex: text } })
                        .toArray()
                        .then((x) => x.map((y) => y._id)),
                },
            },
        ]
    }
    const bands = await context.db
        .collection("band")
        .find(query)
        .sort({ _id })
        .limit(first)
        .toArray()
    return {
        bands,
        pageInfo: {
            hasNextPage: bands.length === first,
            endCursor: bands[bands.length - 1]?._id,
        },
    }
}
