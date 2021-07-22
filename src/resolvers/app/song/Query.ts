import { Context } from "config/types"
import {
    GetSongByNameInput,
    GetSongByNameQuery,
    GetSongByArtistInput,
    GetSongByArtistQuery
} from "resolvers/app/song/models"

export const getAllSongs = async (parent: void, args: void, context: Context) => {
    const { db } = context
    return db.collection("song").find({}).toArray()
}

export const getSongByName = async (parent: void, args: GetSongByNameInput, context: Context) => {
    const { db } = context
    const query: GetSongByNameQuery = {
        name: { $regex: new RegExp(args.input.name, "ig") }
    }
    if (args.input.genre !== undefined) {
        query.genre = args.input.genre
    }
    if (args.input.level !== undefined) {
        query.level = args.input.level
    }
    return await db.collection("song").find(query).toArray()
}

export const getSongByArtist = async (parent: void, args: GetSongByArtistInput, context: Context) => {
    const { db } = context
    const query: GetSongByArtistQuery = {
        artist: { $regex: new RegExp(args.input.artist, "ig") }
    }
    if (args.input.genre !== undefined) {
        query.genre = args.input.genre
    }
    if (args.input.level !== undefined) {
        query.level = args.input.level
    }
    return await db.collection("song").find(query).toArray()
}