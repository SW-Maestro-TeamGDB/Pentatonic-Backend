import request from "supertest"
import app from "test"
import fetch from "node-fetch"
import env from "config/env"
import { Db } from "mongodb"
import { deepStrictEqual as equal } from "assert"
import DB from "config/connectDB"
const fileUpload = (query: string, variables: { [x: string]: string }) => {
    const map = Object.assign(
        {},
        Object.keys(variables).map((key) => [`variables.${key}`])
    )
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
describe("Penta-Tonic Song Services", () => {
    after(async () => {
        const db = (await DB.get()) as Db
        await Promise.all([
            db.collection("song").deleteMany({}),
            db.collection("instrument").deleteMany({}),
        ])
    })
    describe("Upload Services test", () => {
        describe("Mutation uploadDefaultFile", () => {
            describe("Failure", () => {
                it("If the code is not correct", async () => {
                    const { body } = await fileUpload(
                        `mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "test-code",
                                    file: $file
                                }
                            )
                        }`,
                        {
                            file: "src/test/test.jpg",
                        }
                    ).expect(200)
                    equal(
                        body.errors[0].message,
                        "관리자 코드가 알맞지 않습니다"
                    )
                }).timeout(50000)
            })
            describe("Success", () => {
                it(".mp3 file is uploaded normally", async () => {
                    const { body } = await fileUpload(
                        `
                        mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    file: $file
                                }
                            )
                        }`,
                        {
                            file: "src/test/viva/violin.mp3",
                        }
                    ).expect(200)
                    uri.push(body.data.uploadDefaultFile)
                    const result = await fetch(body.data.uploadDefaultFile, {
                        method: "GET",
                    })
                    equal(result.status, 200)
                }).timeout(50000)
                it(".jpg file is uploaded normally", async () => {
                    const { body } = await fileUpload(
                        `
                        mutation($file: Upload!) {
                            uploadDefaultFile(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    file: $file
                                }
                            )
                        }`,
                        {
                            file: "src/test/test.jpg",
                        }
                    ).expect(200)
                    uri.push(body.data.uploadDefaultFile)
                    const result = await fetch(body.data.uploadDefaultFile, {
                        method: "GET",
                    })
                    equal(result.status, 200)
                }).timeout(50000)
            })
        })
    })
    describe("Song Services test", () => {
        describe("Mutation uploadSong", () => {
            describe("Success", () => {
                it("Successfully uploaded a song - 1", async () => {
                    const query = `
                        mutation{
                            uploadSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "name",
                                        songURI: "${uri[0]}",
                                        songImg: "${uri[1]}",
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
                it("Successfully uploaded a song - 2", async () => {
                    const query = `
                        mutation{
                            uploadSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        name: "name",
                                        songURI: "${uri[0]}",
                                        songImg: "${uri[1]}",
                                        genre: POP,
                                        artist: "artist",
                                        weeklyChallenge: false,
                                        releaseDate: "2019-01-01",
                                        level: 2,
                                        album: "Viva la Vida or Death and All His Friends",
                                        lyrics: "test lyrics~~"
                                    }
                                }
                            ){
                                songId
                                songURI
                                releaseDate
                                songImg
                                name
                                level
                                lyrics
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
                    equal(body.data.uploadSong.lyrics, "test lyrics~~")
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
                                        genre: POP,
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

                    equal(
                        body.errors[0].message,
                        "관리자 코드가 알맞지 않습니다"
                    )
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
                                        genre: POP,
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
                    equal(
                        body.errors[0].message,
                        "음원 파일을 정상적으로 읽지 못했습니다"
                    )
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
                                        genre: POP,
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
                    equal(
                        body.data.updateSong.songURI,
                        env.S3_URI + "/result.mp3"
                    )
                    equal(body.data.updateSong.songId, songIds[0])
                    equal(body.data.updateSong.songImg, uri[1])
                    equal(body.data.updateSong.name, "Viva La Vida")
                    equal(body.data.updateSong.level, 3)
                    equal(body.data.updateSong.releaseDate, "2008-06-12")
                })
                it("If nothing is updated", async () => {
                    const query = `
                        mutation{
                            updateSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        songId: "${songIds[0]}"
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
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.data.updateSong.songURI,
                        env.S3_URI + "/result.mp3"
                    )
                    equal(body.data.updateSong.songId, songIds[0])
                    equal(body.data.updateSong.songImg, uri[1])
                    equal(body.data.updateSong.name, "Viva La Vida")
                    equal(body.data.updateSong.level, 3)
                    equal(body.data.updateSong.releaseDate, "2008-06-12")
                })
                it("If only one update is made", async () => {
                    const query = `
                        mutation{
                            updateSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        songId: "${songIds[0]}",
                                        name: "Viva La Vida"
                                    }
                                }
                            ){
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.updateSong.name, "Viva La Vida")
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
                                        genre: POP,
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
                    equal(
                        body.errors[0].message,
                        "음원 파일을 정상적으로 읽지 못했습니다"
                    )
                })
            })
        })
    })
    describe("Instrument Services test", () => {
        describe("Mutation uploadInstrument", async () => {
            describe("Success", () => {
                it("If you normally upload the instrument - 1", async () => {
                    const query = `
                        mutation{
                            uploadInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "viva la vida demo guitar",
                                        instURI: "${env.S3_URI}/song1-Guitar.mp3",
                                        songId: "${songIds[0]}",
                                        position: ACOUSTIC_GUITAR
                                    }
                                }
                            ){
                                instId
                                songId
                                instURI
                                name
                                position
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.uploadInstrument.songId, songIds[0])
                    equal(
                        body.data.uploadInstrument.instURI,
                        `${env.S3_URI}/song1-Guitar.mp3`
                    )
                    equal(
                        body.data.uploadInstrument.name,
                        "viva la vida demo guitar"
                    )
                    equal(
                        body.data.uploadInstrument.position,
                        "ACOUSTIC_GUITAR"
                    )
                    instrumentIds.push(body.data.uploadInstrument.instId)
                })
                it("If you normally upload the instrument - 2", async () => {
                    const query = `
                        mutation{
                            uploadInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        name: "name",
                                        instURI: "${env.S3_URI}/song1-Guitar.mp3",
                                        songId: "${songIds[1]}",
                                        position: ELECTRIC_GUITAR
                                    }
                                }
                            ){
                                instId
                                songId
                                instURI
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.uploadInstrument.songId, songIds[1])
                    equal(
                        body.data.uploadInstrument.instURI,
                        `${env.S3_URI}/song1-Guitar.mp3`
                    )
                    equal(body.data.uploadInstrument.name, "name")
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
                                        instURI: "${uri[1]}",
                                        songId: "${songIds[0]}",
                                        position: ACOUSTIC_GUITAR
                                    }
                                }
                            ){
                                    instId
                                    songId
                                    instURI
                                    name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "음원 파일을 정상적으로 읽지 못했습니다"
                    )
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
                                        instURI: "${env.S3_URI}/song1-Drum.mp3",
                                        songId: "${songIds[0]}",
                                        position: DRUM
                                    }
                                }
                            ){
                                instId
                                songId
                                instURI
                                name
                                position
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)

                    equal(body.data.updateInstrument.songId, songIds[0])
                    equal(
                        body.data.updateInstrument.instURI,
                        `${env.S3_URI}/song1-Drum.mp3`
                    )
                    equal(
                        body.data.updateInstrument.name,
                        "Viva La Vida demo Drum"
                    )
                    equal(body.data.updateInstrument.instId, instrumentIds[0])
                    equal(body.data.updateInstrument.position, "DRUM")
                })
                it("If nothing is updated", async () => {
                    const query = `
                        mutation{
                            updateInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        instId: "${instrumentIds[0]}"
                                    }
                                }
                            ){
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.data.updateInstrument.name,
                        "Viva La Vida demo Drum"
                    )
                })
                it("If only one update is made normally", async () => {
                    const query = `
                        mutation{
                            updateInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        instId: "${instrumentIds[0]}",
                                        name: "Viva La Vida demo Guitar"
                                    }
                                }
                            ){
                                name
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.data.updateInstrument.name,
                        "Viva La Vida demo Guitar"
                    )
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
                                        instURI: "${uri[1]}",
                                        songId: "${songIds[0]}"
                                    }
                                }
                            ){
                                instId
                                songId
                                instURI
                            }
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(
                        body.errors[0].message,
                        "음원 파일을 정상적으로 읽지 못했습니다"
                    )
                })
            })
        })
        describe("Mutation deleteSong", () => {
            describe("Success", () => {
                it("Successfully deleted a song", async () => {
                    const query = `
                        mutation{
                            deleteSong(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    song: {
                                        songId: "${songIds[1]}"
                                    }
                                }
                            )
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.deleteSong, true)
                })
            })
        })
        describe("Mutation deleteInstrument", () => {
            describe("Success", () => {
                it("Successfully deleted an instrument", async () => {
                    const query = `
                        mutation{
                            deleteInstrument(
                                input: {
                                    code: "${env.JWT_SECRET}",
                                    instrument: {
                                        instId: "${instrumentIds[1]}"
                                    }
                                }
                            )
                        }`
                    const { body } = await request(app)
                        .post("/api")
                        .set("Content-Type", "application/json")
                        .send(JSON.stringify({ query }))
                        .expect(200)
                    equal(body.data.deleteInstrument, true)
                })
            })
        })
    })
    describe("Query test", () => {
        describe("Query querySong", () => {
            it("Get all songs sorted by date asc", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: ALL,
                                sort: DATE_ASC
                            }
                        ){
                            name
                            songId
                            instrument {
                                songId
                            }
                        }
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.querySong[0].name, "Viva La Vida")
                equal(
                    body.data.querySong[0].songId,
                    body.data.querySong[0].instrument[0].songId
                )
            })
            it("Get all songs sorted by date desc", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: ALL,
                                sort: DATE_DESC
                            }
                        ){
                            name
                        }
                    }`
                const { body } = await request(app)
                    .post("/api")
                    .set("Content-Type", "application/json")
                    .send(JSON.stringify({ query }))
                    .expect(200)
                equal(body.data.querySong[0].name, "Viva La Vida")
            })

            it("Get song using name filter", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: NAME,
                                content: "viva"
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
                equal(body.data.querySong[0].name, "Viva La Vida")
            })

            it("Get song using name & level & genre filter", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: NAME,
                                content: "viva",
                                genre: POP,
                                level: 3
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
                equal(body.data.querySong[0].name, "Viva La Vida")
            })
            it("Get song using artist filter", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: ARTIST,
                                content: "cold"
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
                equal(body.data.querySong[0].name, "Viva La Vida")
            })
            it("Get song using empty artist filter", async () => {
                const query = `
                    query{
                        querySong(
                            filter: {
                                type: ARTIST
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
                equal(body.data.querySong[0].name, "Viva La Vida")
            })
        })
        describe("Query getSong", () => {
            it("request getSong - 1", async () => {
                const query = `
                query{
                    getSong(
                        songId: "${songIds[0]}"
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
                equal(body.data.getSong.name, "Viva La Vida")
            })
        })
    })
})
