export interface Song {
    songURI: URL
    name: string
    songImg: URL
    genre: SongGenres
    artist: string
    weeklyChallenge: boolean
    playTime: number
    level: number
}

const SongGenres = {
    Pop: "Pop",
    Rock: "Rock",
    Rap: "Rap",
    Ballad: "Ballad"
} as const

type SongGenres = typeof SongGenres[keyof typeof SongGenres]