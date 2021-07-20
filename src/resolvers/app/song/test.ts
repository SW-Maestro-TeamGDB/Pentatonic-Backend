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
const songIds: string[] = []
const instrumentIds: string[] = []
describe("Penta-Tonic music Services", () => {
    describe("Upload Services test", () => {
        describe("Mutation uploadDefaultFile", () => {
            describe("Failure", () => {
                it("If the code is not correct", async () => {
                    const { body } = await fileUpload(`
                        mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "test-code",
                                    file: $file
                                }
                            )
                        }`, {
                        file: "src/test/test.jpg"
                    }).expect(200)
                    equal(body.errors[0].message, "관리자 코드가 알맞지 않습니다")
                }).timeout(50000)
            })
            describe("Success", () => {
                it(".mp3 file is uploaded normally", async () => {
                    const { body } = await fileUpload(`
                        mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    file: $file
                                }
                            )
                        }`, {
                        file: "src/test/viva/violin.mp3"
                    }).expect(200)
                    uri.push(body.data.uploadDefaultFile)
                    const result = await fetch(body.data.uploadDefaultFile, {
                        method: "GET"
                    })
                    equal(result.status, 200)
                }).timeout(50000)
                it(".jpg file is uploaded normally", async () => {
                    const { body } = await fileUpload(`
                        mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    file: $file
                                }
                            )
                        }`, {
                        file: "src/test/test.jpg"
                    }).expect(200)
                    uri.push(body.data.uploadDefaultFile)
                    const result = await fetch(body.data.uploadDefaultFile, {
                        method: "GET"
                    })
                    equal(result.status, 200)
                }).timeout(50000)
            })
        })
    })
    describe("Song Services test", () => {
        describe("Mutation uploadSong", () => {
            describe("Success", () => {
                it("Successfully uploaded a song", async () => {
                    const query = `
                        mutation{
                            uploadSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "name",
                                        songURI: "${uri[0]}",
                                        songImg: "${uri[1]}",
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
                                songURI
                                releaseDate
                                songImg
                                name
                                level
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
                    songIds.push(body.data.uploadSong.songId)
                })
            })
            describe("Failure", () => {
                it("If the code is not correct", async () => {
                    const query = `
                        mutation{
                            uploadSong(
                                input: {
                                    code: "test-code",
                                    song: {
                                        name: "name",
                                        songURI: "${uri[0]}",
                                        songImg: "${uri[1]}",
                                        genre: "Pop",
                                        artist: "artist",
                                        weeklyChallenge: false,
                                        releaseDate: "2008-06-12",
                                        level: 2,
                                        album: "Viva la Vida or Death and All His Friends"
                                    }
                                }
                            ){
                                songId
                                songURI
                                releaseDate
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
                it("If you didn't read the sound source file normally", async () => {
                    const query = `
                        mutation{
                            uploadSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "name",
                                        songURI: "${uri[1]}",
                                        songImg: "${uri[1]}",
                                        genre: "Pop",
                                        artist: "artist",
                                        weeklyChallenge: false,
                                        releaseDate: "2008-06-12",
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
                    equal(body.errors[0].message, "음원 파일을 정상적으로 읽지 못했습니다")
                })
            })
        })
        describe("Mutation update song", () => {
            describe("Success", () => {
                it("Successfully updated a song", async () => {
                    const query = `
                        mutation{
                            updateSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "Viva La Vida",
                                        songId: "${songIds[0]}",
                                        songURI: "${env.S3_URI}/result.mp3",
                                        songImg: "${uri[1]}",
                                        genre: "Pop",
                                        artist: "Coldplay",
                                        weeklyChallenge: true,
                                        releaseDate: "2008-06-12",
                                        level: 3,
                                        album: "Viva la Vida or Death and All His Friends"
                                    }
                                }
                            ){
                                songId
                                songURI
                                releaseDate
                                songImg
                                name
                                level
                                releaseDate
                                instrument{
                                    instId
                                }
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.updateSong.songURI, env.S3_URI + "/result.mp3")
                    equal(body.data.updateSong.songId, songIds[0])
                    equal(body.data.updateSong.songImg, uri[1])
                    equal(body.data.updateSong.name, "Viva La Vida")
                    equal(body.data.updateSong.level, 3)
                    equal(body.data.updateSong.releaseDate, "2008-06-12")
                })
            })
            describe("Failure", () => {
                it("If you didn't read the sound source file normally", async () => {
                    const query = `
                        mutation{
                            updateSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "Viva La Vida",
                                        songId: "${songIds[0]}",
                                        songURI: "${uri[1]}",
                                        songImg: "${uri[1]}",
                                        genre: "Pop",
                                        artist: "Coldplay",
                                        weeklyChallenge: true,
                                        releaseDate: "2008-06-12",
                                        level: 3,
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
                    equal(body.errors[0].message, "음원 파일을 정상적으로 읽지 못했습니다")
                })
            })
        })
    })
    describe("Instrument Services test", () => {
        describe("Mutation uploadInstrument", async () => {
            describe("Success", () => {
                it("If you normally upload the instrument", async () => {
                    const query = `
                        mutation{
                            uploadInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "viva la vida demo guitar",
                                        instrumentURI: "${env.S3_URI}/song1-Guitar.mp3",
                                        songId: "${songIds[0]}"
                                    }
                                }
                            ){
                                instId
                                songId
                                instrumentURI
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.uploadInstrument.songId, songIds[0])
                    equal(body.data.uploadInstrument.instrumentURI, `${env.S3_URI}/song1-Guitar.mp3`)
                    equal(body.data.uploadInstrument.name, "viva la vida demo guitar")
                    instrumentIds.push(body.data.uploadInstrument.instId)
                })
            })
            describe("Failure", () => {
                it("If you didn't read the sound source file normally", async () => {
                    const query = `
                        mutation{
                            uploadInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "viva la vida demo guitar",
                                        instrumentURI: "${uri[1]}",
                                        songId: "${songIds[0]}"
                                    }
                                }
                            ){
                                    instId
                                    songId
                                    instrumentURI
                                    name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "음원 파일을 정상적으로 읽지 못했습니다")
                })
            })
        })
        describe("Mutation updateInstrument", () => {
            describe("Success", () => {
                it("Successfully updated an instrument", async () => {
                    const query = `
                        mutation{
                            updateInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "Viva La Vida demo Drum",
                                        instId: "${instrumentIds[0]}",
                                        instrumentURI: "${env.S3_URI}/song1-Drum.mp3",
                                        songId: "${songIds[0]}"
                                    }
                                }
                            ){
                                instId
                                songId
                                instrumentURI
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)

                    equal(body.data.updateInstrument.songId, songIds[0])
                    equal(body.data.updateInstrument.instrumentURI, `${env.S3_URI}/song1-Drum.mp3`)
                    equal(body.data.updateInstrument.name, "Viva La Vida demo Drum")
                    equal(body.data.updateInstrument.instId, instrumentIds[0])
                })
            })
            describe("Failure", () => {
                it("If you didn't read the sound source file normally", async () => {
                    const query = `
                        mutation{
                            updateInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "viva la vida demo guitar",
                                        instId: "${instrumentIds[0]}",
                                        instrumentURI: "${uri[1]}",
                                        songId: "${songIds[0]}"
                                    }
                                }
                            ){
                                instId
                                songId
                                instrumentURI
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.errors[0].message, "음원 파일을 정상적으로 읽지 못했습니다")
                })
            })
        })
    })
})