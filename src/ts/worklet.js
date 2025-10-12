/** @module worklet */

// Called with `audioWorker.addModule('worklet.js')`
// Defines the following global variables:
// - sampleRate
// - registerProcessor

/**
 * The `Processor` class is an AudioWorkletProcessor that resamples the input audio to a target sample rate.
 */
class Processor extends AudioWorkletProcessor {
    /**
     * @param {object} options - The options object.
     * @param {object} options.processorOptions - The processor options object.
     * @param {number} options.processorOptions.targetSampleRate - The target sample rate.
     */
    constructor(options) {
        super(options);
        this.targetSampleRate = options.processorOptions.targetSampleRate;
        this.inputBuffer = new Float32Array(this.inputFrameSize);
        this.inputBufferSize = 0;
        this.outputBuffer = new Float32Array(this.targetFrameSize);
    }

    /**
     * The size of the input frame.
     * @type {number}
     */
    get inputFrameSize() {
        return Math.round(sampleRate / 50);
    }

    /**
     * The size of the target frame.
     * @type {number}
     */
    get targetFrameSize() {
        return Math.round(this.targetSampleRate / 50);
    }

    /**
     * Flushes the input buffer to the output buffer, resampling the audio.
     * Then sends the output buffer to the main thread using the port.
     */
    async flush() {
        const ratio = sampleRate / this.targetSampleRate;
        this.outputBuffer.fill(0);
        for (let i = 0; i < this.targetFrameSize; i++) {
            const index = i * ratio;
            const left = Math.floor(index);
            const right = Math.min(left + 1, this.targetFrameSize - 1);
            const weight = index - left;
            this.outputBuffer[i] = this.inputBuffer[left] * (1 - weight) + this.inputBuffer[right] * weight;
        }
        await this.port.postMessage(this.outputBuffer);
    }

    /**
     * Pushes audio to the input buffer.
     * @param {Float32Array} inputArray - The input audio.
     */
    pushAudio(inputArray) {
        const inputLength = inputArray.length;
        const remainingLength = this.inputFrameSize - this.inputBufferSize;
        if (inputLength < remainingLength) {
            this.inputBuffer.set(inputArray, this.inputBufferSize);
            this.inputBufferSize += inputLength;
            return;
        }
        this.inputBuffer.set(inputArray.subarray(0, remainingLength), this.inputBufferSize);
        this.flush();
        this.inputBufferSize = 0;
        this.pushAudio(inputArray.subarray(remainingLength));
    }

    /**
     * Processes the input audio (the main worklet loop).
     */
    process(inputArray, outputArray, parameters) {
        this.pushAudio(inputArray[0][0]);
        return true;
    }
}

// Registers the processor with the name "hey-buddy".
registerProcessor("hey-buddy", Processor);
