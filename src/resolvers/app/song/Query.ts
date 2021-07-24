import { Context } from "config/types"
import {
    GetSongByNameInput,
    GetSongByNameQuery,
    GetSongByArtistInput,
    GetSongByArtistQuery,
    GetSongByWeeklyChallengeInput,
    getSongBySongIdInput
} from "resolvers/app/song/models"
import { ObjectID } from "mongodb"

export const getAllSongs = async (parent: void, args: void, context: Context) =>
    context.db.collection("song").find({}).toArray()

export const getSongBySongId = async (parent: void, args: getSongBySongIdInput, context: Context) =>
    context.db.collection("song").findOne({
        _id: new ObjectID(args.input.song.songId)
    })
export const getSongByName = async (parent: void, args: GetSongByNameInput, context: Context) => {
    const { db } = context
    const query: GetSongByNameQuery = {
        name: { $regex: new RegExp(args.input.song.name, "ig") }
    }
    if (args.input.song.genre !== undefined) {
        query.genre = args.input.song.genre
    }
    if (args.input.song.level !== undefined) {
        query.level = args.input.song.level
    }
    return db.collection("song").find(query).toArray()
}

export const getSongByArtist = async (parent: void, args: GetSongByArtistInput, context: Context) => {
    const { db } = context
    const query: GetSongByArtistQuery = {
        artist: { $regex: new RegExp(args.input.song.artist, "ig") }
    }
    if (args.input.song.genre !== undefined) {
        query.genre = args.input.song.genre
    }
    if (args.input.song.level !== undefined) {
        query.level = args.input.song.level
    }
    return db.collection("song").find(query).toArray()
}

export const getSongByWeeklyChallenge = async (parent: void, args: GetSongByWeeklyChallengeInput, context: Context) =>
    context.db.collection("song").find({
        weeklyChallenge: args.input.song.weeklyChallenge
    }).toArray()
