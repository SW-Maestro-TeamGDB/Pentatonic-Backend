import request from "supertest"
import app from "test"

import env from "config/env"
import { deepStrictEqual as equal } from "assert"
import * as redis from "config/connectRedis"
import { Redis } from "config/connectRedis"
import DB from "config/connectDB"
import jwt from "jsonwebtoken"
import { TokenInterface } from "resolvers/app/auth/models"

const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
describe("User auth service test", () => {
    describe("SMS service test", () => {
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
    describe("Register & Login services test", () => {
        after(async () => {
            const db = await DB.get()
            await db.collection("user").deleteOne({ phoneNumber })
        })
        describe("Register", async () => {
            describe("Success", () => {
                it("User register", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "test1234",
                                pw: "test1234",
                                username: "pukuba",
                                phoneNumber: "${phoneNumber}",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.register, true)
                })
            })
            describe("Failure", () => {
                before(async () => {
                    await (redis as Redis).setex(phoneNumber, 600, "")
                })
                it("id already exists", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "test1234",
                                pw: "test1234",
                                username: "erolf0123",
                                phoneNumber: "${phoneNumber}",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다.")
                })
                it("Username already exists", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "erolf0123",
                                pw: "test1234",
                                username: "pukuba",
                                phoneNumber: "${phoneNumber}",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다.")
                })
                it("Phone Number Authentication Expired", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "kkzkk1234",
                                pw: "test1234",
                                username: "kkzkk1234",
                                phoneNumber: "+821000000000",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "휴대번호 인증을 다시해야합니다.")
                })
                it("Invalid Input id", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "test",
                                pw: "test1234",
                                username: "kkzkk1234",
                                phoneNumber: "${phoneNumber}",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다.")
                })
                it("Invalid Input password", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "kkzkk1234",
                                pw: "test",
                                username: "kkzkk1234",
                                phoneNumber: "${phoneNumber}",
                                position: "Piano",
                                level: 2,
                                type: 1
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "pw 가 조건에 맞지 않습니다.")
                })
            })
        })
        describe("Login", () => {
            describe("Success", () => {
                const token: string[] = []
                it("User login", async () => {
                    const query = `
                        mutation{
                            login(
                                id:"test1234",
                                pw:"test1234"
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(typeof body.data.login, "string")
                    token.push(body.data.login)
                    try {
                        const user = jwt.verify(token[0], env.JWT_SECRET) as TokenInterface
                        equal(user.username, "pukuba")
                    } catch (e) {
                        console.log(e)
                    }
                })
            })
            describe("Failure", () => {
                it("ID without", async () => {
                    const query = `
                        mutation{
                            login(
                                id:"kkzkk1234",
                                pw:"test1234"
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "잘못된 아이디 또는 비밀번호를 입력하셨습니다.")
                })
                it("PW without", async () => {
                    const query = `
                        mutation{
                            login(
                                id:"test1234",
                                pw:"kkzkk1234"
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "잘못된 아이디 또는 비밀번호를 입력하셨습니다.")
                })
            })
        })
    })
})