import { ObjectID } from "mongodb"


export interface CreateCommentInput {
    input: {
        comment: {
            content: string
            bandId: ObjectID
        }
    }
}

export interface Comment {
    bandId: ObjectID
    userId: string
    username: string
    content: string
    createdAt: Date
    _id: ObjectID
}