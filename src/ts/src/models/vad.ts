/** @module models/vad */
import { ONNX } from "../onnx";
import { ONNXModel } from "./base";

/**
 * Silero VAD model
 * @extends ONNXModel
 */
export class SileroVAD extends ONNXModel {
    sampleRate : number;
    speechVadThreshold : number;
    silenceVadThreshold : number;
    silentFramesCount : number;
    silentFrames : number;
    isSpeaking : boolean;
    h : any; // ONNX tensor for hidden state
    c : any; // ONNX tensor for cell state
    sr : any; // ONNX tensor for sample rate
    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     * @param {number} sampleRate - Sample rate of the input audio
     * @param {number} speechVadThreshold - Threshold for speech detection (default: 0.65)
     * @param {number} silenceVadThreshold - Threshold for silence detection (default: 0.4)
     * @param {number} silentFramesCount - Number of silent frames to consider speech ended (default: 10)
     */
    constructor(
        modelPath : string = "/pretrained/silero-vad.onnx",
        sampleRate : number = 16000,
        speechVadThreshold : number = 0.65,
        silenceVadThreshold : number = 0.4,
        silentFramesCount : number = 10,
        power : number = 0,
        webnn : number = 1,
        webgpu : number = 2,
        webgl : number = 3,
        wasm : number = 4,
    ) {
        super(
            modelPath,
            power,
            webnn,
            webgpu,
            webgl,
            wasm,
        );
        this.sampleRate = sampleRate || 16000;
        this.speechVadThreshold = speechVadThreshold;
        this.silenceVadThreshold = silenceVadThreshold;
        this.silentFramesCount = silentFramesCount;
        this.silentFrames = 0;
        this.isSpeaking = false;
    }

    /**
     * Test the model
     * @param {boolean} debug - If true, log the result to the console
     * @throws {Error} - If the model fails the test
     */
    async test(debug = false) {
        let result = await this.run(new Float32Array(16000).fill(0));
        if (!isNaN(result) && 0.0 <= result && result <= 1.0) {
            if (debug) {
                console.log(`VAD model OK, executed in ${this.duration} ms`);
            }
        } else {
            throw new Error(`VAD model failed - got ${result}`);
        }
    }

    /**
     * Execute the model
     * @param {Float32Array} input - Input data
     * @returns {Promise} - Promise that resolves with the output of the model, which is a single float
     * @throws {Error} - If the input data is not a Float32Array
     */
    async execute(input : Float32Array) : Promise<number> {
        if (this.h === undefined || this.c === undefined || this.sr === undefined) {
            this.sr = await ONNX.createTensor("int64", [this.sampleRate], [1]);
            this.h = await ONNX.createTensor("float32", (new Array(128)).fill(0), [2, 1, 64]);
            this.c = await ONNX.createTensor("float32", (new Array(128)).fill(0), [2, 1, 64]);
        }
        const inputTensor = await ONNX.createTensor("float32", input, [1, input.length]);
        if(!this.session) throw new Error("Session not loaded");
        const output = await this.session.run({
            input: inputTensor,
            h: this.h,
            c: this.c,
            sr: this.sr,
        });
        this.c = output.cn;
        this.h = output.hn;
        return output.output.data[0] as number;
    }

    /**
     * Determines if speech is present in the audio with debouncing logic
     * also, if someone speaks, then is quiet for sometime and speaks more
     * that doesn't mean there was no speech in the middle
     * like that whole thing needs to be considered as speech
     * we do this alot lol
     * 
     * @param {Float32Array} audio - Audio data to check for speech
     * @returns {Promise<Object>} - Promise that resolves with an object containing:
     *   - isSpeaking: boolean - true if speech is detected, false otherwise
     *   - probability: number - the raw VAD probability score (0-1)
     */
    async hasSpeechAudio(audio : Float32Array) : Promise<{isSpeaking: boolean, speechProbability: number, justStoppedSpeaking: boolean, justStartedSpeaking: boolean}> {
        // Run VAD on the audio
        const speechProbability = await this.run(audio);
        const hasSpeech         = speechProbability > this.speechVadThreshold;
        const hasSilence        = speechProbability < this.silenceVadThreshold;
        let justStoppedSpeaking = false;
        let justStartedSpeaking = false;
        
        // Update speech state with debouncing
        if (!hasSpeech) {
            if (hasSilence) {
                this.silentFrames += 1;
            
                if (this.isSpeaking && this.silentFrames > this.silentFramesCount) {
                    this.isSpeaking = false;
                    justStoppedSpeaking = true;
                }
            }
        } else {
            this.silentFrames = 0;
            if(!this.isSpeaking){
                this.isSpeaking = true;
                justStartedSpeaking = true;
            }
        }
        
        // Return both the speech state and the probability
        return {
            isSpeaking: this.isSpeaking,
            speechProbability,
            justStoppedSpeaking,
            justStartedSpeaking
        };
    }
}