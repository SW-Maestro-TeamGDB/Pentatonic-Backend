import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"

const bandIds: string[] = []
const songIds: string[] = []
const coverIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = "", token1: string = ""

describe("FreeSong Service Test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("follow").deleteMany({}),
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("band").deleteMany({}),
            db.collection("freeBand").deleteMany({}),
            db.collection("join").deleteMany({})
        ])
    })
    before(async () => {
        await (async () => {
            await Redis.setex(phoneNumber as string, 600, "123456")
            const query = `
            mutation{
                register(
                    input: {
                        user: {
                            id: "test1234",
                            password: "test1234",
                            username: "test1234",
                            type: 1
                        },
                        phoneNumber: "${phoneNumber}",
                        authCode: 123456
                    }
                )
            }`
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            token = body.data.register
        })()
        await (async () => {
            await Redis.setex("+821000000000", 600, "123456")
            const query = `
                mutation{
                    register(
                        input: {
                            user: {
                                id: "test12345",
                                password: "test12345",
                                username: "test12345",
                                type: 1
                            },
                            phoneNumber: "+821000000000",
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
            token1 = body.data.register
        })()
    })
    describe("Mutation createFreeBand", () => {
        describe("Success", () => {
            it("If you normally create free band", async () => {
                const query = `
                    mutation {
                        createFreeBand(
                            input: {
                                song: {
                                    songURI: "${env.S3_URI}/result.mp3",
                                    name: "example Name",
                                    artist: "example Artist"
                                }, 
                                band: {
                                    name: "example Name",
                                    introduce: "example Introduce"
                                },
                                sessionConfig: [{
                                    session: DRUM,
                                    maxMember: 2
                                },{
                                    session: VIOLIN,
                                    maxMember: 1
                                }]
                            }
                        ){
                            name
                            bandId
                            song{
                                name
                                songId
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
                equal(body.data.createFreeBand.name, "example Name")
                equal(body.data.createFreeBand.song.name, "example Name")
                songIds.push(body.data.createFreeBand.song.songId)
                bandIds.push(body.data.createFreeBand.bandId)
            })
        })
    })
    describe("Mutation joinFreeBand", () => {

        before(async () => {
            await (async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    songId: "${songIds[0]}",
                                    name: "테스트 커버 업로드 - 1",
                                    coverURI: "${env.S3_URI}/drum.m4a",
                                    position: DRUM
                                }
                            }
                        ){
                            coverId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                coverIds.push(body.data.uploadCover.coverId)
            })()
            await (async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    songId: "${songIds[0]}",
                                    name: "테스트 커버 업로드 - 2",
                                    coverURI: "${env.S3_URI}/drum.m4a",
                                    position: DRUM
                                }
                            }
                        ){
                            coverId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                coverIds.push(body.data.uploadCover.coverId)
            })()
            await (async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    songId: "${songIds[0]}",
                                    name: "테스트 커버 업로드 - 3",
                                    coverURI: "${env.S3_URI}/violin.m4a",
                                    position: VIOLIN
                                }
                            }
                        ){
                            coverId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                coverIds.push(body.data.uploadCover.coverId)
            })()
            await (async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    songId: "${songIds[0]}",
                                    name: "테스트 커버 업로드 - 4",
                                    coverURI: "${env.S3_URI}/violin.m4a",
                                    position: VIOLIN
                                }
                            }
                        ){
                            coverId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                coverIds.push(body.data.uploadCover.coverId)
            })()
        })
        describe("Success", () => {
            it("If the user normally joins the band - 1", async () => {
                const query = `
                    mutation {
                        joinFreeBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[0]}",
                                    position: DRUM
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
                equal(body.data.joinFreeBand, true)
            })
            it("If the user normally joins the band - 2", async () => {
                const query = `
                    mutation {
                        joinFreeBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[1]}",
                                    position: DRUM
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
                equal(body.data.joinFreeBand, true)
            })
            it("If the user normally joins the band - 3", async () => {
                const query = `
                    mutation {
                        joinFreeBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[2]}",
                                    position: VIOLIN
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
                equal(body.data.joinFreeBand, true)
            })
        })
        describe("Failure", () => {
            it("Fail to join freeBand - full", async () => {
                const query = `
                    mutation{
                        joinFreeBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[3]}",
                                    position: VIOLIN
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
                equal(body.errors[0].message, "세션이 가득찾거나 존재하지 않습니다")
            })
            it("Fail to join freeBand - invalid cover", async () => {
                const query = `
                    mutation{
                        joinFreeBand(
                            input: {
                                band:{
                                    bandId:"${bandIds[0]}"
                                },
                                session: {
                                    coverId: "111111111111111111111111",
                                    position: DRUM
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
                equal(body.errors[0].message, "커버내역이 존재하지 않습니다")
            })
            it("Fail to join freeBand - user already", async () => {
                const query = `
                    mutation{
                        joinFreeBand(
                            input: {
                                band:{
                                    bandId:"${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[0]}",
                                    position: DRUM
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
                equal(body.errors[0].message, "이미 참여한 유저입니다")
            })
            it("Fail to join freeBand - undefined bandId", async () => {
                const query = `
                    mutation{
                        joinFreeBand(
                            input: {
                                band:{
                                    bandId:"111111111111111111111111"
                                },
                                session: {
                                    coverId: "${coverIds[0]}",
                                    position: DRUM
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
                equal(body.errors[0].message, "밴드가 존재하지 않습니다")
            })
        })
    })
})