import { exec as syncExec } from "child_process"
import util from "util"
import { uploadS3 } from "lib"
import { ApolloError } from "apollo-server-express"
import { RemakeAudioInput } from "lib"
const exec = util.promisify(syncExec)
import { unlink } from "fs"
const deleteFile = util.promisify(unlink)

export const remakeAudio = async (args: RemakeAudioInput) => {
    const { audioURI, reverb, syncDelay, position } = args
    const filename = audioURI.substring(audioURI.lastIndexOf("/") + 1)
    const filenameSplit = filename.split(".")
    if (!audioURI.endsWith("mp3")) {
        throw new ApolloError("mp3 파일만 업로드 가능합니다")
    }
    /*
    ffmpeg -i src/test/viva/result.mp3 -i src/lib/church.mp3 \
    -ss 1 
    ffmpeg -ss 0.1233 -i cover.mp3 -i src/lib/church.mp3 \
    -filter_complex '[0] [1] afir=dry=6:wet=6 [reverb];
        [0] [reverb] amix=inputs=2:weights=1;
        arnndn=m=src/lib/mp.rnnn[1];
        [0] volume=3[0]' \
    -c:a libmp3lame -strict -2 -b:a 360k \
    test.mp3 -y
     */
    const ss = syncDelay < 0 ? ` -ss ${syncDelay * -1}` : ""
    const noiseFilter =
        position !== "DRUM" ? "arnndn=m=src/lib/mp.rnnn[1];" : ""
    try {
        await exec(`
            ffmpeg ${ss} -i '${audioURI}' -i src/lib/church.mp3 \
            -filter_complex '[0] [1] afir=dry=${reverb}:wet=${reverb} [reverb];
                [0] [reverb] amix=inputs=2:weights=1;
                ${noiseFilter} [0] volume=3[0]' \
            -c:a libmp3lame -strict -2 -b:a 360k \
            ${filenameSplit[filenameSplit.length - 2]}.mp3 -y
        `)
        const result = await uploadS3(
            `${filenameSplit[filenameSplit.length - 2]}.mp3`,
            `${filenameSplit[filenameSplit.length - 2]}.mp3`,
            "audio/mpeg"
        )
        deleteFile(`${filenameSplit[filenameSplit.length - 2]}.mp3`)
        return result
    } catch (e) {
        console.log(e)
        deleteFile(`${filenameSplit[filenameSplit.length - 2]}.mp3`)
        throw new ApolloError("음원 정제 실패")
    }
}

export const mergeAudios = async (audios: string[], audioName: string) => {
    const ffmpegInputs = audios
        .map((uri: string) => `-i ${uri}`)
        .toString()
        .split(",")
        .join(" ")
    try {
        await exec(`
            ffmpeg ${ffmpegInputs} \\
            -filter_complex amix=inputs=${
                audios.length
            }:duration=first:dropout_transition=3,volume=3 \\
            -c:a ${
                audioName.endsWith(".wav")
                    ? "pcm_s16le -strict -2"
                    : "mp3 -strict -2 -b:a 192k"
            } \\
            ${audioName} -y
        `)
        const result = await uploadS3(audioName, audioName, "audio/mpeg")
        deleteFile(audioName)
        return result
    } catch (e) {
        deleteFile(audioName)
        return new ApolloError("audio merge error")
    }
}

import { getAudioDurationInSeconds } from "get-audio-duration"

export const getAudioDuration = async (uri: string): Promise<number> => {
    try {
        const duration = await getAudioDurationInSeconds(uri)
        if (duration < 5) throw ""
        return duration
    } catch {
        throw new ApolloError("음원 파일을 정상적으로 읽지 못했습니다")
    }
}
