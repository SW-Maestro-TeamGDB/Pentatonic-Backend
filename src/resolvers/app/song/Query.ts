import { Context } from "config/types"
import {
    QuerySongInput,
    GetSongInput
} from "resolvers/app/song/models"
import { ObjectID } from "mongodb"

export const querySong = (parent: void, args: QuerySongInput, context: Context) => {
    const { type, content, sort, ...data } = args.filter
    const _id = sort === "DATE_ASC" ? 1 : -1
    if (type === "ALL") {
        return context.db.collection("song").find({ ...data, isFreeSong: false }).sort({ _id }).toArray()
    }
    const query = {
        [type.toLowerCase()]: { $regex: new RegExp(content || "", "ig") },
        ...data,
        isFreeSong: false
    }
    return context.db.collection("song").find(query).sort({ _id }).toArray()
}

export const getSong = (parent: void, args: GetSongInput, context: Context) =>
    context.db.collection("song").findOne({ _id: new ObjectID(args.songId) })