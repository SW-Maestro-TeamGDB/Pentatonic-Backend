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

export interface GetSongByWeeklyChallengeInput {
    input: {
        song: {
            weeklyChallenge: boolean
        }
    }
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
        }
    }
}

export interface GetSongByNameInput {
    input: {
        song: {
            name: string
            level: number
            genre: string
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

export interface GetSongByArtistInput {
    input: {
        song: {
            artist: string
            genre?: string
            level?: number
        }
    }
}

export interface GetSongByArtistQuery {
    artist: {
        $regex: RegExp
    }
    genre?: string
    level?: number
}

export interface GetSongByNameQuery {
    name: {
        $regex: RegExp
    }
    genre?: string
    level?: number
}

export interface UpdateInstrumentInput {
    input: {
        code: string
        instrument: {
            instId?: ObjectID
            songId?: ObjectID
            name?: string
            instURI?: URL
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
    instURI: URL
    name: string
    duration: number
}


export interface getSongBySongIdInput {
    input: {
        song: {
            songId: ObjectID
        }
    }
}