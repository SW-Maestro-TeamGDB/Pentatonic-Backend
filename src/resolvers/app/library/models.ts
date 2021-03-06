import { File } from "config/types"
import { ObjectID } from "mongodb"
import { SessionType } from "resolvers/app/band/models"

export interface GetCoverInput {
    coverId: ObjectID
}

export interface QueryCoverInput {
    filter: {
        type: "ALL" | "NAME" | "SONG_ID" | "POSITION"
        content?: string
        sort: "DATE_DESC" | "DATE_ASC"
    }
}

export interface UploadCoverFileInput {
    input: {
        file: Promise<File>
    }
}

export interface UpdateCoverInput {
    input: {
        cover: {
            coverId: ObjectID
            name: string
            position: string
        }
    }
}

export interface UploadCoverInput {
    input: {
        cover: {
            songId: ObjectID
            name: string
            coverURI: URL
            position: SessionType
        }
        filter: {
            syncDelay: number
            reverb: number
        }
    }
}

export interface ChangeCoverQuery {
    $set: {
        name?: string
        position?: string
    }
}

export interface Cover {
    songId: ObjectID
    coverBy: string
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
    coverBy: string
    isFreeSong?: boolean
    name?: { $regex?: RegExp }
    songId?: ObjectID
    position?: string
}
