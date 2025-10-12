<div align="center">
<img src="https://github.com/user-attachments/assets/7a5040dc-4d3b-4e99-b60d-fe3f7d3ccea5" width=512 height=512 />
</div>

<p align="center">
    <a href="https://huggingface.co/benjamin-paine/hey-buddy" target="_blank">
        <img src="https://img.shields.io/static/v1?label=benjamin-paine&message=hey-buddy&logo=huggingface&color=0b1830" alt="painebenjamin - hey-buddy" />
    </a>
    <img src="https://img.shields.io/static/v1?label=painebenjamin&message=hey-buddy&logo=github&color=0b1830" alt="painebenjamin - hey-buddy">
    <img src="https://img.shields.io/github/stars/painebenjamin/hey-buddy?style=social" alt="stars - hey-buddy">
    <img src="https://img.shields.io/github/forks/painebenjamin/hey-buddy?style=social" alt="forks - hey-buddy"><br />
    <a href="https://github.com/painebenjamin/hey-buddy/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache-0b1830" alt="License"></a>
    <a href="https://github.com/painebenjamin/hey-buddy/releases/"><img src="https://img.shields.io/github/tag/painebenjamin/hey-buddy?include_prereleases=&sort=semver&color=0b1830" alt="GitHub tag"></a>
    <a href="https://github.com/painebenjamin/hey-buddy/releases/"><img alt="GitHub release (with filter)" src="https://img.shields.io/github/v/release/painebenjamin/hey-buddy?color=0b1830"></a>
    <a href="https://pypi.org/project/heybuddy"><img alt="PyPI - Version" src="https://img.shields.io/pypi/v/heybuddy?color=0b1830"></a>
    <a href="https://github.com/painebenjamin/hey-buddy/releases/"><img alt="GitHub all releases" src="https://img.shields.io/github/downloads/painebenjamin/hey-buddy/total?logo=github&color=0b1830"></a>
    <a href="https://pypi.org/project/heybuddy"><img alt="PyPI - Downloads" src="https://img.shields.io/pypi/dm/heybuddy?logo=python&logoColor=white&color=0b1830"></a>
</p>
<hr />

**Hey Buddy!** is a library for training wake word models (a.k.a audio keyword spotters) and deploying them to the browser for real-time use on CPU or GPU.

Using a wake-word as a gating mechanism for voice-enabled web applications carries numerous benefits, including reduced power consumption, improved privacy, and enhanced performance in noisy environments over speech-to-text systems.

Designed for usability and flexibility, **Hey Buddy!** features the following:
- Available with a simple `pip install heybuddy`
- Use a single command to train a model, no downloads or data gathering required
- Models are resilient to noisy environments and hurried speech
- Verified for commercial use - uses open data and libraries with commercially-viable licenses (see below for specifics)
- Process an arbitrary number of Wake Word models at once, with plenty of frame budget left over
- Voice-command-oriented JavaScript module provides a recording of the audio from the beginning of the wake word to the end of speech, ready to be dispatched for downstream processing
- Callback interface for more advanced integrations

# Demo

A live demo space is available [here.](https://huggingface.co/spaces/benjamin-paine/hey-buddy) As this runs entirely on-device, this will not consume any HuggingFace credits.

# Installation

The Python library only works on Linux at the moment, due to `piper-phonemize` only working on Linux.

The easiest way to install and use Hey Buddy is with [Anaconda/Miniconda](https://docs.anaconda.com/distro-or-miniconda/) and the maintained environment file like so:

```
wget https://raw.githubusercontent.com/painebenjamin/hey-buddy/refs/heads/main/environment.yml
conda env create -f environment.yml
conda activate heybuddy
pip install heybuddy[gpu]
```

If you already have a working CUDA environment, you can just skip to `pip install heybuddy`. You will need to install `piper-phonemize` separately in this case, see [the rhasspy/piper-phonemizer releases page on GitHub](https://github.com/rhasspy/piper-phonemize/releases/) to find the latest wheel for your python version - for example, the environment file uses python 3.10, so it installs `https://github.com/rhasspy/piper-phonemize/releases/download/v1.1.0/piper_phonemize-1.1.0-cp310-cp310-manylinux_2_28_x86_64.whl`.

# Training Models

Training a model is as simple as executing `heybuddy train`:

```sh
heybuddy train "hello world"
```

This will:

1. Generate 100,000 training speech samples of the wake phrase using Piper TTS
2. Generate 100,000 adversarial training speech samples of phonetically-similar phrases using Piper TTS
3. Augment the wake word text with common follow-up words for conversational or command-oriented speech
4. Augment generated speech samples using sound effects and music in varying ratios of signal-to-noise
5. Reverberate these speech samples using varying impule responses (IRs)
6. Undergo any combination of additional distortions including white noise, pitch shifting, and more.
7. Extract speech embeddings from both sets of samples, storing as memory-mapped `numpy` arrays for quick access during training
8. Repeat the above process is repeated to generate testing samples and validation\* samples
9. Download the precalculated training and validation datasets if not already downloaded
10. Train the model in an automated fashion in three stages
11. Save the model's checkpoint for conversion to ONNX or resuming training at a later time.

*\* Validation is slightly different from testing in that the positive samples are not augmented with noise, and thus serve as a 'best-case' speech validation that should be close to 100% accurate. Validation, additionally, does not include adversarial samples.*

Finally, a convenient script is available for converting the `.pt` checkpoint to a `.onnx` model for the web:

```sh
heybuddy convert checkpoints/hello_world_final.pt
```

You can now serve this model on the web. See the JavaScript API documentation below.


## Precalculated Datasets

Training and validation datasets are automatically downloaded when using the command-line interface with default options. See [here](https://huggingface.co/datasets/benjamin-paine/hey-buddy) for more information about these datasets and how you can make your own.

If you have space limitations, reference the table below for command-line flags that can help reduce size.

| Flag | Size | Default |
| ---- | ---- | ------- |
| `--training-full-default-dataset` | 72 GB | Yes |
| `--training-large-default-dataset` | 46 GB | No |
| `--training-medium-default-dataset` | 25 GB | No |
| `--training-no-default-dataset` | 0 | No |

Note when using no default dataset, you will need to provide your own dataset with `--training-dataset <path>`. See the link above for how to create your own.

## Augmentation Datasets

These are the default augmentation datasets. These were selected for their **commercial availability** and **lack of copyleft restrictions** so your trained wake-word models are your own. If you substitute another dataset, make sure you have the required license to use that data for AI training.

1. [benjamin-paine/mit-impulse-response-survey-16khz](https://huggingface.co/datasets/benjamin-paine/mit-impulse-response-survey-16khz) (CC-BY)
2. [benjamin-paine/freesound-laion-640k-commercial-16khz-full](https://huggingface.co/datasets/benjamin-paine/freesound-laion-640k-commercial-16khz-full) (CC0, CC-BY, CC-Sampling)
3. [benjamin-paine/free-music-archive-commercial-16khz-full](https://huggingface.co/datasets/benjamin-paine/free-music-archive-commercial-16khz-full) (CC0, CC-BY, CC-Sampling+, FMA Sound Recording Common Law, Free Art License, Public Domain)

When using the command-line, pass `--augmentation-dataset-streaming` to stream datasets instead of downloading them. This is not recommended for performance.

To disable using these datasets, pass `--augmentation-no-default-background-dataset` and `--augmentation-no-default-impulse-dataset`. You should pass your own datasets in the format `<username>/<repo>`, for loading via [`load_dataset`](https://huggingface.co/docs/datasets/v3.0.1/en/package_reference/loading_methods#datasets.load_dataset)

## CLI Options

```
Usage: heybuddy train [OPTIONS] PHRASE                         
                                                                                   
  Trains a wake word detection model.                                              
                                                                                                                                                                       
Options:                                                                           
  --additional-phrase TEXT        Additional phrases to use for training.  
  --wandb-entity TEXT             W&B entity to use for logging.           
  --layer-dim INTEGER             Dimension of the linear layers to use for   
                                  the model.  [default: 96]                   
  --num-layers INTEGER            The number of perceptron blocks.  [default:
                                  2]                                               
  --num-heads INTEGER             The number of attention heads to use when        
                                  using the transformer model.  [default: 1]       
  --steps INTEGER                 Number of optimization steps to take.      
                                  [default: 12500]                          
  --stages INTEGER                Number of training stages.  [default: 3]  

  --learning-rate FLOAT           Learning rate for the optimizer.  [default:
                                  0.001]                                           
  --high-loss-threshold FLOAT     Threshold for high loss values (e.g. with  
                                  the default 0.001, a value is high-loss if
                                  it's supposed to be 0 and is higher than  
                                  0.001 or supposed to be 1 and is lower than
                                  0.999)  [default: 0.0001]       
  --target-false-positive-rate FLOAT                                               
                                  Target false positive rate for the model.
                                  [default: 0.5]                              
  --dynamic-negative-weight / --no-dynamic-negative-weight                         
                                  Dynamically adjust the negative weight based
                                  on target false positive rate at each       
                                  validation step (instead of in-between
                                  stages.)  [default: dynamic-negative-weight]
  --negative-weight FLOAT         Negative weight for the loss function.     
                                  [default: 1.0]
  --training-full-default-dataset                                                  
                                  Use the full precalculated default training
                                  set.  [default: full]
  --training-large-default-dataset                                                 
                                  Use the large precalculated default training
                                  set.  [default: full]
  --training-medium-default-dataset                                                
                                  Use the medium precalculated default        
                                  training set.  [default: full]
  --training-no-default-dataset   Do not use a precalculated default training 
                                  set.  [default: full]                       
  --training-dataset FILE         Use a custom precalculated training set.
  --augment-phrase-prob FLOAT     Probability of augmenting the phrase.  
                                  [default: 0.75]                            
  --augment-phrase-default-words / --augment-phrase-no-default-words
                                  Use the default words for augmentation.
                                  [default: augment-phrase-default-words]
  --augment-phrase-word TEXT      Custom words to use for augmentation.
  --augmentation-default-background-dataset / --augmentation-no-default-background-dataset
                                  Use the default background dataset for
                                  augmentation.  [default: augmentation-   
                                  default-background-dataset]              
  --augmentation-background-dataset TEXT                                           
                                  Use a custom background dataset for
                                  augmentation.                               
  --augmentation-default-impulse-dataset / --augmentation-no-default-impulse-dataset
                                  Use the default impulse dataset for      
                                  augmentation.  [default: augmentation-
                                  default-impulse-dataset]                    
  --augmentation-impulse-dataset TEXT                                              
                                  Use a custom impulse dataset for                 
                                  augmentation.                     
  --augmentation-dataset-streaming / --augmentation-dataset-no-streaming      
                                  Stream the augmentation datasets, instead of
                                  downloading first.  [default: augmentation-
                                  dataset-no-streaming]
  --augmentation-seven-band-prob FLOAT                                             
                                  Probability of applying the seven band           
                                  equalization augmentation.  [default: 0.25]
  --augmentation-seven-band-gain-db FLOAT                                   
                                  Gain in decibels for the seven band       
                                  equalization augmentation.  [default: 6.0]

  --augmentation-tanh-distortion-prob FLOAT                                 
                                  Probability of applying the tanh distortion
                                  augmentation.  [default: 0.25]          
  --augmentation-tanh-distortion-min FLOAT                                  
                                  Minimum value for the tanh distortion
                                  augmentation.  [default: 0.0001]
  --augmentation-tanh-distortion-max FLOAT                             
                                  Maximum value for the tanh distortion
                                  augmentation.  [default: 0.1]               
  --augmentation-pitch-shift-prob FLOAT                                            
                                  Probability of applying the pitch shift     
                                  augmentation.  [default: 0.25]              
  --augmentation-pitch-shift-semitones INTEGER
                                  Number of semitones to shift the pitch for  
                                  the pitch shift augmentation.  [default: 3]
  --augmentation-band-stop-prob FLOAT
                                  Probability of applying the band stop filter
                                  augmentation.  [default: 0.25]  
  --augmentation-colored-noise-prob FLOAT 
                                  Probability of applying the colored noise   
                                  augmentation.  [default: 0.25]              
  --augmentation-colored-noise-min-snr-db FLOAT
                                  Minimum signal-to-noise ratio for the       
                                  colored noise augmentation.  [default: 10.0]
  --augmentation-colored-noise-max-snr-db FLOAT
                                  Maximum signal-to-noise ratio for the       
                                  colored noise augmentation.  [default: 30.0]
  --augmentation-colored-noise-min-f-decay FLOAT           
                                  Minimum frequency decay for the colored
                                  noise augmentation.  [default: -1.0]       
  --augmentation-colored-noise-max-f-decay FLOAT                   
                                  Maximum frequency decay for the colored
                                  noise augmentation.  [default: 2.0]
  --augmentation-background-noise-prob FLOAT                           
                                  Probability of applying the background noise
                                  augmentation.  [default: 0.75]
  --augmentation-background-noise-min-snr-db FLOAT                         
                                  Minimum signal-to-noise ratio for the    
                                  background noise augmentation.  [default:
                                  -10.0]
  --augmentation-background-noise-max-snr-db FLOAT                            
                                  Maximum signal-to-noise ratio for the    
                                  background noise augmentation.  [default:
                                  15.0]
  --augmentation-gain-prob FLOAT  Probability of applying the gain            
                                  augmentation.  [default: 1.0]             
  --augmentation-reverb-prob FLOAT                                                 
                                  Probability of applying the reverb
                                  augmentation.  [default: 0.75]              
  --logging-steps INTEGER         How often to log step details.  [default: 1]
  --validation-steps INTEGER      How often to validate the model.  [default:
                                  250]
  --checkpoint-steps INTEGER      How often to save the model.  [default:    
                                  5000]                                            
  --positive-samples INTEGER      Number of positive samples to use for    
                                  training. Will synthetically generate more
                                  when needed.  [default: 100000]       
  --adversarial-samples INTEGER   Number of adversarial samples to use for
                                  training. Will synthetically generate more
                                  when needed.  [default: 100000]
  --adversarial-phrases INTEGER   Number of adversarial phrases to use for
                                  training. Will synthetically generate more
                                  when needed.  [default: 250]
  --adversarial-phrase-custom TEXT
                                  Custom adversarial phrases to use for
                                  training.
  --positive-batch-size INTEGER   The number of positive samples to include in
                                  each batch during training.  [default: 50]
  --negative-batch-size INTEGER   The number of negative samples to include in
                                  each batch during training.  [default: 1000]
  --adversarial-batch-size INTEGER
                                  The number of adversarial samples to include
                                  in each batch during training.  [default:
                                  50]
  --num-batch-threads INTEGER     The number of threads to spawn for creating
                                  training batches.  [default: 12]
  --validation-positive-batch-size INTEGER
                                  The number of positive samples to include in
                                  each batch during validation.  [default: 50]
  --validation-negative-batch-size INTEGER
                                  The number of negative samples to include in
                                  each batch during validation.  [default:
                                  1000]
  --validation-samples INTEGER    The number of samples to use for validation.
                                  Will synthetically generate more when
                                  needed.  [default: 25000]
  --validation-num-batch-threads INTEGER
                                  The number of threads to spawn for creating
                                  validation batches.  [default: 1]
  --validation-default-dataset / --validation-no-default-dataset
                                  Use the default validation dataset.
                                  [default: validation-default-dataset]
  --validation-dataset FILE       Use a custom precalculated validation set.
  --testing-positive-samples INTEGER
                                  The number of positive samples to use for
                                  testing. Will synthetically generate more
                                  when needed.  [default: 25000]
  --testing-adversarial-samples INTEGER
                                  The number of adversarial samples to use for
                                  testing. Will synthetically generate more
                                  when needed.  [default: 25000]
  --testing-positive-batch-size INTEGER
                                  The number of positive samples to include in
                                  each batch during testing. Default matches
                                  the size used during training.
  --testing-adversarial-batch-size INTEGER
                                  The number of adversarial samples to include
                                  in each batch during testing. Default
                                  matches the size used during training.
  --testing-num-batch-threads INTEGER
                                  The number of threads to spawn for creating
                                  testing batches.  [default: 1]
  --resume / --no-resume          Resume training from the last checkpoint.
                                  [default: no-resume]
  --debug / --no-debug            Enable debug logging.  [default: no-debug]
  --help                          Show this message and exit.
```

# Evaluating Models

A number of evaluation metrics are recorded during training. The best way to access this data is to use [Weights & Biases](https://wandb.ai), then pass your entity (username or team name) to the training script via `--wandb-entity <name>`.

<div align="center">
  <figure>
    <a href="https://cdn-uploads.huggingface.co/production/uploads/64429aaf7feb866811b12f73/lKp-YyG2p-JtmkP8qK6fw.png" target="_blank">
      <img src="https://cdn-uploads.huggingface.co/production/uploads/64429aaf7feb866811b12f73/lKp-YyG2p-JtmkP8qK6fw.png" width="400" />
    </a><br />
    <figcaption>
      Training metrics from Weights & Biases. Click to enlarge.
    </figcaption>
  </figure>
</div>

# Inference

## JavaScript API

**Hey Buddy!** is distributed a single minified javascript file, available through npm or other popular CDNs.

### Node

Install from NPM:

```
npm install hey-buddy-onnx
```

### Browser

You need to make the ONNX runtime available prior to importing the HeyBuddy JS API.

The easiest way to do this and use HeyBuddy is like so:

```html
<!-- ONNX Runtime -->
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.min.js"></script>
<!-- Hey Buddy API -->
<script src="https://cdn.jsdelivr.net/npm/hey-buddy-onnx@0.1.2/dist/hey-buddy.min.js"></script>
<!-- Your Code -->
<script>...</script>
```

You will also need to host the `onnx` file created by `heybuddy convert` (see above.)

Your implementation code could look something like this:

```js
const options = {
    record: true, // disable when not needed to save memory
    modelPath: ["/models/my-model.onnx", "/models/my-other-model.onnx"], // Also accepts single strings
};

const heyBuddy = new HeyBuddy(options);

// do something with a recording
heyBuddy.onRecording(async (audio) => {
    // audio is a Float32Array of samples
});

// do something every frame
heyBuddy.onProcessed((result) => {
    /**
     * this is triggered every frame with:
     * {
     *    listening: bool,
     *    recording: bool,
     *    speech: {
     *        probability: 0.0 <= float <= 1.0,
     *        active: bool
     *    },
     *    wakeWords: {
     *       $modelNameWithoutExtension: {
     *           probability: 0.0 <= float <= 1.0,
     *           active: bool
     *       }
     *    }
     * }
     */
});
```

## Python API

To use the torch model directly, you can do the following.

```py
from heybuddy import WakeWord

audio = "/path/to/audio.wav" # OR flac OR mp3 OR numpy array/tensor (int16 or float32) OR list of the same
model = WakeWord.from_file("/path/to/model.pt")
model.to("cuda") # optional
predictions = model.predict(
    audio,
    threshold=0.5, # you can experiment with different thresholds
    return_scores=False, # when true, return the prediction scores instead of bools. default false.
)
first_audio_has_wakeword = predictions[0] # bool by default
```

A threaded API is also available for ease-of-use and to minimize performance impact.

```py
from heybuddy import WakeWordModelThread

audio = "/path/to/audio.wav" # OR flac OR mp3 OR numpy array/tensor (int16 or float32) OR list of the same
thread = WakeWordModelThread(
    "/path/to/model.pt", # or onnx
    device_id=None, # set to GPU index to use CUDA for torch or onnx, otherwise runs on CPU
    threshold=0.5, # you can experiment with different thresholds
    return_scores=False, # when true, return the prediction scores instead of bools. default false.
)

thread.put(audio)
predictions = thread.get( # same arguments as queue.Queue.get()
    block=True,
    timeout=None
)
first_audio_has_wakeword = predictions[0] # bool by default
```

# Errata

These are some potentially useful JavaScript snippets for working with raw audio samples.

```js
/**
 * Play audio samples using the Web Audio API.
 * @param {Float32Array} audioSamples - The audio samples to play.
 * @param {number} sampleRate - The sample rate of the audio samples.
 */
function playAudioSamples(audioSamples, sampleRate = 16000) {
    // Create an AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Create an AudioBuffer
    const audioBuffer = audioContext.createBuffer(
        1, // number of channels
        audioSamples.length, // length of the buffer in samples
        sampleRate // sample rate (samples per second)
    );

    // Fill the AudioBuffer with the Float32Array of audio samples
    audioBuffer.getChannelData(0).set(audioSamples);

    // Create a BufferSource node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Connect the source to the AudioContext's destination (the speakers)
    source.connect(audioContext.destination);

    // Start playback
    source.start();
};

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
    // Create data URL
    const url = URL.createObjectURL(audioBlob);

    // Create and configure audio element
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = url;
    return audio;
}

/**
 * Downloads a blob as a file.
 * @param {Blob} blob - A blob with a type that can be converted to an object URL.
 * @param {string} filename - The file name after downloading.
 */
function downloadBlob(blob, filename) {
    // Create data URL
    const url = URL.createObjectURL(blob);

    // Create and configure link element
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";

    // Add the link to the page, click, then remove
    document.body.appendChild(link);
    window.requestAnimationFrame(() => {
        link.dispatchEvent(new MouseEvent("click"));
        document.body.removeChild(link);
    });
}
```

# License

- HeyBuddy source code and pretrained models are released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.html).
- Pre-calculated training and validation datasets are released under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). See [the dataset card](https://huggingface.co/datasets/benjamin-paine/hey-buddy/) for individual licensing information.

# Citations and Acknowledgements

- David Scripka, [OpenWakeWord](https://github.com/dscripka/openWakeWord/) (Apache 2.0 License)
- Lin, Kilgour, Roblek, Sharifi et. Al, [Speech Embeddings](https://www.kaggle.com/models/google/speech-embedding/tensorFlow1/speech-embedding/1) (Apache 2.0 License)
- Rhasspy and the Open Home Foundation, [Piper TTS](https://rhasspy.github.io/piper-samples/) (MIT License)
- Silero Team, [SileroVAD](https://github.com/snakers4/silero-vad) (MIT License)
- Siebert, Adelman and Git, [npy-append-array](https://github.com/xor2k/npy-append-array)

```
@misc{lin2020trainingkeywordspotterslimited,
  title={Training Keyword Spotters with Limited and Synthesized Speech Data}, 
  author={James Lin and Kevin Kilgour and Dominik Roblek and Matthew Sharifi},
  year={2020},
  eprint={2002.01322},
  archivePrefix={arXiv},
  primaryClass={eess.AS},
  url={https://arxiv.org/abs/2002.01322}, 
}
```
```
@inproceedings{50492,
  title={Improving Automatic Speech Recognition with Neural Embeddings},
  author={Christopher Li and Diamantino A. Caseiro and Leonid Velikovich and Pat Rondon and Petar S. Aleksic and Xavier L Velez},
  year={2021},
  address={111 8th AveNew York, NY 10011}
}
```
```
@misc{Silero VAD,
  author = {Silero Team},
  title = {Silero VAD: pre-trained enterprise-grade Voice Activity Detector (VAD), Number Detector and Language Classifier},
  year = {2021},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/snakers4/silero-vad}},
  commit = {insert_some_commit_here},
  email = {hello@silero.ai}
}
```
```
@inproceedings{fma_dataset,
  title = {{FMA}: A Dataset for Music Analysis},
  author = {Defferrard, Micha\"el and Benzi, Kirell and Vandergheynst, Pierre and Bresson, Xavier},
  booktitle = {18th International Society for Music Information Retrieval Conference (ISMIR)},
  year = {2017},
  archiveprefix = {arXiv},
  eprint = {1612.01840},
  url = {https://arxiv.org/abs/1612.01840},
}
```
```
@inproceedings{fma_challenge,
  title = {Learning to Recognize Musical Genre from Audio},
  subtitle = {Challenge Overview},
  author = {Defferrard, Micha\"el and Mohanty, Sharada P. and Carroll, Sean F. and Salath\'e, Marcel},
  booktitle = {The 2018 Web Conference Companion},
  year = {2018},
  publisher = {ACM Press},
  isbn = {9781450356404},
  doi = {10.1145/3184558.3192310},
  archiveprefix = {arXiv},
  eprint = {1803.05337},
  url = {https://arxiv.org/abs/1803.05337},
}
```
```
@article{
  doi:10.1073/pnas.1612524113,
  author = {James Traer and Josh H. McDermott},
  title = {Statistics of natural reverberation enable perceptual separation of sound and space},
  journal = {Proceedings of the National Academy of Sciences},
  volume = {113},
  number = {48},
  pages = {E7856-E7865},
  year = {2016},
  doi = {10.1073/pnas.1612524113},
  URL = {https://www.pnas.org/doi/abs/10.1073/pnas.1612524113},
  eprint = {https://www.pnas.org/doi/pdf/10.1073/pnas.1612524113},
  abstract = {Sounds produced in the world reflect off surrounding surfaces on their way to our ears. Known as reverberation, these reflections distort sound but provide information about the world around us. We asked whether reverberation exhibits statistical regularities that listeners use to separate its effects from those of a sound’s source. We conducted a large-scale statistical analysis of real-world acoustics, revealing strong regularities of reverberation in natural scenes. We found that human listeners can estimate the contributions of the source and the environment from reverberant sound, but that they depend critically on whether environmental acoustics conform to the observed statistical regularities. The results suggest a separation process constrained by knowledge of environmental acoustics that is internalized over development or evolution. In everyday listening, sound reaches our ears directly from a source as well as indirectly via reflections known as reverberation. Reverberation profoundly distorts the sound from a source, yet humans can both identify sound sources and distinguish environments from the resulting sound, via mechanisms that remain unclear. The core computational challenge is that the acoustic signatures of the source and environment are combined in a single signal received by the ear. Here we ask whether our recognition of sound sources and spaces reflects an ability to separate their effects and whether any such separation is enabled by statistical regularities of real-world reverberation. To first determine whether such statistical regularities exist, we measured impulse responses (IRs) of 271 spaces sampled from the distribution encountered by humans during daily life. The sampled spaces were diverse, but their IRs were tightly constrained, exhibiting exponential decay at frequency-dependent rates: Mid frequencies reverberated longest whereas higher and lower frequencies decayed more rapidly, presumably due to absorptive properties of materials and air. To test whether humans leverage these regularities, we manipulated IR decay characteristics in simulated reverberant audio. Listeners could discriminate sound sources and environments from these signals, but their abilities degraded when reverberation characteristics deviated from those of real-world environments. Subjectively, atypical IRs were mistaken for sound sources. The results suggest the brain separates sound into contributions from the source and the environment, constrained by a prior on natural reverberation. This separation process may contribute to robust recognition while providing information about spaces around us.}
}
```
```
@article{Pratap2020MLSAL,
  title={MLS: A Large-Scale Multilingual Dataset for Speech Research},
  author={Vineel Pratap and Qiantong Xu and Anuroop Sriram and Gabriel Synnaeve and Ronan Collobert},
  journal={ArXiv},
  year={2020},
  volume={abs/2012.03411}
}
```
```
@inproceedings{commonvoice:2020,
  author = {Ardila, R. and Branson, M. and Davis, K. and Henretty, M. and Kohler, M. and Meyer, J. and Morais, R. and Saunders, L. and Tyers, F. M. and Weber, G.},
  title = {Common Voice: A Massively-Multilingual Speech Corpus},
  booktitle = {Proceedings of the 12th Conference on Language Resources and Evaluation (LREC 2020)},
  pages = {4211--4215},
  year = 2020
}
```
```
@misc{wang2024globe,
  title={GLOBE: A High-quality English Corpus with Global Accents for Zero-shot Speaker Adaptive Text-to-Speech}, 
  author={Wenbin Wang and Yang Song and Sanjay Jha},
  year={2024},
  eprint={2406.14875},
  archivePrefix={arXiv},
}
```
```
@article{Instruction Speech 2024,
  title={Instruction Speech},
  author={JanAI},
  year=2024,
  month=June},
  url={https://huggingface.co/datasets/jan-hq/instruction-speech}
}
```
```
@inproceedings{wang-etal-2021-voxpopuli,
  title = "{V}ox{P}opuli: A Large-Scale Multilingual Speech Corpus for Representation Learning, Semi-Supervised Learning and Interpretation",
  author = "Wang, Changhan  and
    Riviere, Morgane  and
    Lee, Ann  and
    Wu, Anne  and
    Talnikar, Chaitanya  and
    Haziza, Daniel  and
    Williamson, Mary  and
    Pino, Juan  and
    Dupoux, Emmanuel",
  booktitle = "Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics and the 11th International Joint Conference on Natural Language Processing (Volume 1: Long Papers)",
  month = aug,
  year = "2021",
  address = "Online",
  publisher = "Association for Computational Linguistics",
  url = "https://aclanthology.org/2021.acl-long.80",
  pages = "993--1003",
}
```
```
@article{fleurs2022arxiv,
  title = {FLEURS: Few-shot Learning Evaluation of Universal Representations of Speech},
  author = {Conneau, Alexis and Ma, Min and Khanuja, Simran and Zhang, Yu and Axelrod, Vera and Dalmia, Siddharth and Riesa, Jason and Rivera, Clara and Bapna, Ankur},
  journal={arXiv preprint arXiv:2205.12446},
  url = {https://arxiv.org/abs/2205.12446},
  year = {2022},
}
```
```
@misc{vansegbroeck2019dipcodinnerparty,
  title={DiPCo -- Dinner Party Corpus}, 
  author={Maarten Van Segbroeck and Ahmed Zaid and Ksenia Kutsenko and Cirenia Huerta and Tinh Nguyen and Xuewen Luo and Björn Hoffmeister and Jan Trmal and Maurizio Omologo and Roland Maas},
  year={2019},
  eprint={1909.13447},
  archivePrefix={arXiv},
  primaryClass={eess.AS},
  url={https://arxiv.org/abs/1909.13447}, 
}
```
```
@software{siebert2023npy_append_array,
  author = {Michael Siebert and Joshua Adelman and Yoav Git},
  title = {xor2k/npy-append-array: 0.9.16},
  version = {0.9.16},
  doi = {10.5281/zenodo.13820984},
  url = {https://github.com/xor2k/npy-append-array/tree/0.9.16},
  year = {2023},
  month = {feb},
  day = {24},
  abstract = {Create Numpy .npy files by appending on the growth axis},
  license = {MIT},
  orcid = {0000-0002-1369-6321},
  type = {software},
}
```
