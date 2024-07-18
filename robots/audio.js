import { fileURLToPath } from "url"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import file from './filehandler.js'
import googleTTS from "google-tts-api"
import AWS from "aws-sdk"
import path from "path"

import { choiceAtRandom } from "./random.js"
import createLogger from "./logger.js"
import state from "./state.js"

const modulePath = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(modulePath)

export default (async () => {
    
    const logger = createLogger("audio")
    const content = state.load()

    logger.log("Starting...")

    await createSpeechAudioForSentences(content)
    await createSpeechAudioForVideo(content)
    await chooseAndManipulateMusic(content)
    await joinMusicWithSpeechAudio(content)

    state.save(content)

    logger.log("Execution finished!")

    async function createSpeechAudioForSentences(content) {
        logger.log("Creating voice speech for sentences...")

        const sentences = content.sentences
       
        for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
            const sentenceText = sentences[sentenceIndex].text
            content.sentences[sentenceIndex].audioFilePath = await createSpeechAudioForSentence(sentenceIndex, sentenceText)
            content.sentences[sentenceIndex].duration = await new Promise((resolve, reject) => {
                ffmpeg.ffprobe(content.sentences[sentenceIndex].audioFilePath, (error, metadata) => {
                    if (error) return reject(error)
                    return resolve(metadata.format.duration)
                })
            })
        }

        async function createSpeechAudioForSentence(sentenceIndex, sentenceText) {
            logger.log(`Creating speech audio for the index sentence: ${sentenceIndex}...`)

            const outputDirPath = path.join(currentDirectory, "..", "content", "new-project", "audios", "sentences")
            if (!fs.existsSync(outputDirPath)) await fs.promises.mkdir(outputDirPath, { recursive: true })
            const outputFileName = `${sentenceIndex}.mp3`
            const outputFilePath = path.join(outputDirPath, outputFileName)

            var createAudioFileWithGooglettsWorks = await createAudioFile(sentenceText,outputFilePath,'Google-tts');

            if(!createAudioFileWithGooglettsWorks){
                await createAudioFile(sentenceText,outputFilePath,'Aws-polly');
            }
            
            logger.log(`Speech audio for the index sentence ${sentenceIndex} created as successfully!`)

            return outputFilePath
        }

        logger.log("Creation of the sentence audios was done successfully!")
    }
    
    async function createAudioFile(text, filePath, providerName, language = "en"){
        let result = true;
        
        try {
        switch (providerName) {
            case 'Google-tts':
                await createAudioFileWithGoogleTTS(text, filePath, language)
              break;
            case 'Aws-polly':
                await createAudioFileWithAWSPolly(text, filePath, language)
              break;
            default:
              result = false;
          }
        }
        catch (error) {
          result = false;
          return result;
        }
        return result;
    }

    function createAudioFileWithGoogleTTS(text, filePath, language = "en") {
        filePath = path.resolve(filePath)

        return new Promise(async (resolve, reject) => {
            const result = await googleTTS.getAllAudioBase64(text, { lang: language })

            const buffers = result.map(result => Buffer.from(result.base64, "base64"))
            const finalBuffer = Buffer.concat(buffers)

            fs.promises.writeFile(filePath, finalBuffer)

            return resolve(filePath)
        })
    }

    async function createAudioFileWithAWSPolly(text, filePath, language = "en") {
        const params = {
            Text: text,
            OutputFormat: "mp3",
            VoiceId: getAWSPollyVoiceId(language)
        }

        let config = await file.readConfigFile('aws.json');
        const { awsAccessKeyId, awsSecretAccessKey, awsRegion } = config; 
        AWS.config.update({
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
            region: awsRegion
        });
    
        const Polly = new AWS.Polly()

        return new Promise((resolve, reject) => {
            Polly.synthesizeSpeech(params, (err, data) => {
                if (err) {
                    console.error("Error when synthesizing speech:", err)
                    return reject(err)
                }

                fs.writeFile(filePath, data.AudioStream, "binary", (writeErr) => {
                    if (writeErr) {
                        console.error("Error writing audio file:", writeErr)
                        reject(writeErr)
                    } else {
                        console.log("Audio file created successfully:", filePath)
                        resolve(filePath)
                    }
                })
            })
        })
    }

    function getAWSPollyVoiceId(language) {
        const languageMap = {
            en: "Joanna",
            pt: "Camila",
            es: "Lucia"
        }
        return languageMap[language] || "Joanna"
    }

    async function createSpeechAudioForVideo(content) {
        logger.log("Putting together audio excerpts from the sentences...")

        const audioFilePaths = []

        for (const sentence of content.sentences) {
            audioFilePaths.push(sentence.audioFilePath)
        }

        const speechAudioFileName = "full-speech-audio.mp3"
        content.speechAudioFilePath = path.join(currentDirectory, "..", "content", "new-project", "audios", speechAudioFileName)

        await mergeAudios(content.speechAudioFilePath, ...audioFilePaths)

        logger.log("Merge of the audios of the sentences done successfully!")
    }

    async function chooseAndManipulateMusic(content) {
        logger.log("Choosing, manipulating and adjusting video music.")

        await chooseAMusic(content)
        await manipuleAMusic(content)

        async function chooseAMusic(content) {
            logger.log("Choosing a song randomly...")

            const musicsDirPath = path.resolve("assets/audios/musics")
            const musicFileNames = await fs.promises.readdir(musicsDirPath)
            const musicFilePaths = musicFileNames.map(musicFileName => path.join(musicsDirPath, musicFileName))
            content.originalMusicFilePath = choiceAtRandom(musicFilePaths)
            console.log(content.originalMusicFilePat); 
            
            logger.log(`Chosen music: ${path.basename(content.originalMusicFilePath)}`)
        }

        async function manipuleAMusic(content) {
            logger.log("Manipulating and adjusting the music...")

            content.manipuledMusicFilePath = path.join(currentDirectory, "..", "content/new-project/audios", "music.mp3")
            await changeAudioVolume(content.originalMusicFilePath, .10, content.manipuledMusicFilePath)

            logger.log("Music set successfully!")
        }
    }

    async function joinMusicWithSpeechAudio(content) {
        logger.log("Merging music with video voice and removing excess music...")

        const outputAudioWithMusicBurrFilePath = path.join(currentDirectory, "..", "content/new-project/audios", "video-audio-with-music-burr.mp3")
        const outputAudioFilePath = path.join(currentDirectory, "..", "content/new-project/audios", "video-audio.mp3")

        const speechAudioDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(content.speechAudioFilePath, (error, metadata) => {
                if (error) reject(error)
                return resolve(
                    Math.ceil(metadata.format.duration)
                )
            })
        })
        
        await joinAudios(content)
        await removeRemainingMusic()

        async function joinAudios(content) {
            logger.log("Merging music with video voice...")

            await composeAudios(
                outputAudioWithMusicBurrFilePath,
                content.speechAudioFilePath,
                content.manipuledMusicFilePath
            )
            
            logger.log("Merge successful!")
        }

        async function removeRemainingMusic() {
            logger.log("Cutting out part of the excess music...")

            await cutAudio(
                outputAudioWithMusicBurrFilePath,
                0,
                speechAudioDuration,
                outputAudioFilePath
            )

            logger.log("Successfully cut!")
        }
    }
    
    function composeAudios(outputFilePath, ...audioFilePaths) {
        return new Promise((resolve, reject) => {
            const audio = ffmpeg()
                .on("error", (error) => {
                    console.log(error)
                    return reject(
                        new Error(`Error composing the audios: ${error.message}`)
                    )
                })
                .on("end", () => {
                    return resolve()
                })
        
                for (let i = 0; i < audioFilePaths.length; i++) {
                    audio.input(audioFilePaths[i])
                }
        
                audio.complexFilter(`[0:a][1:a]amix=inputs=${audioFilePaths.length}:duration=longest`)
    
            audio.save(outputFilePath)
        })
    }
    
    function mergeAudios(outputFilePath, ...audioFilePaths) {
        return new Promise((resolve, reject) => {
            const audio = ffmpeg()
                .on("error", (error) => {
                    reject(
                        new Error(`Error when joining the audios: ${error.message}`)
                    )
                })
                .on("end", () => {
                    resolve()
                })
    
            for (const audioFilePath of audioFilePaths) {
                audio.input(audioFilePath)
            }
      
            audio.mergeToFile(outputFilePath)
        })
    }
      
    function changeAudioVolume(inputPath, volume, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(inputPath)
                .audioFilters(`volume=${volume}`)
                .on("error", (error) => {
                    return reject(
                    new Error(`Erro ao alterar o volume: ${error.message}`)
                    )
                })
                .on("end", () => {
                    return resolve()
                })
                .output(outputPath)
                .run()
        })
    }
    
    function cutAudio(inputPath, startTime, duration, outputPath) {
        return new Promise((resolve, reject) => {
          ffmpeg()
            .input(inputPath)
            .setStartTime(startTime)
            .setDuration(duration)
            .on("error", (error) => {
                return reject(
                    new Error(`Error cutting audio: ${error.message}`)
                )
            })
            .on("end", () => {
                return resolve("Audio successfully cut!")
            })
            .output(outputPath)
            .run()
        })
    }
})