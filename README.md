# Gemini Live API - Real-time Audio & Video Chat Application

A complete web application that enables real-time multimodal conversations with Google's Gemini AI using the Live API. Features include live audio streaming, video camera integration, and natural voice interactions.

## Features

- **Real-time Audio Streaming**: Speak naturally with Gemini and receive voice responses
- **Video Camera Integration**: Show things to Gemini through your webcam at 1 FPS
- **Multimodal Understanding**: Ask Gemini to describe what it sees in the video
- **Low Latency**: Direct WebSocket connection for minimal delay
- **Professional UI**: Clean, modern interface with live status indicators
- **Conversation Transcript**: Track the entire conversation history

## Technical Specifications

- **Audio Input**: 16-bit PCM, 16kHz, mono
- **Audio Output**: 16-bit PCM, 24kHz
- **Video**: 768x768 resolution at 1 FPS
- **Model**: gemini-2.0-flash-exp
- **Protocol**: WebSocket (wss://generativelanguage.googleapis.com)

## Prerequisites

1. **Gemini API Key**: Get your free API key from [Google AI Studio](https://aistudio.google.com)
2. **Modern Web Browser**: Chrome, Edge, or Firefox with WebRTC support
3. **Camera & Microphone**: Physical devices for audio/video input
4. **HTTPS or Localhost**: Required for media device access

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Navigate to "Get API Key"
4. Create a new API key
5. Copy the key (starts with `AIza...`)

### 2. Install the Application

**Option A: Simple File Server (Recommended for testing)**

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

**Option B: Deploy to Web Server**

Upload all files to your web hosting:
- `index.html`
- `app.js`
- `styles.css`
- `README.md`

### 3. Access the Application

1. Open your browser and navigate to:
   - Local: `http://localhost:8000`
   - Deployed: `https://yourdomain.com`

2. Allow camera and microphone permissions when prompted

## Usage Guide

### Starting a Session

1. **Enter API Key**: Paste your Gemini API key in the password field
2. **Configure System Instructions** (Optional): Customize how Gemini should behave
3. **Enable Features**: Toggle audio/video as needed
4. **Click "Start Session"**: Wait for "Connected" status
5. **Start Talking**: Speak naturally to Gemini

### Example Interactions

**Audio-Only Conversation:**
```
You: "Hi Gemini, how are you today?"
Gemini: [Responds with voice]
```

**Video Description:**
```
You: "What do you see in the video?"
Gemini: [Describes what's visible through your camera]
```

**Multimodal Interaction:**
```
You: [Shows an object to camera] "Can you tell me what this is?"
Gemini: [Identifies and describes the object]
```

### Stopping a Session

1. Click "Stop Session" button
2. Camera and microphone will be released
3. WebSocket connection closes

## File Structure

```
gemini-live-app/
├── index.html       # Main HTML structure
├── app.js          # Core application logic
├── styles.css      # UI styling
└── README.md       # This file
```

## Key Components

### WebSocket Communication

The app connects to Gemini's Live API via WebSocket:

```javascript
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=YOUR_API_KEY
```

### Audio Processing Pipeline

1. **Capture**: Get microphone input via `getUserMedia()`
2. **Resample**: Convert from 48kHz (browser) to 16kHz (Gemini)
3. **Encode**: Convert Float32 to 16-bit PCM
4. **Stream**: Send chunks via WebSocket
5. **Receive**: Get 24kHz PCM audio back
6. **Decode**: Convert to AudioBuffer
7. **Play**: Output through speakers

### Video Processing Pipeline

1. **Capture**: Get webcam feed via `getUserMedia()`
2. **Sample**: Extract frames at 1 FPS
3. **Resize**: Scale to 768x768 (square aspect ratio)
4. **Encode**: Convert to JPEG Base64
5. **Stream**: Send via WebSocket

## Configuration Options

### System Instructions

Customize Gemini's behavior by editing the system prompt:

```javascript
"You are a helpful AI assistant with vision and voice capabilities..."
```

### Voice Selection

The app uses the "Puck" voice by default. Other options include:
- Puck (default)
- Charon
- Kore
- Fenrir
- Aoede

Change in `app.js`:

```javascript
prebuilt_voice_config: {
    voice_name: "Puck"  // Change here
}
```

### Video Resolution

Adjust in `app.js`:

```javascript
video: {
    width: { ideal: 768 },
    height: { ideal: 768 },
    frameRate: { ideal: 1, max: 5 }
}
```

## Troubleshooting

### "Failed to start: Permission denied"
- Grant camera/microphone permissions in browser settings
- Ensure you're on HTTPS or localhost

### "WebSocket connection failed"
- Verify your API key is correct
- Check internet connection
- Ensure API key has Live API access enabled

### No audio output
- Check browser audio isn't muted
- Verify speakers are working
- Open browser console for error messages

### Video not showing
- Confirm camera is not in use by another app
- Try toggling "Enable Video Camera" off and on
- Refresh the page and try again

### Poor audio quality
- Speak clearly into microphone
- Reduce background noise
- Check microphone is not muted

## Browser Compatibility

| Browser | Audio | Video | Notes |
|---------|-------|-------|-------|
| Chrome 90+ | ✅ | ✅ | Recommended |
| Edge 90+ | ✅ | ✅ | Full support |
| Firefox 88+ | ✅ | ✅ | Full support |
| Safari 14+ | ⚠️ | ⚠️ | Limited WebRTC support |
| Opera 76+ | ✅ | ✅ | Full support |

## API Limits

- **Session Duration**: Maximum 10 minutes per session
- **Concurrent Sessions**: 5,000 per project
- **Rate Limits**: Varies by API tier
- **Video Processing**: 1 FPS (frames per second)

## Security Considerations

### Production Deployment

⚠️ **IMPORTANT**: Never expose your API key in client-side code for production!

**Recommended Architecture:**

1. **Backend Proxy**: Create a server-side endpoint
2. **Token Exchange**: Use ephemeral tokens
3. **Authentication**: Implement user authentication
4. **Rate Limiting**: Control API usage per user

**Example Backend Proxy (Node.js):**

```javascript
const WebSocket = require('ws');
const express = require('express');

app.post('/api/gemini-token', authenticate, (req, res) => {
    // Generate ephemeral token
    // Return to client
});
```

### Best Practices

- Use environment variables for API keys during development
- Implement CORS policies
- Enable HTTPS in production
- Validate and sanitize user inputs
- Monitor API usage and costs

## Advanced Features

### Function Calling

Enable Gemini to call custom functions:

```javascript
setup: {
    tools: [{
        function_declarations: [{
            name: "get_weather",
            description: "Get current weather",
            parameters: {
                type: "object",
                properties: {
                    location: { type: "string" }
                }
            }
        }]
    }]
}
```

### Search Grounding

Enable Google Search integration:

```javascript
tools: [{
    google_search: {}
}]
```

### Code Execution

Allow Gemini to run code:

```javascript
tools: [{
    code_execution: {}
}]
```

## Performance Optimization

### Reduce Latency

1. **Use CDN**: Serve static files from CDN
2. **Minimize Bundle**: Remove unused code
3. **Audio Buffering**: Adjust buffer sizes
4. **Video Quality**: Lower JPEG quality if needed

### Bandwidth Optimization

```javascript
// Reduce video frame rate
frameRate: { ideal: 0.5 }  // 1 frame every 2 seconds

// Lower JPEG quality
canvas.toBlob(blob, 'image/jpeg', 0.6)  // 60% quality
```

## Development

### Debug Mode

Enable console logging:

```javascript
// Add to app.js
const DEBUG = true;

if (DEBUG) console.log('Debug info:', data);
```

### Testing

Test individual components:

1. **Audio Only**: Disable video to test audio pipeline
2. **Video Only**: Mute microphone to test video
3. **Text Responses**: Change `response_modalities` to `["TEXT"]`

## Known Issues

1. **Safari Limitations**: Some WebRTC features limited on Safari
2. **Mobile Support**: Mobile browsers may have restrictions
3. **Audio Echo**: Use headphones to prevent audio feedback
4. **Session Timeout**: Sessions automatically close after 10 minutes

## Roadmap

- [ ] Mobile app support (iOS/Android)
- [ ] Screen sharing capability
- [ ] Multi-language support
- [ ] Chat history export
- [ ] Custom voice training
- [ ] Integration with other Gemini models

## Resources

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [Google AI Studio](https://aistudio.google.com)
- [API Reference](https://ai.google.dev/api/live)
- [GitHub Examples](https://github.com/google-gemini/live-api-web-console)

## License

This project is open-source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review [official documentation](https://ai.google.dev/gemini-api/docs/live)
3. Open an issue on GitHub
4. Contact Google AI support for API-specific issues

## Credits

Built with:
- Google Gemini Live API
- Web Audio API
- WebRTC getUserMedia
- WebSocket API

---

**Made with ❤️ for the Gemini Developer Community**
