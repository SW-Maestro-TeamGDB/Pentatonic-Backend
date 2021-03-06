import request from "supertest"
import app from "test"
import env from "config/env"
import { Db } from "mongodb"
import DB from "config/connectDB"
import { deepStrictEqual as equal } from "assert"
import * as Redis from "config/connectRedis"

const songIds: string[] = []
const coverURI: string[] = []
const coverIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(
    3,
    (env.PHONE_NUMBER as string).length
)}`
let token = ""

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
    return response.expect(200)
}

describe("Library services test", () => {
    after(async () => {
        const db = (await DB.get()) as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({}),
        ])
    })
    describe("Before Register & upload", () => {
        it("mock user register", async () => {
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
    })
    describe("Mutation uploadCoverFile", () => {
        describe("Success", () => {
            it("Successfully uploaded a cover file", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadCoverFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/viva/drum.mp3",
                    },
                    token
                )
                coverURI.push(body.data.uploadCoverFile)
            }).timeout(50000)
        })
        describe("Failure", () => {
            it("Fail to upload a cover file extensions error", async () => {
                const query = `
                    mutation($file: Upload!){
                        uploadCoverFile(
                            input: {
                                file: $file
                            }
                        )
                    }`
                const { body } = await fileUpload(
                    query,
                    {
                        file: "src/test/test.jpg",
                    },
                    token
                )
                equal(body.errors[0].message, "mp3 ????????? ????????????")
            })
        })
    })
    describe("Mutation uploadCover", () => {
        describe("Success", () => {
            it("Successfully uploaded a cover .mp3 - 1", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "???????????? Viva La Vida Drum ??????",
                                    songId: "${songIds[0]}",
                                    coverURI: "${coverURI[0]}",
                                    position: DRUM
                                },
                                filter: {
                                    reverb: 3.2,
                                    syncDelay: -0.123
                                }
                            }
                        ){
                            name
                            coverBy{ 
                                id
                            }
                            songId
                            coverURI
                            coverId
                            position
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
                    body.data.uploadCover.name,
                    "???????????? Viva La Vida Drum ??????"
                )
                equal(body.data.uploadCover.songId, songIds[0])
                equal(body.data.uploadCover.coverBy.id, "user1234")
                equal(body.data.uploadCover.position, "DRUM")
                coverIds.push(body.data.uploadCover.coverId)
                equal(typeof body.data.uploadCover.coverId, "string")
            }).timeout(500000)
            it("Successfully uploaded a cover .mp3 - 2", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "???????????? Viva La Vida Drum ?????? - 2",
                                    songId: "${songIds[0]}",
                                    coverURI: "${coverURI[0]}",
                                    position: DRUM
                                },
                                filter: {
                                    reverb: 3.2,
                                    syncDelay: -0.123
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
            }).timeout(50000)
            it("Successfully uploaded a cover .mp3 - 3", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "???????????? Viva La Vida Violin ?????? - 1",
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
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                coverIds.push(body.data.uploadCover.coverId)
                equal(typeof body.data.uploadCover.coverId, "string")
            }).timeout(50000)
            it("Successfully uploaded a cover .mp3 - 1", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "???????????????????????????????????????",
                                    songId: "${songIds[0]}",
                                    coverURI: "${env.S3_URI}/result.mp3",
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
                equal(typeof body.data.uploadCover.coverId, "string")
            }).timeout(50000)
        })
        describe("Failure", () => {
            it("Fail to upload a cover", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "hawawa cover",
                                    songId: "111111111111111111111111",
                                    coverURI: "https://naver.com",
                                    position: VOCAL
                                }
                            }
                        ){
                            name
                            songId
                            coverURI
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
                equal(
                    body.errors[0].message,
                    "?????? ????????? ??????????????? ?????? ???????????????"
                )
            })
            it("invalid coverURI", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "hawawa cover",
                                    songId: "${songIds[0]}",
                                    coverURI: "${env.S3_URI}/mr-1.wav",
                                    position: VOCAL
                                }
                            }
                        ){
                            name
                            songId
                            coverURI
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
                equal(body.errors[0].message, "mp3 ????????? ????????? ???????????????")
            }).timeout(50000)
            it("invalid songId", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "hawawa cover",
                                    songId: "111111111111111111111111",
                                    coverURI: "${env.S3_URI}/result.mp3",
                                    position: VOCAL
                                }
                            }
                        ){
                            name
                            songId
                            coverURI
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
                equal(body.errors[0].message, "???????????? ?????? songId ?????????")
            }).timeout(50000)
        })
    })
    describe("Mutation updateCover", () => {
        describe("Success", () => {
            it("Successfully updated a cover - 1", async () => {
                const query = `
                    mutation {
                        updateCover(
                            input: {
                                cover: {
                                    name: "Viva La Vida Drum ??????",
                                    position: DRUM,
                                    coverId: "${coverIds[0]}"
                                }
                            }
                        ){
                            position
                            name
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
                equal(body.data.updateCover.position, "DRUM")
                equal(body.data.updateCover.name, "Viva La Vida Drum ??????")
                equal(body.data.updateCover.coverId, coverIds[0])
            })
            it("Successfully updated a cover - 2", async () => {
                const query = `
                    mutation {
                        updateCover(
                            input: {
                                cover: {
                                    coverId: "${coverIds[0]}"
                                }
                            }
                        ){
                            position
                            name
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
                equal(body.data.updateCover.position, "DRUM")
                equal(body.data.updateCover.name, "Viva La Vida Drum ??????")
                equal(body.data.updateCover.coverId, coverIds[0])
            })
        })
    })
    describe("Mutation deleteCover", () => {
        describe("Success", () => {
            it("Successfully deleted a cover", async () => {
                const query = `
                    mutation {
                        deleteCover(
                            input: {
                                cover: {
                                    coverId: "${coverIds[1]}"
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
                equal(body.data.deleteCover, true)
            })
        })
        describe("Failure", () => {
            it("cover is undefined", async () => {
                const query = `
                    mutation {
                        deleteCover(
                            input: {
                                cover: {
                                    coverId: "111111111111111111111111"
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
                equal(body.errors[0].message, "??????????????? ?????????????????????")
            })
        })
    })
    describe("Query queryCover", () => {
        describe("Success", () => {
            it("Successfully queried a cover filter type = ALL sort = DATE_ASC", async () => {
                const query = `
                    query {
                        queryCover(
                            filter: {
                                type: ALL,
                                sort: DATE_ASC
                            }
                        ){
                            name
                            date
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                const nowDate = new Date().getTime()
                equal(
                    nowDate - new Date(body.data.queryCover[0].date).getTime() <
                        100000,
                    true
                )
                equal(body.data.queryCover[0].name, "Viva La Vida Drum ??????")
            })
            it("Successfully queried a cover filter type = NAME", async () => {
                const query = `
                    query {
                        queryCover(
                            filter: {
                                type: NAME,
                                content: "??????"
                            }
                        ){
                            name
                            song {
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
                equal(
                    body.data.queryCover[0].name,
                    "???????????? Viva La Vida Violin ?????? - 1"
                )
                equal(body.data.queryCover[0].song.name, "Viva La Vida")
            })
            it("Successfully queried a cover filter type = NAME & empty content", async () => {
                const query = `
                    query {
                        queryCover(
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
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(
                    body.data.queryCover[0].name,
                    "???????????????????????????????????????"
                )
            })
            it("Successfully queried a cover filter type = POSITION", async () => {
                const query = `
                    query {
                        queryCover(
                            filter: {
                                type: POSITION,
                                content: "DRUM"
                            }
                        ){
                            name
                            coverId
                            position
                        }
                    }
                `
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .set("Authorization", token)
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.queryCover[0].position, "DRUM")
                equal(
                    body.data.queryCover[0].name,
                    "???????????????????????????????????????"
                )
            })
            it("Successfully queried a cover type = SONG_ID - 1", async () => {
                const query = `
                    query {
                        queryCover(
                            filter: {
                                type: SONG_ID,
                                content: "111111111111111111111111"
                            }
                        ){
                            name
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
                equal(body.data.queryCover.length, 0)
            })
            it("Successfully queried a cover type = SONG_ID - 2", async () => {
                const query = `
                    query {
                        queryCover(
                            filter: {
                                type: SONG_ID,
                                content: "${songIds[0]}"
                            }
                        ){
                            name
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
                equal(
                    body.data.queryCover[0].name,
                    "???????????????????????????????????????"
                )
            })
        })
    })
    describe("Query queryCover", () => {
        it("successfully getCover query", async () => {
            const query = `
                query {
                    getCover(
                        coverId: "${coverIds[0]}"
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
            equal(body.data.getCover.coverId, coverIds[0])
        })
    })
})
