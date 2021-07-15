import DataLoader from "dataloader"
import DB from "config/connectDB"
import { Instrument } from "resolvers/app/song/models"
import { ObjectID, Db } from "mongodb"

const batchLoadInstrumentFn = async (songIds: readonly ObjectID[]) => {
    const db = await DB.get() as Db
    const instruments: Instrument[] = await db.collection("songInstrument").find({ songId: { $in: songIds } }).toArray()
    const table = new Map()
    const resultArray: Instrument[][] = Array.from(Array(songIds.length), () => [])
    songIds.forEach((id, index) => { table.set(id.toString(), index) })
    instruments.forEach((instrument: Instrument) => resultArray[table.get(instrument.songId.toString())].push(instrument))
    return resultArray
}

export const instrumentsLoader = () => new DataLoader(batchLoadInstrumentFn)