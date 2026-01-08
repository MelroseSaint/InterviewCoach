class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const channelData = input[0];
            // Resample to 16kHz
            const inputSampleRate = sampleRate;
            const targetSampleRate = 16000;
            const ratio = inputSampleRate / targetSampleRate;
            const newLength = Math.floor(channelData.length / ratio);
            const resampled = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
                const index = i * ratio;
                const low = Math.floor(index);
                const high = Math.ceil(index);
                const weight = index - low;
                if (high < channelData.length) {
                    resampled[i] = channelData[low] * (1 - weight) + channelData[high] * weight;
                } else {
                    resampled[i] = channelData[low];
                }
            }
            // Convert to PCM
            const pcm = new Int16Array(resampled.length);
            for (let i = 0; i < resampled.length; i++) {
                pcm[i] = resampled[i] * 32768;
            }
            // Send to main thread
            this.port.postMessage(pcm);
        }
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);