import { ObjectID } from "mongodb"

export interface LikeStatusInput {
    bandId: ObjectID
}

export interface LikeInput {
    input: LikeStatusInput
}