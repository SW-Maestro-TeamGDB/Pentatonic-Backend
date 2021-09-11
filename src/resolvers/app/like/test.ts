import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"


const bandIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""
let token1: string = ""
describe("Like services test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({}),
            db.collection("band").deleteMany({}),
            db.collection("session").deleteMany({}),
            db.collection("join").deleteMany({}),
            db.collection("like").deleteMany({}),
            db.collection("freeBand").deleteMany({})
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

        const db = await DB.get() as Db
        const { insertedId } = await db.collection("song").insertOne({
            name: "자유곡 예제 노래",
            artist: "demo",
            songURI: `${env.S3_URI}/result.mp3`,
            isFreeSong: true,
            duration: 222.302041
        })
        const band1 = await db.collection("freeBand").insertOne({
            name: "demo",
            introduce: "demo",
            songId: insertedId,
            sessions: {
                durm: 1
            },
            backGroundURI: "https://cdn.wallpapersafari.com/39/72/MF1esV.jpg",
            creatorId: "user1234",
            createDate: new Date()
        })
        const band2 = await db.collection("freeBand").insertOne({
            name: "demo",
            introduce: "demo",
            songId: insertedId,
            sessions: {
                durm: 1
            },
            backGroundURI: "https://cdn.wallpapersafari.com/39/72/MF1esV.jpg",
            creatorId: "user1234",
            createDate: new Date()
        })
        bandIds.push(band1.insertedId.toString())
        bandIds.push(band2.insertedId.toString())
        const lib = await db.collection("library").insertOne({
            name: "자유곡업로드테스트",
            songId: insertedId,
            coverURI: `${env.S3_URI}/result.mp3`,
            duration: 222.302041,
            position: "DRUM",
            coverBy: "user1234"
        })
        await db.collection("join").insertOne({
            bandId: band1.insertedId,
            position: "DRUM",
            userId: "user1234"
        })
        await db.collection("join").insertOne({
            bandId: band2.insertedId,
            position: "DRUM",
            userId: "user1234"
        })
        await db.collection("session").insertOne({
            bandId: band1.insertedId,
            position: "DRUM",
            coverID: lib.insertedId,
        })
        await db.collection("session").insertOne({
            bandId: band2.insertedId,
            position: "DRUM",
            coverID: lib.insertedId,
        })
    })
    describe("Mutation like", () => {
        describe("Success", () => {
            it("If you like it normally - 1", async () => {
                const query = `
                    mutation{
                        like(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                }
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
                equal(body.data.like, true)
            })
            it("If you like it normally - 2", async () => {
                const query = `
                    mutation{
                        like(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                }
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
                equal(body.data.like, true)
            })
            it("If you like it normally - 3", async () => {
                const query = `
                    mutation{
                        like(
                            input: {
                                band: {
                                    bandId: "${bandIds[1]}"
                                }
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
                equal(body.data.like, true)
            })
            it("If you like it normally - 4", async () => {
                const query = `
                    mutation{
                        like(
                            input: {
                                band: {
                                    bandId: "${bandIds[1]}"
                                }
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
                equal(body.data.like, true)
            })
            it("If you normally cancel the good - 1", async () => {
                const query = `
                    mutation{
                        like(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                }
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
                equal(body.data.like, true)
            })
        })
    })
    describe("Query likeStatus", () => {
        it("get like status", async () => {
            const query = `
                query{
                    likeStatus(
                        bandId: "${bandIds[0]}"
                    )
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.likeStatus, false)
        })
    })
    describe("Query getRankedBands", () => {
        it("get band by sorted likeCount", async () => {
            const query = `
                query{
                    getRankedBands{
                        name
                        likeCount
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getRankedBands.length, 2)
            equal(body.data.getRankedBands[0].likeCount, 2)
            equal(body.data.getRankedBands[1].likeCount, 1)
        })
    })
})