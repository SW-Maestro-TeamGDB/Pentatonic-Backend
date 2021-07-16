import { ObjectID } from "mongodb"
import { File } from "config/types"

interface InputSong {
    songURI: URL
    name: string
    songImg: URL
    genre: SongGenres
    release: Date
    artist: string
    album: string

    weeklyChallenge: boolean
    level: number

    id?: ObjectID

}
export type SongKeys = keyof InputSong
interface InputCode {
    code: string
}

export interface InputUploadSong extends InputCode {
    song: InputSong
}


export interface Song extends InputSong {
    _id: ObjectID
    playTime: number
    instrument: string[]
}

export interface InputUploadDefaultImg extends InputCode {
    file: File
}

const SongGenres = {
    Pop: "Pop",
    Rock: "Rock",
    Rap: "Rap",
    Ballad: "Ballad"
} as const

type SongGenres = typeof SongGenres[keyof typeof SongGenres]
export interface Instrument {
    _id: ObjectID
    songId: ObjectID
    instrumentURI: URL
    name: string
    duration: number
}