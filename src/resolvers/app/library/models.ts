import { File } from "config/types"
import { ObjectID } from "mongodb"


export interface GetCoverInput {
    coverId: ObjectID
}

export interface QueryCoverInput {
    filter: {
        type: "ALL" | "NAME" | "SONG_ID"
        content?: string
        sort: "DATE_DESC" | "DATE_ASC"
    }
}

export interface UploadCoverFileInput {
    input: {
        file: File
    }
}

export interface UpdateCoverInput {
    input: {
        cover: {
            coverId: ObjectID
            name: string
        }
    }
}

export interface UploadCoverInput {
    input: {
        cover: {
            songId: ObjectID
            name: string
            coverURI: URL
        }
    }
}

export interface Cover {
    songId: ObjectID
    creatorId: string
    coverURI: URL
    name: string
    duration: number
    _id: ObjectID
}

export interface DeleteCoverInput {
    input: {
        cover: {
            coverId: ObjectID
        }
    }
}



export interface CoverQuery {
    creatorId: string
    name?: { "$regex"?: RegExp }
    songId?: ObjectID
}