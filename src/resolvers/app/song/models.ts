import { ObjectID } from "mongodb"
import { File } from "config/types"

export interface Song {
    _id: ObjectID
    name: string
    songImg: URL
    songURI: URL
    genre: string
    artist: string
    album: string
    level: number
    release: Date
    weeklyChallenge: boolean
    duration: number
}

export interface UploadSongInput {
    input: {
        code: string
        song: {
            name: string
            songImg: URL
            genre: string
            artist: string
            songURI: URL
            weeklyChallenge: boolean
            level: number
            release: Date
            album: string
        }
    }
}

export interface UploadInstrumentInput {
    input: {
        code: string
        instrument: {
            songId: ObjectID
            name: string
            instrumentURI: URL
        }
    }
}

export interface UpdateInstrumentInput {
    input: {
        code: string
        instrument: {
            instId?: ObjectID
            songId?: ObjectID
            name?: string
            instrumentURI?: URL
        }
    }
}

export type InstrumentKeys = keyof UploadInstrumentInput["input"]["instrument"]

export interface UpdateSongInput {
    input: {
        code: string
        song: {
            songId: ObjectID
            name?: string
            songImg?: URL
            genre?: SongGenres
            artist?: string
            songURI?: URL
            weeklyChallenge?: boolean
            level?: number
            release?: Date
            album?: string
        }
    }
}

export type SongKeys = keyof UpdateSongInput["input"]["song"]



export interface UploadDefaultImgInput {
    input: {
        file: File
        code: string
    }
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