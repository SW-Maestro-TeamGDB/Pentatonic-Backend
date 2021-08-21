import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
import * as Redis from "config/connectRedis"
import { Cover } from "resolvers/app/library/models"

const songIds: string[] = []
const coverIds: string[] = []
const bandIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""
let token1: string = ""
describe("Band services test", () => {
    after(async () => {
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({}),
            db.collection("band").deleteMany({}),
            db.collection("session").deleteMany({}),
            db.collection("join").deleteMany({}),
            db.collection("like").deleteMany({})
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
        it("Successfully uploaded a cover - 1", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "승원이의 Viva La Vida Drum 커버",
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
                .set("Authorization", token)
                .send(JSON.stringify({ query }))
                .expect(200)
            coverIds.push(body.data.uploadCover.coverId)
            equal(typeof body.data.uploadCover.coverId, "string")
        })
        it("Successfully uploaded a cover - 2", async () => {
            const query = `
                mutation {
                    uploadCover(
                        input: {
                            cover: {
                                name: "승원이의 Viva La Vida Violin 커버",
                                songId: "${songIds[0]}",
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
                                name: "승원이의 Viva La Vida Violin 커버",
                                songId: "${songIds[0]}",
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
                                name: "잉잉의 Viva La Vida Violin 커버",
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
        })
    })
    describe("Mutation createBand", () => {
        describe("Success", () => {
            it("Successfully create band", async () => {
                const query = `
                    mutation{
                        createBand(
                            input: {
                                band: {
                                    songId:"${songIds[0]}",
                                    introduce:"Test-Band-1",
                                    name:"테스트 밴드입니다 >.<"
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
                equal(body.data.createBand.name, "테스트 밴드입니다 >.<")
                equal(body.data.createBand.song.name, "Viva La Vida")
                equal(body.data.createBand.song.songId, songIds[0])
                equal(body.data.createBand.session[0].position, "DRUM")
                equal(body.data.createBand.creator.username, "pukuba")
                equal(body.data.createBand.creator.id, "user1234")
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
                equal(body.errors[0].message, "커버내역이 존재하지 않습니다")
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
                equal(body.errors[0].message, "이미 참여한 유저입니다")
            })
            it("Fail to join band - undfined bandId", async () => {
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
                equal(body.errors[0].message, "밴드가 존재하지 않습니다")
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
                equal(body.errors[0].message, "세션이 가득찾거나 존재하지 않습니다")
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
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.data.updateBand.name, "테스트 밴드 업데이트!!")
            })
            it("Successfully update band - 2", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.data.updateBand.name, "테스트 밴드 업데이트!!")
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
                equal(body.data.updateBand.name, "테스트 밴드 업데이트!!")
            })
        })
        describe("Failure", () => {
            it("Fail to update band - invalid bandId", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"111111111111111111111111",
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.errors[0].message, "권한이 없거나 밴드가 올바르지 않습니다")
            })
            it("Fail to update band - permission error", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.errors[0].message, "권한이 없거나 밴드가 올바르지 않습니다")
            })
            it("Fail to update band - Incorrect Session Update error - 1", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.errors[0].message, "현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요")
            })
            it("Fail to update band - Incorrect Session Update error - 2", async () => {
                const query = `
                    mutation{
                        updateBand(
                            input: {
                                band: {
                                    bandId:"${bandIds[0]}",
                                    name: "테스트 밴드 업데이트!!"
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
                equal(body.errors[0].message, "현재 세션에 있는 유저를 없앤뒤 다시 수정해주세요")
            })
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
    describe("Query queryBand", () => {
        it("Searching by Band Name & sort DATE_DESC", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: NAME
                        }
                    ){
                        name
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand[0].name.includes("테스트 밴드"), true)
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
                        name
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand.length, 0)
        })
        it("Searching by Band introduce & sort DATE_ASC", async () => {
            const query = `
                query{
                    queryBand(
                        filter: {
                            type: INTRODUCE,
                            content: "test",
                            sort: DATE_ASC
                        }
                    ){
                        name
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.queryBand[0].name, "테스트 밴드 업데이트!!")
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
        it("Search for bands with band ID", async () => {
            const query = `
                query{
                    getBand(bandId: "${bandIds[0]}"){
                        name
                        likeCount
                    }
                }
            `
            const { body } = await request(app)
                .post("/api")
                .set("Content-Type", "application/json")
                .send(JSON.stringify({ query }))
                .expect(200)
            equal(body.data.getBand.name, "테스트 밴드 업데이트!!")
            equal(body.data.getBand.likeCount, 1)
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
                    getUserInfo{
                        id
                        username
                        band{
                            bandId
                            songId
                            likeCount
                        }
                        library{
                            songId
                            coverBy
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
            equal(body.data.getUserInfo.band[0].songId, songIds[0])
            equal(body.data.getUserInfo.band[0].likeCount, 1)
            body.data.getUserInfo.library.forEach((x: { coverBy: string }) => equal(x.coverBy, "user1234"))
        })
        it("If you normally bring in other people's information", async () => {
            const query = `
                query{
                    getUserInfo(userId:"test1234"){
                        id
                        username
                        band{
                            bandId
                            songId
                        }
                        library{
                            songId
                            coverBy
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
            equal(body.data.getUserInfo.band[0].songId, songIds[0])
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
                equal(body.errors[0].message, "권한이 없습니다")
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
                equal(body.errors[0].message, "세션이 존재하지 않습니다")
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
                equal(body.errors[0].message, "해당 커버가 존재하지 않습니다")
            })
        })
        describe("Success", () => {
            it("Successfully out band - 1", async () => {
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
            it("Successfully out band - 2", async () => {
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