import { Context } from "config/types"
import {
    CreateBandInput,
    SessionInformation,
    QueryBandInput,
    BandQuery,
    GetBandInput
} from "resolvers/app/band/models"
import { snakeToCamel } from "lib"
import { ObjectID } from "mongodb"

export const queryBand = async (parent: void, args: QueryBandInput, context: Context) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const query: BandQuery = {
        [snakeToCamel(type)]: {
            $regex: new RegExp(content || "", "ig"),
        }
    }
    return context.db.collection("band").find(query).sort({ _id }).toArray()

}

export const getBand = async (parent: void, args: GetBandInput, context: Context) =>
    context.db.collection("band").findOne({ _id: new ObjectID(args.bandId) })