import { Context } from "config/types"
import { LikeStatusInput } from "resolvers/app/like/models"
import { ObjectID } from "mongodb"
export const likeStatus = (parent: void, args: LikeStatusInput, context: Context) =>
    context.db.collection("like").find({
        bandId: new ObjectID(args.bandId),
        userId: context.user.id
    }).count().then(x => x === 1)