import { ObjectID } from "mongodb"

export interface FollowInput {
    input: {
        following: ObjectID
    }
}

export interface GetFollowerListInput {
    userId: string
}

export interface GetFollowingListInput {
    userId: string
}