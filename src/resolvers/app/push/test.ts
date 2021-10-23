import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"

const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(
    3,
    (env.PHONE_NUMBER as string).length
)}`
let token = "",
    token1 = ""

describe("Push Service Test", () => {
    before(async () => {
        await Redis.setex(phoneNumber as string, 600, "123456")
        await Redis.setex("+82100000000" as string, 600, "123456")
        const query = `
                mutation{
                    a:register(
                        input: {
                            user:{
                                id: "user1234",
                                password: "user1234",
                                username: "pukuba",
                                type: 1
                            },
                            phoneNumber: "${phoneNumber}",
                            authCode: 123456
                        }
                    )
                    b:register(
                        input: {
                            user: {
                                id:"test1234",
                                password:"test1234",
                                username:"erolf0123",
                                type: 1
                            },
                            phoneNumber: "+82100000000",
                            authCode: 123456
                        }
                    )
                }
                `
        const { body } = await request(app)
            .post("/api")
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ query }))
            .expect(200)
        token = body.data.a
        token1 = body.data.b
    })
    after(async () => {
        const db = (await DB.get()) as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("fcm").deleteMany({}),
        ])
    })
    describe("Mutation updateDeviceToken", () => {
        describe("Success", () => {
            it("should be return true", async () => {
                const query = `
                    mutation{
                        updateDeviceToken(
                            input: {
                                deviceToken: "test1234"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Authorization", token1)
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.updateDeviceToken, true)
            })
        })
    })
})
