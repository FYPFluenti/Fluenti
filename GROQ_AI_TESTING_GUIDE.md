# 🎯 Quick Start: Testing Groq AI Integration

## ✅ Changes Summary

**Before:** OpenAI GPT-4o + Groq Whisper (2 API keys)  
**After:** Groq openai/gpt-oss-120b + Groq Whisper (1 API key)

---

## 🔑 Setup (Required)

### 1. Add Groq API Key to `.env`
```bash
# Your .env file should have:
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

**Get your key:** https://console.groq.com/keys

---

## 🧪 Testing Instructions

### **Test 1: Word Generation**
1. Open: http://localhost:3001/speech-therapy/games
2. Click on "Word Practice Game"
3. **Expected:** Game loads with 15-20 personalized words
4. **✅ Success:** Words appear with phonetic info
5. **❌ Failure:** Error message about AI service

**Debug:**
```bash
# Check server logs for:
✅ "Using Groq openai/gpt-oss-120b for word generation"
❌ "Error calling Groq for word generation"
```

---

### **Test 2: Pronunciation Validation (CRITICAL)**
1. In Word Practice Game, say a word **exactly** (e.g., "sun")
2. **Expected:** ✅ Marked as correct
3. Now say modified version (e.g., "sunny")
4. **Expected:** ❌ Marked as incorrect with feedback

**Why this matters:**
- Tests strict phonetic analysis
- Ensures "sunny" ≠ "sun" (different words)
- Validates Groq's reasoning capabilities

**Debug:**
```bash
# Check server logs for:
🔍 AI Pronunciation Validation: "sun" vs "sunny" → INCORRECT ❌ (75%)
```

---

### **Test 3: Feedback Generation**
1. Complete a word attempt (correct or incorrect)
2. **Expected:** Personalized, encouraging feedback appears
3. Check feedback includes:
   - Child's name
   - Specific guidance
   - Encouraging tone
   - Reference to interests (if applicable)

**Example Good Feedback:**
> "Great job, Emma! Your 'sun' sounds wonderful! 🌟 Try opening your mouth a bit wider for the 'u' sound. You're doing amazing!"

---

### **Test 4: Session Summary**
1. Complete an entire game session (practice 5-6 words)
2. **Expected:** Celebration modal with:
   - Total Points (actual score, not 0)
   - Stars Earned (visible stars based on accuracy)
   - Best Streak (highest consecutive correct)
   - Accuracy Percentage
   - Achievements list
   - Motivational message

**Debug:**
```bash
# Check console for:
✅ Score: 180, Stars: 15, Max Streak: 4, Accuracy: 85%
```

---

## 🐛 Common Issues

### Issue: "AI service not configured"
```bash
# Fix: Add GROQ_API_KEY to .env
GROQ_API_KEY=gsk_your_key_here

# Then restart:
npm run dev
```

### Issue: No words generated
```bash
# Check: Is GROQ_API_KEY valid?
# Test in terminal:
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"

# Should return list of available models including openai/gpt-oss-120b
```

### Issue: Rate limit errors
```bash
# Groq free tier: 30 requests/minute
# Solution: Wait 1 minute, then try again
# Or: Upgrade Groq plan at console.groq.com
```

---

## 📊 What's Using Groq Now?

| Feature | Model | Temperature | Purpose |
|---------|-------|-------------|---------|
| **Speech Recognition** | `whisper-large-v3` | N/A | Transcribe child's voice |
| **Word Generation** | `openai/gpt-oss-120b` | 0.7 | Generate personalized words |
| **Feedback** | `openai/gpt-oss-120b` | 0.8 | Create encouraging messages |
| **Validation** | `openai/gpt-oss-120b` | 0.3 | Strict phonetic analysis |
| **Summary** | `openai/gpt-oss-120b` | 0.8 | Celebration messages |

---

## ✅ Success Checklist

- [ ] `.env` has valid `GROQ_API_KEY`
- [ ] Server starts without errors
- [ ] Word Practice Game loads
- [ ] Words are generated (15-20 items)
- [ ] Pronunciation validation works (strict checking)
- [ ] Feedback is personalized and encouraging
- [ ] Session summary shows correct stats
- [ ] No TypeScript errors in console
- [ ] No API errors in server logs

---

## 🎯 Performance Check

Run a complete game session and measure:

| Metric | Target | How to Check |
|--------|--------|--------------|
| **Word Gen Time** | < 3s | Time from game start to words loaded |
| **Validation Time** | < 1s | Time from speech end to feedback shown |
| **Feedback Time** | < 2s | Time from validation to feedback modal |
| **Summary Time** | < 3s | Time from game end to summary modal |

---

## 📞 Support

**Groq Issues:**
- Console: https://console.groq.com/
- Docs: https://console.groq.com/docs/quickstart
- Status: https://status.groq.com/

**Model Not Available?**
- Check: https://console.groq.com/docs/models
- Ensure `openai/gpt-oss-120b` is listed
- Verify your account has access to reasoning models

---

## 🚀 Next: Run the Game

```bash
# Start development server
npm run dev

# Open browser
http://localhost:3001

# Navigate to:
Speech Therapy → Word Practice Game

# Test all 4 AI operations:
1. Word Generation ✅
2. Pronunciation Validation ✅
3. Feedback Generation ✅
4. Session Summary ✅
```

---

**Migration Status:** ✅ Complete  
**Date:** January 2025  
**All AI operations now using Groq Cloud API**
