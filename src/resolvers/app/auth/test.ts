import request from "supertest"
import app from "test"

import fetch from "node-fetch"
import env from "config/env"
import { deepStrictEqual as equal } from "assert"
import * as redis from "config/connectRedis"
import { Redis, JWTUser } from "config/types"
import DB from "config/connectDB"
import jwt from "jsonwebtoken"
import { Db } from "mongodb"
import { includes } from "test/utils"
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(
    3,
    (env.PHONE_NUMBER as string).length
)}`

const fileUpload = (
    query: string,
    variables: { [x: string]: string },
    token: string
) => {
    const map = Object.assign(
        {},
        Object.keys(variables).map((key) => [`variables.${key}`])
    )
    const response = request(app)
        .post("/api")
        .set({ Authorization: token })
        .set("Content-Type", "multipart/form-data")
        .field("operations", JSON.stringify({ query }))
        .field("map", JSON.stringify(map))

    Object.values(variables).forEach((value, i) => {
        response.attach(`${i}`, value)
    })
    return response
}

describe("User auth service test", () => {
    const token: string[] = []
    const uri: string[] = []
    after(async () => {
        const db = (await DB.get()) as Db
        await db.collection("user").deleteOne({ phoneNumber })
    })
    describe("SMS service test", () => {
        describe("Mutation sendAuthCode", () => {
            describe("Success", () => {
                it("When you have sent a register authentication number", async () => {
                    const query = `
                        mutation{ 
                            sendAuthCode(
                                input:{
                                    isRegistration: true,
                                    phoneNumber: "${phoneNumber}"
                                }
                            )
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.sendAuthCode, true)
                })
            })
            describe("Failure", () => {
                before(async () => {
                    const db = (await DB.get()) as Db
                    await db
                        .collection("user")
                        .insertOne({ phoneNumber: "+821000000000" })
                })
                after(async () => {
                    const db = (await DB.get()) as Db
                    await db
                        .collection("user")
                        .deleteOne({ phoneNumber: "+821000000000" })
                })
                it("If it's not a Korean phone number", async () => {
                    const query = `
                        mutation{
                            sendAuthCode(
                                input: {
                                    isRegistration: true,
                                    phoneNumber: "+12319235123"
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
                            sendAuthCode(
                                input: {
                                    isRegistration: true,
                                    phoneNumber: "+821000000000"
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "이미 해당 전화번호로 가입한 유저가 있습니다"
                    )
                })
            })
        })
    })
    describe("Register & Login services test", () => {
        describe("Mutation register", async () => {
            describe("Success", () => {
                it("In the case of normal membership registration", async () => {
                    await (redis as Redis).setex(phoneNumber, 60, "123432")
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user:{
                                        id: "test1234",
                                        password: "test1234AA@@",
                                        username: "pukuba",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(typeof body.data.register, "string")
                    token.push(body.data.register)
                })
            })
            describe("Failure", () => {
                before(async () => {
                    await (redis as Redis).setex(phoneNumber, 600, "123432")
                })
                it("If the id already exists", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user:{
                                        id: "test1234",
                                        password: "test1234AA@@",
                                        username: "erolf0123",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}"
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "중복인 id 입니다")
                })
                it("If there is already a username", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "erolf0123",
                                        password: "test1234AA@2",
                                        username: "pukuba",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "중복인 username 입니다")
                })
                it("If your phone number is already registered", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "kkzkk1234",
                                        password: "test1234AA@@",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "+821000000000",
                                    authCode: 666666
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "휴대번호 인증을 다시해야합니다"
                    )
                })
                it("If the username format is invalid - 1", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "testtest",
                                        password: "test1234AA@@",
                                        username: "X",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "username의 길이는 6이상 14이하여야 합니다"
                    )
                })
                it("If the id format is invalid - 2", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "test",
                                        password: "test1234AA@@",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "id의 길이는 6이상 14이하여야 합니다"
                    )
                })
                it("If the username format is invalid - 3", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "testTEST!@#$하와와",
                                        password: "test1234AA@@",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "id는 영문 소문자, 대문자, 숫자여야합니다"
                    )
                })
                it("If the password format is invalid - 1", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "kkzkk1234",
                                        password: "test",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "Password의 길이는 6이상 14이하여야 합니다"
                    )
                })
                it("If the password format is invalid - 2", async () => {
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "kkzkk1234",
                                        password: "하와와와와와와",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "Password는 영문 소문자, 대문자, 숫자, 특수문자여야 합니다"
                    )
                })
                it("The authentication number does not match", async () => {
                    await (redis as Redis).setex(`${phoneNumber}`, 60, "123432")
                    const query = `
                        mutation{
                            register(
                                input: {
                                    user: {
                                        id: "kkzkk1234",
                                        password: "test1234AA@@",
                                        username: "kkzkk1234",
                                        type: 1
                                    },
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123433
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "인증번호가 일치하지 않습니다"
                    )
                })
            })
        })
        describe("Mutation login", () => {
            describe("Success", () => {
                it("If login is successful", async () => {
                    const query = `
                        mutation{
                            login(
                                input: {
                                    user: {
                                        id:"test1234",
                                        password:"test1234AA@@"
                                    }
                                }
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
                    const user = jwt.verify(token[0], env.JWT_SECRET) as JWTUser
                    equal(user.id, "test1234")
                })
            })
            describe("Failure", () => {
                it("If incorrectly entered id", async () => {
                    const query = `
                        mutation{
                            login(
                                input: {
                                    user: {
                                        id:"kkzkk1234",
                                        password:"test1234AA@@"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "잘못된 아이디 또는 비밀번호를 입력하셨습니다"
                    )
                })
                it("If incorrectly entered password", async () => {
                    const query = `
                        mutation{
                            login(
                                input: {
                                    user:{
                                        id:"test1234",
                                        password:"kkzkk1234"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "잘못된 아이디 또는 비밀번호를 입력하셨습니다"
                    )
                })
            })
        })
    })
    describe("User information find service", () => {
        describe("Query checkAuthCode", () => {
            describe("Success", () => {
                it("checkAuthCode return true - 1", async () => {
                    await (redis as Redis).setex(`${phoneNumber}`, 60, "123432")
                    const query = `
                        query{
                            checkAuthCode(
                                phoneNumber: "${phoneNumber}",
                                authCode: 123432
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.checkAuthCode, true)
                })
            })
            describe("Failure", () => {
                it("checkAuthCoe return false - 1", async () => {
                    const query = `
                        query{
                            checkAuthCode(
                                phoneNumber: "${phoneNumber}",
                                authCode: 123433
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.checkAuthCode, false)
                })
            })
        })

        describe("Query findId", () => {
            describe("Success", () => {
                it("Send message when information is available", async () => {
                    const query = `
                        mutation{
                            sendAuthCode(
                                input: {
                                    phoneNumber: "${phoneNumber}",
                                    isRegistration: false
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.sendAuthCode, true)
                })
                it("If you have sent an ID find authentication number", async () => {
                    await (redis as Redis).setex(`${phoneNumber}`, 60, "123432")
                    const query = ` 
                        query{ 
                            findId(
                                phoneNumber:"${phoneNumber}",
                                authCode: 123432
                            ){
                                id
                            }
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.findId.id, "test1234")
                })
            })
            describe("Failure", () => {
                it("If find a user who does not exist", async () => {
                    await (redis as Redis).setex(
                        "canSend-::ffff:127.0.0.1",
                        60,
                        `[${Date.now()},0]`
                    )
                    const query = `
                        mutation{
                            sendAuthCode(
                                input: {
                                    phoneNumber: "+82100000000000",
                                    isRegistration: false
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "해당 전화번호로 가입한 유저가 없습니다"
                    )
                })
                it("If you are looking for a user who does not exist", async () => {
                    const query = ` 
                        query{ 
                            findId(
                                phoneNumber:"+82100000000000",
                                authCode: 123432
                            ){
                                id
                            }
                        }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "휴대번호 인증을 다시해야합니다"
                    )
                })
                it("the authentication number is wrong", async () => {
                    await (redis as Redis).setex(phoneNumber, 60, "123432")
                    const query = ` 
                        query{ 
                            findId(
                                phoneNumber:"${phoneNumber}",
                                authCode: 666666
                            ){
                                id
                            }
                        }
                `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "인증번호가 일치하지 않습니다"
                    )
                })
            })
        })
        describe("Mutation resetPassword", () => {
            describe("Success", () => {
                it("The password is reset normally", async () => {
                    await (redis as Redis).setex(
                        "canSend-::ffff:127.0.0.1",
                        60,
                        `[${Date.now() - 70000},4]`
                    )
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 123432,
                                    user: {
                                        password: "test1234"
                                    }
                                }
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
                it("The authentication number is invalid", async () => {
                    await (redis as Redis).setex(
                        "+82100000000000",
                        60,
                        "555555"
                    )
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "+82100000000000",
                                    authCode: 444444,
                                    user: {
                                        password: "mongoose"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "인증번호가 일치하지 않습니다"
                    )
                })
                it("If the user does not exist", async () => {
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 444444,
                                    user: {
                                        password: "mongoose"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "휴대번호 인증을 다시해야합니다"
                    )
                })
                it("If the number of requests exceeds - 1", async () => {
                    await (redis as Redis).setex(
                        "canSend-::ffff:127.0.0.1",
                        60,
                        `[${Date.now()},5]`
                    )
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 444444,
                                    user: {
                                        password: "mongoose"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "잠시 뒤에 시도해주세요")
                })
                it("Password does not meet the condition", async () => {
                    await (redis as Redis).setex(
                        "canSend-::ffff:127.0.0.1",
                        60,
                        `[${Date.now()},0]`
                    )
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "${phoneNumber}",
                                    authCode: 444444,
                                    user: {
                                        password: "x"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    includes(
                        body.errors[0].message,
                        "Password의 길이는 6이상 14이하여야 합니다"
                    )
                })
                it("If there is no record requesting the authentication number", async () => {
                    const query = `
                        mutation{
                            resetPassword(
                                input: {
                                    phoneNumber: "+82100000000111",
                                    authCode: 444444,
                                    user: {
                                        password: "xyzzxyyxz1234"
                                    }
                                }
                            )
                        }
                    `
                    const { body } = await request(app)
                        .post("/api")
                        .set({ "Content-Type": "application/json" })
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "휴대번호 인증을 다시해야합니다"
                    )
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
                            input: {
                                user: {
                                    password:"test1234",
                                    changePassword: "testtest1234@@"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
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
                            input: {
                                user: {
                                    password:"testtest1234@@",
                                    changePassword: "testtest1234!!"
                                }
                            }
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
                            input: {
                                user: {
                                    password:"testtest1234@@",
                                    changePassword: "testtest1234!!"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: jwt.sign(
                            { id: "hack1234", username: "hack1234321" },
                            env.JWT_SECRET
                        ),
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "인증 정보가 유효하지 않습니다")
            })
            it("If the password is not valid", async () => {
                const query = `
                    mutation{
                        changePassword(
                            input: {
                                user: {
                                    password:"xxxxxxxxxxxx",
                                    changePassword: "testtest1234!!"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "비밀번호가 올바르지 않습니다")
            })
            it("If the password doesn't fit the form", async () => {
                const query = `
                    mutation{
                        changePassword(
                            input: {
                                user: {
                                    password:"testtest1234@@",
                                    changePassword: "ㅌㅌ"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                includes(
                    body.errors[0].message,
                    "Password는 영문 소문자, 대문자, 숫자, 특수문자여야 합니다"
                )
            })
        })
    })

    describe("Mutation UploadImageFile", () => {
        describe("Success", () => {
            it("If you uploaded files normally .jpg", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadImageFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: `src/test/test.jpg`,
                    },
                    token[0]
                )
                const result = await fetch(body.data.uploadImageFile, {
                    method: "GET",
                })
                uri.push(body.data.uploadImageFile)
                equal(result.status, 200)
            }).timeout(50000)
            it("If you uploaded files normally .png", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadImageFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/test.png",
                    },
                    token[0]
                )
                const result = await fetch(body.data.uploadImageFile, {
                    method: "GET",
                })
                uri.push(body.data.uploadImageFile)
                equal(result.status, 200)
            }).timeout(50000)
            it("If you uploaded files normally .jpeg", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadImageFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/test.jpeg",
                    },
                    token[0]
                )
                const result = await fetch(body.data.uploadImageFile, {
                    method: "GET",
                })
                uri.push(body.data.uploadImageFile)
                equal(result.status, 200)
            }).timeout(50000)
        })
        describe("Failure", () => {
            it("If you uploaded a file that wasn't a picture", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadImageFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/test.zip",
                    },
                    token[0]
                )
                equal(body.errors[0].message, "파일 확장자가 올바르지 않습니다")
            })
            it("If the user's token is not valid", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadImageFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/test.png",
                    },
                    "14235412534231132"
                )
                equal(body.errors[0].message, "Authorization Error")
            })
        })
    })
    describe("Mutation changeProfile", () => {
        describe("Success", () => {
            it("If you update all information", async () => {
                const query = `
                mutation{
                    changeProfile(
                        input: {
                            user: {
                                username: "SeungWon",
                                profileURI: "${uri[0]}",
                                introduce: "테스트 자기소개 글 입니다!",
                                type: 3
                            }
                        }
                    ){
                        id
                        username
                        profileURI
                        introduce
                    }
                }
            `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                const result = body.data.changeProfile
                equal(result.id, "test1234")
                equal(result.username, "SeungWon")
                equal(result.profileURI, uri[0])
                equal(result.introduce, "테스트 자기소개 글 입니다!")
            })
            it("If only some of them were updated", async () => {
                const query = `
                    mutation{
                        changeProfile(
                            input: {
                                user: {
                                    introduce: "테스트 자기소개 글 입니다!"
                                }
                            }
                        ){
                            username
                            introduce
                            type
                        }
                    }
            `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                const result = body.data.changeProfile
                equal(result.username, "SeungWon")
                equal(result.type, 3)
                equal(result.introduce, "테스트 자기소개 글 입니다!")
            })
            it("If you are not updating anything", async () => {
                const query = `
                mutation{
                    changeProfile(
                        input: {
                            user: {
                                
                            }
                        }
                    ){
                        username
                        introduce
                        type
                    }
                }
            `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                const result = body.data.changeProfile
                equal(result.username, "SeungWon")
                equal(result.type, 3)
                equal(result.introduce, "테스트 자기소개 글 입니다!")
            })
        })
        describe("Failure", () => {
            it("If you do not include the essential factor", async () => {
                const query = `
                mutation{
                    changeProfile(
                        input:{
                            user: {

                            }
                        }
                    ) {
                        username
                        introduce
                        type
                    }
                }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: jwt.sign(
                            { id: "gogo1234321" },
                            env.JWT_SECRET
                        ),
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "인증 정보가 유효하지 않습니다")
            })
            it("If you change to a nickname that exists", async () => {
                const query = `
                mutation{
                    changeProfile(
                        input:{
                            user: {
                                username: "SeungWon"
                            }
                        }
                    ) {
                        username
                        introduce
                        type
                    }
                }`
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "중복인 username 입니다")
            })
        })
    })
    describe("Query getUserInfo", () => {
        describe("Success", () => {
            it("Get the information using the getUserInfo query with authorization headers", async () => {
                const query = `
                    query{
                        getUserInfo(userId:"test1234"){
                            id
                            username
                            type
                            phoneNumber
                        }
                    }
                `
                const { body } = await request(app)
                    .get(`/api?query=${query}`)
                    .set({ Authorization: token[0] })
                    .expect(200)
                equal(body.data.getUserInfo.id, "test1234")
                equal(body.data.getUserInfo.username, "SeungWon")
                equal(body.data.getUserInfo.type, 3)
                equal(body.data.getUserInfo.phoneNumber, phoneNumber)
            })
            it("Get the information using the getUserInfo query with empty headers", async () => {
                const query = `
                    query{
                        getUserInfo(userId:"test1234"){
                            id
                            username
                            type
                            phoneNumber
                        }
                    }
                `
                const { body } = await request(app)
                    .get(`/api?query=${query}`)
                    .expect(200)
                equal(body.data.getUserInfo.id, "test1234")
                equal(body.data.getUserInfo.username, "SeungWon")
                equal(body.data.getUserInfo.type, 3)
                equal(body.data.getUserInfo.phoneNumber, null)
            })
        })
    })
    describe("Mutation deleteAccount", () => {
        describe("Failure", () => {
            it("If the password is not right", async () => {
                const query = `
                    mutation{
                        deleteAccount(
                            input: {
                                user: {
                                    password: "xxxxxx"
                                }
                            }
                        ) 
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "비밀번호가 올바르지 않습니다")
            })
            it("If it is a member that does not exist", async () => {
                const query = `
                    mutation{
                        deleteAccount(
                            input: {
                                user: {
                                    password: "asdfdsasdf"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: "1234342112341234",
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "Authorization Error")
            })
        })
        describe("Success", () => {
            it("If you normally delete account", async () => {
                const query = `
                    mutation{
                        deleteAccount(
                            input: {
                                user: {
                                    password: "testtest1234@@"
                                }
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set({
                        "Content-Type": "application/json",
                        Authorization: token[0],
                    })
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.deleteAccount, true)
            })
        })
    })
})
