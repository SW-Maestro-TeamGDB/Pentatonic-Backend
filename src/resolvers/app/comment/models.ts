import { ObjectID } from "mongodb"
import { Cursor } from "config/types"

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

export interface QueryCommentsInput extends Cursor {
    bandId: ObjectID
    sort: "DATE_DESC" | "DATE_ASC"
}

export interface CommentQuery {
    _id?: {
        $gt?: ObjectID
        $lt?: ObjectID
    }
    bandId: ObjectID
}
