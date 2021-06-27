import request from "supertest"
import app from "test"

import env from "config/env"
import { deepStrictEqual as equal } from "assert"
import * as redis from "config/connectRedis"
import { Redis } from "config/connectRedis"
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
describe("Auth service test", () => {
    describe("SMS test", () => {
        describe("Send SMS test", () => {
            // describe("Success", () => {
            //     it("Submit SMS", async () => {
            //         const query = `
            //             mutation{ 
            //                 sendSMS(
            //                     phoneNumber: "${phoneNumber}"
            //                 )
            //             }`
            //         const { body } = await request(app)
            //             .post("/api")
            //             .set({ "Content-Type": "application/json" })
            //             .send(JSON.stringify({ query }))
            //             .expect(200)
            //         equal(body.data.sendSMS, true)
            //     })
            // })
            describe("Failure", () => {
                it("PhoneNumber Format Error", async () => {
                    const query = `
                        mutation{
                            sendSMS(
                                phoneNumber:"01000000000"
                            )
                        }
                    `
                    await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(400)
                })
                it("not a Korean mobile number", async () => {
                    const query = `
                        mutation{
                            sendSMS(
                                phoneNumber:"+12319235123"
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "한국 번호가 아닙니다")
                })
            })
        })
        describe("Check SMS", () => {
            before("Set SMS authenticationNumber", async () => {
                await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 123432)
            })
            describe("Success", () => {
                it("Valid Authentication Number", async () => {
                    const query = `
                        mutation{
                            checkSMS(
                                phoneNumber:"${phoneNumber}",
                                authenticationNumber: 123432
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.checkSMS, true)
                })
            })
            describe("Failure", () => {
                it("Invalid authentication number", async () => {
                    const query = `
                        mutation{
                            checkSMS(
                                phoneNumber:"${phoneNumber}",
                                authenticationNumber: 123432
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.checkSMS, false)
                })
                it("Unauthenticated Phone Number", async () => {
                    const query = `
                        mutation{
                            checkSMS(
                                phoneNumber:"+821000000000",
                                authenticationNumber: 123432
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.checkSMS, false)
                })
                it("Invalid Type", async () => {
                    const query = `
                        mutation{
                            checkSMS(
                                phoneNumber:"+821000000000",
                                authenticationNumber: "123432"
                            )
                        }
                    `
                    await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(400)
                })
            })
        })
    })
})