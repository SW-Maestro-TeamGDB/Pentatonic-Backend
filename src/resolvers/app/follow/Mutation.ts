import { Context } from "config/types"
import { FollowInput } from "resolvers/app/follow/models"
import { ApolloError } from "apollo-server-express"

/**
 * 팔로우 상태 반전
 * @param args.input.following        내가 팔로우할 사람
 */
export const follow = async (
    parent: void,
    args: FollowInput,
    context: Context
) => {
    if (context.user.id === args.input.following) {
        return new ApolloError("자기 자신을 팔로잉할 수 없습니다")
    }
    const user = await context.db
        .collection("user")
        .findOne({ id: args.input.following })
    if (user === null) {
        return new ApolloError("존재하지 않는 유저입니다")
    }
    const result = await context.db
        .collection("follow")
        .find({
            userId: context.user.id,
            following: args.input.following,
        })
        .count()
    if (result === 0) {
        return context.db
            .collection("follow")
            .insertOne({
                userId: context.user.id,
                following: args.input.following,
            })
            .then(({ result }) => result.n === 1)
    } else {
        return context.db
            .collection("follow")
            .deleteOne({
                userId: context.user.id,
                following: args.input.following,
            })
            .then(({ result }) => result.n === 1)
    }
}
