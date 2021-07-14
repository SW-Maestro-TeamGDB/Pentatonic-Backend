import { ObjectID } from "mongodb"
import { File } from "config/types"

interface InputSong {
    songURI: URL
    name: string
    songImg: URL
    genre: SongGenres
    artist: string

    weeklyChallenge: boolean
    level: number
}

interface InputCode {
    code: string
}

export interface InputUploadSong extends InputCode {
    song: InputSong
}

export interface Song extends InputSong {
    _id: ObjectID
    playTime: number
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