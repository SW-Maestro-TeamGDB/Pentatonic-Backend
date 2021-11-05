import axios from "axios"
import { PaymentInput } from "resolvers/app/payment/models"
import { Context } from "config/types"
import env from "config/env"

const iamport = {
    imp_key: env.IMP_KEY as string,
    imp_secret: env.IMP_SECRET as string,
}
export const payment = async (
    parent: void,
    args: PaymentInput,
    context: Context
) => {
    const token = (await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: iamport,
    })) as any
    try {
        const res = (await axios({
            url: `https://api.iamport.kr/payments/${args.input.impUid}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token.data.response.access_token,
            },
        })) as any
        if (res.data.code === 0 && res.data.message === null) {
            await context.db.collection("user").updateOne(
                {
                    id: context.user.id,
                },
                { $set: { prime: true } }
            )
            return true
        }
        return false
    } catch (e) {
        return false
    }
}
