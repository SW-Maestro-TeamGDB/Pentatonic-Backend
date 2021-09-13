import { Context } from "config/types"
import {
    QueryBandInput,
    BandQuery,
    GetBandInput,
    DefaultBandQuery
} from "resolvers/app/band/models"
import { snakeToCamel } from "lib"
import { ObjectID } from "mongodb"

export const queryFreeBand = async (parent: void, args: QueryBandInput, context: Context) => {
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
    return context.db.collection("freeBand").find(query).sort({ _id }).toArray()

}

export const getFreeBand = (parent: void, args: GetBandInput, context: Context) =>
    context.db.collection("freeBand").findOne({ _id: new ObjectID(args.bandId) })