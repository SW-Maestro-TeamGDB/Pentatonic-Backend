import { Context } from "config/types"
import {
    QueryCoverInput,
    CoverQuery,
    GetCoverInput
} from "resolvers/app/library/models"
import { ObjectID } from "mongodb"

export const queryCover = (parent: void, args: QueryCoverInput, context: Context) => {
    const { type, content, sort } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    const query: CoverQuery = {
        coverBy: context.user.id,
        isFreeSong: false
    }
    if (type === "SONG_ID") {
        query.songId = new ObjectID(content)
    }
    if (type === "NAME") {
        query.name = { $regex: new RegExp(content || "", "ig") }
    }
    if (type === "POSITION") {
        query.position = content
    }
    return context.db.collection("library").find(query).sort({ _id }).toArray()
}

export const getCover = (parent: void, args: GetCoverInput, context: Context) =>
    context.db.collection("library").findOne({
        coverBy: context.user.id,
        isFreeSong: false,
        _id: new ObjectID(args.coverId)
    })