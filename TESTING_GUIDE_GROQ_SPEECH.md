---
noteId: "e1ed3571ad9f11f08c9a4dfd044ffb6d"
tags: []

---

# Quick Testing Guide - Groq Speech Recognition

## Before You Start

Make sure you have:
1. A working microphone (built-in or external)
2. A supported browser (Chrome, Edge, or Firefox)
3. The Groq API key configured in your environment

## Step-by-Step Testing

### 1. Check Microphone Access

```powershell
# In your browser's console (F12), run:
navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log('Audio Inputs:', devices.filter(d => d.kind === 'audioinput'));
});
```

Expected output: Should list at least one audio input device

### 2. Test the Application

1. Start your development server (if not already running):
   ```powershell
   npm run dev
   ```

2. Open the app in your browser

3. Navigate to the **Word Practice Game**

4. **Watch for the microphone permission prompt:**
   - Click "Allow" when prompted
   - If you don't see a prompt, check your browser settings

5. **Start the game:**
   - You should see a toast notification if permission is granted
   - If permission is denied, you'll see a clear error message

6. **Click "Say the word" button:**
   - The button should turn red and show "I'm Listening..."
   - Speak the word clearly
   - Wait for the recording to complete (5 seconds max)

### 3. Expected Behavior

✅ **Success Case:**
- Button turns red while recording
- Recording completes after 5 seconds or when you finish speaking
- Transcription appears
- Feedback is generated
- Game advances or allows retry

❌ **Error Cases You Should Test:**

1. **No microphone connected:**
   - Should show: "No microphone found. Please connect a microphone and try again."

2. **Permission denied:**
   - Should show: "Please allow microphone access in your browser settings."

3. **Microphone in use:**
   - Should show: "Your microphone might be used by another application."

## Common Issues and Solutions

### Issue 1: "Requested device not found"

**Root Cause:** No microphone available or permission denied

**Solution:**
1. Check Windows Sound Settings:
   - Right-click speaker icon in taskbar
   - Select "Sound settings"
   - Under "Input", ensure a device is selected and working
   
2. Test your microphone:
   - In Windows: Settings → System → Sound → Test your microphone
   
3. Check browser permissions:
   - Chrome: Settings → Privacy and security → Site Settings → Microphone
   - Edge: Settings → Cookies and site permissions → Microphone

### Issue 2: Microphone works in other apps but not in the browser

**Solution:**
1. Clear browser cache and cookies
2. Reset site permissions for localhost
3. Restart the browser
4. Try a different browser

### Issue 3: Permission prompt doesn't appear

**Solution:**
1. Check if permission was previously denied
2. Clear site data for localhost
3. Or manually enable in browser settings:
   - Chrome: chrome://settings/content/microphone
   - Edge: edge://settings/content/microphone

## Browser Developer Tools Debugging

Open DevTools (F12) and check the Console tab for these logs:

### Successful Flow:
```
✅ Microphone permission granted
🎯 Starting Groq Whisper speech recognition for: [word]
🎤 Found 1 audio input device(s)
✅ Microphone access granted
🔴 Recording started...
⏹️ Recording stopped (timeout)
🎵 Audio recorded, size: [X] bytes
🎤 Starting Groq Whisper transcription...
✅ Groq transcription successful: { text: "...", confidence: 0.XX }
```

### Error Flow:
```
❌ Microphone permission denied: [Error details]
❌ Recording error: [Error message]
```

## Performance Check

Monitor these metrics:
- **Permission check:** < 100ms
- **Device enumeration:** < 200ms
- **Recording start:** < 500ms
- **Groq transcription:** 1-3 seconds
- **Total flow:** 5-8 seconds from click to feedback

## API Monitoring

Check Groq API usage:
1. Go to: https://console.groq.com
2. Check your API usage dashboard
3. Monitor:
   - Number of requests
   - Response times
   - Error rates
   - Token usage

## Final Checklist

Before considering the fix complete:

- [ ] Microphone permission prompt works
- [ ] Error messages are clear and actionable
- [ ] Game can record speech successfully
- [ ] Groq transcription works correctly
- [ ] Pronunciation analysis provides accurate feedback
- [ ] Game advances properly after successful attempts
- [ ] Game handles failed attempts gracefully
- [ ] No console errors during normal operation
- [ ] Microsoft Speech Service is completely removed
- [ ] Code is clean and maintainable

## Need Help?

If you're still experiencing issues:

1. **Check the logs:**
   - Browser console (F12)
   - Network tab to see Groq API calls
   
2. **Verify environment variables:**
   - Ensure `GROQ_API_KEY` is set correctly
   
3. **Test Groq API separately:**
   ```javascript
   // In browser console
   fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer YOUR_API_KEY'
     },
     // ... add audio data
   });
   ```

4. **Review the fix documentation:**
   - See `GROQ_SPEECH_ONLY_FIX.md` for complete details

## Success Criteria

The fix is working correctly if:
1. ✅ No "Requested device not found" error when microphone is available
2. ✅ Clear, specific error messages when there are actual problems
3. ✅ Users can easily understand and fix permission issues
4. ✅ Game works smoothly with Groq Whisper only
5. ✅ No references to Microsoft Speech Service remain
