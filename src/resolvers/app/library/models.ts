import { File } from "config/types"
import { ObjectID } from "mongodb"


export interface UpdateCoverQuery {
    $set: {
        name?: string
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