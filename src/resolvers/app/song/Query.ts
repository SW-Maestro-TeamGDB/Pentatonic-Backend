import { Context } from "config/types"

export const getAllSongs = async (parent: void, args: void, context: Context) => {
    return context.db.collection("song").find({}).toArray()
}