import { Context } from "config/types"
import { UpdateDeviceTokenInput } from "resolvers/app/push/models"

export const updateDeviceToken = async (
    parent: void,
    args: UpdateDeviceTokenInput,
    context: Context
) => {
    const { deviceToken } = args.input
    await context.db
        .collection("fcm")
        .updateOne(
            { userId: context.user.id },
            { $set: { userId: context.user.id, deviceToken } },
            { upsert: true }
        )
    return true
}
