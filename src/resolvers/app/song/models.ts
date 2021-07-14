import { ObjectID } from "mongodb"

export interface InputSong {
    songURI: URL
    name: string
    songImg: URL
    genre: SongGenres
    artist: string

    weeklyChallenge: boolean
    level: number
}

export interface Song extends InputSong {
    _id: ObjectID
    playTime: number
}


const SongGenres = {
    Pop: "Pop",
    Rock: "Rock",
    Rap: "Rap",
    Ballad: "Ballad"
} as const

type SongGenres = typeof SongGenres[keyof typeof SongGenres]