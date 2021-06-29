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
            describe("Success", () => {
                it("Submit SMS", async () => {
                    const query = `
                        mutation{ 
                            registerSMSSend(
                                phone:{
                                    phoneNumber: "${phoneNumber}"
                                }
                            )
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.registerSMSSend, true)
                })
            })
            describe("Failure", () => {
                before(async () => {
                    const db = await DB.get()
                    await db.collection("user").insertOne({ phoneNumber: "+821000000000" })
                })
                after(async () => {
                    const db = await DB.get()
                    await db.collection("user").deleteOne({ phoneNumber: "+821000000000" })
                })
                it("PhoneNumber Format Error", async () => {
                    const query = `
                        mutation{
                            registerSMSSend(
                                phone:{
                                    phoneNumber:"01000000000"
                                }
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
                            registerSMSSend(
                                phone:{
                                    phoneNumber:"+12319235123"
                                }
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
                it("Phone number already exists", async () => {
                    const query = `
                        mutation{
                            registerSMSSend(
                                phone:{
                                    phoneNumber:"+821000000000"
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "이미 해당 전화번호로 가입한 유저가 있습니다")
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
                            registerSMSCheck(
                                phone:{
                                    phoneNumber:"${phoneNumber}",
                                    authenticationNumber: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.registerSMSCheck, true)
                })
            })
            describe("Failure", () => {
                it("Invalid authentication number", async () => {
                    const query = `
                        mutation{
                            registerSMSCheck(
                                phone:{
                                    phoneNumber:"${phoneNumber}",
                                    authenticationNumber: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.registerSMSCheck, false)
                })
                it("Unauthenticated Phone Number", async () => {
                    const query = `
                        mutation{
                            registerSMSCheck(
                                phone:{
                                    phoneNumber:"+821000000000",
                                    authenticationNumber: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.registerSMSCheck, false)
                })
                it("Invalid Type", async () => {
                    const query = `
                        mutation{
                            registerSMSCheck(
                                phone:{
                                    phoneNumber:"+821000000000",
                                    authenticationNumber: "123432"
                                }
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
                                password: "test1234AA@@",
                                username: "pukuba",
                                phone: {
                                    phoneNumber: "${phoneNumber}"
                                },
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
                                password: "test1234AA@@",
                                username: "erolf0123",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                },
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
                                password: "test1234AA@2",
                                username: "pukuba",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                },
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
                                password: "test1234AA@@",
                                username: "kkzkk1234",
                                phone: { 
                                    phoneNumber: "+821000000000",
                                },
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
                it("Invalid Input username", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "testtest",
                                password: "test1234AA@@",
                                username: "X",
                                phone: { 
                                    phoneNumber: "${phoneNumber}",
                                },
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
                it("Invalid Input id - 1", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "test",
                                password: "test1234AA@@",
                                username: "kkzkk1234",
                                phone: { 
                                    phoneNumber: "${phoneNumber}",
                                },
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
                it("Invalid Input id - 2", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "testTEST!@#$하와와",
                                password: "test1234AA@@",
                                username: "kkzkk1234",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                },
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
                it("Invalid Input password - 1", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "kkzkk1234",
                                password: "test",
                                username: "kkzkk1234",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                },
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
                    equal(body.errors[0].message, "비밀번호가 조건에 맞지 않습니다.")
                })
                it("Invalid Input password - 2", async () => {
                    const query = `
                        mutation{
                            register(
                                id: "kkzkk1234",
                                password: "하와와와와와와",
                                username: "kkzkk1234",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                },
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
                    equal(body.errors[0].message, "비밀번호가 조건에 맞지 않습니다.")
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
                                password:"test1234AA@@"
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
                    const user = jwt.verify(token[0], env.JWT_SECRET) as TokenInterface
                    equal(user.username, "pukuba")

                })
            })
            describe("Failure", () => {
                it("ID without", async () => {
                    const query = `
                        mutation{
                            login(
                                id:"kkzkk1234",
                                password:"test1234AA@@"
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
                it("password without", async () => {
                    const query = `
                        mutation{
                            login(
                                id:"test1234",
                                password:"kkzkk1234"
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