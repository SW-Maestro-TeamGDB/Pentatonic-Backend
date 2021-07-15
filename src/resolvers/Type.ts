import {
    Song as SongInterface,
    Instrument as InstrumentInterface
} from "resolvers/app/song/models"
import { Context } from "config/types"

export const Song = {
    id: (parent: SongInterface) => parent._id,
    instrument: (parent: SongInterface, args: void, context: Context) => {
        return context.loaders.instrumentsLoader.load(parent._id)
    }
}

export const Instrument = {
    id: (parent: InstrumentInterface) => parent._id
}