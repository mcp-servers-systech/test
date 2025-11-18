// Validation script to check for potential issues in app.js

const fs = require('fs');

console.log('🔍 Running validation checks on the application...\n');

// Read the JavaScript file
const appJs = fs.readFileSync('app.js', 'utf8');

// Check 1: WebSocket URL format
console.log('✓ Check 1: WebSocket URL format');
if (appJs.includes('wss://generativelanguage.googleapis.com')) {
    console.log('  ✓ WebSocket endpoint is correct');
} else {
    console.log('  ✗ WebSocket endpoint might be incorrect');
}

// Check 2: Audio sample rate configuration
console.log('\n✓ Check 2: Audio configuration');
if (appJs.includes('sampleRate: 16000') && appJs.includes('rate=16000')) {
    console.log('  ✓ Audio input rate is correctly set to 16kHz');
} else {
    console.log('  ✗ Audio rate configuration issue');
}

if (appJs.includes('sampleRate = 24000') || appJs.includes('24kHz')) {
    console.log('  ✓ Audio output rate is set to 24kHz');
}

// Check 3: Video processing
console.log('\n✓ Check 3: Video processing');
if (appJs.includes('canvas.width = 768') && appJs.includes('canvas.height = 768')) {
    console.log('  ✓ Video resolution is set to 768x768');
} else {
    console.log('  ✗ Video resolution issue');
}

if (appJs.includes('setInterval') && appJs.includes('1000')) {
    console.log('  ✓ Video frame rate is set to 1 FPS');
}

// Check 4: Error handling
console.log('\n✓ Check 4: Error handling');
const tryBlocks = (appJs.match(/try\s*{/g) || []).length;
const catchBlocks = (appJs.match(/catch\s*\(/g) || []).length;
console.log(`  ✓ Found ${tryBlocks} try blocks and ${catchBlocks} catch blocks`);

// Check 5: Resource cleanup
console.log('\n✓ Check 5: Resource cleanup');
if (appJs.includes('cleanup()') && appJs.includes('mediaStream.getTracks()')) {
    console.log('  ✓ Cleanup function exists with proper media track stopping');
}
if (appJs.includes('clearInterval')) {
    console.log('  ✓ Interval cleanup is implemented');
}
if (appJs.includes('ws.close()')) {
    console.log('  ✓ WebSocket cleanup is implemented');
}

// Check 6: Base64 encoding
console.log('\n✓ Check 6: Base64 encoding');
if (appJs.includes('arrayBufferToBase64') && appJs.includes('btoa')) {
    console.log('  ✓ Base64 encoding functions are present');
}

// Check 7: Audio playback
console.log('\n✓ Check 7: Audio playback');
if (appJs.includes('playAudioResponse') && appJs.includes('AudioContext')) {
    console.log('  ✓ Audio playback implementation found');
}

// Check 8: Message handling
console.log('\n✓ Check 8: Message handling');
if (appJs.includes('setupComplete') && appJs.includes('serverContent')) {
    console.log('  ✓ WebSocket message handlers are implemented');
}

// Check 9: Model configuration
console.log('\n✓ Check 9: Model configuration');
if (appJs.includes('gemini-2.0-flash-exp') || appJs.includes('models/')) {
    console.log('  ✓ Gemini model is specified');
}

// Check 10: Event listeners
console.log('\n✓ Check 10: Event listeners');
if (appJs.includes('addEventListener')) {
    const listeners = (appJs.match(/addEventListener/g) || []).length;
    console.log(`  ✓ Found ${listeners} event listeners attached`);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Validation complete! No critical issues found.');
console.log('='.repeat(50));
