__all__ = [
    "DEFAULT_ARCHITECTURE",
    "DEFAULT_USE_GATING",
    "DEFAULT_USE_HALF_LAYERS",
    "DEFAULT_LAYER_DIM",
    "DEFAULT_LAYERS",
    "DEFAULT_HEADS",
    "DEFAULT_STEPS",
    "DEFAULT_WARMUP_STEPS",
    "DEFAULT_HOLD_STEPS",
    "DEFAULT_STAGES",
    "DEFAULT_TARGET_FALSE_POSITIVE_RATE",
    "DEFAULT_DYNAMIC_NEGATIVE_WEIGHT",
    "DEFAULT_NEGATIVE_WEIGHT_ADJUST_RATIO",
    "DEFAULT_STEP_ADJUST_RATIO",
    "DEFAULT_BATCH_SIZE_ADJUST_RATIO",
    "DEFAULT_LEARNING_RATE_ADJUST_RATIO",
    "DEFAULT_LEARNING_RATE",
    "DEFAULT_NEGATIVE_WEIGHT",
    "DEFAULT_HIGH_LOSS_THRESHOLD",
    "DEFAULT_ACTIVATION_THRESHOLD",
    "DEFAULT_LOGGING_STEPS",
    "DEFAULT_VALIDATION_STEPS",
    "DEFAULT_CHECKPOINT_STEPS",
    "DEFAULT_POSITIVE_SAMPLES",
    "DEFAULT_ADVERSARIAL_SAMPLES",
    "DEFAULT_ADVERSARIAL_PHRASES",
    "DEFAULT_POSITIVE_BATCH_SIZE",
    "DEFAULT_NEGATIVE_BATCH_SIZE",
    "DEFAULT_ADVERSARIAL_BATCH_SIZE",
    "DEFAULT_BATCH_THREADS",
    "DEFAULT_VALIDATION_POSITIVE_BATCH_SIZE",
    "DEFAULT_VALIDATION_NEGATIVE_BATCH_SIZE",
    "DEFAULT_VALIDATION_SAMPLES",
    "DEFAULT_TESTING_POSITIVE_SAMPLES",
    "DEFAULT_TESTING_ADVERSARIAL_SAMPLES",
    "DEFAULT_LISTEN_BUFFER_SIZE",
    "DEFAULT_FEATURE_BATCH_SIZE",
    "DEFAULT_TTS_BATCH_SIZE",
    "DEFAULT_TTS_SLERP_WEIGHTS",
    "DEFAULT_TTS_LENGTH_SCALES",
    "DEFAULT_TTS_NOISE_SCALES",
    "DEFAULT_TTS_NOISE_SCALE_WEIGHTS",
    "DEFAULT_NOISE_BATCH_SIZE",
    "DEFAULT_AUGMENT_BATCH_SIZE",
    "DEFAULT_AUGMENT_SAMPLE_RATIO",
    "DEFAULT_AUGMENT_SEVEN_BAND_PROB",
    "DEFAULT_AUGMENT_SEVEN_BAND_GAIN_DB",
    "DEFAULT_AUGMENT_TANH_DISTORTION_PROB",
    "DEFAULT_AUGMENT_TANH_MIN_DISTORTION",
    "DEFAULT_AUGMENT_TANH_MAX_DISTORTION",
    "DEFAULT_AUGMENT_PITCH_SHIFT_PROB",
    "DEFAULT_AUGMENT_PITCH_SHIFT_SEMITONES",
    "DEFAULT_AUGMENT_BAND_STOP_PROB",
    "DEFAULT_AUGMENT_COLORED_NOISE_PROB",
    "DEFAULT_AUGMENT_COLORED_NOISE_MIN_SNR_DB",
    "DEFAULT_AUGMENT_COLORED_NOISE_MAX_SNR_DB",
    "DEFAULT_AUGMENT_COLORED_NOISE_MIN_F_DECAY",
    "DEFAULT_AUGMENT_COLORED_NOISE_MAX_F_DECAY",
    "DEFAULT_AUGMENT_BACKGROUND_NOISE_PROB",
    "DEFAULT_AUGMENT_BACKGROUND_NOISE_MIN_SNR_DB",
    "DEFAULT_AUGMENT_BACKGROUND_NOISE_MAX_SNR_DB",
    "DEFAULT_AUGMENT_GAIN_PROB",
    "DEFAULT_AUGMENT_REVERB_PROB",
    "DEFAULT_EMBEDDING_SPECTROGRAM_BATCH_SIZE",
    "DEFAULT_EMBEDDING_BATCH_SIZE",
    "DEFAULT_IMPULSE_DATASET",
    "DEFAULT_BACKGROUND_DATASET",
    "DEFAULT_AUGMENT_PHRASE_WORDS",
    "DEFAULT_AUGMENT_PHRASE_PROB"
]

DEFAULT_ARCHITECTURE = "perceptron"
DEFAULT_USE_GATING = True
DEFAULT_USE_HALF_LAYERS = False

DEFAULT_LAYER_DIM = 96
DEFAULT_LAYERS = 2
DEFAULT_HEADS = 1

DEFAULT_STEPS = 5000
DEFAULT_WARMUP_STEPS = int(DEFAULT_STEPS / 5.0)
DEFAULT_HOLD_STEPS = int(DEFAULT_STEPS / 3.0)
DEFAULT_STAGES = 3
DEFAULT_TARGET_FALSE_POSITIVE_RATE = 1.5
DEFAULT_DYNAMIC_NEGATIVE_WEIGHT = True
DEFAULT_NEGATIVE_WEIGHT_ADJUST_RATIO = 2.0
DEFAULT_STEP_ADJUST_RATIO = 2.0
DEFAULT_BATCH_SIZE_ADJUST_RATIO = 0.5
DEFAULT_LEARNING_RATE_ADJUST_RATIO = 0.5
DEFAULT_LEARNING_RATE = 0.001
DEFAULT_NEGATIVE_WEIGHT = 1.0
DEFAULT_HIGH_LOSS_THRESHOLD = 0.0001
DEFAULT_ACTIVATION_THRESHOLD = 0.50
DEFAULT_LOGGING_STEPS = 1
DEFAULT_VALIDATION_STEPS = 250
DEFAULT_CHECKPOINT_STEPS = 5000
DEFAULT_POSITIVE_SAMPLES = 100000
DEFAULT_POSITIVE_BATCH_SIZE = 50
DEFAULT_ADVERSARIAL_SAMPLES = 100000
DEFAULT_ADVERSARIAL_BATCH_SIZE = 50
DEFAULT_ADVERSARIAL_PHRASES = 250
DEFAULT_NEGATIVE_BATCH_SIZE = 1000
DEFAULT_BATCH_THREADS = 12
DEFAULT_VALIDATION_NEGATIVE_BATCH_SIZE = 1000
DEFAULT_VALIDATION_POSITIVE_BATCH_SIZE = 50
DEFAULT_VALIDATION_SAMPLES = 25000
DEFAULT_TESTING_POSITIVE_SAMPLES = 25000
DEFAULT_TESTING_ADVERSARIAL_SAMPLES = 25000
DEFAULT_LISTEN_BUFFER_SIZE = 4096
DEFAULT_FEATURE_BATCH_SIZE = 25000
DEFAULT_NOISE_BATCH_SIZE = 1000
DEFAULT_TTS_BATCH_SIZE = 8
DEFAULT_TTS_SLERP_WEIGHTS = (0.00, 0.25, 0.50, 0.75)
DEFAULT_TTS_LENGTH_SCALES = (0.75, 1.00, 1.25, 1.50)
DEFAULT_TTS_NOISE_SCALES = (0.667, 1.0)
DEFAULT_TTS_NOISE_SCALE_WEIGHTS = (0.8, 1.0)
DEFAULT_AUGMENT_BATCH_SIZE = 8
DEFAULT_AUGMENT_SAMPLE_RATIO = 1.0
DEFAULT_AUGMENT_SEVEN_BAND_PROB = 0.25
DEFAULT_AUGMENT_SEVEN_BAND_GAIN_DB = 6.0
DEFAULT_AUGMENT_TANH_DISTORTION_PROB = 0.25
DEFAULT_AUGMENT_TANH_MIN_DISTORTION = 1e-4
DEFAULT_AUGMENT_TANH_MAX_DISTORTION = 0.1
DEFAULT_AUGMENT_PITCH_SHIFT_PROB = 0.25
DEFAULT_AUGMENT_PITCH_SHIFT_SEMITONES = 3
DEFAULT_AUGMENT_BAND_STOP_PROB = 0.25
DEFAULT_AUGMENT_COLORED_NOISE_PROB = 0.25
DEFAULT_AUGMENT_COLORED_NOISE_MIN_SNR_DB = 10.0
DEFAULT_AUGMENT_COLORED_NOISE_MAX_SNR_DB = 30.0
DEFAULT_AUGMENT_COLORED_NOISE_MIN_F_DECAY = -1.0
DEFAULT_AUGMENT_COLORED_NOISE_MAX_F_DECAY = 2.0
DEFAULT_AUGMENT_BACKGROUND_NOISE_PROB = 0.75
DEFAULT_AUGMENT_BACKGROUND_NOISE_MIN_SNR_DB = -10.0
DEFAULT_AUGMENT_BACKGROUND_NOISE_MAX_SNR_DB = 15.0
DEFAULT_AUGMENT_GAIN_PROB = 1.0
DEFAULT_AUGMENT_REVERB_PROB = 0.75
DEFAULT_EMBEDDING_SPECTROGRAM_BATCH_SIZE = 32
DEFAULT_EMBEDDING_BATCH_SIZE = 32
DEFAULT_IMPULSE_DATASET = "benjamin-paine/mit-impulse-response-survey-16khz"
DEFAULT_BACKGROUND_DATASET = [
    "benjamin-paine/free-music-archive-commercial-16khz-full",
    "benjamin-paine/freesound-laion-640k-commercial-16khz-full",
]
DEFAULT_AUGMENT_PHRASE_PROB = 0.75
DEFAULT_AUGMENT_PHRASE_WORDS = [ # 100 in total
    "can","where","who","what","when",
    "why","how","is","are","do",
    "will","would","should","could","may",
    "might","please","tell","give",
    "show","explain","find","list","make",
    "play","call","set","remind","start","stop",
    "pause","open","close","turn","begin",
    "continue","send","search","answer","read",
    "repeat","check","update","add","remove",
    "delete","connect","save","load","launch",
    "bring","print","identify","translate","record",
    "forward","rewind","increase","decrease","switch",
    "change","describe","access","review","manage",
    "organize","move","select","toggle","control",
    "copy","paste","schedule","arrange","integrate",
    "collaborate","prepare","track","navigate","compile",
    "prioritize","compare","summarize","highlight",
    "visualize","analyze","optimize","clarify","verify",
    "monitor","explore","enhance","expand","customize",
    "format","generate","calculate","configure",
    "recommend","build",
]
