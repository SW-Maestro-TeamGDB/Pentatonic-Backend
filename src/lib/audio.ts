import { exec as syncExec } from "child_process"
import util from "util"
import { uploadS3 } from "lib"
import { ApolloError } from "apollo-server-express"
const exec = util.promisify(syncExec)
import { unlink } from "fs"
const deleteFile = util.promisify(unlink)
export const mergeAudios = async (audios: string[], audioName: string) => {
    const ffmpegInputs = audios.map((uri: string) => `-i ${uri}`)
        .toString()
        .split(",")
        .join(" ")
    try {
        await exec(`
            ffmpeg ${ffmpegInputs} \\
            -filter_complex amix=inputs=${audios.length}:duration=first:dropout_transition=3,volume=3 \\
            -c:a ${audioName.endsWith(".wav") ? 'pcm_s16le -strict -2' : 'mp3 -strict -2 -b:a 320k'} \\
            ${audioName} -y
        `)
        if (audioName.endsWith(".wav")) {
            const result = await uploadS3(audioName, audioName, "audio/wav")
            deleteFile(audioName)
            return result
        }
        if (audioName.endsWith(".mp3")) {
            const result = await uploadS3(audioName, audioName, "audio/mpeg")
            deleteFile(audioName)
            return result
        }

    } catch (e) {
        deleteFile(audioName)
        return new ApolloError(e)
    }
}

import { getAudioDurationInSeconds } from "get-audio-duration"

export const getAudioDuration = async (uri: string): Promise<number> => {
    try {
        const duration = await getAudioDurationInSeconds(uri)
        if (duration < 10) throw ""
        return duration
    } catch {
        return 0
    }
}