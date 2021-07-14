import { Song as SongInterface } from "resolvers/app/song/models"

export const Song = {
    id: (parent: SongInterface) => parent._id
}