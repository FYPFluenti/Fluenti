// Real speech therapy word data with phonetic breakdowns
export const wordPracticeData = {
  level1: {
    name: "Simple Sounds",
    words: [
      { word: "cat", phonetic: "/kæt/", phonemes: ["k", "æ", "t"], difficulty: 1, category: "animals" },
      { word: "dog", phonetic: "/dɔːg/", phonemes: ["d", "ɔː", "g"], difficulty: 1, category: "animals" },
      { word: "sun", phonetic: "/sʌn/", phonemes: ["s", "ʌ", "n"], difficulty: 1, category: "nature" },
      { word: "cup", phonetic: "/kʌp/", phonemes: ["k", "ʌ", "p"], difficulty: 1, category: "objects" },
      { word: "hat", phonetic: "/hæt/", phonemes: ["h", "æ", "t"], difficulty: 1, category: "clothing" },
      { word: "bed", phonetic: "/bɛd/", phonemes: ["b", "ɛ", "d"], difficulty: 1, category: "furniture" },
      { word: "pen", phonetic: "/pɛn/", phonemes: ["p", "ɛ", "n"], difficulty: 1, category: "objects" },
      { word: "box", phonetic: "/bɑːks/", phonemes: ["b", "ɑː", "k", "s"], difficulty: 1, category: "objects" }
    ]
  },
  level2: {
    name: "Consonant Blends",
    words: [
      { word: "tree", phonetic: "/triː/", phonemes: ["t", "r", "iː"], difficulty: 2, category: "nature" },
      { word: "blue", phonetic: "/bluː/", phonemes: ["b", "l", "uː"], difficulty: 2, category: "colors" },
      { word: "frog", phonetic: "/frɑːg/", phonemes: ["f", "r", "ɑː", "g"], difficulty: 2, category: "animals" },
      { word: "star", phonetic: "/stɑːr/", phonemes: ["s", "t", "ɑː", "r"], difficulty: 2, category: "objects" },
      { word: "snow", phonetic: "/snoʊ/", phonemes: ["s", "n", "oʊ"], difficulty: 2, category: "nature" },
      { word: "drum", phonetic: "/drʌm/", phonemes: ["d", "r", "ʌ", "m"], difficulty: 2, category: "objects" },
      { word: "flag", phonetic: "/flæg/", phonemes: ["f", "l", "æ", "g"], difficulty: 2, category: "objects" },
      { word: "swim", phonetic: "/swɪm/", phonemes: ["s", "w", "ɪ", "m"], difficulty: 2, category: "actions" }
    ]
  },
  level3: {
    name: "Complex Words",
    words: [
      { word: "butterfly", phonetic: "/ˈbʌtərflaɪ/", phonemes: ["b", "ʌ", "t", "ər", "f", "l", "aɪ"], difficulty: 3, category: "animals" },
      { word: "rainbow", phonetic: "/ˈreɪnboʊ/", phonemes: ["r", "eɪ", "n", "b", "oʊ"], difficulty: 3, category: "nature" },
      { word: "elephant", phonetic: "/ˈɛlɪfənt/", phonemes: ["ɛ", "l", "ɪ", "f", "ə", "n", "t"], difficulty: 3, category: "animals" },
      { word: "umbrella", phonetic: "/ʌmˈbrɛlə/", phonemes: ["ʌ", "m", "b", "r", "ɛ", "l", "ə"], difficulty: 3, category: "objects" },
      { word: "sandwich", phonetic: "/ˈsænwɪtʃ/", phonemes: ["s", "æ", "n", "w", "ɪ", "tʃ"], difficulty: 3, category: "food" },
      { word: "basketball", phonetic: "/ˈbæskɪtbɔːl/", phonemes: ["b", "æ", "s", "k", "ɪ", "t", "b", "ɔːl"], difficulty: 3, category: "sports" },
      { word: "dinosaur", phonetic: "/ˈdaɪnəsɔːr/", phonemes: ["d", "aɪ", "n", "ə", "s", "ɔːr"], difficulty: 3, category: "animals" },
      { word: "telephone", phonetic: "/ˈtɛlɪfoʊn/", phonemes: ["t", "ɛ", "l", "ɪ", "f", "oʊ", "n"], difficulty: 3, category: "objects" }
    ]
  }
};

// Sound recognition therapeutic data
export const soundRecognitionData = {
  phonemes: [
    { sound: "/b/", example: "ball", audioKey: "b_sound", category: "plosive" },
    { sound: "/p/", example: "pen", audioKey: "p_sound", category: "plosive" },
    { sound: "/m/", example: "moon", audioKey: "m_sound", category: "nasal" },
    { sound: "/f/", example: "fish", audioKey: "f_sound", category: "fricative" },
    { sound: "/v/", example: "van", audioKey: "v_sound", category: "fricative" },
    { sound: "/s/", example: "sun", audioKey: "s_sound", category: "fricative" },
    { sound: "/z/", example: "zoo", audioKey: "z_sound", category: "fricative" },
    { sound: "/θ/", example: "think", audioKey: "th_voiceless", category: "fricative" },
    { sound: "/ð/", example: "this", audioKey: "th_voiced", category: "fricative" },
    { sound: "/ʃ/", example: "shop", audioKey: "sh_sound", category: "fricative" },
    { sound: "/r/", example: "red", audioKey: "r_sound", category: "approximant" },
    { sound: "/l/", example: "leaf", audioKey: "l_sound", category: "lateral" }
  ],
  vowels: [
    { sound: "/iː/", example: "see", audioKey: "ee_sound", category: "long_vowel" },
    { sound: "/ɪ/", example: "sit", audioKey: "i_sound", category: "short_vowel" },
    { sound: "/ɛ/", example: "bed", audioKey: "e_sound", category: "short_vowel" },
    { sound: "/æ/", example: "cat", audioKey: "a_sound", category: "short_vowel" },
    { sound: "/ʌ/", example: "cup", audioKey: "u_sound", category: "short_vowel" },
    { sound: "/ɔː/", example: "door", audioKey: "or_sound", category: "long_vowel" },
    { sound: "/oʊ/", example: "go", audioKey: "o_sound", category: "diphthong" },
    { sound: "/aɪ/", example: "my", audioKey: "i_long", category: "diphthong" }
  ]
};

// Sentence building templates
export const sentenceBuildingData = {
  level1: {
    templates: [
      { 
        pattern: "[subject] [verb] [object]",
        example: "The cat sees the ball",
        words: [
          { text: "The cat", type: "subject", options: ["The cat", "The dog", "A bird"] },
          { text: "sees", type: "verb", options: ["sees", "likes", "wants"] },
          { text: "the ball", type: "object", options: ["the ball", "the toy", "a mouse"] }
        ]
      },
      {
        pattern: "[subject] [verb] [adverb]",
        example: "I run quickly",
        words: [
          { text: "I", type: "subject", options: ["I", "You", "We"] },
          { text: "run", type: "verb", options: ["run", "walk", "jump"] },
          { text: "quickly", type: "adverb", options: ["quickly", "slowly", "happily"] }
        ]
      }
    ]
  },
  level2: {
    templates: [
      {
        pattern: "[subject] [verb] [adjective] [object]",
        example: "The boy ate the red apple",
        words: [
          { text: "The boy", type: "subject", options: ["The boy", "The girl", "My friend"] },
          { text: "ate", type: "verb", options: ["ate", "found", "picked"] },
          { text: "the red", type: "adjective", options: ["the red", "a big", "the small"] },
          { text: "apple", type: "object", options: ["apple", "banana", "orange"] }
        ]
      }
    ]
  }
};

// Rhythm patterns for speech therapy
export const rhythmPatternsData = {
  basic: [
    { pattern: "• • • •", name: "Even Beat", bpm: 60, description: "Four even beats" },
    { pattern: "• - • -", name: "Long Short", bpm: 80, description: "Alternating long and short" },
    { pattern: "• • - •", name: "Two Short One Long", bpm: 70, description: "Emphasis on third beat" }
  ],
  intermediate: [
    { pattern: "• - - • •", name: "Waltz Time", bpm: 90, description: "3/4 time signature" },
    { pattern: "• • • - • •", name: "Syncopated", bpm: 100, description: "Syncopated rhythm" }
  ],
  advanced: [
    { pattern: "• - • • - • •", name: "Complex Pattern", bpm: 120, description: "Mixed rhythm pattern" },
    { pattern: "• • - - • • -", name: "Swing Time", bpm: 110, description: "Swing rhythm" }
  ]
};

// Story reading data
export const storyReadingData = {
  level1: {
    title: "The Little Cat",
    text: "The little cat is soft. The cat has a red ball. The cat likes to play. The cat runs fast.",
    sentences: [
      "The little cat is soft.",
      "The cat has a red ball.",
      "The cat likes to play.",
      "The cat runs fast."
    ],
    comprehension: [
      { question: "What color is the ball?", answer: "red", options: ["red", "blue", "green"] },
      { question: "What does the cat like to do?", answer: "play", options: ["play", "sleep", "eat"] }
    ],
    difficulty: 1
  },
  level2: {
    title: "The Big Tree",
    text: "There was a big tree in the park. Many birds lived in the tree. The children loved to play under the tree. In summer, the tree gave cool shade.",
    sentences: [
      "There was a big tree in the park.",
      "Many birds lived in the tree.",
      "The children loved to play under the tree.",
      "In summer, the tree gave cool shade."
    ],
    comprehension: [
      { question: "Where was the tree?", answer: "in the park", options: ["in the park", "at home", "by the river"] },
      { question: "Who lived in the tree?", answer: "birds", options: ["birds", "cats", "dogs"] },
      { question: "When did the tree give shade?", answer: "summer", options: ["summer", "winter", "spring"] }
    ],
    difficulty: 2
  },
  level3: {
    title: "The Adventure",
    text: "Emma found a mysterious map in her grandmother's attic. The map showed a path through the forest to a hidden waterfall. She decided to explore with her best friend Tom. Together, they discovered beautiful flowers and heard birds singing. At the waterfall, they found a treasure chest full of colorful stones.",
    sentences: [
      "Emma found a mysterious map in her grandmother's attic.",
      "The map showed a path through the forest to a hidden waterfall.",
      "She decided to explore with her best friend Tom.",
      "Together, they discovered beautiful flowers and heard birds singing.",
      "At the waterfall, they found a treasure chest full of colorful stones."
    ],
    comprehension: [
      { question: "Where did Emma find the map?", answer: "grandmother's attic", options: ["grandmother's attic", "library", "school"] },
      { question: "Who went with Emma?", answer: "Tom", options: ["Tom", "Sarah", "Jake"] },
      { question: "What was in the treasure chest?", answer: "colorful stones", options: ["colorful stones", "gold coins", "toys"] }
    ],
    difficulty: 3
  }
};

// Quick sounds challenge data
export const quickSoundsData = {
  easy: [
    { sound: "B", word: "Ball", time: 3000 },
    { sound: "C", word: "Cat", time: 3000 },
    { sound: "D", word: "Dog", time: 3000 },
    { sound: "F", word: "Fish", time: 3000 },
    { sound: "M", word: "Moon", time: 3000 },
    { sound: "P", word: "Pen", time: 3000 },
    { sound: "S", word: "Sun", time: 3000 },
    { sound: "T", word: "Top", time: 3000 }
  ],
  medium: [
    { sound: "CH", word: "Chair", time: 2500 },
    { sound: "SH", word: "Ship", time: 2500 },
    { sound: "TH", word: "Think", time: 2500 },
    { sound: "WH", word: "Wheel", time: 2500 },
    { sound: "PH", word: "Phone", time: 2500 },
    { sound: "CK", word: "Duck", time: 2500 }
  ],
  hard: [
    { sound: "STR", word: "Street", time: 2000 },
    { sound: "SPR", word: "Spring", time: 2000 },
    { sound: "THR", word: "Three", time: 2000 },
    { sound: "SCR", word: "Screen", time: 2000 },
    { sound: "SQU", word: "Square", time: 2000 }
  ]
};
