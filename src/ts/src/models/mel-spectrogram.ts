/** @module models/mel-spectrogram */
import { ONNX } from "../onnx";
import { ONNXModel } from "./base";

/**
 * Mel spectrogram model
 * @extends ONNXModel
 */
export class MelSpectrogram extends ONNXModel {
    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     */
    constructor(
        modelPath : string = "/pretrained/mel-spectrogram.onnx",
        power : number = 0,
        webnn  = 1,
        webgpu = 2,
        webgl = 3,
        wasm = 4,
    ) {
        super(
            modelPath,
            power,
            webnn,
            webgpu,
            webgl,
            wasm,
        );
    }

    /**
     * Test the model
     * @param {boolean} debug - If true, print debug information
     * @throws {Error} - If the model fails the test
     */
    async test(debug = false) {
        let result = await this.run(new Float32Array(12640).fill(1.0));
        if (result.dims.length === 4 && 
            result.dims[2] === 76 &&
            result.dims[3] === 32
        ) {
            if (debug) {
                console.log(`Mel spectrogram model OK, executed in ${this.duration} ms`);
            }
        } else {
            throw new Error("Mel spectrogram model failed");
        }
    }

    /**
     * Execute the model
     * @param {Float32Array} input - Input data
     * @returns {Promise} - Promise that resolves with the output of the model, which is a 2D array
     * @throws {Error} - If the input data is not a Float32Array
     */
    async execute(input : Float32Array) : Promise<any> {
        const inputTensor = await ONNX.createTensor(
            "float32",
            input,
            [1, input.length]
        );
        if(!this.session) {
            throw new Error("Model not loaded");
        }
        const output = await this.session.run({ input: inputTensor });

        return await ONNX.createTensor(
            "float32",
            // @ts-expect-error something about number vs bigint that needs to be improved
            output?.output.data.map((datum) => (datum) / 10.0 + 2.0) as any,
            // @ts-expect-error something about number vs bigint that needs to be improved
            output?.output.dims
        );
    }
}
