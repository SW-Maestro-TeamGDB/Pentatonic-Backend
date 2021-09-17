import { LikeInput } from "resolvers/app/like/models"
import { ObjectID } from "mongodb"
import { Context } from "config/types"

export const like = async (parent: void, args: LikeInput, context: Context) => {
    const result = await context.db.collection("like").findOne({
        bandId: new ObjectID(args.input.band.bandId),
        userId: context.user.id
    }).then(x => x !== null)
    if (result) {
        const [res] = await Promise.all([
            context.db.collection("like").deleteOne({
                bandId: new ObjectID(args.input.band.bandId),
                userId: context.user.id
            }).then(({ deletedCount }) => deletedCount === 1),
            context.db.collection("trend").deleteOne({
                bandId: new ObjectID(args.input.band.bandId),
                userId: context.user.id
            })
        ])
        return res
    } else {
        const [res] = await Promise.all([
            context.db.collection("like").insertOne({
                bandId: new ObjectID(args.input.band.bandId),
                userId: context.user.id
            }).then(({ result }) => result.n === 1),
            context.db.collection("trend").insertOne({
                createdAt: new Date(),
                bandId: new ObjectID(args.input.band.bandId),
                userId: context.user.id
            })
        ])
        return res
    }
}