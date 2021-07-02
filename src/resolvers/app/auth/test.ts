import request from "supertest"
import app from "test"

import env from "config/env"
import { deepStrictEqual as equal } from "assert"
import * as redis from "config/connectRedis"
import { Redis } from "config/types"
import DB from "config/connectDB"
import jwt from "jsonwebtoken"
import { TokenInterface } from "resolvers/app/auth/models"
import { Db } from "mongodb"

const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
describe("User auth service test", () => {
    const token: string[] = []
    const passwords: string[] = []
    after(async () => {
        const db = await DB.get() as Db
        await db.collection("user").deleteOne({ phoneNumber })
    })
    describe("SMS service test", () => {
        describe("Mutation registerSMSSend", () => {
            describe("Success", () => {
                it("When you have sent a register authentication number", async () => {
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
                    const db = await DB.get() as Db
                    await db.collection("user").insertOne({ phoneNumber: "+821000000000" })
                })
                after(async () => {
                    const db = await DB.get() as Db
                    await db.collection("user").deleteOne({ phoneNumber: "+821000000000" })
                })
                it("If the phone number form is not correct", async () => {
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
                it("If it's not a Korean phone number", async () => {
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
                it("If you are already a member", async () => {
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
        describe("Mutation registerSMSCheck", () => {
            describe("Success", () => {
                before(async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 123432)
                })
                it("If the register authentication number is correct", async () => {
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
                it("If you need to re-request your authentication number", async () => {
                    const query = `
                        mutation{
                            registerSMSCheck(
                                phone:{
                                    phoneNumber:"+82100000000",
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
                    equal(body.errors[0].message, "인증번호를 다시 요청해야합니다")
                })
                it("If the authentication number doesn't match", async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 432123)
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
                    equal(body.errors[0].message, "인증번호가 일치하지 않습니다")
                })
                it("If the phone number doesn't fit the format", async () => {
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
        describe("Mutation register", async () => {
            describe("Success", () => {
                it("In the case of normal membership registration", async () => {
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
                it("If the id already exists", async () => {
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
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다")
                })
                it("If there is already a username", async () => {
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
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다")
                })
                it("If your phone number is already registered", async () => {
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
                    equal(body.errors[0].message, "휴대번호 인증을 다시해야합니다")
                })
                it("If the username format is invalid", async () => {
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
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다")
                })
                it("If the id format is invalid - 1", async () => {
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
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다")
                })
                it("If the user name format is invalid - 2", async () => {
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
                    equal(body.errors[0].message, "id 혹은 username 이 조건에 맞지 않습니다")
                })
                it("If the password format is invalid - 1", async () => {
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
                    equal(body.errors[0].message, "비밀번호가 조건에 맞지 않습니다")
                })
                it("If the password format is invalid - 2", async () => {
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
                    equal(body.errors[0].message, "비밀번호가 조건에 맞지 않습니다")
                })
            })
        })
        describe("Mutation login", () => {
            describe("Success", () => {
                it("If login is successful", async () => {
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
                    equal(user.id, "test1234")
                })
            })
            describe("Failure", () => {
                it("If incorrectly entered id", async () => {
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
                    equal(body.errors[0].message, "잘못된 아이디 또는 비밀번호를 입력하셨습니다")
                })
                it("If incorrectly entered password", async () => {
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
                    equal(body.errors[0].message, "잘못된 아이디 또는 비밀번호를 입력하셨습니다")
                })
            })
        })
    })
    describe("User information find service", () => {
        describe("Mutation findIdSMSSend", () => {
            describe("Success", () => {
                it("If you have sent an ID find authentication number", async () => {
                    const query = ` 
                    mutation{ 
                        findIdSMSSend(
                            phone:{
                                phoneNumber:"${phoneNumber}"
                            }
                        )
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.findIdSMSSend, true)
                })
            })
            describe("Failure", () => {
                it("If you are looking for a user who does not exist", async () => {
                    const query = ` 
                    mutation{ 
                        findIdSMSSend(
                            phone:{
                                phoneNumber:"+82100000000000"
                            }
                        )
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "해당 번호로 가입한 유저가 존재하지 않습니다")
                })
            })
        })
        describe("Mutation findIdSMSCheck", () => {
            describe("Success", () => {
                before(async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 432123)
                })
                it("If the ID Find Authentication Number is correct", async () => {
                    const query = ` 
                    mutation{ 
                        findIdSMSCheck(
                            phone:{
                                phoneNumber: "${phoneNumber}",
                                authenticationNumber: 432123
                            }
                        ){
                            message
                            id
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)

                    equal(body.data.findIdSMSCheck.message, "아이디 찾기 성공")
                    equal(body.data.findIdSMSCheck.id, "test1234")
                })
            })
            describe("Failure", () => {
                it("If the authentication request is not valid", async () => {
                    const query = ` 
                    mutation{ 
                        findIdSMSCheck(
                            phone:{
                                phoneNumber:"${phoneNumber}",
                                authenticationNumber: 444444
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "인증 요청이 유효하지 않습니다")
                })
                it("If the authentication number is not appropriate", async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 432123)
                    const query = ` 
                    mutation{ 
                        findIdSMSCheck(
                            phone:{
                                phoneNumber:"${phoneNumber}",
                                authenticationNumber: 444444
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "인증번호가 유효하지 않습니다")
                })
                it("If there is no user with the information,", async () => {
                    const query = ` 
                    mutation{ 
                        findIdSMSCheck(
                            phone:{
                                phoneNumber:"+82100000000000",
                                authenticationNumber: 123422
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "해당 번호로 가입한 유저가 존재하지 않습니다")
                })
            })
        })
        describe("Mutation findPasswordSMSSend", () => {
            describe("Success", () => {
                it("If you have sent a password-finding authentication number", async () => {
                    const query = `
                        mutation{
                            findPasswordSMSSend(
                                id: "test1234",
                                phone: {
                                    phoneNumber: "${phoneNumber}"
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.findPasswordSMSSend, true)
                })
            })
            describe("Failure", () => {
                it("If the user does not exist", async () => {
                    const query = `
                        mutation{
                            findPasswordSMSSend(
                                id: "asdffadsfsad",
                                phone: {
                                    phoneNumber: "${phoneNumber}"
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "해당 정보로 가입한 유저가 존재하지 않습니다")
                })
            })
        })
        describe("Mutation findPasswordSMSCheck", () => {
            describe("Success", () => {
                before(async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 111111)
                })
                it("Find Password Authentication Number is correct", async () => {
                    const query = `
                        mutation{
                            findPasswordSMSCheck(
                                id: "test1234",
                                phone: {
                                    phoneNumber: "${phoneNumber}",
                                    authenticationNumber: 111111
                                }
                            ){
                                message,
                                token
                            }
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.findPasswordSMSCheck.message, "인증번호가 유효합니다")
                    token.push(body.data.findPasswordSMSCheck.token)
                })
            })
            describe("Failure", () => {
                it("If there is no user with the information,", async () => {
                    const query = `
                    mutation{
                        findPasswordSMSCheck(
                            id: "test123asdfdsa4",
                            phone: {
                                phoneNumber: "${phoneNumber}",
                                authenticationNumber: 123211
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "해당 정보의 유저를 찾을 수 없습니다")
                })
                it("If the authentication number request is not valid", async () => {
                    const query = `
                    mutation{
                        findPasswordSMSCheck(
                            id: "test1234",
                            phone: {
                                phoneNumber: "${phoneNumber}",
                                authenticationNumber: 123211
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "인증 요청이 유효하지 않습니다")
                })
                it("If the authentication number is not correct", async () => {
                    await (redis as Redis).setex(env.PHONE_NUMBER as string, 180, 222222)
                    const query = `
                    mutation{
                        findPasswordSMSCheck(
                            id: "test1234",
                            phone: {
                                phoneNumber: "${phoneNumber}",
                                authenticationNumber: 333333
                            }
                        ){
                            message
                        }
                    }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "인증번호가 유효하지 않습니다")
                })
            })
        })
    })
    describe("Mutation changePassword", () => {
        describe("Success", () => {
            it("If successfully changed password", async () => {
                const query = `
                    mutation{
                        changePassword(
                            password:"test1234AA@@",
                            changePassword: "testtest1234@@"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        "Authorization": token[0]
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.changePassword, true)
            })
        })
        describe("Failure", () => {
            it("If you don't have the authority", async () => {
                const query = `
                    mutation{
                        changePassword(
                            password:"testtest1234@@",
                            changePassword: "testtest1234!!"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({ "Content-Type": "application/json" })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "Authorization Error")
            })
            it("If the user information is not correct", async () => {
                const query = `
                    mutation{
                        changePassword(
                            password:"testtest1234@@",
                            changePassword: "testtest1234!!"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        "Authorization": jwt.sign({ id: "hack1234", username: "hack1234321" }, env.JWT_SECRET)
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "인증 정보가 유효하지 않습니다")
            })
            it("If the password is not valid", async () => {
                const query = `
                    mutation{
                        changePassword(
                            password:"xxxxxxxxxxxx",
                            changePassword: "testtest1234!!"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        "Authorization": token[0]
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "비밀번호가 올바르지 않습니다")
            })
            it("If the password doesn't fit the form", async () => {
                const query = `
                    mutation{
                        changePassword(
                            password:"testtest1234@@",
                            changePassword: "ㅌㅌ"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        "Authorization": token[0]
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "새 비밀번호가 양식에 맞지 않습니다")
            })
        })
    })
    describe("Mutation resetPassword", () => {
        describe("Success", () => {
            it("Normally, you have changed your password", async () => {
                const query = `
                    mutation{
                        resetPassword(
                            token: "${token[1]}",
                            resetPassword: "exPassword!"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({ "Content-Type": "application/json" })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.resetPassword, true)
            })
        })
        describe("Failure", () => {
            it("If the password doesn't fit the form", async () => {
                const query = `
                    mutation{
                        resetPassword(
                            token: "${token[1]}",
                            resetPassword: "c"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({ "Content-Type": "application/json" })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "비밀번호가 조건에 맞지 않습니다")
            })
            it("If the tokens are not useful", async () => {
                const query = `
                    mutation{
                        resetPassword(
                            token: "${token[1]}",
                            resetPassword: "ccc22211!!"
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({ "Content-Type": "application/json" })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "다시 시도해 주세요")
            })
        })
    })
})