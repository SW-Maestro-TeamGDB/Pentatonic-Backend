import { ObjectID } from "mongodb"

export interface SessionInformation {
    vocal?: number
    acousticGuitar?: number
    electricGuitar?: number
    base?: number
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
        coverId: ObjectID
    }
}



export interface Band {
    _id: ObjectID
    songId: ObjectID
}