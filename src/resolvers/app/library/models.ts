import { File } from "config/types"
import { ObjectID } from "mongodb"

export interface UploadCoverFileInput {
    input: {
        file: File
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