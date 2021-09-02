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
    }).toArray().then(a => a.map(x => x.userId))
    return context.db.collection("user").find({
        id: { $in: userIds }
    }).toArray()
}

export const getFollowingList = async (parnet: void, args: GetFollowingListInput, context: Context) => {
    const userIds = await context.db.collection("follow").find({
        userId: args.userId
    }).toArray().then(a => a.map(x => x.following))
    return context.db.collection("user").find({
        id: { $in: userIds }
    }).toArray()
}

export const getRankedUser = async (parent: void, args: void, context: Context) => {
    const followCounts = await context.db.collection("follow").aggregate([
        {
            $group: {
                _id: "$following",
                count: { $sum: 1 }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]).limit(100).toArray()
    const userIds = followCounts.map(({ _id }) => _id)
    const users = await context.db.collection("user").find({ id: { $in: userIds } }).toArray()
    const mp = followCounts.reduce((acc, cur, index) => {
        acc[cur._id] = index
        return acc
    }, {})
    return users.sort((a, b) => mp[a.id] - mp[b.id])
}