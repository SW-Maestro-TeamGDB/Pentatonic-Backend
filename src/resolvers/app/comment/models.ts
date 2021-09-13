import { ObjectID } from "mongodb"


export interface CreateCommentInput {
    input: {
        band: {
            bandId: ObjectID
        }
        comment: {
            content: string
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