# How to Test Microphone in Browser Console

## Step-by-Step Visual Guide

### 1. Open Your Browser
- Navigate to your app (http://localhost:5000 or wherever it's running)
- The page can be on any screen, but preferably on the Word Practice Game page

### 2. Open Developer Tools
```
Press F12 key
```

You should see a panel appear at the bottom or right side of your browser window with tabs like:
- Elements
- Console ← (Click this one)
- Sources
- Network
- etc.

### 3. Click on "Console" Tab

You'll see something like:
```
>_
```
This is where you type commands.

### 4. Copy and Paste Commands

#### Quick Test (No Permission Required):
```javascript
navigator.mediaDevices.enumerateDevices().then(d => console.log('Devices:', d.filter(x => x.kind === 'audioinput')))
```

**Expected Output if NO permission granted yet:**
```
Devices: [{deviceId: "default", kind: "audioinput", label: "", groupId: "..."}]
```
Note: `label` will be empty until permission is granted.

**Expected Output if NO microphone:**
```
Devices: []
```

---

#### Full Test (Requests Permission):
```javascript
// Copy this entire block
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone works!');
    console.log('Tracks:', stream.getAudioTracks());
    stream.getTracks().forEach(t => t.stop());
    
    // List devices after permission
    return navigator.mediaDevices.enumerateDevices();
  })
  .then(devices => {
    const mics = devices.filter(d => d.kind === 'audioinput');
    console.log(`Found ${mics.length} microphone(s):`);
    mics.forEach((m, i) => console.log(`${i+1}. ${m.label}`));
  })
  .catch(error => {
    console.error('❌ Error:', error.name, '-', error.message);
  });
```

### 5. Interpret Results

#### ✅ SUCCESS - Microphone Working:
```
✅ Microphone works!
Tracks: [MediaStreamTrack]
Found 1 microphone(s):
1. Microphone Array (Realtek Audio)
```

#### ❌ FAIL - No Microphone:
```
❌ Error: NotFoundError - Requested device not found
```
**Fix:** Connect a microphone or enable it in Windows Sound Settings.

#### ❌ FAIL - Permission Denied:
```
❌ Error: NotAllowedError - Permission denied
```
**Fix:** Click 🔒 in address bar → Site Settings → Microphone → Allow

#### ❌ FAIL - Microphone In Use:
```
❌ Error: NotReadableError - Could not start audio source
```
**Fix:** Close other apps using the microphone (Zoom, Teams, Skype, etc.)

---

## Screenshot Reference

When you open DevTools (F12), you'll see:

```
┌─────────────────────────────────────────┐
│  Your App Content                       │
│                                         │
│  [Word Practice Game]                   │
│                                         │
├─────────────────────────────────────────┤ ← DevTools appears here
│ Elements  Console  Sources  Network    │
│ ───────────────────────────────────────│
│ >_ (Type commands here)                │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Console Tab Contents:
```
Console
  Filter  Default levels  ⚙️

>_ navigator.mediaDevices.enumerateDevices()...  [ENTER]

← Output appears below your command
```

---

## Pro Tips

### Tip 1: Clear Console
Click the 🚫 icon or press `Ctrl+L` to clear old messages.

### Tip 2: Copy Error Messages
Right-click any error → "Copy" to get the full text.

### Tip 3: Preserve Log
Check "Preserve log" checkbox to keep messages when page refreshes.

### Tip 4: Run Commands on Page Load
You can also add these commands to the console immediately when the page loads to see what happens during initialization.

---

## Common Issues & Solutions

### Issue: "Devices: []" (Empty Array)
**Meaning:** No microphone detected by Windows/Browser
**Check:**
1. Windows Sound Settings → Input → Any device listed?
2. Device Manager → Audio inputs and outputs → Microphone listed?
3. Try external USB microphone

### Issue: Labels are Empty
**Meaning:** Need to grant permission first
**Solution:** Run the full test command that requests permission

### Issue: "Cannot read property 'getUserMedia' of undefined"
**Meaning:** Not using HTTPS or localhost
**Solution:** 
- Use localhost for development
- Use HTTPS in production
- MediaDevices API requires secure context

---

## What This Tests

Running these commands tests:
1. ✅ Browser API support (does `navigator.mediaDevices` exist?)
2. ✅ Device enumeration (can browser see devices?)
3. ✅ Permission status (does user allow access?)
4. ✅ Microphone functionality (can browser capture audio?)
5. ✅ Device labels (what microphones are available?)

This is the SAME process the app uses, so if it fails here, it will fail in the app too.
