import { SessionConfig } from "resolvers/app/band/models"

export interface CreateFreeBandInput {
    input: {
        song: {
            name: string
            artist: string
            songURI: URL
        }
        band: {
            name: string
            introduce: string
            backGroundURI: URL
        }
        sessionConfig: SessionConfig[]
    }
}