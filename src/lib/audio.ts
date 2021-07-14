import { exec as syncExec } from "child_process"
import util from "util"
import { uploadS3 } from "lib"
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
            await uploadS3(audioName, audioName, "audio/wav")
        }
        if (audioName.endsWith(".mp3")) {
            await uploadS3(audioName, audioName, "audio/mpeg")
        }
        deleteFile(audioName)
        return true
    } catch {
        deleteFile(audioName)
        return false
    }
}

import { getAudioDurationInSeconds } from "get-audio-duration"

export const getAudioDuration = async (uri: string): Promise<number> => await getAudioDurationInSeconds(uri)