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

export interface DeleteCommentInput {
    input: {
        comment: {
            commentId: ObjectID
        }
    }
}

export interface UpdateCommentInput {
    input: {
        comment: {
            commentId: ObjectID
            content: string
        }
    }
}

export interface GetCommentsInput {
    bandId: ObjectID
}
