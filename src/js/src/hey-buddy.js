/** @module hey-buddy */
import { ONNX } from "./onnx.js";
import { AudioBatcher } from "./audio.js";
import {
    SileroVAD,
    SpeechEmbedding,
    MelSpectrogram,
    WakeWord
} from "./models.js";

/**
 * Combines an array of embedding buffers into a single embedding tensor.
 *
 * @async
 * @function
 * @param {Float32Array[]} embeddingBufferArray - An array of embedding buffers, where each buffer is a Float32Array.
 * @param {number} numFramesPerEmbedding - The number of frames per embedding.
 * @param {number} embeddingDim - The dimensionality of each embedding.
 * @returns {Promise<Object>} A promise that resolves to an ONNX tensor containing the combined embeddings.
 */
async function embeddingBufferArrayToEmbedding(embeddingBufferArray, numFramesPerEmbedding, embeddingDim){
    // Create empty buffer of the right size
    const combinedEmptyData = new Float32Array(numFramesPerEmbedding * embeddingBufferArray.length * embeddingDim);
    
    // Create tensor with the empty buffer
    const embeddingBuffer = await ONNX.createTensor(
        "float32",
        combinedEmptyData,
        [numFramesPerEmbedding * embeddingBufferArray.length, embeddingDim]
    );

    // Fill the buffer with data
    for (let i = 0; i < embeddingBufferArray.length; i++) {
        const embedding = embeddingBufferArray[i];
        embeddingBuffer.data.set(embedding.data, i * numFramesPerEmbedding * embeddingDim);
    }
    return embeddingBuffer;
}

/**
 * HeyBuddy class for running wake word detection.
 */
export class HeyBuddy {
    /**
     * Create a HeyBuddy instance.
     * @param {Object} [options] - Options object.
     * @param {number} [options.positiveVadThreshold=0.5] - VAD threshold for speech.
     * @param {number} [options.negativeVadThreshold=0.25] - VAD threshold for silence.
     * @param {number} [options.negativeVadCount=8] - Number of negative VADs to trigger silence.
     * @param {number} [options.wakeWordThreads=4] - Number of threads for wake word detection.
     * @param {number} [options.wakeWordThreshold=0.5] - Wake word detection threshold.
     * @param {string|string[]} [options.modelPath="/models/hey-buddy.onnx"] - Path to wake word model.
     * @param {string} [options.vadModelPath="/pretrained/silero-vad.onnx"] - Path to VAD model.
     * @param {string} [options.embeddingModelPath="/pretrained/speech-embedding.onnx"] - Path to speech embedding model.
     * @param {string} [options.spectrogramModelPath="/pretrained/mel-spectrogram.onnx"] - Path to mel spectrogram model.
     * @param {number} [options.batchSeconds=1.08] - Number of seconds per batch.
     * @param {number} [options.batchIntervalSeconds=0.12] - Number of seconds between batches.
     * @param {number} [options.targetSampleRate=16000] - Target sample rate for audio.
     * @param {number} [options.spectrogramMelBins=32] - Number of mel bins for spectrogram.
     * @param {number} [options.embeddingDim=96] - Dimension of speech embedding.
     * @param {number} [options.embeddingWindowSize=76] - Window size for speech embedding.
     * @param {number} [options.embeddingWindowStride=8] - Window stride for speech embedding.
     */
    constructor (options) {
        options = options || {};
        // Get options or use defaults for runtime
        this.debug = options.debug || false;
        options.positiveVadThreshold = options.positiveVadThreshold || 0.65;
        options.negativeVadThreshold = options.negativeVadThreshold || 0.4;
        options.negativeVadCount = options.negativeVadCount || 8;
        this.wakeWordThreads = options.wakeWordThreads || 4;
        this.wakeWordThreshold = options.wakeWordThreshold || 0.5;
        this.wakeWordInterval = options.wakeWordInterval || 2.0; // How often a wake word can be uttered

        // Get options or use defaults for models
        const modelPath = options.modelPath || "/models/hey-buddy.onnx";
        const modelArray = Array.isArray(modelPath) ? modelPath : [modelPath];
        const vadModelPath = options.vadModelPath || "/pretrained/silero-vad.onnx";
        const embeddingModelPath = options.embeddingModelPath || "/pretrained/speech-embedding.onnx";
        const spectrogramModelPath = options.spectrogramModelPath || "/pretrained/mel-spectrogram.onnx";
        const batchSeconds = options.batchSeconds || 1.08; // 1080ms * 16khz = 17280 samples
        const batchIntervalSeconds = options.batchIntervalSeconds || 0.12; // 120ms * 16khz = 1920 samples
        const targetSampleRate = options.targetSampleRate || 16000;
        const spectrogramMelBins = options.spectrogramMelBins || 32;
        const embeddingDim = options.embeddingDim || 96;
        const embeddingWindowSize = options.embeddingWindowSize || 76;
        const embeddingWindowStride = options.embeddingWindowStride || 8;
        const wakeWordEmbeddingFrames = options.wakeWordEmbeddingFrames || 16;

        // Initialize shared models
        this.vad = new SileroVAD(vadModelPath, this.targetSampleRate, options.positiveVadThreshold, options.negativeVadThreshold, options.negativeVadCount);
        this.vad.test(this.debug);

        this.spectrogram = new MelSpectrogram(spectrogramModelPath);
        this.spectrogram.test(this.debug);
        this.spectrogramMelBins = spectrogramMelBins;

        this.embedding = new SpeechEmbedding(
            embeddingModelPath,
            embeddingDim,
            embeddingWindowSize,
            embeddingWindowStride,
        );
        this.embedding.test(this.debug);
        this.embeddingDim = embeddingDim;
        this.embeddingWindowSize = embeddingWindowSize;
        this.embeddingWindowStride = embeddingWindowStride;
        this.embeddingBuffer = null;
        this.embeddingBufferArray = []

        // Initialize wake word models
        this.wakeWords = {};
        this.wakeWordTimes = {};
        this.wakeWordEmbeddingFrames = wakeWordEmbeddingFrames;
        for (let model of modelArray) {
            let modelName = model.split("/").pop().split(".")[0];
            this.wakeWords[modelName] = new WakeWord(model, this.wakeWordThreshold);
            this.wakeWords[modelName].test(this.debug);
        }

        // Initialize state
        this.recording = false;
        this.audioBuffer = null;
        this.frameIntervalEma = 0;
        this.frameIntervalEmaWeight = 0.1;
        this.frameTimeEma = 0;
        this.frameTimeEmaWeight = 0.1;

        this.speechStartCallbacks = [];
        this.speechEndCallbacks = [];
        this.recordingCallbacks = [];
        this.processedCallbacks = [];
        this.detectedCallbacks = [];

        // Initialize batcher and add callback
        this.batcher = new AudioBatcher(
            batchSeconds,
            batchIntervalSeconds,
            targetSampleRate
        );
        this.batcher.onBatch((batch) => this.process(batch));
    }

    /**
     * Gets the names of wake words, chunked for threaded wake word detection.
     * @returns {string[][]} - Names of wake words.
     */
    get chunkedWakeWords() {
        return Object.keys(this.wakeWords).reduce((carry, name, i) => {
            const chunkIndex = Math.floor(i / this.wakeWordThreads);
            if (!carry[chunkIndex]) {
                carry[chunkIndex] = [];
            }
            carry[chunkIndex].push(name);
            return carry;
        }, []);
    }

    /**
     * Add a callback for when a wake word is detected.
     * @param {string|string[]} names - Name of wake word.
     * @param {Function} callback - Callback function.
     */
    onDetected(names, callback) {
        this.detectedCallbacks.push({names, callback});
    }

    /**
     * Add a callback for processed data.
     * @param {Function} callback - Callback function.
     */
    onProcessed(callback) {
        this.processedCallbacks.push(callback);
    }

    /**
     * Add a callback for speech start.
     * @param {Function} callback - Callback function.
     */
    onSpeechStart(callback) {
        this.speechStartCallbacks.push(callback);
    }

    /**
     * Add a callback for speech end.
     * @param {Function} callback - Callback function.
     */
    onSpeechEnd(callback) {
        this.speechEndCallbacks.push(callback);
    }

    /**
     * Add a callback for recording.
     * @param {Function} callback - Callback function.
     */
    onRecording(callback) {
        this.recordingCallbacks.push(callback);
    }

    /**
     * Trigger speech start event.
     */
    speechStart() {
        if (this.debug) {
            console.log("Speech start");
        }
        for (let callback of this.speechStartCallbacks) {
            callback();
        }
    }

    /**
     * Trigger speech end event.
     */
    speechEnd() {
        if (this.debug) {
            console.log("Speech end");
        }
        for (let callback of this.speechEndCallbacks) {
            callback();
        }
        if (this.recording) {
            this.dispatchRecording();
            this.recording = false;
        }
    }

    /**
     * Dispatch recording to all recording callbacks.
     */ 
    dispatchRecording() {
        if (this.audioBuffer === null) {
            console.error("No recording to dispatch");
            return;
        }
        if (this.debug) {
            const recordingLength = this.audioBuffer.length;
            const recordedDuration = recordingLength / this.batcher.targetSampleRate;
            console.log(`Dispatching recording with ${recordingLength} frames (${recordedDuration} s)`);
        }
        for (let callback of this.recordingCallbacks) {
            callback(this.audioBuffer);
        }
        this.audioBuffer = null;
    }

    /**
     * Trigger wake word detection event.
     * @param {string} name - Name of wake word.
     */
    wakeWordDetected(name) {
        const now = Date.now();
        if (this.wakeWordTimes[name] && (now - this.wakeWordTimes[name]) < this.wakeWordInterval * 1000) {
            return;
        }
        if (this.debug) {
            console.log("Wake word detected:", name);
        }
        this.recording = true;
        this.wakeWordTimes[name] = now;

        for (let {names, callback} of this.detectedCallbacks) {
            if (Array.isArray(names) && names.includes(name) || names === name) {
                callback();
            }
        }
    }

    /**
     * Trigger processed event.
     * @param {Object} data - Processed data.
     */
    processed(data) {
        for (let callback of this.processedCallbacks) {
            callback(data);
        }
    }

    /**
     * Runs wake word detection on a subset of wake words.
     * @param {string[]} wakeWordNames - Names of wake words to check.
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWordSubset(wakeWordNames) {
        return await Promise.all(
            wakeWordNames.map(name => this.wakeWords[name].checkWakeWordCalled(this.embeddingBuffer))
        );
    }

    /**
     * Run wake word detection on audio.
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWords() {
        const returnMap = {};
        for (let nameChunk of this.chunkedWakeWords) {
            const wakeWordsCalled = await this.checkWakeWordSubset(nameChunk);
            for (let i = 0; i < nameChunk.length; i++) {
                const name = nameChunk[i];
                const wordCalled = wakeWordsCalled[i];
                returnMap[name] = wordCalled;
            }
        }
        for (let name in returnMap) {
            if (returnMap[name].detected) {
                this.wakeWordDetected(name);
            }
        }
        return returnMap;
    }

    /**
     * Process audio batch.
     * @param {Float32Array} audio - Audio samples.
     */
    async process(audio) {
        // Start timer
        this.frameStart = (new Date()).getTime();

        if (this.frameEnd !== undefined && this.frameEnd !== null) {
            this.frameInterval = this.frameStart - this.frameEnd;
        } else {
            this.frameInterval = 0;
        }
        if (this.frameIntervalEma === 0) {
            this.frameIntervalEma = this.frameInterval;
        } else {
            this.frameIntervalEma = this.frameIntervalEma * (1 - this.frameIntervalEmaWeight) + this.frameInterval * this.frameIntervalEmaWeight;
        }

        // Get the last batch of samples
        const lastBatch = audio.subarray(audio.length - this.batcher.batchIntervalSamples);

        // Calculate the spectrogram for this buffer, assert it is exactly one window
        const spectrograms = await this.spectrogram.run(audio);
        const embedding = await this.embedding.getEmbeddingFromMelSpectrogramOutput(spectrograms);
        const numFramesPerEmbedding = embedding.dims[0];
        const maxEmbeddings = this.wakeWordEmbeddingFrames/numFramesPerEmbedding;


        // We want to run it via a "window" of audio samples at a time
        // so we add a new element, remove the first element, then analyze the new section of audio
        // (or rather audio embeddings) to see if the voice keyword is detected there
        this.embeddingBufferArray.push(embedding);
        if (this.embeddingBufferArray.length > maxEmbeddings) this.embeddingBufferArray.shift();

        this.embeddingBuffer = await embeddingBufferArrayToEmbedding(this.embeddingBufferArray, numFramesPerEmbedding, this.embeddingDim);
        const {isSpeaking, speechProbability, justStoppedSpeaking, justStartedSpeaking} = await this.vad.hasSpeechAudio(lastBatch);

        if(justStartedSpeaking) this.speechStart();
        if(justStoppedSpeaking) this.speechEnd();

        if (isSpeaking && this.embeddingBuffer.dims[0] === this.wakeWordEmbeddingFrames) {
            // If we're listening, run wake word detection
            const wakeWordsCalled = await this.checkWakeWords();
            // Trigger callbacks with processed data
            this.processed({
                listening: true,
                recording: this.recording,
                speech: {probability: speechProbability, active: isSpeaking},
                wakeWords: wakeWordsCalled
            });
        } else {
            // Trigger callbacks right away if we're not listening
            this.processed({
                listening: false,
                recording: this.recording,
                speech: {probability: speechProbability, active: isSpeaking},
                wakeWords: Object.entries(this.wakeWords).reduce(
                    (carry, [name, model]) => {
                        carry[name] = {
                            probability: 0.0,
                            active: false
                        };
                        return carry;
                    },
                    {}
                )
            });
        }

        // If we're recording, append audio to buffer
        if (this.recording) {
            if (this.audioBuffer === null) {
                this.audioBuffer = new Float32Array(audio.length);
                this.audioBuffer.set(audio);
            } else {
                const concatenated = new Float32Array(this.audioBuffer.length + lastBatch.length);
                concatenated.set(this.audioBuffer);
                concatenated.set(lastBatch, this.audioBuffer.length);
                this.audioBuffer = concatenated;
            }
        }

        // Stop timer
        this.frameEnd = (new Date()).getTime();
        this.frameTime = this.frameEnd - this.frameStart;
        if (this.frameTimeEma === 0) {
            this.frameTimeEma = this.frameTime;
        } else {
            this.frameTimeEma = this.frameTimeEma * (1 - this.frameTimeEmaWeight) + this.frameTime * this.frameTimeEmaWeight;
        }
    }
};

if (typeof window !== "undefined") {
    window.HeyBuddy = HeyBuddy;
}