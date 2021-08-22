import { exec as syncExec } from "child_process"
import util from "util"
import { uploadS3 } from "lib"
import { ApolloError } from "apollo-server-express"
const exec = util.promisify(syncExec)
import { unlink } from "fs"
const deleteFile = util.promisify(unlink)

export const denoiseFilter = async (audioURI: string) => {
    const filename = audioURI.substring(audioURI.lastIndexOf("/") + 1)
    try {
        await exec(`
            ffmpeg -i ${audioURI} -af "arnndn=m=src/lib/mp.rnnn" \
            -c:a alac -strict -2 -b:a 360k \
            ${filename} -y
        `)
        const [a, b] = filename.split(".")
        const result = await uploadS3(filename, `${a}-1.${b}`, "audio/wav")
        deleteFile(filename)
        return result
    } catch (e) {
        deleteFile(filename)
        throw new ApolloError(e)
    }
}

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
        throw new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
}