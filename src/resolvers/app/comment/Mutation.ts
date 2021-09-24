import { ObjectID } from "mongodb"
import {
    CreateCommentInput,
    DeleteCommentInput,
    UpdateCommentInput,
} from "resolvers/app/comment/models"
import { Context } from "config/types"
import { ApolloError } from "apollo-server-express"

export const createComment = async (
    parent: void,
    args: CreateCommentInput,
    context: Context
) =>
    await context.db
        .collection("comment")
        .insertOne({
            userId: context.user.id,
            bandId: new ObjectID(args.input.comment.bandId),
            content: args.input.comment.content,
            createdAt: new Date(),
        })
        .then(({ ops }) => ops[0])

export const deleteComment = async (
    parent: void,
    args: DeleteCommentInput,
    context: Context
) => {
    const { commentId } = args.input.comment
    const res = await context.db
        .collection("comment")
        .deleteOne({
            userId: context.user.id,
            _id: new ObjectID(commentId),
        })
        .then(({ result }) => result.n === 1)
    if (res) {
        return true
    } else {
        throw new ApolloError(
            "댓글이 존재하지 않거나 내가 작성한 댓글이 아닙니다"
        )
    }
}

export const updateComment = async (
    parent: void,
    args: UpdateCommentInput,
    context: Context
) => {
    const { commentId, content } = args.input.comment
    const res = await context.db
        .collection("comment")
        .findOneAndUpdate(
            {
                userId: context.user.id,
                _id: new ObjectID(commentId),
            },
            {
                $set: {
                    content,
                },
            },
            { returnDocument: "after" }
        )
        .then(({ value }) => value)
    if (res) {
        return res
    } else {
        throw new ApolloError(
            "댓글이 존재하지 않거나 내가 작성한 댓글이 아닙니다"
        )
    }
}
