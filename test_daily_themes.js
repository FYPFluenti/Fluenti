/**
 * Daily Quest Theme Preview Script
 * Shows what themes will appear over the next 30 days
 * Run: node test_daily_themes.js
 */

// Theme data
const QUEST_THEMES = [
  { theme: "Ocean Adventure", emoji: "🌊" },
  { theme: "Space Explorer", emoji: "🚀" },
  { theme: "Jungle Safari", emoji: "🌴" },
  { theme: "Arctic Expedition", emoji: "❄️" },
  { theme: "Dragon Kingdom", emoji: "🐉" },
  { theme: "Fairy Garden", emoji: "🧚" },
  { theme: "Pirate Treasure Hunt", emoji: "🏴‍☠️" },
  { theme: "Rainbow Bridge", emoji: "🌈" },
  { theme: "Wizard Academy", emoji: "🧙" },
  { theme: "Dinosaur Park", emoji: "🦕" },
  { theme: "Superhero Training", emoji: "⚡" },
  { theme: "Circus Spectacular", emoji: "🎪" },
  { theme: "Castle Quest", emoji: "🏰" },
  { theme: "Music Festival", emoji: "🎵" }
];

// Same algorithm as backend
function getQuestThemeForDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const seed = (year * 10000) + (month * 100) + day;
  const pseudoRandom = Math.abs(Math.sin(seed) * 10000);
  const themeIndex = Math.floor(pseudoRandom) % QUEST_THEMES.length;
  
  return { ...QUEST_THEMES[themeIndex], index: themeIndex };
}

// Test next 30 days
console.log('\n📅 DAILY QUEST THEMES - NEXT 30 DAYS\n');
console.log('='.repeat(60));

const today = new Date();
for (let i = 0; i < 30; i++) {
  const testDate = new Date(today);
  testDate.setDate(today.getDate() + i);
  
  const theme = getQuestThemeForDate(testDate);
  const dateStr = testDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const isToday = i === 0 ? ' ← TODAY' : '';
  console.log(`${dateStr.padEnd(20)} ${theme.emoji} ${theme.theme}${isToday}`);
}

console.log('='.repeat(60));
console.log(`\n✅ Total unique themes: ${QUEST_THEMES.length}`);
console.log('🔄 Themes will repeat after all have been used\n');

// Check for duplicates in next 14 days
console.log('\n🔍 CHECKING FOR DUPLICATES IN NEXT 14 DAYS:');
const seen = new Set();
let hasDuplicates = false;
for (let i = 0; i < 14; i++) {
  const testDate = new Date(today);
  testDate.setDate(today.getDate() + i);
  const theme = getQuestThemeForDate(testDate);
  
  if (seen.has(theme.theme)) {
    hasDuplicates = true;
    console.log(`❌ Duplicate found: ${theme.emoji} ${theme.theme} on day ${i + 1}`);
  }
  seen.add(theme.theme);
}

if (!hasDuplicates) {
  console.log('✅ No duplicates found in next 14 days!');
}

console.log('\n');
