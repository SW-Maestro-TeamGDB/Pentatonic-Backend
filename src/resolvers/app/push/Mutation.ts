import { Context } from "config/types"
import { UpdateDeviceTokenInput } from "resolvers/app/push/models"

export const updateDeviceToken = async (
    parent: void,
    args: UpdateDeviceTokenInput,
    context: Context
) => {
    const { token } = args.input
    await context.db
        .collection("fcm")
        .updateOne(
            { userId: context.user.id },
            { $set: { userId: context.user.id, token } },
            { upsert: true }
        )
    return true
}
