# 🎨 Quick Visual Reference - Theme Updates

## Color Palette

### Primary Colors
```css
Orange Primary:  #ff6b1d
Orange Hover:    #ff8a4a
Gradient:        linear-gradient(to right, #ff6b1d, #ff8a4a)
```

### Backgrounds
```css
White:           #ffffff
Light Gray:      #f9fafb (gray-50)
Border:          #e5e7eb (gray-200)
```

### Accent Colors
```css
Green (Success): #10b981 → #34d399
Blue (Info):     #3b82f6 → #60a5fa
```

---

## Component Styles

### Modal Background
```tsx
className="bg-white rounded-3xl shadow-2xl border border-gray-200"
```

### Stat Card
```tsx
className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm"
```

### Icon Circle (Success)
```tsx
className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg"
```

### Icon Circle (Primary)
```tsx
className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b1d] to-[#ff8a4a] shadow-lg"
```

### Message Box
```tsx
className="bg-gray-50 p-4 rounded-2xl border border-gray-200"
```

### Achievement Badge
```tsx
className="bg-green-50 border border-green-200 rounded-2xl p-4"
```

### Button (Primary)
```tsx
className="bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105"
```

### Info Box (Blue)
```tsx
className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
```

### Info Box (Orange)
```tsx
className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4"
```

---

## Typography

### Headings
```tsx
className="text-3xl font-bold text-gray-900"
```

### Body Text
```tsx
className="text-lg text-gray-700"
```

### Muted Text
```tsx
className="text-sm text-gray-600"
```

### Values/Stats
```tsx
className="text-3xl font-bold text-[#ff6b1d]"
```

### Section Titles
```tsx
className="text-lg font-bold text-gray-900"
```

---

## Before & After Examples

### Feedback Modal Header
**Before:**
```tsx
<div className="w-24 h-24 bg-green-100 border-4 border-green-300">
  <PartyPopper className="w-12 h-12 text-green-600" />
</div>
<h3 className="text-2xl font-bold text-[#F5B82E]">
```

**After:**
```tsx
<div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
  <PartyPopper className="w-10 h-10 text-white" />
</div>
<h3 className="text-2xl font-bold text-gray-900">
```

---

### Stats Card
**Before:**
```tsx
<div className="bg-muted rounded-lg p-4">
  <div className="text-2xl font-bold text-[#F5B82E]">385</div>
  <div className="text-sm text-muted-foreground">Total Points</div>
</div>
```

**After:**
```tsx
<div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm">
  <div className="text-3xl font-bold text-[#ff6b1d]">385</div>
  <div className="text-sm text-gray-600">Total Points</div>
</div>
```

---

### Achievement Badge
**Before:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
  <Check className="w-5 h-5 text-green-500" />
  <span className="text-sm">{achievement}</span>
</div>
```

**After:**
```tsx
<div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
    <Check className="w-4 h-4 text-white" />
  </div>
  <span className="text-sm text-gray-700 text-left">{achievement}</span>
</div>
```

---

### Button
**Before:**
```tsx
<button className="bg-gradient-to-r from-[#F5B82E] to-orange-400 text-white py-3 px-6 rounded-xl font-bold">
  Next Word! 🚀
</button>
```

**After:**
```tsx
<button className="bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white py-4 px-6 rounded-2xl font-bold hover:shadow-xl transform hover:scale-105">
  Next Word! 🚀
</button>
```

---

## Icon Box Pattern

### Standard Format
```tsx
<div className="w-8 h-8 bg-gradient-to-br from-{color}-400 to-{color}-500 rounded-lg flex items-center justify-center">
  <Icon className="w-4 h-4 text-white" />
</div>
```

### Examples
```tsx
// Green (Achievement)
<div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg">
  <Award className="w-5 h-5 text-white" />
</div>

// Blue (Next Goal)
<div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg">
  <Target className="w-4 h-4 text-white" />
</div>

// Orange (Trophy)
<div className="w-24 h-24 bg-gradient-to-br from-[#ff6b1d] to-[#ff8a4a] rounded-full shadow-lg">
  <Trophy className="w-12 h-12 text-white" />
</div>
```

---

## Shadow Hierarchy

```css
/* Subtle - For cards */
shadow-sm

/* Medium - For modals */
shadow-2xl

/* Interactive - For buttons on hover */
shadow-xl

/* No shadow - For nested elements */
(none)
```

---

## Border Radius Guide

```css
/* Small elements (8px) */
rounded-lg

/* Cards and boxes (16px) */
rounded-2xl

/* Large modals (24px) */
rounded-3xl

/* Circles */
rounded-full
```

---

## Spacing Pattern

```css
/* Icon boxes */
w-6 h-6 (small icons in badges)
w-8 h-8 (medium icons in headers)
w-20 h-20 (large icons in modals)
w-24 h-24 (hero icons)

/* Padding */
p-3 (compact)
p-4 (standard)
p-6 (comfortable)
p-8 (spacious)

/* Gaps */
gap-2 (tight)
gap-3 (standard)
gap-4 (comfortable)
```

---

## Consistent Patterns to Follow

### 1. All modals should have:
```tsx
className="bg-white rounded-3xl shadow-2xl border border-gray-200"
```

### 2. All stat cards should have:
```tsx
className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm"
```

### 3. All primary buttons should have:
```tsx
className="bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white rounded-2xl hover:shadow-xl transform hover:scale-105"
```

### 4. All icons in circles should have:
```tsx
<div className="w-{size} h-{size} bg-gradient-to-br from-{color}-400 to-{color}-500 rounded-{shape} shadow-lg">
  <Icon className="text-white" />
</div>
```

### 5. All headings should be:
```tsx
className="text-gray-900" // Not colored
```

### 6. All stats/values should be:
```tsx
className="text-[#ff6b1d]" // Brand color
```

---

## Quick Copy-Paste Components

### Section Header with Icon
```tsx
<h3 className="text-lg font-bold mb-3 flex items-center justify-center gap-2 text-gray-900">
  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
    <Award className="w-5 h-5 text-white" />
  </div>
  Amazing Achievements!
</h3>
```

### Info Card
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
  <div className="flex items-center gap-2 mb-2">
    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
      <Brain className="w-4 h-4 text-white" />
    </div>
    <span className="text-sm font-bold text-blue-900">Helpful Tip:</span>
  </div>
  <p className="text-sm text-blue-700">{tipText}</p>
</div>
```

### Primary Button
```tsx
<button className="w-full bg-gradient-to-r from-[#ff6b1d] to-[#ff8a4a] text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl transition-all transform hover:scale-105">
  Continue! 🚀
</button>
```

---

## ✅ Checklist for New Components

When creating new UI elements, ensure:

- [ ] Uses `#ff6b1d` orange (not `#F5B82E` yellow)
- [ ] White background with `border-gray-200`
- [ ] Proper shadow (`shadow-sm` or `shadow-2xl`)
- [ ] Rounded corners (`rounded-2xl` or `rounded-3xl`)
- [ ] Icons in gradient circles when appropriate
- [ ] Headings are `text-gray-900`
- [ ] Body text is `text-gray-700`
- [ ] Values/stats are `text-[#ff6b1d]`
- [ ] Buttons have hover effects
- [ ] Spacing follows pattern (p-4, gap-3, etc.)

**Keep it clean, professional, and consistent!** 🎨✨
