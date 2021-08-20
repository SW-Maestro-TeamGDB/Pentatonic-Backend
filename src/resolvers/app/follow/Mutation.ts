import { Context } from "config/types"
import { FollowInput } from "resolvers/app/follow/models"

/**
 * 팔로우 상태 반전
 * @param args.input.following        내가 팔로우할 사람  
 */
export const follow = async (parent: void, args: FollowInput, context: Context) => {
    const result = await context.db.collection("follow").find({
        userId: args.input.following,
        following: context.user.id
    }).count()
    if (result === 0) {
        return context.db.collection("follow").insertOne({
            userId: args.input.following,
            following: context.user.id
        }).then(({ result }) => result.n === 1)
    } else {
        return context.db.collection("follow").deleteOne({
            userId: args.input.following,
            following: context.user.id
        }).then(({ result }) => result.n === 1)
    }
}