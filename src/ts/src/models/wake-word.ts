/** @module models/wake-word */
import { ONNX, TypedTensor } from "../onnx";
import { ONNXModel } from "./base";
import type { InferenceSession } from "onnxruntime-web";

/**
 * Wake Word model
 * @extends ONNXModel
 */
export class WakeWord extends ONNXModel {
    threshold : number;
    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     * @param {number} threshold - Threshold for wake word detection (default: 0.5)
     */
    constructor(
        modelPath : string,
        threshold : number,
        power : number = 0,
        webnn : number = 1,
        webgpu : number = 2,
        webgl : number = 3,
        wasm : number = 4
    ) {
        super(modelPath, power, webnn, webgpu, webgl, wasm);
        this.threshold = threshold;
    }

    /**
     * Test the model
     * @param {boolean} debug - Whether to log debug messages
     * @throws {Error} - If the model test fails
     */
    async test(debug = false) {

        const embeddings = await ONNX.createTensor(
            "float32",
            new Float32Array(16*96).fill(0),
            [1, 16, 96]
        );
        const output : number = await this.run(embeddings);
        if (0.0 <= output && output <= 1.0) {
            if (debug) {
                console.log(`Wake Word model OK, executed in ${this.duration} ms`);
            }
        } else {
            throw new Error(`Wake Word model test failed - expected 0 <= x <= 1, got ${output}`);
        }
    }

    /**
     * Execute the model
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise} - Promise that resolves with the output of the model, which is a single float
     * @throws {Error} - If the input data is not a Float32Array
     */
    async execute(embeddings : any) : Promise<number> {
        const input = {
            input : null
        } as {[key: string]: null | TypedTensor<"string">};

        if (embeddings.dims.length === 3) {
            input.input = embeddings;
        } else {
            input.input = await ONNX.createTensor(
                "float32",
                embeddings.data,
                [1, embeddings.dims[0], embeddings.dims[1]]
            ) as TypedTensor<"string">;
        }
        if(!this.session) throw new Error("Session not loaded");

        const output = await this.session.run(input as InferenceSession.OnnxValueMapType);
        return (output.output.data[0] as number) * 1;
    }

    /**
     * Check if the wake word is detected based on the threshold
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise<Object>} - Promise that resolves with an object containing probability and detected status
     */
    async checkWakeWordCalled(embeddings : Float32Array) {
        const probability = await this.run(embeddings);

        return {
            probability,
            detected: probability >= this.threshold
        };
    }

    /**
     * Run wake word detection on audio.
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWordPresent(embeddings : Float32Array) : Promise<number> {
        return await this.execute(embeddings);
    }
}
