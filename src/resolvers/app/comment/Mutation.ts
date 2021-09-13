import { ObjectID } from "mongodb"
import { CreateCommentInput } from "resolvers/app/comment/models"
import { Context } from "config/types"

export const createComment = async (parent: void, args: CreateCommentInput, context: Context) =>
    context.db.collection("comment").insertOne({
        userId: context.user.id,
        postId: new ObjectID(args.input.band.bandId),
        content: args.input.comment.content,
        createdAt: new Date(),
    }).then(({ ops }) => ops[0])
