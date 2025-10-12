/** @module audio */
// Minified worklet code
const workletName = "hey-buddy";
const workletBlob = new Blob([`(()=>{class t extends AudioWorkletProcessor{constructor(t){super(t),this.targetSampleRate=t.processorOptions.targetSampleRate,this.inputBuffer=new Float32Array(this.inputFrameSize),this.inputBufferSize=0,this.outputBuffer=new Float32Array(this.targetFrameSize)}get inputFrameSize(){return Math.round(sampleRate/50)}get targetFrameSize(){return Math.round(this.targetSampleRate/50)}async flush(){const t=sampleRate/this.targetSampleRate;this.outputBuffer.fill(0);for(let e=0;e<this.targetFrameSize;e++){const i=e*t,r=Math.floor(i),s=Math.min(r+1,this.targetFrameSize-1),u=i-r;this.outputBuffer[e]=this.inputBuffer[r]*(1-u)+this.inputBuffer[s]*u}await this.port.postMessage(this.outputBuffer)}pushAudio(t){const e=t.length,i=this.inputFrameSize-this.inputBufferSize;if(e<i)return this.inputBuffer.set(t,this.inputBufferSize),void(this.inputBufferSize+=e);this.inputBuffer.set(t.subarray(0,i),this.inputBufferSize),this.flush(),this.inputBufferSize=0,this.pushAudio(t.subarray(i))}process(t,e,i){return this.pushAudio(t[0][0]),!0}}registerProcessor("${workletName}",t)})();`], {type: "application/javascript"});
const workletUrl = URL.createObjectURL(workletBlob);

/**
 * A class that batches audio samples and calls a callback with the batch.
 */
export class AudioBatcher {
    initialized : boolean;
    callbacks : Function[];
    batchSeconds : number;
    batchIntervalSeconds : number;
    batchIntervalCount : number;
    targetSampleRate : number;
    buffer : Float32Array;
    stream? : MediaStream;
    audioContext? : AudioContext;
    sourceNode? : MediaStreamAudioSourceNode;
    workerNode? : AudioNode;
    /**
     * @param {number} batchSeconds - The number of seconds to batch.
     * @param {number} batchIntervalSeconds - The number of seconds to wait before calling the callback.
     * @param {number} targetSampleRate - The target sample rate of the worklet.
     */
    constructor(
        batchSeconds:number=2.0,
        batchIntervalSeconds:number=0.05, // 50ms
        targetSampleRate:number=16000,
    ) {
        this.initialized = false;
        this.callbacks = [];
        this.batchSeconds = batchSeconds;
        this.batchIntervalSeconds = batchIntervalSeconds;
        this.batchIntervalCount = 0;
        this.targetSampleRate = targetSampleRate;
        this.buffer = new Float32Array(this.batchSamples);
        this.buffer.fill(0);
        this.initialize();
    }

    /**
     * The number of samples in a batch.
     * @type {number}
     */
    get batchSamples() {
        return Math.floor(this.batchSeconds * this.targetSampleRate);
    }

    /**
     * The number of samples in a batch interval.
     * @type {number}
     */
    get batchIntervalSamples() {
        return Math.floor(this.batchIntervalSeconds * this.targetSampleRate);
    }

    /**
     * Clears the buffer.
     */
    clearBuffer() {
        this.buffer.fill(0);
    }

    /**
     * Pushes new audio samples into the buffer.
     * @param {Float32Array} data - The new audio samples.
     */
    push(data : Float32Array) {
        const dataLength = data.length;
        // Shift the buffer back by this much
        this.buffer.set(this.buffer.subarray(dataLength));
        // Append the new data
        this.buffer.set(data, this.buffer.length - dataLength);
        this.batchIntervalCount += dataLength;
        // If we have enough samples, call the callbacks and reset the interval count
        if (this.batchIntervalCount >= this.batchIntervalSamples) {
            this.callbacks.forEach(callback => callback(this.buffer));
            this.batchIntervalCount = 0;
        }
    }

    /**
     * Adds a callback to be called with each batch.
     * @param {Function} callback - The callback to add.
     */
    onBatch(callback : Function) {
        this.callbacks.push(callback);
    }

    /**
     * Removes a callback from the list of callbacks.
     * @param {Function} callback - The callback to remove.
     */
    offBatch(callback : Function) {
        this.callbacks = this.callbacks.filter(c => c !== callback);
    }

    /**
     * Initializes the audio batcher.
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true,
            }
        });

        this.audioContext = new AudioContext();
        this.sourceNode = new MediaStreamAudioSourceNode(
            this.audioContext,
            { mediaStream: this.stream }
        );
        this.workerNode = await AudioNode.create(
            this.audioContext,
            this.targetSampleRate,
        );

        this.sourceNode.connect(this.workerNode.worker);

        this.workerNode.worker.port.onmessage = (event : MessageEvent<any>) => {
            this.push(event.data);
        }

        this.clearBuffer();
        this.initialized = true;
    }
}

/**
 * A class that wraps an AudioWorkletNode.
 */
export class AudioNode {
    context : AudioContext;
    worker : AudioWorkletNode;
    /**
     * @param {AudioContext} context - The audio context.
     * @param {AudioWorkletNode} worker - The audio worklet node.
     */
    constructor(context : AudioContext, worker : AudioWorkletNode) {
        this.context = context;
        this.worker = worker;
    }

    /**
     * Creates an AudioNode.
     * @param {AudioContext} context - The audio context.
     * @param {number} targetSampleRate - The target sample rate of the worklet.
     * @returns {Promise<AudioNode>} The created AudioNode.
     */
    static async create(context : AudioContext, targetSampleRate : number) : Promise<AudioNode> {
        await context.audioWorklet.addModule(workletUrl);
        const workletOptions = {
            processorOptions: {
                targetSampleRate: targetSampleRate,
            }
        };
        const worker = new AudioWorkletNode(context, workletName, workletOptions);
        return new AudioNode(context, worker);
    }
}
