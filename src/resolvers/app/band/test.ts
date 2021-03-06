import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import { Band } from "resolvers/app/band/models"
import * as Redis from "config/connectRedis"
import { Cover } from "resolvers/app/library/models"

const songIds: string[] = []
const coverIds: string[] = []
const bandIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(
    3,
    (env.PHONE_NUMBER as string).length
)}`
let token = ""
let token1 = ""
describe("Band services test", () => {
    after(async () => {
        const db = (await DB.get()) as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({}),
            db.collection("band").deleteMany({}),
            db.collection("session").deleteMany({}),
            db.collection("join").deleteMany({}),
            db.collection("like").deleteMany({}),
        ])
    })
    describe("Before Register & upload", () => {
        it("mock user register - 1", async () => {
            await Redis.setex(phoneNumber as string, 600, "123456")
            const query = `
            mutation{
                register(
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
            }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            token = body.data.register
        })
        it("mock user register - 2", async () => {
            await Redis.setex("+82100000000" as string, 600, "123456")
            const query = `
            mutation{
                register(
                    input: {
                        user:{
                            id: "test1234",
                            password: "test1234",
                            username: "erolf01234",
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
            token1 = body.data.register
        })
        it("Successfully uploaded a song", async () => {
            const query = `
                    mutation{
                        uploadSong(
                            input: {
                                code: "${env.JWT_SECRET}",
                                song: {
                                    name: "Viva La Vida",
                                    songURI: "${env.S3_URI}/result.mp3",
                                    songImg: "https://kr.seaicons.com/wp-content/uploads/2016/05/Letter-P-blue-icon.png",
                                    genre: POP,
                                    artist: "artist",
                                    weeklyChallenge: false,
                                    releaseDate: "2019-01-01",
                                    level: 2,
                                    album: "Viva la Vida or Death and All His Friends"
                                }
                            }
                        ){
                            songId
                        }
                    }`
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            songIds.push(body.data.uploadSong.songId)
        })
        it("Successfully uploaded a free song", async () => {
            const query = `
                    mutation{
                        uploadFreeSong(
                            input: {
                                song: {
                                    name: "Viva La Vida",
                                    songURI: "${env.S3_URI}/result.mp3",
                                    artist: "artist"
                                }
                            }
                        )
                    }`
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            songIds.push(body.data.uploadFreeSong)
        })
        it("Successfully uploaded a cover - 1", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "???????????? Viva La Vida Drum ??????",
                                songId: "${songIds[0]}",
                                coverURI: "${env.S3_URI}/song1-Drum.mp3",
                                position: DRUM
                            },
                            filter: {
                                syncDelay: -0.01
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
                .expect(200)
            coverIds.push(body.data.uploadCover.coverId)
            equal(typeof body.data.uploadCover.coverId, "string")
        }).timeout(500000)
        it("Successfully uploaded a cover - 2", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "???????????? Viva La Vida Violin ??????",
                                songId: "${songIds[0]}",
                                coverURI: "${env.S3_URI}/violin.mp3",
                                position: VIOLIN
                            },
                            filter: {
                                syncDelay: -1.1
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
                .expect(200)
            coverIds.push(body.data.uploadCover.coverId)
            equal(typeof body.data.uploadCover.coverId, "string")
        }).timeout(500000)
        it("Successfully uploaded a cover - 3", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "???????????? Viva La Vida Violin ??????",
                                songId: "${songIds[0]}",
                                coverURI: "${env.S3_URI}/violin.mp3",
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
                .expect(200)
            coverIds.push(body.data.uploadCover.coverId)
            equal(typeof body.data.uploadCover.coverId, "string")
        }).timeout(500000)
        it("Successfully uploaded a cover - 4", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "????????? Viva La Vida Violin ??????",
                                songId: "${songIds[0]}",
                                coverURI: "${env.S3_URI}/song1-Drum.mp3",
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
                .expect(200)
            coverIds.push(body.data.uploadCover.coverId)
            equal(typeof body.data.uploadCover.coverId, "string")
        }).timeout(50000)
    })
    describe("Mutation createBand", () => {
        describe("Success", () => {
            it("Successfully create band - 1", async () => {
                const query = `
                    mutation{
                        createBand(
                            input: {
                                band: {
                                    songId:"${songIds[0]}",
                                    introduce:"Test-Band-1",
                                    name:"????????? ??????????????? >.<",
                                    isSoloBand: false
                                },
                                sessionConfig:[
                                    {
                                        session: DRUM,
                                        maxMember:1
                                    },
                                    {
                                        session: VIOLIN,
                                        maxMember:2
                                    }
                                ]
                            }
                        ){
                            bandId
                            name
                            song{
                                name
                                songId
                            }
                            session{
                                position
                            }
                            creator{
                                username
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
                equal(body.data.createBand.name, "????????? ??????????????? >.<")
                equal(body.data.createBand.song.name, "Viva La Vida")
                equal(body.data.createBand.song.songId, songIds[0])
                equal(body.data.createBand.session[0].position, "DRUM")
                equal(body.data.createBand.creator.username, "pukuba")
                equal(body.data.createBand.creator.id, "user1234")
                bandIds.push(body.data.createBand.bandId)
            })
            it("Successfully create band - 2", async () => {
                const query = `
                    mutation{
                        createBand(
                            input: {
                                band: {
                                    songId:"${songIds[0]}",
                                    introduce:"test band - 2",
                                    name:"test band - 2",
                                    isSoloBand: false
                                },
                                sessionConfig:[
                                    {
                                        session: DRUM,
                                        maxMember:1
                                    },
                                    {
                                        session: VIOLIN,
                                        maxMember:2
                                    }
                                ]
                            }
                        ){
                            bandId
                            name
                            song{
                                name
                                songId
                            }
                            session{
                                position
                            }
                            creator{
                                username
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
                equal(body.data.createBand.name, "test band - 2")
                equal(body.data.createBand.song.name, "Viva La Vida")
                equal(body.data.createBand.song.songId, songIds[0])
                equal(body.data.createBand.session[0].position, "DRUM")
                equal(body.data.createBand.creator.username, "pukuba")
                equal(body.data.createBand.creator.id, "user1234")
                bandIds.push(body.data.createBand.bandId)
            })
            it("Successfully create free band - 3", async () => {
                const query = `
                    mutation{
                        createBand(
                            input: {
                                band: {
                                    songId:"${songIds[1]}",
                                    introduce:"test band - 3",
                                    name:"test band - 3",
                                    isSoloBand: true
                                },
                                sessionConfig:[
                                    {
                                        session: DRUM,
                                        maxMember:1
                                    }
                                ]
                            }
                        ){
                            bandId
                            name
                            song {
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
                equal(body.data.createBand.name, "test band - 3")
                equal(body.data.createBand.song.songId, songIds[1])
                bandIds.push(body.data.createBand.bandId)
            })
        })
    })
    describe("Mutation joinBand", () => {
        describe("Success", () => {
            it("Successfully join band - 1", async () => {
                const query = `
                    mutation{
                        joinBand(
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
                equal(body.data.joinBand, true)
            })
            it("Successfully join band - 2", async () => {
                const query = `
                    mutation{
                        joinBand(
                            input: {
                                band:{
                                    bandId:"${bandIds[0]}"
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
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.joinBand, true)
            })
            it("Successfully join band - 3", async () => {
                const query = `
                    mutation{
                        joinBand(
                            input: {
                                band:{
                                    bandId:"${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[1]}",
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
                    .expect(200)
                equal(body.data.joinBand, true)
            })
        })
        describe("Farilure", () => {
            it("Fail to join band - invalid cover", async () => {
                const query = `
                    mutation{
                        joinBand(
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
                equal(body.errors[0].message, "??????????????? ???????????? ????????????")
            })
            it("Fail to join band - user already", async () => {
                const query = `
                    mutation{
                        joinBand(
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
                equal(body.errors[0].message, "?????? ????????? ???????????????")
            })
            it("Fail to join band - undefined bandId", async () => {
                const query = `
                    mutation{
                        joinBand(
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
                equal(body.errors[0].message, "????????? ???????????? ????????????")
            })
            it("Fail to join band - full", async () => {
                const query = `
                    mutation{
                        joinBand(
                            input: {
                                band:{
                                    bandId:"${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[3]}",
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
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "????????? ??????????????? ???????????? ????????????"
                )
            })
        })
    })
    describe("Mutation updateBand", () => {
        describe("Success", () => {
            it("Successfully update band - 1", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "????????? ?????? ????????????!!"
                                }, 
                                sessionConfig:[
                                    {
                                        session: DRUM,
                                        maxMember:1
                                    },
                                    {
                                        session: VIOLIN,
                                        maxMember:2
                                    },
                                    {
                                        session: KEYBOARD,
                                        maxMember:1
                                    }
                                ]
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.updateBand.name, "????????? ?????? ????????????!!")
            })
            it("Successfully update band - 2", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "????????? ?????? ????????????!!"
                                }, 
                            }
                        ){
                            name
                            session {
                                position
                                cover{
                                    songId
                                }
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
                equal(body.data.updateBand.name, "????????? ?????? ????????????!!")
                for (const item of body.data.updateBand.session) {
                    item.cover.forEach((x: Cover) => {
                        equal(x.songId, songIds[0].toString())
                    })
                }
            })
            it("Successfully update band - 3", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}"
                                }, 
                            }
                        ){
                            name
                            session {
                                position
                                cover{
                                    songId
                                }
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
                equal(body.data.updateBand.name, "????????? ?????? ????????????!!")
            })
        })
        describe("Failure", () => {
            it("Fail to update soloband session update", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[2]}"
                                },
                                sessionConfig: []
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "??? ????????? ????????????????????? ?????? ????????? ????????? ??? ????????????"
                )
            })
            it("Fail to update band - invalid bandId", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"111111111111111111111111",
                                    name: "????????? ?????? ????????????!!"
                                }
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "????????? ????????? ????????? ???????????? ????????????"
                )
            })
            it("Fail to update band - permission error", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "????????? ?????? ????????????!!"
                                }
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "????????? ????????? ????????? ???????????? ????????????"
                )
            })
            it("Fail to update band - Incorrect Session Update error - 1", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "????????? ?????? ????????????!!"
                                }, 
                                sessionConfig:[]
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "?????? ????????? ?????? ????????? ????????? ?????? ??????????????????"
                )
            })
            it("Fail to update band - Incorrect Session Update error - 2", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "????????? ?????? ????????????!!"
                                }, 
                                sessionConfig:[{
                                    session: DRUM,
                                    maxMember:0
                                }]
                            }
                        ){
                            name
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.errors[0].message,
                    "?????? ????????? ?????? ????????? ????????? ?????? ??????????????????"
                )
            })
        })
    })
    describe("Query queryBand", () => {
        let cursor = ""
        it("Success to queryBands first data", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: ALL
                        },
                        first: 1
                    ){
                        bands { 
                            name
                        },
                        pageInfo { 
                            endCursor,
                            hasNextPage
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
            equal(body.data.queryBand.pageInfo.hasNextPage, true)
            equal(body.data.queryBand.bands[0].name, "test band - 3")
            cursor = body.data.queryBand.pageInfo.endCursor
        })
        it("Success to queryBand get second data", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: ALL
                        },
                        first: 1,
                        after: "${cursor}"
                    ){
                        bands { 
                            name
                        },
                        pageInfo { 
                            endCursor,
                            hasNextPage
                        }
                    }
                } 
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
            equal(body.data.queryBand.pageInfo.hasNextPage, true)
            equal(body.data.queryBand.bands[0].name, "test band - 2")
        })
        it("Searching by Band creator & sort DATE_ASC", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: INTRODUCE,
                            content: "test",
                            sort: DATE_ASC
                        }
                    ){
                        bands{ 
                            name
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands[0].name, "????????? ?????? ????????????!!")
        })
        it("Searching Band by Song name", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: SONG_NAME,
                            content: "viva",
                            sort: DATE_ASC
                        }
                    ){
                        bands{ 
                            name
                            song{ 
                                name
                            }
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands[0].song.name.includes("Viva"), true)
        })
        it("Searching by Band ALL information", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: ALL,
                            content: "!!"
                        }
                    ){
                        bands{
                            song{ 
                                name
                            }
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands[0].song.name.includes("Viva"), true)
        })
        it("Searching by Band creator & sort DATE_ASC", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: CREATOR_ID,
                            content: "pukuba",
                            sort: DATE_ASC
                        }
                    ){
                        bands{ 
                            name
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands.length, 0)
        })
        it("Searching by Band Name & sort DATE_DESC", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: NAME
                        }
                    ){
                        bands{
                            name
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands[0].name.includes("test"), true)
        })
        it("Searching by Band Song genre", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: NAME,
                            genre: POP,
                            level: 2
                        }
                    ){
                        bands{
                            name
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands.length, 2)
        })
        it("Searching by Band Song genre", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: NAME,
                            isFreeSong: false,
                            weeklyChallenge: false
                        }
                    ){
                        bands{
                            name
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.bands.length, 2)
        })
    })

    describe("Query getRecommendBand", () => {
        it("Get Recommend band", async () => {
            const res1 = await (async () => {
                const query = `
                    query {
                        getRecommendBand{ 
                            bandId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)
                return body
            })()
            const res2 = await (async () => {
                const query = `
                    query {
                        getRecommendBand{ 
                            bandId
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)
                return body
            })()
            for (const item of res1.data.getRecommendBand) {
                const result = res2.data.getRecommendBand.find(
                    (item2: any) => item2.bandId === item.bandId
                )
                equal(result !== undefined, true)
            }
        })
    })

    describe("Query likeStatus", () => {
        it("Get the band likeStatus", async () => {
            const query = `
                query{
                    likeStatus(bandId: "${bandIds[0]}")
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
    describe("Query getBand", () => {
        it("Search for bands with band ID - 1", async () => {
            const query = `
                query{
                    getBand(bandId: "${bandIds[0]}"){
                        name
                        likeCount
                        viewCount
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getBand.name, "????????? ?????? ????????????!!")
            equal(body.data.getBand.viewCount, 1)
        })
        it("Search for bands with band ID - 2", async () => {
            const query = `
                query{
                    getBand(bandId: "${bandIds[0]}"){
                        name
                        likeCount
                        viewCount
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getBand.name, "????????? ?????? ????????????!!")
            equal(body.data.getBand.viewCount, 1)
        })
    })
    describe("Query getSong + band test", () => {
        it("Successfully get band data", async () => {
            const query = `
                query{
                    getSong(
                        songId: "${songIds[0]}"
                    ){
                        songId
                        band {
                            song{
                                songId
                            }
                        }
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getSong.songId, songIds[0])
            equal(body.data.getSong.band[0].song.songId, songIds[0])
        })
    })
    describe("Query getUserInfo", () => {
        it("If you normally bring my information", async () => {
            const query = `
                query{
                    getUserInfo(userId:"user1234"){
                        id
                        username
                        band{
                            bandId
                            song{ 
                                songId
                            }
                            likeCount
                        }
                        library{
                            songId
                            coverBy{
                                id
                            }
                            name
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
            equal(body.data.getUserInfo.band[0].bandId, bandIds[0])
            equal(body.data.getUserInfo.band[0].song.songId, songIds[0])
            body.data.getUserInfo.library.forEach(
                (x: { coverBy: { id: string } }) =>
                    equal(x.coverBy.id, "user1234")
            )
        })
        it("If you normally bring in other people's information", async () => {
            const query = `
                query{
                    getUserInfo(userId:"test1234"){
                        id
                        username
                        band{
                            bandId
                            song{ 
                                songId
                            }
                        }
                        library{
                            songId
                            name
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
            equal(body.data.getUserInfo.band[0].bandId, bandIds[0])
            equal(body.data.getUserInfo.band[0].song.songId, songIds[0])
            equal(body.data.getUserInfo.library, null)
        })
    })
    describe("Mutation leaveBand", () => {
        describe("Failure", () => {
            it("permission error", async () => {
                const query = `
                    mutation{
                        leaveBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[0]}"
                                }
                            }
                        )
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token1)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "????????? ????????????")
            })
            it("nonexistent session", async () => {
                const query = `
                    mutation{
                        leaveBand(
                            input: {
                                band: {
                                    bandId: "111111111111111111111111"
                                },
                                session: {
                                    coverId: "${coverIds[0]}"
                                }
                            }
                        )
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "????????? ???????????? ????????????")
            })
            it("nonexistent cover", async () => {
                const query = `
                    mutation{
                        leaveBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "111111111111111111111111"
                                }
                            }
                        )
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.errors[0].message, "?????? ????????? ???????????? ????????????")
            })
        })
        describe("Success", () => {
            it("Successfully leave band - 1", async () => {
                const query = `
                    mutation{
                        leaveBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[0]}"
                                }
                            }
                        )
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.leaveBand, true)
            })
            it("Successfully leave band - 2", async () => {
                const query = `
                    mutation{
                        leaveBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[0]}"
                                },
                                session: {
                                    coverId: "${coverIds[2]}"
                                }
                            }
                    )
                }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.leaveBand, true)
            })
        })
    })
    describe("Mutation deleteBand", () => {
        describe("Success", () => {
            it("Successfully delete band - 1", async () => {
                const query = `
                    mutation{
                        deleteBand(
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
                equal(body.data.deleteBand, true)
            })
            it("Successfully delete free band - 2", async () => {
                const query = `
                    mutation{
                        deleteBand(
                            input: {
                                band: {
                                    bandId: "${bandIds[2]}"
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
                equal(body.data.deleteBand, true)
            })
        })
        describe("Failure", () => {
            it("nonexistent band", async () => {
                const query = `
                    mutation{
                        deleteBand(
                            input: {
                                band: {
                                    bandId: "111111111111111111111111"
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
                equal(body.data.deleteBand, false)
            })
        })
    })
})
