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