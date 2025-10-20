---
noteId: "e1ec7221ad9f11f08c9a4dfd044ffb6d"
tags: []

---

# Quick Microphone Diagnostic Guide

## The Issue: "Available audio input devices: 0"

This means Windows/Browser cannot detect ANY microphone. This is NOT a permission issue - it's that no physical microphone exists or is recognized.

## Step 1: Check Windows Sound Settings (MOST IMPORTANT)

### Quick Check:
1. **Right-click the speaker icon** in your taskbar (bottom-right)
2. Click **"Sound settings"**
3. Look under **"Input"** section

**What you should see:**
- A dropdown that says "Choose your input device"
- At least ONE device listed (e.g., "Microphone Array", "Built-in Microphone", "Headset")

**If you see "No input devices found":**
- ❌ Windows doesn't detect any microphone
- This is why the browser shows 0 devices
- Continue to Step 2

**If you DO see a device:**
- Test it: Speak and watch if the blue bar under "Test your microphone" moves
- If it moves → Your mic works in Windows, continue to Step 3
- If it doesn't move → Your mic is connected but not working, continue to Step 2

## Step 2: Check Device Manager

1. Press **Windows + X**
2. Click **"Device Manager"**
3. Look for **"Audio inputs and outputs"**
4. Expand it

**What you should see:**
- Your microphone listed (e.g., "Microphone Array", "Realtek Audio")
- NO yellow warning icons (⚠️)

**If you see a yellow warning icon:**
1. Right-click the device
2. Click "Update driver" → "Search automatically"
3. Restart your computer

**If you don't see ANY audio inputs:**
- Your computer doesn't have a built-in microphone
- You need to connect an external microphone/headset

## Step 3: Check Windows Privacy Settings

1. Press **Windows + I** (Settings)
2. Go to **Privacy & Security** → **Microphone**
3. Make sure ALL THREE are turned ON:
   - ✅ "Microphone access" 
   - ✅ "Let apps access your microphone"
   - ✅ "Let desktop apps access your microphone"

## Step 4: Browser Console Test

1. Open the app in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab
4. Copy and paste this command:

```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ SUCCESS! Microphone works!');
    console.log('Tracks:', stream.getTracks());
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => {
    console.error('❌ ERROR:', error.name, error.message);
  });
```

**Expected Results:**

### ✅ If microphone is working:
```
✅ SUCCESS! Microphone works!
Tracks: [Array with 1+ items]
```

### ❌ If microphone not found:
```
❌ ERROR: NotFoundError Requested device not found
```
This means Windows doesn't recognize any microphone.

### ❌ If permission denied:
```
❌ ERROR: NotAllowedError Permission denied
```
This means you need to allow permission in browser settings.

## Step 5: Common Solutions

### For Laptops with Built-in Microphone:

**Check if disabled:**
1. Device Manager → Audio inputs and outputs
2. If you see "Disabled" next to your microphone:
   - Right-click → Enable

**Try this:**
1. Open Windows Settings
2. Search for "Troubleshoot"
3. Click "Other troubleshooters"
4. Run "Recording Audio" troubleshooter

### For External Microphone/Headset:

**USB Microphone:**
1. Try a different USB port
2. Unplug and plug back in
3. Check if the LED (if any) lights up
4. Try on another computer to verify it works

**3.5mm Jack Microphone:**
1. Make sure it's plugged into the PINK jack (not green/blue)
2. Push it in firmly
3. Try the front and back audio jacks
4. Check if bent pins are preventing connection

**Bluetooth Headset:**
1. Go to Bluetooth settings
2. Remove/forget the device
3. Re-pair it
4. Make sure it's set as both output AND input device

## Step 6: Verify It's Working

After fixing, run this in browser console:

```javascript
navigator.mediaDevices.enumerateDevices().then(devices => {
  const mics = devices.filter(d => d.kind === 'audioinput');
  console.log('Microphones found:', mics.length);
  mics.forEach(mic => console.log('- ', mic.label || 'Unnamed device'));
});
```

**You should see:**
```
Microphones found: 1 (or more)
-  Microphone Array (Realtek Audio)
```

## Most Common Causes (in order):

1. 🔴 **No microphone physically connected** (60%)
   - Solution: Connect a microphone or use a headset

2. 🔴 **Microphone disabled in Device Manager** (15%)
   - Solution: Enable it in Device Manager

3. 🔴 **Windows Privacy blocking it** (10%)
   - Solution: Enable in Privacy & Security → Microphone

4. 🔴 **Driver issues** (10%)
   - Solution: Update drivers or use Windows Update

5. 🔴 **Hardware failure** (5%)
   - Solution: Try different hardware

## Still Not Working?

### Last Resort Steps:

1. **Restart your computer** (seriously, this fixes a lot)

2. **Windows Update:**
   - Settings → Windows Update
   - Check for updates
   - Install all available updates
   - Restart

3. **Reinstall audio drivers:**
   - Device Manager → Audio inputs and outputs
   - Right-click → Uninstall device
   - Restart computer (Windows will reinstall)

4. **Check BIOS settings** (for built-in mic):
   - Restart computer
   - Press F2/Del during boot to enter BIOS
   - Look for "Audio" or "Microphone" settings
   - Make sure it's enabled
   - Save and exit

5. **Try a USB microphone as test:**
   - Buy a cheap USB microphone ($10-20)
   - Plug it in
   - If it works → Your built-in mic is broken
   - If it doesn't work → Deeper Windows/hardware issue

## For Developers: The Fix Applied

The code now:
1. ✅ Requests permission FIRST (before enumerating)
2. ✅ Shows device count AFTER permission granted
3. ✅ Provides specific error messages for each scenario
4. ✅ Gives 15-second toast duration for errors
5. ✅ Shows success message when microphone is ready

The error "Available audio input devices: 0" is now expected if:
- No microphone is connected
- Microphone is disabled in Windows
- Driver issues prevent detection

This is working as designed - it correctly reports when Windows doesn't recognize a microphone.
