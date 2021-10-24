import axios from "axios"
import { PaymentInput } from "resolvers/app/payment/models"
import { Context } from "config/types"
import env from "config/env"
import { rand, changePhoneNumber } from "lib"
import { contentType } from "mime-types"

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
    const uid = `${Date.now()}-${rand(100000, 999999)}`
    try {
        const res = await axios({
            url: "https://api.iamport.kr/subscribe/payments/onetime",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token.data.response.access_token,
            },
            data: {
                merchant_uid: uid,
                amount: 3900,
                name: "펜타토닉 프리미엄 회원",
                card_number: args.input.cardNumber,
                expiry: args.input.expiry,
                birth: args.input.birth,
                buyer_name: args.input.buyerName,
                buyer_email: args.input.buyerEmail,
                buyer_tel: "buyer_tel",
                pwd_2digit: args.input.password2Digit,
            },
        })
        if (res.status === 200) {
            await context.db.collection("user").updateOne(
                {
                    id: context.user.id,
                },
                { $set: { prime: true } }
            )
            return true
        }
    } catch (e) {
        return false
    }
}
