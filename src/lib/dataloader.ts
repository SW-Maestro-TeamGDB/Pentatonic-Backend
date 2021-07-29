import DataLoader from "dataloader"
import DB from "config/connectDB"
import { Instrument } from "resolvers/app/song/models"
import { Song } from "resolvers/app/song/models"
import { User } from "resolvers/app/auth/models"
import { ObjectID, Db } from "mongodb"

const batchLoadInstrumentFn = async (songIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const instruments: Instrument[] = await db.collection("instrument").find({ songId: { $in: songIds } }).toArray()
    const table = new Map()
    const resultArray: Instrument[][] = Array.from(Array(songIds.length), () => [])
    songIds.forEach((id, index) => { table.set(id.toString(), index) })
    instruments.forEach((instrument: Instrument) => resultArray[table.get(instrument.songId.toString())].push(instrument))
    return resultArray
}


const batchLoadSongFn = async (songIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const songs: Song[] = await db.collection("song").find({ _id: { $in: songIds } }).toArray()
    const table = new Map()
    const resultArray: Song[] = []
    songIds.forEach((id, index) => {
        if (table.get(id.toString()) === undefined) {
            table.set(id.toString(), [index])
        }
        else {
            table.get(id.toString()).push(index)
        }
    })
    songs.forEach((song: Song) => {
        table.get(song._id.toString()).forEach((x: number) => {
            resultArray[x] = song
        })
    })
    return resultArray
}

const batchLoadUserFn1 = async (userIds: readonly string[]) => {
    const db = await DB.get() as Db
    const users: User[] = await db.collection("user").find({ id: { $in: userIds } }).toArray()
    const table = new Map()
    const resultArray: User[] = []
    userIds.forEach((id, index) => {
        if (table.get(id) === undefined) {
            table.set(id, [index])
        }
        else {
            table.get(id).push(index)
        }
    })
    users.forEach((user: User) => {
        table.get(user.id).forEach((x: number) => {
            resultArray[x] = user
        })
    })
    return resultArray
}

export const userLoader1 = () => new DataLoader(batchLoadUserFn1)
export const songsLoader = () => new DataLoader(batchLoadSongFn)
export const instrumentsLoader = () => new DataLoader(batchLoadInstrumentFn)