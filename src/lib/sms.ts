import env from "config/env"
import crypto from "crypto-js"
import fetch from "node-fetch"
const makeSignature = (timeStamp: string) => {
    const hmac = crypto.algo.HMAC.create(crypto.algo.SHA256, env.NCP_SECRET_KEY as string)
    hmac.update("POST")
    hmac.update(" ")
    hmac.update(`/sms/v2/services/${env.SMS_KEY}/messages`)
    hmac.update("\n")
    hmac.update(timeStamp)
    hmac.update("\n")
    hmac.update(env.NCP_ACCESS_KEY as string)

    const hash = hmac.finalize()
    return hash.toString(crypto.enc.Base64)
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

export const smsRequest = async (smsNumber: string) => {
    const randNumber = rand(100000, 999999)
    const timeStamp = Date.now().toString()
    try {
        const result = await fetch(`https://sens.apigw.ntruss.com/sms/v2/services/${env.SMS_KEY}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "x-ncp-iam-access-key": env.NCP_ACCESS_KEY as string,
                "x-ncp-apigw-timestamp": timeStamp,
                "x-ncp-apigw-signature-v2": makeSignature(timeStamp)
            },
            body: JSON.stringify({
                type: "SMS",
                countryCode: "82",
                from: env.PHONE_NUMBER as string,
                contentType: "COMM",
                content: `[Pentatonic] 본인확인 인증번호 \n[${randNumber}]를 화면에 입력해주세요`,
                messages: [{
                    to: smsNumber
                }]
            })
        })
        const resultJson = await result.json()
        if (resultJson.statusName === "success") {
            return randNumber
        }
        return false
    } catch (e) {
        console.log(e)
        return false
    }
}

export const changePhoneNumber = (phoneNumber: string) => `010${phoneNumber.slice(5, phoneNumber.length)}`