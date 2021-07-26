import { Context } from "config/types"
import {
    QueryCoverInput,
    CoverQuery
} from "resolvers/app/library/models"
import { ObjectID } from "mongodb"

export const queryCover = async (parent: void, args: QueryCoverInput, context: Context) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const query: CoverQuery = {
        creatorId: context.user.id
    }
    if (type === "SONG_ID") {
        query.songId = new ObjectID(content)
    }
    if (type === "NAME") {
        query.name = { $regex: new RegExp(content || "", "ig") }
    }
    return context.db.collection("library").find(query).sort({ _id }).toArray()
}