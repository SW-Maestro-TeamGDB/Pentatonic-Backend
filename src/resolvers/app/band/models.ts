import { ObjectID } from "mongodb"
import { Cursor } from "config/types"

export interface SessionInformation {
    vocal?: number
    acousticGuitar?: number
    electricGuitar?: number
    bass?: number
    drum?: number
    keyboard?: number
    violin?: number
    cello?: number
    gayageum?: number
    haegeum?: number
    geomungo?: number
}

const SessionDirection = {
    VOCAL: "VOCAL",
    ACOUSTIC_GUITAR: "ACOUSTIC_GUITAR",
    ELECTRIC_GUITAR: "ELECTRIC_GUITAR",
    BASS: "BASS",
    DRUM: "DRUM",
    KEYBOARD: "KEYBOARD",
    VIOLIN: "VIOLIN",
    CELLO: "CELLO",
    GAYAGEUM: "GAYAGEUM",
    HAEGEUM: "HAEGEUM",
    GEOMUNGO: "GEOMUNGO",
} as const

export type SessionType = typeof SessionDirection[keyof typeof SessionDirection]

export interface SessionConfig {
    session: keyof SessionInformation
    maxMember: number
}

export interface CreateBandInput {
    input: {
        band: {
            name: string
            songId: ObjectID
            backGroundURI: URL
            introduce: string
            isSoloBand: boolean
        }
        sessionConfig: SessionConfig[]
    }
}

export interface Band {
    _id: ObjectID
    songId: ObjectID
    creatorId: string
    sessions: SessionInformation
}

export interface Session {
    bandId: ObjectID
    coverId: ObjectID
    _id: ObjectID
    coverURI: URL
}

export interface BatchSesssion {
    position?: keyof SessionInformation
    maxMember?: number
    cover?: Session[]
}

export interface UpdateBandInput {
    input: {
        band: {
            bandId: ObjectID
            name?: string
            creatorId?: string
            introduce?: string
            backGroundURI?: URL
        }
        sessionConfig: {
            session: keyof SessionInformation
            maxMember: number
        }[]
    }
}

export interface UpdateBandQuery {
    $set: {
        sessions?: SessionInformation
        name?: string
        creatorId?: string
        introduce?: string
        backGroundURI?: URL
    }
}

export interface JoinBandInput {
    input: {
        band: {
            bandId: ObjectID
        }
        session: {
            coverId: ObjectID
            position: keyof SessionInformation
        }
    }
}

export interface OutBandInput {
    input: {
        band: {
            bandId: ObjectID
        }
        session: {
            coverId: ObjectID
        }
    }
}

export interface DeleteBandInput {
    input: {
        band: {
            bandId: ObjectID
        }
    }
}

export interface QueryBandInput {
    filter: {
        type: "NAME" | "INTRODUCE" | "CREATOR_ID" | "ALL" | "SONG_NAME"
        content?: string
        sort: "DATE_DESC" | "DATE_ASC"
        isSoloBand?: boolean
        genre: string // genre
        level: number
    }
}

export interface SongQuery {
    songId?: {
        $in: ObjectID[]
    }
}

export interface BandQuery {
    name?: {
        $regex?: RegExp
    }
    introduce?: {
        $regex?: RegExp
    }
    creatorId?: {
        $regex?: RegExp
    }
    isSoloBand?: boolean
    songId?: {
        $in: ObjectID[]
    }
    _id?: {
        $lt?: ObjectID
        $gt?: ObjectID
    }
}

export interface DefaultBandQuery {
    $or?: BandQuery[]
}

export interface GetBandInput {
    bandId: ObjectID
}

export interface QueryBandsInput extends QueryBandInput, Cursor {}
