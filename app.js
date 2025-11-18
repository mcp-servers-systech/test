// Gemini Live API - Real-time Audio & Video Chat Application

class GeminiLiveClient {
    constructor() {
        this.ws = null;
        this.audioContext = null;
        this.mediaStream = null;
        this.audioWorkletNode = null;
        this.videoInterval = null;
        this.isConnected = false;
        this.audioQueue = [];
        this.isPlayingAudio = false;

        // Audio processing
        this.sampleRate = 16000; // Gemini expects 16kHz
        this.audioChunks = [];

        // DOM elements
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.videoPreview = document.getElementById('videoPreview');
        this.videoCanvas = document.getElementById('videoCanvas');
        this.apiKeyInput = document.getElementById('apiKey');
        this.systemPromptInput = document.getElementById('systemPrompt');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.transcript = document.getElementById('transcript');
        this.enableVideo = document.getElementById('enableVideo');
        this.enableAudio = document.getElementById('enableAudio');
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.stopBtn.addEventListener('click', () => this.stopSession());
    }

    async startSession() {
        try {
            const apiKey = this.apiKeyInput.value.trim();
            if (!apiKey) {
                alert('Please enter your Gemini API key');
                return;
            }

            this.updateStatus('Initializing...', 'connecting');
            this.addTranscript('system', 'Starting session...');

            // Get media stream (audio and/or video)
            await this.initializeMedia();

            // Connect to Gemini Live API
            await this.connectWebSocket(apiKey);

            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.apiKeyInput.disabled = true;
            this.enableVideo.disabled = true;
            this.enableAudio.disabled = true;

        } catch (error) {
            console.error('Error starting session:', error);
            this.addTranscript('error', `Failed to start: ${error.message}`);
            this.updateStatus('Error', 'disconnected');
            this.cleanup();
        }
    }

    async initializeMedia() {
        const constraints = {
            audio: this.enableAudio.checked ? {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } : false,
            video: this.enableVideo.checked ? {
                width: { ideal: 768 },
                height: { ideal: 768 },
                frameRate: { ideal: 1, max: 5 }
            } : false
        };

        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        // Display video preview
        if (this.enableVideo.checked) {
            this.videoPreview.srcObject = this.mediaStream;
        }

        // Initialize audio context for processing
        if (this.enableAudio.checked) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 48000 // Browser default, we'll resample
            });
            await this.setupAudioProcessing();
        }
    }

    async setupAudioProcessing() {
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);

        // Create a script processor for audio chunks
        const bufferSize = 4096;
        const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

        processor.onaudioprocess = (e) => {
            if (!this.isConnected) return;

            const inputData = e.inputBuffer.getChannelData(0);

            // Resample from 48kHz to 16kHz
            const resampled = this.resampleAudio(inputData, this.audioContext.sampleRate, this.sampleRate);

            // Convert to 16-bit PCM
            const pcmData = this.floatTo16BitPCM(resampled);

            // Send to Gemini
            this.sendAudioChunk(pcmData);
        };

        source.connect(processor);
        processor.connect(this.audioContext.destination);

        this.audioWorkletNode = processor;
    }

    resampleAudio(audioData, fromSampleRate, toSampleRate) {
        const ratio = fromSampleRate / toSampleRate;
        const newLength = Math.round(audioData.length / ratio);
        const result = new Float32Array(newLength);

        for (let i = 0; i < newLength; i++) {
            const index = i * ratio;
            const indexInt = Math.floor(index);
            const indexFrac = index - indexInt;

            const sample1 = audioData[indexInt] || 0;
            const sample2 = audioData[indexInt + 1] || 0;

            result[i] = sample1 + (sample2 - sample1) * indexFrac;
        }

        return result;
    }

    floatTo16BitPCM(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);

        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        return buffer;
    }

    async connectWebSocket(apiKey) {
        return new Promise((resolve, reject) => {
            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

            this.ws = new WebSocket(wsUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.sendSetupMessage();
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(new Error('WebSocket connection failed'));
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.isConnected = false;
                this.updateStatus('Disconnected', 'disconnected');
            };

            // Resolve after setup complete
            this.setupCompletePromise = { resolve, reject };
        });
    }

    sendSetupMessage() {
        const systemInstruction = this.systemPromptInput.value.trim();

        const setupMessage = {
            setup: {
                model: "models/gemini-2.0-flash-exp",
                generation_config: {
                    response_modalities: ["AUDIO"],
                    speech_config: {
                        voice_config: {
                            prebuilt_voice_config: {
                                voice_name: "Puck"
                            }
                        }
                    }
                }
            }
        };

        if (systemInstruction) {
            setupMessage.setup.system_instruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        console.log('Sending setup message:', setupMessage);
        this.ws.send(JSON.stringify(setupMessage));
    }

    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);

            if (message.setupComplete) {
                console.log('Setup complete');
                this.isConnected = true;
                this.updateStatus('Connected', 'connected');
                this.connectionStatus.textContent = 'Connected';
                this.addTranscript('system', 'Connected! You can now talk to Gemini.');

                // Start sending video frames if enabled
                if (this.enableVideo.checked) {
                    this.startVideoStream();
                }

                if (this.setupCompletePromise) {
                    this.setupCompletePromise.resolve();
                }
            }

            if (message.serverContent) {
                this.handleServerContent(message.serverContent);
            }

            if (message.toolCall) {
                console.log('Tool call received:', message.toolCall);
            }

        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    handleServerContent(content) {
        // Handle text responses
        if (content.modelTurn) {
            content.modelTurn.parts.forEach(part => {
                if (part.text) {
                    this.addTranscript('gemini', part.text);
                }

                // Handle audio response
                if (part.inlineData && part.inlineData.mimeType.includes('audio')) {
                    const audioData = part.inlineData.data;
                    this.playAudioResponse(audioData);
                }
            });
        }

        // Handle turn completion
        if (content.turnComplete) {
            console.log('Turn complete');
        }
    }

    sendAudioChunk(pcmData) {
        if (!this.isConnected || !this.ws) return;

        const base64Audio = this.arrayBufferToBase64(pcmData);

        const message = {
            realtimeInput: {
                mediaChunks: [
                    {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Audio
                    }
                ]
            }
        };

        this.ws.send(JSON.stringify(message));
    }

    startVideoStream() {
        // Send video frames at 1 FPS
        this.videoInterval = setInterval(() => {
            this.captureAndSendVideoFrame();
        }, 1000);
    }

    captureAndSendVideoFrame() {
        if (!this.isConnected || !this.ws) return;

        const canvas = this.videoCanvas;
        const video = this.videoPreview;

        canvas.width = 768;
        canvas.height = 768;

        const ctx = canvas.getContext('2d');

        // Draw video frame to canvas
        const aspectRatio = video.videoWidth / video.videoHeight;
        let sx, sy, sWidth, sHeight;

        if (aspectRatio > 1) {
            sHeight = video.videoHeight;
            sWidth = sHeight;
            sx = (video.videoWidth - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = video.videoWidth;
            sHeight = sWidth;
            sx = 0;
            sy = (video.videoHeight - sHeight) / 2;
        }

        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, 768, 768);

        // Convert to JPEG and send
        canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];

                const message = {
                    realtimeInput: {
                        mediaChunks: [
                            {
                                mimeType: "image/jpeg",
                                data: base64data
                            }
                        ]
                    }
                };

                this.ws.send(JSON.stringify(message));
            };
            reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);
    }

    async playAudioResponse(base64Audio) {
        try {
            // Decode base64 to array buffer
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create audio context for playback if not exists
            if (!this.playbackContext) {
                this.playbackContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Gemini returns 24kHz 16-bit PCM
            const sampleRate = 24000;
            const numSamples = bytes.length / 2;
            const audioBuffer = this.playbackContext.createBuffer(1, numSamples, sampleRate);
            const channelData = audioBuffer.getChannelData(0);

            // Convert 16-bit PCM to float
            const view = new DataView(bytes.buffer);
            for (let i = 0; i < numSamples; i++) {
                const int16 = view.getInt16(i * 2, true);
                channelData[i] = int16 / (int16 < 0 ? 0x8000 : 0x7FFF);
            }

            // Play the audio
            const source = this.playbackContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.playbackContext.destination);
            source.start();

            console.log('Playing audio response');

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    addTranscript(sender, message) {
        const transcriptBox = this.transcript;

        // Remove hint if exists
        const hint = transcriptBox.querySelector('.transcript-hint');
        if (hint) hint.remove();

        const entry = document.createElement('div');
        entry.className = `transcript-entry ${sender}`;

        const timestamp = new Date().toLocaleTimeString();
        const label = sender === 'gemini' ? 'Gemini' : sender === 'user' ? 'You' : 'System';

        entry.innerHTML = `
            <div class="transcript-header">
                <strong>${label}</strong>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="transcript-message">${message}</div>
        `;

        transcriptBox.appendChild(entry);
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }

    updateStatus(text, status) {
        this.statusText.textContent = text;
        this.statusIndicator.className = `status-indicator ${status}`;
        this.connectionStatus.textContent = text;
    }

    stopSession() {
        this.cleanup();
        this.updateStatus('Disconnected', 'disconnected');
        this.addTranscript('system', 'Session ended.');
    }

    cleanup() {
        // Stop video interval
        if (this.videoInterval) {
            clearInterval(this.videoInterval);
            this.videoInterval = null;
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Stop media tracks
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        // Clear video preview
        this.videoPreview.srcObject = null;

        // Reset UI
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.apiKeyInput.disabled = false;
        this.enableVideo.disabled = false;
        this.enableAudio.disabled = false;
        this.isConnected = false;
        this.connectionStatus.textContent = 'Not Connected';
    }
}

// Initialize the application when page loads
let client;
document.addEventListener('DOMContentLoaded', () => {
    client = new GeminiLiveClient();
    console.log('Gemini Live Client initialized');
});
