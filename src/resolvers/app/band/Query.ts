import { Context } from "config/types"
import {
    CreateBandInput,
    SessionInformation
} from "resolvers/app/band/models"
import { sessionParse } from "lib"
import { ObjectID } from "mongodb"

export const exampleQuery = async (parent: void, args: void, context: Context) =>
    context.db.collection("band").find({}).toArray()