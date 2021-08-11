import { Context } from "config/types"
import { LikeInput } from "resolvers/app/like/models"
import { ObjectID } from "mongodb"
export const like = async (parent: void, args: LikeInput, context: Context) => {
    const result = await context.db.collection("like").findOne({
        bandId: new ObjectID(args.input.bandId),
        userId: context.user.id
    }).then(x => x !== null)
    if (result) {
        return context.db.collection("like").deleteOne({
            bandId: new ObjectID(args.input.bandId),
            userId: context.user.id
        }).then(({ deletedCount }) => deletedCount === 1)
    } else {
        return context.db.collection("like").insertOne({
            bandId: new ObjectID(args.input.bandId),
            userId: context.user.id
        }).then(({ result }) => result.n === 1)
    }
}