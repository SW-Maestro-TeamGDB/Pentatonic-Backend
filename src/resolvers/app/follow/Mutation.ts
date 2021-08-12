import { Context } from "config/types"
import { FollowInput } from "resolvers/app/follow/models"
export const follow = async (parent: void, args: FollowInput, context: Context) => {
    const result = await context.db.collection("follow").findOne({
        following: args.input.following,
        follower: context.user.id
    })
    if (result === null) {
        return context.db.collection("follow").insertOne({
            following: args.input.following,
            follower: context.user.id
        }).then(({ result }) => result.n === 1)
    } else {
        return context.db.collection("follow").deleteOne({
            following: args.input.following,
            follower: context.user.id
        }).then(({ result }) => result.n === 1)
    }
}