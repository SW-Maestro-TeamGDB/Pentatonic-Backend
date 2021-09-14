import { Context } from "config/types"
import {
    GetCommentsInput
} from "resolvers/app/comment/models"
import { ObjectID } from "mongodb"


export const getComments = async (parent: void, args: GetCommentsInput, context: Context) =>
    context.db.collection("comment").find({
        bandId: new ObjectID(args.bandId)
    }).sort({ createdAt: -1 }).toArray()