/** @module onnx */
import { sleep } from "./helpers";
import type { TensorConstructor, InferenceSessionFactory, TypedTensor, InferenceSession as OrtInferenceSession} from "onnxruntime-web";

// Dynamically import the ONNX Runtime Web API
// This avoids loading the entire library if it's not needed.
let initialized = false, Tensor : TensorConstructor, InferenceSession : InferenceSessionFactory;

declare global {
    var ort: any;
}

if (globalThis.ort !== "undefined") {
    initialized = true;
    Tensor = ort.Tensor;
    InferenceSession = ort.InferenceSession;
} else {
    import("onnxruntime-web").then((module) => {
        initialized = true;
        Tensor = module.Tensor;
        InferenceSession = module.InferenceSession;
    }).catch(() => {
        /* @ts-expect-error , I am not sure why this was put, but I am going to treat it as religion and leave it here
        import( webpackIgnore: true *"./onnxruntime-web/ort.mjs").then((module) => {
            initialized = true;
            Tensor = module.Tensor;
            InferenceSession = module.InferenceSession;
        }); */
    });
}

/**
 * Wrapper for ONNX Runtime Web API.
 */
export class ONNX {
    /**
     * Wait for the ONNX Runtime Web API to be initialized.
     * @returns {Promise<void>} A promise that resolves when the ONNX Runtime Web API is initialized.
     */
    static async waitForInitialization() : Promise<void> {
        while (!initialized) {
            await sleep(10);
        }
    }

    /**
     * Create a new tensor.
     * @param {string} dtype The data type of the tensor.
     * @param {Array<number>} data The data of the tensor.
     * @param {Array<number>} dims The dimensions of the tensor.
     * @returns {Promise<Tensor>} A promise that resolves to a new tensor.
     */
    static async createTensor(dtype: any, data: number[]|Float32Array, dims: number[]|Float32Array) : Promise<TypedTensor<"string"|"float32"|"float64"|"int32"|"int16"|"int8"|"uint8"|"uint16"|"uint32"|"bool">>{
        await ONNX.waitForInitialization();
        return new Tensor(dtype, data, dims);
    }

    /**
     * Create a new inference session.
     * @param {string} model The model to load
     * @param {Object} [options] The options for the inference session.
     * @returns {Promise<InferenceSession>} A promise that resolves to a new inference session.
     */
    static async createInferenceSession(model : string, options = {}) : Promise<OrtInferenceSession> {
        await ONNX.waitForInitialization();
        return await InferenceSession.create(model, options);
    }
}

// Wait for the ONNX Runtime Web API to be initialized, then replace the static methods.
// The static methods can still potentially be used, depending on the order of execution.
// This only saves a cycle or two, but it's better than nothing.
ONNX.waitForInitialization().then(() => {
    ONNX.createTensor = (dtype, data, dims) => Promise.resolve(new Tensor(dtype, data, dims));
    ONNX.createInferenceSession = (model, options = {}) => InferenceSession.create(model, options);
});

export type { Tensor, TensorConstructor, InferenceSessionFactory, TypedTensor, OrtInferenceSession };