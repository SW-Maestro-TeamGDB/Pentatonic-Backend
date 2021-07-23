import request from "supertest"
import app from "test"
import fetch from "node-fetch"
import env from "config/env"
import { Db } from "mongodb"
import DB from "config/connectDB"
import { deepStrictEqual as equal } from "assert"
import * as Redis from "config/connectRedis"

const songIds: string[] = []
const coverURI: string[] = []
const coverIds: string[] = []
const phoneNumber = `+8210${(env.PHONE_NUMBER as string).slice(3, (env.PHONE_NUMBER as string).length)}`
let token: string = ""

const fileUpload = (query: string, variables: { [x: string]: string }, token: string) => {
    const map = Object.assign({}, Object.keys(variables).map(key => [`variables.${key}`]))
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
        const db = await DB.get() as Db
        await Promise.all([
            db.collection("user").deleteMany({}),
            db.collection("song").deleteMany({}),
            db.collection("library").deleteMany({})
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
                                    genre: "Pop",
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
                const { body } = await fileUpload(query, {
                    file: "src/test/viva/drum.mp3"
                }, token)
                coverURI.push(body.data.uploadCoverFile)
            })
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
                const { body } = await fileUpload(query, {
                    file: "src/test/test.jpg"
                }, token)
                equal(body.errors[0].message, "mp3, m4a 파일이 아닙니다")
            })
        })
    })
    describe("Mutation uploadCover", () => {
        describe("Success", () => {
            it("Successfully uploaded a cover - 1", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "승원이의 Viva La Vida Drum 커버",
                                    songId: "${songIds[0]}",
                                    coverURI: "${coverURI[0]}"
                                }
                            }
                        ){
                            name
                            creatorId
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
                equal(body.data.uploadCover.name, "승원이의 Viva La Vida Drum 커버")
                equal(body.data.uploadCover.songId, songIds[0])
                equal(body.data.uploadCover.coverURI, coverURI[0])
                equal(body.data.uploadCover.creatorId, "user1234")
                coverIds.push(body.data.uploadCover.coverId)
                equal(typeof body.data.uploadCover.coverId, "string")
            })
            it("Successfully uploaded a cover - 2", async () => {
                const query = `
                    mutation {
                        uploadCover(
                            input: {
                                cover: {
                                    name: "승원이의 Viva La Vida Drum 커버 - 2",
                                    songId: "${songIds[0]}",
                                    coverURI: "${coverURI[0]}"
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
                                    coverURI: "https://naver.com"
                                }
                            }
                        ){
                            name
                            creatorId
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
                equal(body.errors[0].message, "음원 파일을 정상적으로 읽지 못했습니다")
            })
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
                                    name: "Viva La Vida Drum 커버",
                                    coverId: "${coverIds[0]}"
                                }
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
                equal(body.data.updateCover.name, "Viva La Vida Drum 커버")
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
                equal(body.data.updateCover.name, "Viva La Vida Drum 커버")
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
    })
})