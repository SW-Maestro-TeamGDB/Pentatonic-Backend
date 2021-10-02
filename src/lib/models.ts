export interface PositionRank {
    position?: string
    likeCount: number
}

export interface RemakeAudioInput {
    position: string
    audioURI: string
    syncDelay: number
    echoDelay: number
    echoDecays: number
}
