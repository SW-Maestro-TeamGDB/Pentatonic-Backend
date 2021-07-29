import DataLoader from "dataloader"
import DB from "config/connectDB"
import { Instrument } from "resolvers/app/song/models"
import { Song } from "resolvers/app/song/models"
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


export const songsLoader = () => new DataLoader(batchLoadSongFn)
export const instrumentsLoader = () => new DataLoader(batchLoadInstrumentFn)