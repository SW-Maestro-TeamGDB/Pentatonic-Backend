import request from "supertest"
import app from "test"

import fetch from "node-fetch"
import env from "config/env"
import { deepStrictEqual as equal } from "assert"

const fileUpload = (query: string, variables: { [x: string]: string }) => {
    const map = Object.assign({}, Object.keys(variables).map(key => [`variables.${key}`]))
    const response = request(app)
        .post("/api")
        .set("Content-Type", "multipart/form-data")
        .field("operations", JSON.stringify({ query }))
        .field("map", JSON.stringify(map))

    Object.values(variables).forEach((value, i) => {
        response.attach(`${i}`, value)
    })
    return response
}

const uri: string[] = []
describe("Penta-Tonic Song Services test", () => {
    describe("Mutation uploadDefaultFile", () => {
        describe("Failure", () => {
            it("If the code is not correct", async () => {
                const { body } = await fileUpload(`
                    mutation($file: Upload!) {
                        uploadDefaultFile(
                            code: "test-code",
                            file: $file
                        )
                    }`, {
                    file: "src/test/test.jpg"
                }).expect(200)
                equal(body.errors[0].message, "관리자 코드가 알맞지 않습니다")
            })
        })
        describe("Success", () => {
            it(".mp3 file is uploaded normally", async () => {
                const { body } = await fileUpload(`
                    mutation($file: Upload!) {
                        uploadDefaultFile(
                            code: "${env.JWT_SECRET}",
                            file: $file
                        )
                    }`, {
                    file: "src/test/song1-Drum.mp3"
                }).expect(200)
                uri.push(body.data.uploadDefaultFile)
                const result = await fetch(body.data.uploadDefaultFile, {
                    method: "GET"
                })
                equal(result.status, 200)
            })
            it(".jpg file is uploaded normally", async () => {
                const { body } = await fileUpload(`
                    mutation($file: Upload!) {
                        uploadDefaultFile(
                            code: "${env.JWT_SECRET}",
                            file: $file
                        )
                    }`, {
                    file: "src/test/test.jpg"
                }).expect(200)
                uri.push(body.data.uploadDefaultFile)
                const result = await fetch(body.data.uploadDefaultFile, {
                    method: "GET"
                })
                equal(result.status, 200)
            })
        })
    })
    describe("Mutation uploadSong", () => {
        describe("Failure", () => {
            it("If the code is not correct", async () => {
                const query = `
                    mutation{
                        uploadSong(
                            code: "test-code",
                            song: {
                                name: "name",
                                songURI: "${uri[0]}",
                                songImg: "${uri[1]}",
                                genre: "Pop",
                                artist: "artist",
                                weeklyChallenge: false,
                                level: 2
                            }
                        ){
                            id
                            songURI
                            songImg
                        }
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)

                equal(body.errors[0].message, "관리자 코드가 알맞지 않습니다")
            })
        })
        describe("Success", () => {
            it("Successfully uploaded a song", async () => {
                const query = `
                    mutation{
                        uploadSong(
                            code: "${env.JWT_SECRET}",
                            song: {
                                name: "name",
                                songURI: "${uri[0]}",
                                songImg: "${uri[1]}",
                                genre: "Pop",
                                artist: "artist",
                                weeklyChallenge: false,
                                level: 2
                            }
                        ){
                            id
                            songURI
                            name
                            level
                            songImg
                        }
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)

                equal(body.data.uploadSong.songURI, uri[0])
                equal(body.data.uploadSong.songImg, uri[1])
                equal(body.data.uploadSong.name, "name")
                equal(body.data.uploadSong.level, 2)
            })
        })
    })
})