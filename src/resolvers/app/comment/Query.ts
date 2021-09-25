import { Context } from "config/types"
import {
    GetCommentsInput,
    QueryCommentsInput,
    CommentQuery,
} from "resolvers/app/comment/models"
import { ObjectID } from "mongodb"

export const getComments = async (
    parent: void,
    args: GetCommentsInput,
    context: Context
) =>
    context.db
        .collection("comment")
        .find({
            bandId: new ObjectID(args.bandId),
        })
        .sort({ createdAt: -1 })
        .toArray()

export const queryComments = async (
    parent: void,
    args: QueryCommentsInput,
    context: Context
) => {
    const _id = args.sort === "DATE_ASC" ? 1 : -1
    const query: CommentQuery = {
        bandId: new ObjectID(args.bandId),
    }
    if (args.after) {
        query._id = { [_id === -1 ? "$lt" : "$gt"]: new ObjectID(args.after) }
    }
    const comments = await context.db
        .collection("comment")
        .find(query)
        .sort({ _id })
        .limit(args.first)
        .toArray()
    return {
        comments,
        pageInfo: {
            hasNextPage: comments.length === args.first,
            endCursor: comments[comments.length - 1]?._id,
        },
    }
}
