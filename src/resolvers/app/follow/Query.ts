import {
    GetFollowerListInput,
    GetFollowingListInput
} from "resolvers/app/follow/models"
import {
    Context
} from "config/types"
export const getFollowerList = async (parent: void, args: GetFollowerListInput, context: Context) => {
    const userIds = await context.db.collection("follow").find({
        following: args.userId
    }).toArray().then(a => a.map(x => x.following))
    return context.db.collection("user").find({
        id: { $in: userIds }
    }).toArray()
}

export const getFollowingList = async (parnet: void, args: GetFollowingListInput, context: Context) => {
    const userIds = await context.db.collection("follow").find({
        userId: args.userId
    }).toArray().then(a => a.map(x => x.userId))
    return context.db.collection("user").find({
        id: { $in: userIds }
    }).toArray()
}