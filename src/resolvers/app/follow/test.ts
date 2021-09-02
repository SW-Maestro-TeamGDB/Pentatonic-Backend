import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"

const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""
let token1: string = ""

describe("Follow Service Test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("follow").deleteMany({}),
            db.collection("user").deleteMany({})
        ])
    })
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
    describe("Mutation follow", () => {
        describe("Success", () => {
            it("Successfully follow - 1", async () => {
                const query = `
                    mutation {
                        follow(
                            input: {
                                following: "test1234"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.follow, true)
            })
            it("Successfully follow - 2", async () => {
                const query = `
                    mutation {
                        follow(
                            input: {
                                following: "user1234"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.follow, true)
            })
            it("Successfully unfollow - 1", async () => {
                const query = `
                    mutation {
                        follow(
                            input: {
                                following: "user1234"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.follow, true)
            })
        })
        describe("Failure", () => {
            it("If you follow yourself", async () => {
                const query = `
                    mutation {
                        follow(
                            input: {
                                following: "user1234"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "자기 자신을 팔로잉할 수 없습니다")
            })
            it("If you follow someone who doesn't have one", async () => {
                const query = `
                    mutation {
                        follow(
                            input: {
                                following: "hawawa"
                            }
                        )
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "존재하지 않는 유저입니다")
            })
        })
    })
    describe("Query getFollowerList", () => {
        it("Get all follower list", async () => {
            const query = `
                query{
                    getFollowerList(
                        userId: "test1234"
                    ){
                        id
                        username
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getFollowerList.length, 1)
            equal(body.data.getFollowerList[0].id, "user1234")
            equal(body.data.getFollowerList[0].username, "pukuba")
        })
    })
    describe("Query getFollowingList", () => {
        it("Get all following list", async () => {
            const query = `
                query{
                    getFollowingList(
                        userId: "user1234"
                    ){
                        id
                        username
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getFollowingList.length, 1)
            equal(body.data.getFollowingList[0].id, "test1234")
            equal(body.data.getFollowingList[0].username, "erolf0123")
        })
    })
    describe("Query getUserInfo with follow services", () => {
        it("Getting user's follow-related information - 1", async () => {
            const query = `
                query{
                    getUserInfo(
                        userId: "user1234"
                    ){
                        followingCount
                        followerCount
                        followingStatus
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getUserInfo.followingCount, 1)
            equal(body.data.getUserInfo.followerCount, 0)
            equal(body.data.getUserInfo.followingStatus, null)
        })
        it("Getting user's follow-related information - 2", async () => {
            const query = `
                query{
                    getUserInfo(
                        userId: "test1234"
                    ){
                        followingCount
                        followerCount
                        followingStatus
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getUserInfo.followingCount, 0)
            equal(body.data.getUserInfo.followerCount, 1)
            equal(body.data.getUserInfo.followingStatus, true)
        })
        it("Getting user's follow-related information - 3 (empty authorization headers)", async () => {
            const query = `
                query{
                    getUserInfo(
                        userId: "test1234"
                    ){
                        followingCount
                        followerCount
                        followingStatus
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getUserInfo.followingCount, 0)
            equal(body.data.getUserInfo.followerCount, 1)
            equal(body.data.getUserInfo.followingStatus, null)
        })
    })
})