import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"


const bandIds: string[] = []
const commentIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""
let token1: string = ""
describe("Comment services test", () => {
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
            db.collection("freeBand").deleteMany({}),
            db.collection("comment").deleteMany({})
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
        const band1 = await db.collection("band").insertOne({
            name: "demo",
            introduce: "demo",
            songId: insertedId,
            sessions: {
                durm: 1,
                violin: 1
            },
            backGroundURI: "https://cdn.wallpapersafari.com/39/72/MF1esV.jpg",
            creatorId: "user1234",
            isSoloBand: false,
            createDate: new Date()
        })
        // const band2 = await db.collection("freeBand").insertOne({
        //     name: "demo",
        //     introduce: "demo",
        //     songId: insertedId,
        //     sessions: {
        //         durm: 1
        //     },
        //     backGroundURI: "https://cdn.wallpapersafari.com/39/72/MF1esV.jpg",
        //     creatorId: "user1234",
        //     createDate: new Date()
        // })
        bandIds.push(band1.insertedId.toString())
        // bandIds.push(band2.insertedId.toString())
    })

    describe("Mutation createComment", () => {
        describe("Success", () => {
            it("Create comment - 1", async () => {
                const query = `
                    mutation{
                        createComment(
                            input: {
                                comment: {
                                    content: "test",
                                    bandId: "${bandIds[0]}"
                                }
                            }
                        ){
                            content
                            bandId
                            commentId
                            user {
                                id
                            }
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.createComment.content, "test")
                equal(body.data.createComment.bandId, bandIds[0])
                equal(body.data.createComment.user.id, "user1234")
                commentIds.push(body.data.createComment.commentId)
            })
            it("Create comment - 2", async () => {
                const query = `
                    mutation{
                        createComment(
                            input: {
                                comment: {
                                    content: "yeah",
                                    bandId: "${bandIds[0]}"
                                }
                            }
                        ){
                            content
                            bandId
                            commentId
                            user {
                                id
                            }
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.createComment.content, "yeah")
                equal(body.data.createComment.bandId, bandIds[0])
                equal(body.data.createComment.user.id, "user1234")
                commentIds.push(body.data.createComment.commentId)
            })
        })
    })
    describe("Mutation deleteComment", () => {
        describe("Success", () => {
            it("Delete comment", async () => {
                const query = `
                    mutation{
                        deleteComment(
                            input: {
                                comment: {
                                    commentId: "${commentIds[1]}"
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
                equal(body.data.deleteComment, true)
            })
        })
        describe("Failure", () => {
            it("comment is undefined", async () => {
                const query = `
                    mutation{
                        deleteComment(
                            input: {
                                comment: {
                                    commentId: "111111111111111111111111"
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
                equal(body.errors[0].message, "댓글이 존재하지 않거나 내가 작성한 댓글이 아닙니다")
            })
        })
    })
    describe("Mutation updateComment", () => {
        describe("Success", () => {
            it("Update comment", async () => {
                const query = `
                    mutation{
                        updateComment(
                            input: {
                                comment: {
                                    commentId: "${commentIds[0]}",
                                    content: "update test comment"
                                }
                            }
                        ){
                            content
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.updateComment.content, "update test comment")
            })
        })
        describe("Failure", () => {
            it("comment is undefined", async () => {
                const query = `
                    mutation {
                        updateComment(
                            input: {
                                comment: {
                                    commentId: "111111111111111111111111",
                                    content: "hawawa"
                                }
                            }
                        ){
                            content
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)

                equal(body.errors[0].message, "댓글이 존재하지 않거나 내가 작성한 댓글이 아닙니다")
            })
        })
    })

    describe("Query getComments", async () => {
        it("get Successfully band comments", async () => {
            const query = `
                query {
                    getComments(
                        bandId: "${bandIds[0]}"
                    ){
                        bandId  
                        content
                        user {
                            id
                        }
                    }
                }
            `

            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getComments.length, 1)
            equal(body.data.getComments[0].content, "update test comment")
            equal(body.data.getComments[0].user.id, "user1234")
        })
    })

    describe("Query QueryFreeBand", () => {
        it("test comments loaders", async () => {
            const query = ` 
                query{ 
                    queryBand(
                        filter: {
                            type: ALL
                        }
                    ){
                        name
                        comment {
                            content
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand[0].name, "demo")
            equal(body.data.queryBand[0].comment[0].content, "update test comment")
        })
    })
})