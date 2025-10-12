/** @module models/speech-embedding */
import { ONNX, TypedTensor } from "../onnx";
import { ONNXModel } from "./base";

/**
 * Speech Embedding model
 * get ths embeddings from a mel spectogram
 * @extends ONNXModel
 */
export class SpeechEmbedding extends ONNXModel {
    embeddingDim : number;
    windowSize : number;
    windowStride : number;

    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     * @param {MelSpectrogram} spectrogramModel - Mel spectrogram model
     * @param {number} spectrogramMelBins - Number of Mel bins for the Mel spectrogram model
     * @param {number} embeddingDim - Dimension of the embeddings
     * @param {number} windowSize - Size of the window
     * @param {number} windowStride - Stride of the window
     */
    constructor(
        modelPath : string,
        embeddingDim : number = 96,
        windowSize : number = 76,
        windowStride : number = 8,
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
            wasm
        );
        this.embeddingDim = embeddingDim;
        this.windowSize = windowSize;
        this.windowStride = windowStride;
    }

    /** 
     * Test the model
     * @param {boolean} debug - Debug mode
     * @throws {Error} - If the model fails the test
     */
    async test(debug = false) {
        const melTensor = await ONNX.createTensor(
            "float32",
            new Float32Array(new Array(100 * 32).fill(0)),
            [100, 32]
        );
        let result = await this.run(melTensor);
        if (result.dims.length === 2 && 
            result.dims[0] === 4 &&
            result.dims[1] === 96
        ) {
            if (debug) {
                console.log(`Speech embedding model OK, executed in ${this.duration} ms`);
            }
        } else {
            console.error("Unexpected speech embedding result", result);
            throw new Error("Speech embedding model failed");
        }
    }

    /**
     * Extracts speech embeddings from a mel spectrogram output
     * 
     * This function takes the output from a mel spectrogram model, creates an ONNX tensor
     * with the appropriate dimensions, and runs it through the speech embedding model to
     * generate embeddings that can be used for wake word detection.
     * 
     * @param {Object} melSpectogramOutput - The output tensor from a mel spectrogram model
     * @param {Float32Array} melSpectogramOutput.data - The raw data from the mel spectrogram
     * @param {Array<number>} melSpectogramOutput.dims - The dimensions of the mel spectrogram output
     * @returns {Promise<Object>} - A promise that resolves to an ONNX tensor containing the speech embeddings
     */
    async getEmbeddingFromMelSpectrogramOutput(melSpectogramOutput : {data: Float32Array, dims: number[]}) : Promise<any> {
        const spectogramBuffer = await ONNX.createTensor(
            "float32",
            melSpectogramOutput.data,
            melSpectogramOutput.dims.slice(2)
        );

        return this.run(spectogramBuffer);
    }

    /**
     * Execute the model
     * @param {TypedTensor} input - Input data
     * @returns {Promise} - Promise that resolves with the output of the model, which is a 2D array
     * @throws {Error} - If the input data is not a Float32Array
     */
    async execute(spectrograms : TypedTensor<"float32">) : Promise<any> {
        const [numFrames, melBins] = spectrograms.dims;
        if (numFrames < this.windowSize) {
            throw new Error(`Audio is too short to process - require ${this.windowSize} samples, got ${numFrames}`);
        }
        // Calculate the number of batches
        const numTruncatedFrames = numFrames - (numFrames - this.windowSize) % this.windowStride;
        const numBatches = (numTruncatedFrames - this.windowSize) / this.windowStride + 1;

        // Create buffer for output
        const embeddings = await ONNX.createTensor(
            "float32",
            (new Array(numBatches * this.embeddingDim)).fill(0),
            [numBatches, this.embeddingDim]
        );

        // Iterate through windows
        const windowBatches = [];
        for (
            let windowStart = 0;
            windowStart < numTruncatedFrames - this.windowSize + this.windowStride;
            windowStart += this.windowStride
        ) {
            const windowEnd = windowStart + this.windowSize;
            const windowTensor = await ONNX.createTensor(
                "float32",
                spectrograms.data.slice(windowStart * melBins, windowEnd * melBins),
                [this.windowSize, melBins, 1]
            );
            windowBatches.push([windowStart, windowEnd, windowTensor]);
        }

        // Restack windows into a single tensor
        const stackedWindowTensor = await ONNX.createTensor(
            "float32",
            new Float32Array(numBatches * this.windowSize * melBins),
            [numBatches, this.windowSize, melBins, 1]
        );
        for (let i = 0; i < numBatches; i++) {
            // @ts-expect-error
            (stackedWindowTensor.data as Float32Array).set(windowBatches[i][2].data, i * this.windowSize * melBins);
        }

        if(!this.session) throw new Error("Session not loaded");

        // Execute the model
        // TODO: Determine why this takes so much longer in the browser than it does in python
        const output = await this.session.run({ input_1: stackedWindowTensor });

        for (let i = 0; i < numBatches; i++) {
            (embeddings.data as Float32Array).set(
                (output.conv2d_19.data as Float32Array).slice(
                    i * this.embeddingDim,
                    (i + 1) * this.embeddingDim
                ),
                i * this.embeddingDim
            );
        }
        return embeddings;
    }
}
