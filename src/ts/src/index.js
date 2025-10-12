import { HeyBuddy } from "./hey-buddy";

/**
 * Turns floating-point audio samples to a Wave blob.
 * @param {Float32Array} audioSamples - The audio samples to play.
 * @param {number} sampleRate - The sample rate of the audio samples.
 * @param {number} numChannels - The number of channels in the audio. Defaults to 1 (mono).
 * @return {Blob} A blob of type `audio/wav`
 */
function samplesToBlob(audioSamples, sampleRate = 16000, numChannels = 1) {
    // Helper to write a string to the DataView
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Helper to convert Float32Array to Int16Array (16-bit PCM)
    const floatTo16BitPCM = (output, offset, input) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i])); // Clamping to [-1, 1]
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // Convert to 16-bit PCM
        }
    };

    const byteRate = sampleRate * numChannels * 2; // 16-bit PCM = 2 bytes per sample

    // Calculate sizes
    const blockAlign = numChannels * 2; // 2 bytes per sample for 16-bit audio
    const wavHeaderSize = 44;
    const dataLength = audioSamples.length * numChannels * 2; // 16-bit PCM data length
    const buffer = new ArrayBuffer(wavHeaderSize + dataLength);
    const view = new DataView(buffer);

    // Write WAV file headers
    writeString(view, 0, 'RIFF'); // ChunkID
    view.setUint32(4, 36 + dataLength, true); // ChunkSize
    writeString(view, 8, 'WAVE'); // Format
    writeString(view, 12, 'fmt '); // Subchunk1ID
    view.setUint32(16, 16, true); // Subchunk1Size (PCM = 16)
    view.setUint16(20, 1, true); // AudioFormat (PCM = 1)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16-bit PCM)
    writeString(view, 36, 'data'); // Subchunk2ID
    view.setUint32(40, dataLength, true); // Subchunk2Size

    // Convert the Float32Array audio samples to 16-bit PCM and write them to the DataView
    floatTo16BitPCM(view, wavHeaderSize, audioSamples);

    // Create and return the Blob
    return new Blob([view], { type: 'audio/wav' });
}

/**
 * Renders a blob to an audio element with controls.
 * Use `appendChild(result)` to add to the document or a node.
 * @param {Blob} audioBlob - A blob with a valid audio type.
 * @see samplesToBlob
 */
function blobToAudio(audioBlob) {
    const url = URL.createObjectURL(audioBlob);
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    return audio;
}

/** Configuration */
const colors = {
    "buddy": [0,119,187],
    "hey buddy": [0,153,136],
    "hi buddy": [51,227,138],
    "sup buddy": [238,119,51],
    "yo buddy": [204,51,217],
    "okay buddy": [238,51,119],
    "hello buddy": [184,62,104],
    "speech": [22,200,206],
    "frame budget": [25,255,25]
};
const rootUrl = "https://huggingface.co/benjamin-paine/hey-buddy/resolve/main";
const wakeWords = ["buddy", "hey buddy", "hi buddy", "sup buddy", "yo buddy", "okay buddy", "hello buddy"];
const canvasSize = { width: 640, height: 100 };
const graphLineWidth = 1;
const options = {
    debug: true,
    modelPath: wakeWords.map((word) => `${rootUrl}/models/${word.replace(' ', '-')}.onnx`),
    vadModelPath: `${rootUrl}/pretrained/silero-vad.onnx`,
    spectrogramModelPath: `${rootUrl}/pretrained/mel-spectrogram.onnx`,
    embeddingModelPath: `${rootUrl}/pretrained/speech-embedding.onnx`,
};

/** Main */
document.addEventListener("DOMContentLoaded", async () => {
    /** DOM elements */
    const graphsContainer = document.getElementById("graphs");
    const audioContainer = document.getElementById("audio");

    /** Memory for drawing */
    const graphs = {};
    const history = {};
    const current = {};
    const active = {};

    /** Get user media to request permission and start the microphone */
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
        alert("Microphone access has been denied, this demo will not function. Please reset audio permissions and refresh the page to try again.");
        return;
    }

    /** Instantiate */
    const heyBuddy = new HeyBuddy(options);

    /** Add callbacks */

    // When processed, update state for next draw
    heyBuddy.onProcessed((result) => {
        current["frame budget"] = heyBuddy.frameTimeEma;
        current["speech"] = result.speech.probability || 0.0;
        active["speech"] = result.speech.active;
        for (let wakeWord in result.wakeWords) {
            current[wakeWord.replace('-', ' ')] = result.wakeWords[wakeWord].probability || 0.0;
            active[wakeWord.replace('-', ' ')] = result.wakeWords[wakeWord].active;
        }
        if (result.recording) {
            audioContainer.innerHTML = "Recording&hellip;";
        }
    });

    // When recording is complete, replace the audio element
    heyBuddy.onRecording((audioSamples) => {
        const audioBlob = samplesToBlob(audioSamples);
        const audioElement = blobToAudio(audioBlob);
        audioContainer.innerHTML = "";
        audioContainer.appendChild(audioElement);
    });

    /** Add graphs */
    for (let graphName of ["wake words", "speech", "frame budget"]) {
        // Create containers for the graph and its label
        const graphContainer = document.createElement("div");
        const graphLabel = document.createElement("label");
        graphLabel.textContent = graphName;

        // Create a canvas for the graph
        const graphCanvas = document.createElement("canvas");
        graphCanvas.className = "graph";
        graphCanvas.width = canvasSize.width;
        graphCanvas.height = canvasSize.height;
        graphs[graphName] = graphCanvas;

        // Add the canvas to the container and the container to the document
        graphContainer.appendChild(graphCanvas);
        graphContainer.appendChild(graphLabel);
        graphsContainer.appendChild(graphContainer);

        // If this is the wake-word graph, also add legend
        if (graphName === "wake words") {
            const graphLegend = document.createElement("div");
            graphLegend.className = "legend";
            for (let wakeWord of wakeWords) {
                const legendItem = document.createElement("div");
                const [r,g,b] = colors[wakeWord];
                legendItem.style.color = `rgb(${r},${g},${b})`;
                legendItem.textContent = wakeWord;
                graphLegend.appendChild(legendItem);
            }
            graphLabel.appendChild(graphLegend);
        }
    }

    /** Define draw loop */
    const draw = () => {
        // Draw speech and model graphs
        for (let graphName in graphs) {
            const isWakeWords = graphName === "wake words";
            const isFrameBudget = graphName === "frame budget";
            const subGraphs = isWakeWords ? wakeWords : [graphName];

            let isFirst = true;
            for (let name of subGraphs) {
                // Update history
                history[name] = history[name] || [];
                if (isFrameBudget) {
                    history[name].push((current[name] || 0.0) / 120.0); // 120ms budget
                } else {
                    history[name].push(current[name] || 0.0);
                }

                // Trim history
                if (history[name].length > canvasSize.width) {
                    history[name] = history[name].slice(history[name].length - canvasSize.width);
                }

                // Draw graph
                const canvas = graphs[graphName];
                const ctx = canvas.getContext("2d");
                const [r,g,b] = colors[name];
                const opacity = isFrameBudget || active[name] ? 1.0 : 0.5;
                
                if (isFirst) {
                    // Clear canvas on first draw
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    isFirst = false;
                }

                ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
                ctx.fillStyle = `rgba(${r},${g},${b},${opacity/2})`;
                ctx.lineWidth = graphLineWidth;

                // Draw from left to right (the frame shifts right to left)
                ctx.beginPath();
                let lastX;
                for (let i = 0; i < history[name].length; i++) {
                    const x = i;
                    const y = canvas.height - history[name][i] * canvas.height;
                    if (i === 0) {
                        ctx.moveTo(1, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    lastX = x;
                }
                // extend downwards to make a polygon
                ctx.lineTo(lastX, canvas.height);
                ctx.lineTo(0, canvas.height);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }

        // Request next frame
        requestAnimationFrame(draw);
    };

    /** Start the loop */
    requestAnimationFrame(draw);
});
