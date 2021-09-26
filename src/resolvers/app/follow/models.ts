import { ObjectID } from "mongodb"

export interface FollowInput {
    input: {
        following: string
    }
}

export interface GetFollowerListInput {
    userId: string
}

export interface GetFollowingListInput {
    userId: string
}

export interface Follow {
    userId: string
    following: string
}
