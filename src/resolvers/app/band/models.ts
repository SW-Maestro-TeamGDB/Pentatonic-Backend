import { ObjectID } from "mongodb"

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
        type: "NAME" | "INTRODUCE" | "CREATOR_ID"
        content?: string
        sort: "DATE_DESC" | "DATE_ASC"
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
}