import { Context } from "config/types"
import {
    GetSongByNameInput,
    GetSongByNameQuery,
    GetSongByArtistInput,
    GetSongByArtistQuery,
    GetSongByWeeklyChallengeInput
} from "resolvers/app/song/models"

export const getAllSongs = async (parent: void, args: void, context: Context) => {
    const { db } = context
    return db.collection("song").find({}).toArray()
}

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

export const getSongByWeeklyChallenge = async (parent: void, args: GetSongByWeeklyChallengeInput, context: Context) => {
    const { db } = context
    const { weeklyChallenge } = args.input.song
    return db.collection("song").find({ weeklyChallenge }).toArray()
}