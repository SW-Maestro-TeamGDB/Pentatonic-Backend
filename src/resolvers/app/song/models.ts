import { ObjectID } from "mongodb"
import { File } from "config/types"
import { Band, SessionType } from "resolvers/app/band/models"

export interface Song {
    _id: ObjectID
    name: string
    songImg: URL
    songURI: URL
    genre: SongGenres
    artist: string
    album: string
    level: number
    release: Date
    weeklyChallenge: boolean
    duration: number
    band: Band
}

export interface UploadFreeSongInput {
    input: {
        song: {
            name: string
            songURI: URL
            artist: string
        }
    }
}

export interface QuerySongInput {
    filter: {
        type: "ALL" | "ARTIST" | "NAME",
        level?: number
        genre?: SongGenres
        content?: string
        weeklyChallenge?: boolean
        sort: "DATE_ASC" | "DATE_DESC"
    }
}

export interface GetSongInput {
    songId: ObjectID
}


export interface UploadSongInput {
    input: {
        code: string
        song: {
            name: string
            songImg: URL
            genre: SongGenres
            artist: string
            songURI: URL
            weeklyChallenge: boolean
            level: number
            releaseDate: Date
            album: string
        }
    }
}

export interface DeleteInstrumentInput {
    input: {
        code: string,
        instrument: {
            instId: ObjectID
        }
    }
}

export interface UploadInstrumentInput {
    input: {
        code: string
        instrument: {
            songId: ObjectID
            name: string
            instURI: URL
            position: SessionType
        }
    }
}


export interface DeleteSongInput {
    input: {
        code: string
        song: {
            songId: ObjectID
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
            instURI?: URL
            position?: SessionType
        }
    }
}

export type InstrumentKeys = keyof UploadInstrumentInput["input"]["instrument"]

export interface UpdateSongQurey {
    $set: {
        name?: string
        songImg?: string
        genre?: SongGenres
        artist?: string
        songURI?: string
        weeklyChallenge?: boolean
        level?: number
        releaseDate?: Date
        album?: string
        duration?: number
        position?: SessionType
    }
}

export interface UpdateInstrumentQuery {
    $set: {
        name?: string
        duration?: number
        songId?: ObjectID
        instURI?: string
    }
}

export interface UpdateSongInput {
    input: {
        code: string
        song: {
            songId?: ObjectID
            name?: string
            songImg?: URL
            genre?: SongGenres
            artist?: string
            songURI?: URL
            weeklyChallenge?: boolean
            level?: number
            releaseDate?: Date
            album?: string
        }
    }
}

export type SongKeys = keyof UpdateSongInput["input"]["song"]



export interface UploadDefaultImgInput {
    input: {
        file: Promise<File>
        code: string
    }
}

const SongGenres = {
    HIP_HOP: "HIP_HOP",
    ELECTRONIC: "ELECTRONIC",
    BLUES: "BLUES",
    POP: "POP",
    JAZZ: "JAZZ",
    CALLSICAL: "CALLSICAL",
    ROCK: "ROCK",
    DANCE: "DANCE",
    BALLAD: "BALLAD",
    K_POP: "K_POP",
} as const

export type SongGenres = typeof SongGenres[keyof typeof SongGenres]
export interface Instrument {
    _id: ObjectID
    songId: ObjectID
    instURI: URL
    name: string
    duration: number
}
