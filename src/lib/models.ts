import { ObjectID } from "mongodb"

export interface PositionRank {
    position?: string
    likeCount: number
}

export interface RemakeAudioInput {
    position: string
    audioURI: string
    syncDelay: number
    reverb: number
}

export interface BandJoinMessageInput {
    username: string
    bandname: string
    bandId: string | ObjectID
    token: string
}
