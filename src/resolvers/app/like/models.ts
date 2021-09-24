import { ObjectID } from "mongodb"

export interface LikeStatusInput {
    bandId: ObjectID
}

export interface LikeInput {
    input: {
        band: LikeStatusInput
    }
}

export interface LikeStatusBatch {
    bandId: ObjectID
    userId: string
}
