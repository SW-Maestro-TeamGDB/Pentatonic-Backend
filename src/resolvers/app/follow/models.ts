import { ObjectID } from "mongodb"

export interface FollowInput {
    input: {
        following: ObjectID
    }
}