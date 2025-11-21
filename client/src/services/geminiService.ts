import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { StoryChunk, Theme, Emotion, CustomStoryInputs, CustomStoryStep, EndingType, SpeechFeedback, ThematicFeedback, TherapyType, CHALLENGES_PER_LEVEL, LanguageFeedback, RewardContent, Character, AssessmentResult, MAX_SCORE, MAX_FOCUS_STARS, SocialAssessmentResult } from '@/types/games/story-game';
import { buildApiUrl } from '@/lib/apiUtils';

// Initialize GoogleGenAI - using API_KEY from environment
// Vite uses import.meta.env instead of process.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY or VITE_API_KEY environment variable is not set!");
}
// Client is initialized before each API call to ensure the latest API key from the dialog is used.

// Model configuration
const TEXT_GENERATION_MODEL = "gemini-2.5-flash";
const ASSESSMENT_MODEL = "gemini-2.5-pro";

// --- ONBOARDING DATA UTILITIES ---
/**
 * Interface for child age information
 */
export interface ChildAge {
    years: number;
    months: number;
}

/**
 * Interface for onboarding data structure
 */
interface OnboardingData {
    childBirthDate?: Date | string;
    childBirthYear?: number;
    childName?: string;
    childGender?: 'girl' | 'boy';
}

/**
 * Calculate child age from birth date or birth year
 * @param birthDate - Full birth date (preferred)
 * @param birthYear - Birth year (fallback)
 * @returns Age object with years and months
 */
export function calculateChildAge(birthDate?: Date | string, birthYear?: number): ChildAge {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    if (birthDate) {
        // Use full birth date for accurate calculation
        const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
        const birthYearFromDate = birth.getFullYear();
        const birthMonth = birth.getMonth();
        const birthDay = birth.getDate();
        
        let years = currentYear - birthYearFromDate;
        let months = currentMonth - birthMonth;
        
        // Adjust if birthday hasn't occurred this year
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDate.getDate() < birthDay)) {
            years--;
            months += 12;
        }
        
        // Adjust months if day hasn't occurred this month
        if (currentDate.getDate() < birthDay) {
            months--;
            if (months < 0) {
                months += 12;
            }
        }
        
        return { years, months };
    } else if (birthYear) {
        // Fallback to birth year with estimated month
        const estimatedBirthMonth = 6; // Mid-year estimate
        let years = currentYear - birthYear;
        let months = currentMonth - estimatedBirthMonth;
        
        if (months < 0) {
            years--;
            months += 12;
        }
        
        return { years, months };
    }
    
    // Default age if no data available (5-7 year old range, use 6 as default)
    return { years: 6, months: 0 };
}

/**
 * Fetch onboarding data from the API
 * Uses the same authentication pattern as the rest of the app (cookie-based)
 * @returns Promise with onboarding data or null if not found
 */
export async function fetchOnboardingData(): Promise<OnboardingData | null> {
    try {
        // Use the same pattern as getQueryFn - rely on httpOnly cookies for auth
        // No need for Authorization header - cookies are sent automatically with credentials: 'include'
        const response = await fetch(buildApiUrl('/api/onboarding'), {
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important: include cookies in request (httpOnly cookies for auth)
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else if (response.status === 401) {
            // User not authenticated - this is expected if they haven't logged in
            console.log('User not authenticated for onboarding data fetch (expected if not logged in)');
            return null;
        } else {
            console.warn('Failed to fetch onboarding data:', response.status, response.statusText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching onboarding data:', error);
        return null;
    }
}

/**
 * Get child age from onboarding data
 * Fetches onboarding data and calculates age
 * @returns Promise with child age object
 */
export async function getChildAgeFromOnboarding(): Promise<ChildAge> {
    try {
        const onboardingData = await fetchOnboardingData();
        if (onboardingData) {
            return calculateChildAge(onboardingData.childBirthDate, onboardingData.childBirthYear);
        }
    } catch (error) {
        console.error('Error getting child age from onboarding:', error);
    }
    
    // Return default age if fetch fails
    return { years: 6, months: 0 };
}

// Helper function to extract retry delay from error
function extractRetryDelay(error: any): number | null {
    try {
        const message = error?.message || '';
        const match = message.match(/Please retry in ([\d.]+)s/i);
        if (match) {
            const seconds = parseFloat(match[1]);
            if (!isNaN(seconds)) {
                return Math.ceil(seconds * 1000);
            }
        }
        // Check for specific Gemini API error details for retry delay
        const details = error?.details || [];
        for (const detail of details) {
            if (detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' && detail.retryDelay) {
                const seconds = parseFloat(detail.retryDelay.replace('s', '')); // e.g., "1.5s" -> 1.5
                if (!isNaN(seconds)) {
                    return Math.ceil(seconds * 1000);
                }
            }
        }
    } catch (e) {
        // Ignore parsing errors
    }
    return null;
}

// Helper function for retry logic with exponential backoff and rate limit handling
async function retryApiCall<T>(
    apiCall: (ai: GoogleGenAI) => Promise<T>, // Takes the AI client as an argument
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (!apiKey) {
                throw new Error("An API Key must be set when running in a browser. Please set VITE_GEMINI_API_KEY in your .env file.");
            }
            const ai = new GoogleGenAI({ apiKey: apiKey }); // Re-initialize for fresh API key
            return await apiCall(ai);
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || error?.toString() || '';
            const errorCode = error?.code || error?.status;
            
            // Check for API key authentication errors first - don't retry
            if (errorCode === 401 || errorCode === 403 || errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('permission')) {
                throw new Error(`API key authentication failed. Please verify your API_KEY environment variable. Error: ${errorMessage}`);
            }
            
            // Check for invalid model name (404) - don't retry, throw immediately with helpful message
            if (errorCode === 404 || errorMessage.includes('NOT_FOUND') || errorMessage.includes('model') && errorMessage.includes('not found')) {
                const modelInError = errorMessage.match(/model\/([^ ]+)/)?.[1] || 'the specified model';
                throw new Error(`Invalid model name: ${modelInError}. Please check the model name in geminiService.ts and verify your API key has access to this model.`);
            }
            
            // Check for quota exceeded (429) - extract retry delay
            if (errorCode === 429 || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                const retryDelay = extractRetryDelay(error);
                if (retryDelay && attempt < maxRetries - 1) {
                    console.warn(`Rate limit exceeded. Waiting ${retryDelay}ms before retry (attempt ${attempt + 1}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue; // Retry after waiting
                } else {
                    // If we can't extract delay or it's the last attempt, throw
                    throw new Error(`Rate limit exceeded. ${errorMessage.includes('quota') ? 'You have reached your API quota limit. Please check your plan and billing details.' : 'Please try again later.'}`);
                }
            }
            
            // Don't retry on client errors (4xx) except 429 (rate limit) and 408 (timeout)
            if (errorCode >= 400 && errorCode < 500 && errorCode !== 429 && errorCode !== 408 && errorCode !== 404) {
                throw error;
            }
            
            // Retry on 5xx errors (server errors) and 503, 408
            const shouldRetry = errorCode === 503 || errorCode === 500 || 
                               errorCode === 408 || errorMessage.includes('overloaded') ||
                               errorMessage.includes('timeout') || errorMessage.includes('network') || 
                               errorMessage.includes('ECONNREFUSED') || errorMessage.includes('UNAVAILABLE');
            
            // Don't retry on last attempt
            if (attempt === maxRetries - 1 || !shouldRetry) {
                // Provide helpful error message for 503 errors
                if (errorCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
                    throw new Error(`Service temporarily unavailable (503). The model may be overloaded. Please try again in a few moments.`);
                }
                throw error;
            }
            
            // For 503 errors, use longer delays (model is overloaded, needs more time)
            const baseDelay = errorCode === 503 ? 2000 : initialDelay;
            // Exponential backoff: wait longer each retry
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries}). Retrying in ${delay}ms...`, errorMessage);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError || new Error("API call failed after retries");
}

const stringSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of exactly three unique strings to be used as suggestions for the child.",
        },
    },
    required: ["suggestions"],
};

const pronunciationPromptsSchema = {
    type: Type.OBJECT,
    properties: {
        prompts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: {
                        type: Type.STRING,
                        description: "A fun, one-sentence story context to set a scene for the child. Example: 'Look up in the sky! It's a beautiful bird with red and blue feathers!'",
                    },
                    action: {
                        type: Type.STRING,
                        description: "An interactive phrase for the child to say, related to the scenario. It must include the target word. Example: 'Let's say hi, parrot!'",
                    },
                    targetWord: {
                        type: Type.STRING,
                        description: "The single, key word within the 'action' that contains a tricky sound. Example: 'parrot'",
                    }
                },
                required: ["scenario", "action", "targetWord"],
                propertyOrdering: ["scenario", "action", "targetWord"],
            },
            description: "An array of exactly three unique and highly interactive pronunciation prompts.",
        },
    },
    required: ["prompts"],
};


const fluencyPromptsSchema = {
    type: Type.OBJECT,
    properties: {
        prompts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: {
                        type: Type.STRING,
                        description: "A fun, engaging, one-sentence story context that sets up a scene for the child. This should create excitement and context for the fluency challenge. Example: 'Oh no! The brave knight needs to say a magic spell quickly to save the castle!'",
                    },
                    action: {
                        type: Type.STRING,
                        description: "An interactive, story-driven instruction for the child to say a specific phrase or sentence smoothly. It must include the target phrase they need to repeat. Frame it as an action needed in the story. Example: 'Say this magic spell smoothly: Peter Piper picked a peck of pickled peppers!'",
                    },
                    targetPhrase: {
                        type: Type.STRING,
                        description: "The specific phrase or sentence the child needs to say for the fluency assessment. This should contain sounds that can be tricky for fluency (plosives, consonant blends). Example: 'Peter Piper picked a peck of pickled peppers.'",
                    }
                },
                required: ["scenario", "action", "targetPhrase"],
                propertyOrdering: ["scenario", "action", "targetPhrase"],
            },
            description: "An array of exactly three unique and highly interactive fluency prompts with engaging scenarios.",
        },
    },
    required: ["prompts"],
};

const dldPromptsSchema = {
    type: Type.OBJECT,
    properties: {
        prompts: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: {
                        type: Type.STRING,
                        description: "A fun, engaging, one-sentence story context that sets up a scene and creates a reason for the child to use language. This should be relatable and exciting for a 5-7 year old. Example: 'Imagine you're a superhero with amazing powers!'",
                    },
                    action: {
                        type: Type.STRING,
                        description: "An interactive, story-driven question or prompt that encourages the child to form a complete, grammatically correct sentence with descriptive language. Frame it as something the character needs to do or explain in the story. Example: 'Tell me about your superpower and why you chose it!'",
                    },
                    targetConcept: {
                        type: Type.STRING,
                        description: "The language concept being assessed (e.g., 'complex sentences', 'descriptive vocabulary', 'cause and effect', 'sequencing'). This helps guide the assessment.",
                    }
                },
                required: ["scenario", "action", "targetConcept"],
                propertyOrdering: ["scenario", "action", "targetConcept"],
            },
            description: "An array of exactly three unique and highly interactive language prompts with engaging scenarios that encourage complex sentence formation.",
        },
    },
    required: ["prompts"],
};

const socialScenariosSchema = {
    type: Type.OBJECT,
    properties: {
        scenarios: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    scenario: {
                        type: Type.STRING,
                        description: "A short, simple, one-sentence social scenario that is relatable to a 5-7 year old child and involves a clear emotion or social problem.",
                    },
                    question: {
                        type: Type.STRING,
                        description: "A simple, open-ended question that prompts the child to respond to the scenario, like 'What could you say or do?'",
                    }
                },
                required: ["scenario", "question"],
                propertyOrdering: ["scenario", "question"],
            },
            description: "An array of exactly three unique social scenarios for a 5-7 year old. They should cover different social skills like empathy, problem-solving, and conversation initiation.",
        },
    },
    required: ["scenarios"],
};

const socialAnalysisSchema = { // This schema is not actually used in the code but kept for reference
    type: Type.OBJECT,
    properties: {
        analysisReasoning: {
            type: Type.STRING,
            description: "A brief, clinical-style explanation for your analysis of the child's social communication skills, citing evidence from their response."
        },
        title: {
            type: Type.STRING,
            description: "A short, encouraging title for the result screen, based on the social communication analysis."
        },
        feedbackText: {
            type: Type.STRING,
            description: "A gentle, encouraging message FOR THE CHILD explaining what you'll work on, based on their social communication skills."
        }
    },
    required: ["analysisReasoning", "title", "feedbackText"],
    propertyOrdering: ["analysisReasoning", "title", "feedbackText"],
};


const assessmentSchema = {
    type: Type.OBJECT,
    properties: {
        level: {
            type: Type.NUMBER,
            description: "An integer skill level from 1 (beginner) to 20 (advanced) based on the child's performance for the specified therapy type."
        },
        analysisReasoning: {
            type: Type.STRING,
            description: "A brief, clinical-style explanation for your choice of level, citing evidence from the data."
        },
        title: {
            type: Type.STRING,
            description: "A short, encouraging title for the result screen, based on the assessment."
        },
        feedbackText: {
            type: Type.STRING,
            description: "A gentle, encouraging message FOR THE CHILD explaining what you'll work on, based on the assessment."
        }
    },
    required: ["level", "analysisReasoning", "title", "feedbackText"],
    propertyOrdering: ["level", "analysisReasoning", "title", "feedbackText"],
};


const storyStartSchema = {
    type: Type.OBJECT,
    properties: {
        storyChunk: {
            type: Type.STRING,
            description: "A short, one-paragraph starting scene for a children's story featuring the main character. Write in a warm, gentle, and narrative style, like a classic children's picture book. The language should be simple yet evocative. It must end with a question for the child to answer, like 'What should the character do next?'",
        },
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Three very short, creative, and distinct suggestions (2-4 words each) for what the character can do next. Frame them as actions, e.g., 'Explore the cave', 'Follow the sound', 'Ask the butterfly'.",
        },
    },
    required: ["storyChunk", "suggestions"],
    propertyOrdering: ["storyChunk", "suggestions"],
};

const storyContinuationSchema = {
    type: Type.OBJECT,
    properties: {
        speechFeedback: {
            type: Type.OBJECT,
            properties: {
                scoreChange: {
                    type: Type.NUMBER,
                    description: "CRITICAL: Score change for therapy skills. If challengeSuccess is true, this MUST be a positive score from +5 (simple challenge) to +15 (complex challenge) based on difficulty. If challengeSuccess is false, it MUST be -5. If challengeSuccess is null (regular story turn), it MUST be 0."
                },
                mispronouncedWords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of specific words the child likely mispronounced or was disfluent with (e.g., 'wabbit', 'b-b-ball'). If speech is perfect, this must be an empty array. This is not for grammar."
                }
            },
            required: ["scoreChange", "mispronouncedWords"],
            propertyOrdering: ["scoreChange", "mispronouncedWords"],
        },
        languageFeedback: {
            type: Type.OBJECT,
            description: "MUST be included if therapy type is 'dld'. Contains feedback on language use.",
            properties: {
                sentenceComplexityScore: { type: Type.NUMBER, description: "Score from 1 (single word) to 10 (complex sentence) for the child's input." },
                newVocabularyIntroduced: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of new, complex, or interesting vocabulary words the child used."
                },
                grammarFeedback: {
                    type: Type.STRING,
                    description: "Gentle grammar correction or praise. e.g., 'That's a great idea! We can say, \"He went to the castle.\"' If grammar is perfect, this must be an empty string."
                },
                storytellingScore: {
                    type: Type.NUMBER,
                    description: "Score from 1 to 10 for the child's storytelling ability on this turn (creativity, relevance, detail)."
                }
            },
            required: ["sentenceComplexityScore", "newVocabularyIntroduced", "grammarFeedback", "storytellingScore"],
            propertyOrdering: ["sentenceComplexityScore", "newVocabularyIntroduced", "grammarFeedback", "storytellingScore"],
        },
        creativityScore: {
            type: Type.NUMBER,
            description: "CRITICAL: Score from 0-10 for creativity. MUST be 0 if challengeSuccess is true or false (challenge response turn). MUST be 1-10 if challengeSuccess is null (regular story turn): original ideas get 8-10, using suggestions gets 4-6, off-topic gets 0-2. This score is added to the total creativity score."
        },
        emotion: {
            type: Type.STRING,
            description: "The primary emotion detected in the child's response. Must be one of: 'happy', 'sad', 'angry', 'calm', 'curious', 'brave'."
        },
        storyChunk: {
            type: Type.STRING,
            description: "The next paragraph of the story. It must seamlessly continue from the child's input. **CRITICAL RULE**: If you are creating a challenge (i.e., the 'challenge' field is NOT null), this 'storyChunk' text **MUST be a simple statement that sets up the scene for the challenge**. It is ABSOLUTELY FORBIDDEN to end this text with a question mark (?). The text must end with a period (.) or exclamation mark (!), NOT a question mark. The text must lead directly into the challenge prompt. Example: 'Leo sees a sparkling waterfall blocking the path.' (Notice: ends with a period, NOT a question mark!) If you are NOT creating a challenge (i.e., 'challenge' field is null), then this story text MUST end with an open-ended question for the child."
        },
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Three new, very short (2-4 words each), creative, and distinct suggestions for the next action. If the story is ending or a challenge is being presented, this MUST be an empty array."
        },
        challengeSuccess: {
            type: Type.BOOLEAN,
            description: "CRITICAL LOGIC FIELD. This field controls game state. If 'Was the previous turn a challenge?' is TRUE, you MUST return `true` or `false`. If 'Was the previous turn a challenge?' is FALSE, you **ABSOLUTELY MUST** return `null`. Do not return `false` for regular story turns. This field directly controls focus stars: +1 star for true, -1 star for false, no change for null."
        },
        thematicFeedback: {
            type: Type.OBJECT,
            properties: {
                relevanceScore: {
                    type: Type.NUMBER,
                    description: "Integer score from 0 (completely off-topic) to 10 (perfectly on-topic) for how relevant the child's response was to the last story beat. Deduct points for nonsensical or repetitive answers."
                },
                feedbackText: {
                    type: Type.STRING,
                    description: "If the relevance score is below 5, provide a very short, gentle, and encouraging sentence to guide the child back to the story. e.g., 'That's a fun idea! What does [character name] do in the forest?' If the score is 5 or higher, this must be an empty string."
                }
            },
            required: ["relevanceScore", "feedbackText"],
            propertyOrdering: ["relevanceScore", "feedbackText"],
        },
        challenge: {
            type: Type.OBJECT,
            description: "An optional field. If a speech challenge is appropriate for this turn, include this object. CRITICAL: Generate a NEW, UNIQUE challenge every time. Never reuse the same challenge. The challenge must fit naturally into the current story context.",
            properties: {
                type: { type: Type.STRING, description: "'pronunciation', 'fluency', 'dld', or 'social'" },
                word: { type: Type.STRING, description: "The target word/phrase for pronunciation or fluency challenges. For pronunciation: a single word with tricky sounds (r, l, s, th, ch, sh, blends). For fluency: a phrase 8-12 words long with plosives and blends. Not used for dld/social." },
                prompt: {
                    type: Type.STRING,
                    description: "CRITICAL: The complete, self-contained, story-driven instruction for the child. This text is displayed prominently and separately from the main story text. **Vary the phrasing and scenarios for challenges to keep them fresh and engaging.** Pronunciation/Fluency prompts must be STATEMENTS, not questions. DLD/Social prompts must be QUESTIONS. Format examples:\n- Pronunciation: 'To open the magic door, you must say the magic word: Spectacular!'\n- Fluency: 'To calm the rushing river, you must whisper the calming phrase: Seven silly swans swam silently.'\n- DLD: 'The little gnome looks hungry! What kind of food should you give him and why?'\n- Social: 'Your friend the fairy looks sad because she lost her wand. What could you say or do to help?'\nNEVER use simple commands like 'Say this word' - always frame it as a story action."
                },
                target: { type: Type.STRING, description: "The target concept for DLD/Social challenges (e.g., 'cause and effect', 'empathy', 'perspective-taking'). Not used for pronunciation/fluency." }
            },
            required: ["type", "prompt"],
            propertyOrdering: ["type", "word", "prompt", "target"],
        },
        endingType: {
            type: Type.STRING,
            description: "This field determines if the story should end this turn. Can ONLY be 'happy' (when child completes 5 challenges and levels up) or 'sad' (when child's focus stars drop to 0). Set to null if the story should continue. The story MUST continue until one of these two conditions is met. NO natural conclusions allowed."
        }
    },
    required: ["speechFeedback", "thematicFeedback", "storyChunk", "suggestions", "creativityScore"],
    propertyOrdering: ["speechFeedback", "languageFeedback", "creativityScore", "emotion", "storyChunk", "suggestions", "challengeSuccess", "thematicFeedback", "challenge", "endingType"],
};

const rewardSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A very short, celebratory title for the reward screen. Should be under 5 words."
        },
        message: {
            type: Type.STRING,
            description: "A short, encouraging, and personalized message for the child, summarizing their adventure. Mention the character and theme."
        },
        badgeText: {
            type: Type.STRING,
            description: "A creative and fun title for a badge the child has earned. e.g., 'Master Storyteller' or 'Bravest Adventurer'."
        }
    },
    required: ["title", "message", "badgeText"],
    propertyOrdering: ["title", "message", "badgeText"],
}

// --- API TEST FUNCTION ---
/**
 * Test the API key by making a simple request
 * Call this function to verify your API key is working
 */
export const testApiKey = async (): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
        const currentApiKey = apiKey;
        if (!currentApiKey) {
            return {
                success: false,
                message: "API key not found",
                error: "API_KEY environment variable is not set. Please check your .env.local file."
            };
        }

        console.log("Testing API key with Google Gemini API...");
        const ai = new GoogleGenAI({ apiKey: currentApiKey });
        const response = await ai.models.generateContent({
            model: TEXT_GENERATION_MODEL, // Use a simple model for testing
            contents: "Say 'API test successful' in exactly 3 words.",
            config: {
                temperature: 1,
                maxOutputTokens: 100, // Small max tokens for a quick test
            },
        });

        const text = response.text?.trim() || '';
        console.log("API test response:", text);
        
        return {
            success: true,
            message: `API key is working! Model: ${TEXT_GENERATION_MODEL}, Response: ${text}`
        };
    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorCode = error?.code || error?.status;
        
        console.error("API test failed:", error);
        
        // Check for authentication errors
        if (errorCode === 401 || errorCode === 403 || errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('permission')) {
            return {
                success: false,
                message: "API key authentication failed",
                error: `Invalid or unauthorized API key. Error: ${errorMessage}`
            };
        }
        
        // Check for invalid model
        if (errorCode === 404 || errorMessage.includes('NOT_FOUND') || errorMessage.includes('model')) {
            return {
                success: false,
                message: "Model not found",
                error: `Model "${TEXT_GENERATION_MODEL}" not found. Error: ${errorMessage}`
            };
        }
        
        // Check for service overload
        if (errorCode === 503 || errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE')) {
            return {
                success: false,
                message: "Service temporarily unavailable",
                error: `The Google Gemini API service is overloaded (503). Please try again in a few moments. Error: ${errorMessage}`
            };
        }
        
        return {
            success: false,
            message: "API test failed",
            error: `Unexpected error: ${errorMessage} (Code: ${errorCode || 'unknown'})`
        };
    }
};

// --- API FUNCTIONS ---

export const assessSpeechLevel = async (
    results: AssessmentResult[], 
    therapyType: TherapyType,
    childAge?: ChildAge
): Promise<{ level: number; title: string; feedbackText: string; }> => {
    
    // Fetch child age from onboarding if not provided
    const age = childAge || await getChildAgeFromOnboarding();
    const ageDescription = age.years > 0 
        ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? ` and ${age.months} month${age.months !== 1 ? 's' : ''}` : ''} old`
        : '5-7 years old';
    
    const resultsForPrompt = results.map(({ sentence, transcript, targetWord }) => ({ sentence, transcript, targetWord }));
    
    const systemInstruction = `You are an expert pediatric speech-language pathologist AI. Your function is to accurately assess a child's skill level in a specific area of communication and assign them a level from 1 to 20.`;

    const prompt = `
    --- OBJECTIVE ---
    Your task is to holistically assess a ${ageDescription} child's skill for the specific therapy focus of **'${therapyType}'**, considering their performance across all 3 assessment rounds provided. Based on this holistic analysis, you will assign a single skill level from 1 (beginner) to 20 (advanced).

    --- IMPORTANT: LEVEL SYSTEM UNDERSTANDING ---
    The game has a leveling system with 20 total levels (1-20). Each level requires the child to complete 5 challenges successfully before advancing to the next level. 
    - Level 1 = challenges 1-5
    - Level 2 = challenges 6-10
    - Level 3 = challenges 11-15
    - And so on...
    
    Your assessment determines the child's STARTING level. This level should accurately reflect their current skill level so they can begin practicing at an appropriate difficulty. 
    - A child at Level 1 needs significant support and practice
    - A child at Level 10 has moderate skills and can handle intermediate challenges
    - A child at Level 20 has advanced skills and can handle complex challenges
    
    Be precise and clinically accurate in your level assignment. Do not default to Level 5 unless the child truly demonstrates moderate skills.

    --- ASSESSMENT CRITERIA by Therapy Type ---

    *   **If Therapy Type is 'pronunciation'** (Articulation & Phonological Problems):
        *   **Clinical Focus**: Assess for articulation disorders and phonological problems:
           - Sound substitutions (e.g., "wabbit" instead of "rabbit", "thun" instead of "sun")
           - Sound omissions (e.g., "ca" instead of "cat", "boo" instead of "blue")
           - Sound distortions (e.g., lisps on 's' sounds, lateralized 's')
        *   **Focus**: Clarity of speech sounds, specifically on the provided 'targetWord' within the child's 'transcript'. The 'sentence' is the full phrase they were asked to say for context.
        *   **Level 1-5**: The target words are consistently difficult to understand due to multiple sound substitutions, omissions, or distortions. Speech is unclear or immature for their age.
        *   **Level 6-10**: Some consistent errors on specific sounds within the target words (e.g., a lisp on 's', difficulty with 'r' or 'l', substituting 'w' for 'r'), but the words are generally intelligible.
        *   **Level 11-15**: The target words are mostly clear, with only minor or occasional errors on more complex sounds or consonant blends.
        *   **Level 16-19**: Consistently clear and accurate pronunciation of target words. This reflects strong, age-appropriate skills.
        *   **Level 20**: Exceptional, age-advanced pronunciation. The child's speech is remarkably clear and precise on all target words. This level should be assigned rarely and only for outstanding performance.

    *   **If Therapy Type is 'fluency'** (Childhood-onset Fluency Disorder / Stuttering):
        *   **Clinical Focus**: Assess for stuttering behaviors:
           - Sound/syllable repetitions (e.g., "b-b-ball", "I-I-I want", "wa-wa-water")
           - Sound prolongations (e.g., "ssssun", "mmmmom", "llllook")
           - Blocks (getting stuck on words, no sound comes out, visible tension)
           - Disruptions in the natural flow of speech
        *   **Focus**: The smoothness and flow of speech in sentences. Look for repetitions, prolongations, blocks, and hesitations.
        *   **Level 1-5**: Frequent stuttering behaviors (repetitions, prolongations, blocks) that significantly interrupt communication. Speech flow is severely disrupted.
        *   **Level 6-10**: Noticeable disfluencies on certain words or in certain situations (especially on plosives, word beginnings, or under pressure), but can communicate effectively most of the time.
        *   **Level 11-15**: Mostly fluent speech, with occasional, minor repetitions or hesitations that do not impede communication. Disfluencies are infrequent and mild.
        *   **Level 16-20**: Consistently smooth, fluid, and effortless speech. No significant disfluencies observed.
    
    *   **If Therapy Type is 'dld'** (Developmental Language Disorder):
        *   **Clinical Focus**: Assess for language delay/disorder:
           - Ability to form grammatically correct sentences (not just single words or short phrases)
           - Vocabulary knowledge and ability to express ideas
           - Sentence complexity (using conjunctions, descriptive words, cause-and-effect)
           - Common errors: missing words, incorrect grammar (e.g., "Her go to the store" instead of "She goes to the store")
        *   **Focus**: Ability to formulate and use grammatically correct, complex sentences to answer questions. Evaluate grammar, vocabulary, sentence structure, and ability to express complex ideas.
        *   **Level 1-5**: Responses are single words or very short, simple phrases (e.g., "blue car", "yes", "no"). Grammar may be incorrect. Limited vocabulary. Difficulty expressing ideas.
        *   **Level 6-10**: Can form basic sentences, but may omit words or use incorrect grammar (e.g., "Her go to the store", "I want cookie"). Vocabulary is developing but limited. Struggles with complex ideas.
        *   **Level 11-15**: Can form grammatically correct sentences but they are often simple. May struggle with more complex ideas, conjunctions, or cause-and-effect reasoning. Vocabulary is adequate.
        *   **Level 16-20**: Uses a variety of complex sentence structures, good vocabulary, and correct grammar to express ideas clearly. Can use conjunctions, descriptive language, and explain cause-and-effect.

    --- ANALYSIS WORKFLOW ---
    1.  **Carefully review all three rounds** of the child's assessment data below. Look at each transcript and compare it to what was expected.
    
    2.  **For 'pronunciation'**: 
        - Focus *specifically* on the clarity of the 'targetWord' within each 'transcript'
        - Compare the child's pronunciation to the expected target word
        - Look for substitutions, omissions, or distortions in the target sounds
        - The 'sentence' provides context but your primary focus is the 'targetWord'
    
    3.  **For 'fluency'**: 
        - Analyze the entire 'transcript' for smoothness and flow
        - Look for repetitions (e.g., "b-b-ball"), prolongations (e.g., "ssssun"), or blocks
        - Count disfluencies and assess their impact on communication
        - Consider the length and complexity of what they were asked to say
    
    4.  **For 'dld'**: 
        - Analyze the entire 'transcript' for language skills
        - Evaluate grammar, sentence structure, vocabulary, and complexity
        - Check if they used complete sentences or just words/phrases
        - Assess their ability to express ideas clearly
    
    5.  **Assign a precise level** (1-20) based on your holistic analysis:
        - Do NOT default to Level 5 unless the child truly demonstrates moderate skills
        - Be clinically accurate: if they show beginner skills, assign Level 1-5
        - If they show advanced skills, assign Level 16-20
        - Consider the severity and frequency of errors across all 3 rounds
        - Do not simply average the rounds - look at the overall pattern
    
    6.  **Write clinical reasoning** that explains:
        - What you observed in the transcripts
        - Why you chose this specific level
        - What skills the child demonstrated
    
    7.  **Create a positive, encouraging message** for the child that:
        - Uses simple, age-appropriate language
        - Explains what they'll practice in a fun way
        - Does NOT mention the level number to the child
        - Focuses on the adventure and fun ahead

    **Child's Assessment Data:**
    ${JSON.stringify(resultsForPrompt, null, 2)}
    `;

    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: assessmentSchema,
                    systemInstruction: systemInstruction,
                },
            });
        });
        
        const content = response.text || '';
        const json = JSON.parse(content);
        
        // Validate the response
        if (!json.level || typeof json.level !== 'number' || json.level < 1 || json.level > 20) {
            throw new Error(`Invalid level assignment: ${json.level}. Level must be between 1 and 20.`);
        }
        
        if (!json.title || !json.feedbackText) {
            throw new Error("Missing required fields in assessment response");
        }
    
        return {
            level: Math.round(json.level), // Ensure it's an integer
            title: json.title,
            feedbackText: json.feedbackText
        };
    } catch (error: any) {
        console.error("Error assessing speech level:", error);
        throw new Error(`Failed to assess speech level: ${error.message || 'Unknown error'}`);
    }
};

export const analyzeSocialCommunication = async (
    results: SocialAssessmentResult[],
    childAge?: ChildAge
): Promise<{ level: number; title: string; feedbackText: string }> => {
    // Fetch child age from onboarding if not provided
    const age = childAge || await getChildAgeFromOnboarding();
    const ageDescription = age.years > 0 
        ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? ` and ${age.months} month${age.months !== 1 ? 's' : ''}` : ''} old`
        : '5-7 years old';
    
    const systemInstruction = `You are an expert pediatric speech-language pathologist AI specializing in Social (Pragmatic) Communication Disorder. Your function is to accurately assess a child's social communication skill level and assign them a level from 1 to 20.`;

    const prompt = `
        --- OBJECTIVE ---
        Your task is to holistically assess a ${ageDescription} child's social communication skills based on their responses to a series of social scenarios. Based on this holistic analysis, you will assign a single skill level from 1 (beginner) to 20 (advanced).

        --- IMPORTANT: LEVEL SYSTEM UNDERSTANDING ---
        The game has a leveling system with 20 total levels (1-20). Each level requires the child to complete 5 challenges successfully before advancing to the next level. 
        - Level 1 = challenges 1-5
        - Level 2 = challenges 6-10
        - Level 3 = challenges 11-15
        And so on...
        
        Your assessment determines the child's STARTING level. This level should accurately reflect their current skill level so they can begin practicing at an appropriate difficulty. 
        - A child at Level 1 needs significant support and practice
        - A child at Level 10 has moderate skills and can handle intermediate challenges
        - A child at Level 20 has advanced skills and can handle complex challenges
        
        Be precise and clinically accurate in your level assignment. Do not default to Level 5 unless the child truly demonstrates moderate skills.

        --- CLINICAL DEFINITIONS for Social Communication (Speech Problems Related to Neurodevelopmental Conditions) ---
        **Problem**: Speech issues related to social communication, including:
        - Limited social communication or flat tone
        - Echolalia (repeating others' words)
        - Difficulty with rhythm and conversation flow
        - Perspective-taking challenges
        - Empathy and social problem-solving difficulties
        
        **Assessment Criteria**:
        1.  **Perspective-Taking**: Can the child understand the other person's feelings or situation? (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)
        2.  **Social Reciprocity**: Are the responses valid conversational turns? Do they appropriately address the situation? (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)
        3.  **Problem-Solving**: Does the child offer helpful or kind solutions? (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)
        4.  **Language Use**: Is the language used appropriate for the social context? (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)

        --- ASSESSMENT CRITERIA by Level ---
        *   **Level 1-5**: Limited social communication skills. Responses show:
            - Difficulty understanding social situations or other people's feelings
            - Inappropriate or off-topic responses
            - Limited empathy or perspective-taking
            - Echolalia (repeating words without understanding)
            - Flat or inappropriate tone in responses
        *   **Level 6-10**: Developing social communication skills. Responses show:
            - Some understanding of social situations but inconsistent
            - Basic empathy but may struggle with complex scenarios
            - Appropriate responses some of the time
            - Developing perspective-taking abilities
        *   **Level 11-15**: Good social communication skills. Responses show:
            - Generally appropriate social responses
            - Good understanding of social cues and situations
            - Consistent empathy and perspective-taking
            - Appropriate language use for social context
        *   **Level 16-20**: Advanced social communication skills. Responses show:
            - Excellent perspective-taking and empathy
            - Sophisticated social problem-solving
            - Highly appropriate and nuanced social responses
            - Advanced understanding of social dynamics

        --- ANALYSIS WORKFLOW (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY) ---
        1.  **Carefully review all three rounds** of the child's assessment data below. You are evaluating TEXT TRANSCRIPTIONS from speech-to-text, NOT audio sounds.
        
        2.  **For 'social' (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)**: 
            - Analyze the TEXT TRANSCRIPTIONS for social communication skills:
              * Perspective-taking: Does the TEXT show understanding of others' feelings? (e.g., "She seems sad" in text)
              * Empathy: Does the TEXT show appropriate emotional responses? (e.g., "I would help her" in text)
              * Social appropriateness: Are responses appropriate for the social context? (e.g., helpful suggestions vs. "I don't know")
              * Language use: Is the language in the TEXT appropriate for social communication?
            - Look for patterns across all three scenarios
            - DO NOT try to guess audio tone or emotion - only evaluate what appears in the TEXT transcription
            - Evaluate based on what's visible in the text, not audio sounds
        
        3.  **Assign a precise level** (1-20) based on your holistic analysis:
            - Do NOT default to Level 5 unless the child truly demonstrates moderate skills
            - Be clinically accurate: if they show beginner skills, assign Level 1-5
            - If they show advanced skills, assign Level 16-20
            - Consider the consistency and quality of responses across all 3 rounds
            - Do not simply average the rounds - look at the overall pattern
        
        4.  **Write clinical reasoning** that explains:
            - What you observed in the TEXT TRANSCRIPTIONS
            - Why you chose this specific level
            - What social communication skills the child demonstrated
        
        5.  **Create a positive, encouraging message** for the child that:
            - Uses simple, age-appropriate language
            - Explains what they'll practice in a fun way
            - Does NOT mention the level number to the child
            - Focuses on the adventure and fun ahead

        **Child's Assessment Data:**
        ${JSON.stringify(results, null, 2)}
    `;
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: assessmentSchema,
                    systemInstruction: systemInstruction,
                },
            });
        });

        const content = response.text || '';
        const json = JSON.parse(content);
        
        // Validate the response
        if (!json.level || typeof json.level !== 'number' || json.level < 1 || json.level > 20) {
            throw new Error(`Invalid level assignment: ${json.level}. Level must be between 1 and 20.`);
        }
        
        if (!json.title || !json.feedbackText) {
            throw new Error("Missing required fields in social assessment response");
        }
        
        return {
            level: Math.round(json.level), // Ensure it's an integer
            title: json.title,
            feedbackText: json.feedbackText
        };
    } catch (error: any) {
        console.error("Error analyzing social communication:", error);
        throw new Error(`Failed to analyze social communication: ${error.message || 'Unknown error'}`);
    }
};


export const getCustomStorySuggestions = async (step: CustomStoryStep, inputs: CustomStoryInputs): Promise<string[]> => {
    let prompt = "";
    if (step === 'characterName') {
        prompt = `Generate three diverse and creative fantasy character names for a children's story (e.g., 'Flicker the Firefly', 'Grizelda the Gentle Giant', 'Captain Comet'). Respond with a JSON object: {"suggestions": ["name1", "name2", "name3"]}`;
    } else if (step === 'setting') {
        prompt = `The hero is named ${inputs.characterName}. Suggest three magical and distinct settings for their adventure (e.g., 'The Whispering Woods', 'The Crystal Caves', 'The City of Clouds'). Respond with a JSON object: {"suggestions": ["setting1", "setting2", "setting3"]}`;
    } else { // interest
        prompt = `The hero is ${inputs.characterName} in ${inputs.setting}. Suggest three unique hobbies or special powers for them (e.g., 'talking to animals', 'painting with moonlight', 'building tiny machines'). Respond with a JSON object: {"suggestions": ["hobby1", "hobby2", "hobby3"]}`;
    }

    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: TEXT_GENERATION_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: stringSuggestionsSchema,
                },
            });
        });
        const content = response.text || '';
        const json = JSON.parse(content);
        if (!json.suggestions || !Array.isArray(json.suggestions) || json.suggestions.length !== 3) {
            throw new Error("Invalid response format from API for suggestions");
        }
        return json.suggestions.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0);
    } catch (error: any) {
        console.error("Error in getCustomStorySuggestions:", error);
        throw new Error(`Failed to get custom story suggestions: ${error.message || 'Unknown error'}. Please try again.`);
    }
};

export const createCustomStory = async (inputs: CustomStoryInputs): Promise<{ storyChunk: string, suggestions: string[] }> => {
    const prompt = `
You are a creative children's storyteller. Your task is to create an opening scene for a custom story.

**STORY ELEMENTS:**
      - Character Name: ${inputs.characterName}
      - Setting: ${inputs.setting}
      - Special Power/Hobby: ${inputs.interest}
      
**STORY REQUIREMENTS:**
- Write a warm, gentle, one-paragraph starting scene (3-5 sentences)
- The scene must end with an open-ended question for the child to answer (e.g., "What should ${inputs.characterName} do next?")
- Provide exactly three short, creative action suggestions (2-4 words each) like "Explore the cave", "Follow the sound", "Ask the butterfly"
    `;
    
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: TEXT_GENERATION_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: storyStartSchema,
                },
            });
        });
        
        const content = response.text || '';
        
        if (!content) {
            console.error("Empty response from AI");
            throw new Error("AI returned an empty response. Please try again.");
        }
        
        let json;
        try {
            json = JSON.parse(content);
        } catch (parseError) {
            console.error("JSON parse error. Raw content:", content);
            throw new Error(`Failed to parse AI response as JSON. The AI may have returned invalid format. Please try again.`);
        }
        
        if (!json.storyChunk) {
            console.error("Missing storyChunk. JSON received:", json);
            throw new Error("AI response is missing the 'storyChunk' field. Please try again.");
        }
        
        if (typeof json.storyChunk !== 'string') {
            console.error("storyChunk is not a string. Type:", typeof json.storyChunk, "Value:", json.storyChunk);
            throw new Error(`AI response has invalid 'storyChunk' type (expected string, got ${typeof json.storyChunk}). Please try again.`);
        }
        
        if (json.storyChunk.trim() === '') {
            console.error("storyChunk is empty string");
            throw new Error("AI response has an empty 'storyChunk' field. Please try again.");
        }
        
        if (!json.suggestions || !Array.isArray(json.suggestions)) {
            console.warn("Invalid suggestions, using empty array. JSON:", json);
            json.suggestions = [];
        }
        
        return { 
            storyChunk: json.storyChunk.trim(), 
            suggestions: json.suggestions.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0) || [] 
        };
    } catch (error: any) {
        console.error("Error in createCustomStory:", error);
        if (error.message && error.message.includes("AI response")) {
            throw error;
        }
        throw new Error(`Failed to create custom story: ${error.message || 'Unknown error'}. Please try again.`);
    }
};

export const startStory = async (
    theme: Theme, 
    characterName: string,
    childAge?: ChildAge
): Promise<{ storyChunk: string, suggestions: string[] }> => {
    // Fetch child age from onboarding if not provided
    const age = childAge || await getChildAgeFromOnboarding();
    const ageDescription = age.years > 0 
        ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? ` and ${age.months} month${age.months !== 1 ? 's' : ''}` : ''} old`
        : '5-7 years old';
    
    const prompt = `
You are a creative children's storyteller. Your task is to start an engaging story for a ${ageDescription} child.

**STORY REQUIREMENTS:**
- Theme: "${theme}"
- Main Character: ${characterName}
- Target Audience: ${ageDescription} child
- Write a warm, gentle, one-paragraph starting scene (3-5 sentences) appropriate for a ${ageDescription} child
- Use age-appropriate language and concepts that match the child's developmental level
- The scene must end with an open-ended question for the child to answer (e.g., "What should ${characterName} do next?")
- Provide exactly three short, creative action suggestions (2-4 words each) like "Explore the cave", "Follow the sound", "Ask the butterfly"
    `;
    
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: TEXT_GENERATION_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: storyStartSchema,
                },
            });
        });
        
        const content = response.text || '';
        
        if (!content) {
            console.error("Empty response from AI");
            throw new Error("AI returned an empty response. Please try again.");
        }
        
        let json;
        try {
            json = JSON.parse(content);
        } catch (parseError) {
            console.error("JSON parse error. Raw content:", content);
            throw new Error(`Failed to parse AI response as JSON. The AI may have returned invalid format. Please try again.`);
        }
        
        if (!json.storyChunk) {
            console.error("Missing storyChunk. JSON received:", json);
            throw new Error("AI response is missing the 'storyChunk' field. Please try again.");
        }
        
        if (typeof json.storyChunk !== 'string') {
            console.error("storyChunk is not a string. Type:", typeof json.storyChunk, "Value:", json.storyChunk);
            throw new Error(`AI response has invalid 'storyChunk' type (expected string, got ${typeof json.storyChunk}). Please try again.`);
        }
        
        if (json.storyChunk.trim() === '') {
            console.error("storyChunk is empty string");
            throw new Error("AI response has an empty 'storyChunk' field. Please try again.");
        }
        
        if (!json.suggestions || !Array.isArray(json.suggestions)) {
            console.warn("Invalid suggestions, using empty array. JSON:", json);
            json.suggestions = [];
        }
        
        return { 
            storyChunk: json.storyChunk.trim(), 
            suggestions: json.suggestions.map((s: any) => String(s)).filter((s: string) => s.trim().length > 0) || [] 
        };
    } catch (error: any) {
        console.error("Error in startStory:", error);
        if (error.message && error.message.includes("AI response")) {
            throw error;
        }
        throw new Error(`Failed to start story: ${error.message || 'Unknown error'}. Please try again.`);
    }
};

export const continueStory = async (
    story: StoryChunk[], 
    userInput: string, 
    therapyType: TherapyType, 
    level: number, 
    currentScore: number,
    currentSpeechScore: number,
    isOriginalIdea: boolean,
    focusStars: number,
    speechChallengesCompleted: number,
    childAge?: ChildAge
): Promise<{ storyChunk: string, emotion: Emotion, suggestions: string[], creativityScore: number, speechFeedback: SpeechFeedback, thematicFeedback: ThematicFeedback, languageFeedback?: LanguageFeedback, challengeSuccess?: boolean, challenge?: StoryChunk['challenge'], endingType?: EndingType }> => {
    
    // Fetch child age from onboarding if not provided
    const age = childAge || await getChildAgeFromOnboarding();
    const ageDescription = age.years > 0 
        ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? ` and ${age.months} month${age.months !== 1 ? 's' : ''}` : ''} old`
        : '5-7 years old';
    
    // Convert existing story chunks to Gemini's 'Content' format
    const historyContents = story.map(chunk => ({
        role: chunk.author === 'ai' ? 'model' : 'user',
        parts: [{ text: chunk.text.replace(/\*\*/g, '') }]
    }));

    // CRITICAL FIX: Since user input is already added to story array before this function is called,
    // we need to look at the correct index to find the AI's challenge
    // story[story.length - 1] = current user input (just added) -> will be added as the last item to contents
    // story[story.length - 2] = previous AI response (potentially containing challenge)
    const lastAiChunk = story.length > 1 ? story[story.length - 2] : null;
    const wasPreviousTurnChallenge = lastAiChunk?.author === 'ai' && !!lastAiChunk.challenge;
    const lastChallenge = wasPreviousTurnChallenge ? lastAiChunk.challenge : null;
    const targetWord = lastChallenge?.word || null; // Extract target word for pronunciation challenges
    
    const childTurnCount = story.filter(c => c.author === 'user').length;
    
    // CORRECTED LOGIC for calculating turns since last challenge
    let regularTurnsSinceLastChallenge = 0;
    if (wasPreviousTurnChallenge) {
        // If the last AI turn was a challenge, the user's current input is a response to it.
        // Therefore, zero regular turns have passed.
        regularTurnsSinceLastChallenge = 0;
    } else {
        // Find the index of the last AI challenge in the story history (excluding the current user turn).
        const lastChallengeIndex = story.slice(0, -1).map(s => s.author === 'ai' && !!s.challenge).lastIndexOf(true);
        if (lastChallengeIndex > -1) {
            // Count user turns that occurred AFTER the last challenge.
            for (let i = lastChallengeIndex + 1; i < story.length; i++) {
                if (story[i].author === 'user') {
                    regularTurnsSinceLastChallenge++;
                }
            }
        } else {
            // No challenges have appeared yet, so all user turns are "regular".
            regularTurnsSinceLastChallenge = childTurnCount;
        }
    }
    
    const hasAnyChallengeBeenIntroduced = story.some(chunk => chunk.author === 'ai' && !!chunk.challenge);


    const prompt = `
    You are a storyteller AI for a ${ageDescription} child. Your primary goal is to create a fun, collaborative story while providing targeted therapeutic practice. You MUST follow all rules precisely. Use age-appropriate language and concepts that match the child's developmental level (${ageDescription}).

    --- CORE GAME MECHANICS (NON-NEGOTIABLE - APPLIES TO ALL THERAPY TYPES) ---
    1.  **Story End Conditions (ONLY TWO WAYS)**:
        *   **WIN (Level Up)**: The child successfully completes ${CHALLENGES_PER_LEVEL} challenges in their current level. This is the PRIMARY win condition. Set \`endingType\` to 'happy' and write a celebratory ending celebrating their achievement and level-up.
        *   **LOSE (Focus Stars)**: The child's 'Focus Stars' drop to 0 after failing a challenge. Set \`endingType\` to 'sad' and write a gentle, encouraging ending.
        *   **CRITICAL**: The story MUST continue until one of these two conditions is met. You are FORBIDDEN from ending the story for any other reason, including narrative completion or natural story arcs. The story ONLY ends when stars reach 0 (lose) or when 5 challenges are completed (win).
    2.  **Star & Score Rules (STRICT - APPLIES TO ALL THERAPY TYPES)**:
        *   **Focus Stars**: ONLY change during AI-presented challenges. NEVER change during normal story-building turns.
            - +1 star when child completes challenge correctly (success)
            - -1 star when child fails a challenge (failure)
            - Stars NEVER change on regular story turns
        *   **Creativity Score**: ONLY increases during normal story-building turns. NEVER increases during challenges.
            - MUST be 0 for ALL challenge response turns
            - 8-10 for original, creative ideas (child came up with something new)
            - 4-6 for using AI suggestions (child picked from your suggestions)
            - 0-2 for off-topic or nonsensical responses
            - This score is added to the total Creativity Score (1-100 scale)
            - This rule applies to ALL therapy types: pronunciation, fluency, DLD, and social
        *   **Therapy Score (Speech Score)**: ONLY changes during challenges. NEVER changes during regular story turns.
            - **+5 to +15 points** when child successfully completes a challenge, based on complexity.
            - -5 points when child fails a challenge
            - 0 points for all regular story-building turns
            - This score reflects performance on therapeutic challenges
    3.  **Level Progression (APPLIES TO ALL THERAPY TYPES)**:
        *   Level increases ONLY after the child successfully completes ALL 5 challenges
        *   This applies to pronunciation, fluency, DLD, and social communication therapy types
        *   When level increases, child earns a unique badge and gets a happy ending
    4.  **Strict Turn Flow**: The game has two modes. After you evaluate a challenge, the VERY NEXT turn MUST be a regular story turn where you CANNOT issue a new challenge.
    5.  **CRITICAL CHALLENGE TIMING RULES**:
        *   **ABSOLUTE RULE**: If regularTurnsSinceLastChallenge is 0, you are FORBIDDEN from creating any challenge. You MUST continue the story normally.
        *   **MANDATORY CHALLENGE**: If regularTurnsSinceLastChallenge is 2 or more, you MUST create a challenge (unless story is ending).
        *   **OPTIONAL CHALLENGE**: If regularTurnsSinceLastChallenge is 1, you MAY create a challenge or continue the story.
        *   **FIRST CHALLENGE**: If no challenge has been introduced yet, you MUST introduce one now (unless story is ending).
        *   You should NOT introduce challenges too frequently (not every turn)
        *   You should NOT wait too long between challenges (aim for 1-2 regular turns between challenges)
        *   The goal is to balance story progression with therapeutic practice

    --- CURRENT GAME STATE ---
    - Therapy Focus: ${therapyType}
    - Child's Skill Level: ${level} / 20
    - Focus Stars: ${focusStars} / ${MAX_FOCUS_STARS}
    - Challenges Completed This Level: ${speechChallengesCompleted} / ${CHALLENGES_PER_LEVEL}
    - Child Turns So Far: ${childTurnCount}
    - Regular Story Turns Since Last Challenge: ${regularTurnsSinceLastChallenge} (use this to decide if it's time for a new challenge - aim for 1-2 turns)
    - Has Any Challenge Been Introduced Yet: ${hasAnyChallengeBeenIntroduced ? 'Yes' : 'No'} (if No, you MUST introduce the first challenge now!)
    - The child just said: "${userInput}"
    - **Was the previous turn a challenge? ${wasPreviousTurnChallenge}**  <-- THIS DETERMINES YOUR MODE.
    - Previous Challenge Details: ${wasPreviousTurnChallenge ? JSON.stringify(lastChallenge) : 'N/A'}

    --- YOUR TASK: CHOOSE A MODE AND FOLLOW ITS RULES EXACTLY ---
    
    🚨 **CRITICAL MODE DETECTION** 🚨
    - If wasPreviousTurnChallenge = TRUE → You are in MODE 1 (Challenge Evaluation) → challenge field MUST be null
    - If wasPreviousTurnChallenge = FALSE → You are in MODE 2 (Regular Story) → challenge field may be null or filled based on timing rules
    
    **CURRENT MODE**: ${wasPreviousTurnChallenge ? 'MODE 1 (Challenge Evaluation) - NO CHALLENGE ALLOWED' : 'MODE 2 (Regular Story) - Challenge allowed based on timing'}

    --- MODE 1: CHALLENGE RESPONSE MODE (Because 'Was the previous turn a challenge?' is TRUE) ---
    **CRITICAL**: You are in CHALLENGE EVALUATION MODE. You are ABSOLUTELY, COMPLETELY, TOTALLY FORBIDDEN from creating ANY new challenge on this turn.
    Your ONLY job is to evaluate the child's attempt and then return to the normal story flow with NO CHALLENGE.
    
    **REMINDER**: Set challenge field to null. You will NOT create a challenge this turn. This is NON-NEGOTIABLE.
    1.  **Analyze Challenge Success (CRITICAL: Evaluate TEXT TRANSCRIPTION ONLY)**: You MUST determine if the child's response ("${userInput}") succeeded at the challenge. You are evaluating a TEXT TRANSCRIPTION from speech-to-text, NOT audio sounds. Base your evaluation ONLY on what appears in the text.
        *   **CRITICAL RULE**: You MUST set challengeSuccess to either true or false - NEVER null when evaluating a challenge response.
        *   For **'pronunciation'** challenges: 
            - **TARGET WORD**: "${targetWord || 'N/A'}"
            - **CHILD'S TEXT**: "${userInput}"
            - **EVALUATION**: You MUST check if the EXACT word "${targetWord || 'N/A'}" appears COMPLETE in the child's text "${userInput}"
            - **CRITICAL EXAMPLE FOR THIS TURN**: Target="${targetWord || 'N/A'}" vs Child="${userInput}" 
              * If target is "Splendiferous" and child said "Spend it" → This is CLEARLY DIFFERENT = FAILURE (challengeSuccess: false)
              * If target is "Splendiferous" and child said "Splendiferous" → EXACT MATCH = SUCCESS (challengeSuccess: true)
              * If target is "Splendiferous" and child said "Splen" → INCOMPLETE = FAILURE (challengeSuccess: false)
            - **EVALUATION CRITERIA**:
              * **Success**: The EXACT target word appears COMPLETE in the text transcription (case-insensitive match). 
                - Example: Target "glimmering" → Text "glimmering" or "Glimmering!" = SUCCESS (set challengeSuccess: true)
                - Example: Target "rabbit" → Text "rabbit" or "rabbit!" = SUCCESS (set challengeSuccess: true)
              * **Failure**: The text shows ANY deviation from the target word:
                - Sound omissions: Target "glimmering" → Text "glimmer" (missing "ing") = FAILURE (set challengeSuccess: false)
                - Sound substitutions: Target "rabbit" → Text "wabbit" (r→w substitution) = FAILURE (set challengeSuccess: false)
                - Sound omissions: Target "rabbit" → Text "rabit" (missing letters) = FAILURE (set challengeSuccess: false)
                - Partial matches: Target "glimmering" but text shows "glimmer" = FAILURE (set challengeSuccess: false)
                - Off-topic response: Target "castle" but text shows "I like dogs" = FAILURE (set challengeSuccess: false)
            - **CRITICAL**: The target word must appear COMPLETE in the text. ANY deviation = FAILURE
            - A case-insensitive, COMPLETE match of the target word = SUCCESS
            - ANY substitutions, omissions, distortions, or off-topic responses = FAILURE
        *   For **'fluency'** challenges:
            - Look at the TEXT TRANSCRIPTION ("${userInput}") for disfluency markers visible in text:
              * **Success**: The text shows smooth, flowing speech without visible repetitions, prolongations, or blocks (e.g., "seven silly swans swam silently") = set challengeSuccess: true
              * **Failure**: The text shows repetitions (e.g., "s-s-seven" or "seven seven"), prolongations visible in text (e.g., "ssseven"), blocks (getting stuck on words, no sound comes out, incomplete phrases), or off-topic responses = set challengeSuccess: false
            - Evaluate ONLY what appears in the text transcription
            - Smooth, complete fluent speech = SUCCESS
            - ANY visible disfluency markers or off-topic responses = FAILURE
        *   For **'dld'** challenges:
            - Look at the TEXT TRANSCRIPTION ("${userInput}") for language skills:
              * **Success**: The text shows complete sentences with proper grammar, good vocabulary, and ability to express complex ideas (e.g., "I would give him an apple because it's healthy and he looks hungry") = set challengeSuccess: true
              * **Failure**: The text shows short phrases, missing words, incorrect grammar, limited vocabulary, or inability to express ideas (e.g., "apple" or "give food" or "Her want apple" or "I don't know") = set challengeSuccess: false
            - Evaluate grammar, sentence structure, vocabulary, and complexity visible in the TEXT
            - Complete, grammatically correct sentences with good vocabulary expressing complex ideas = SUCCESS
            - Short phrases, grammar errors, limited vocabulary, or off-topic responses = FAILURE
        *   For **'social'** challenges:
            - Look at the TEXT TRANSCRIPTION ("${userInput}") for social communication skills:
              * **Success**: The text shows appropriate social response with empathy, perspective-taking, and helpful suggestions (e.g., "I would give her a hug and help her look for her wand because she seems sad") = set challengeSuccess: true
              * **Failure**: The text shows inappropriate response, lack of empathy, inability to understand the social situation, or off-topic responses (e.g., "I don't know" or "wand" or unrelated answers) = set challengeSuccess: false
            - Evaluate perspective-taking, empathy, and social appropriateness visible in the TEXT
            - Appropriate, empathetic, socially aware response = SUCCESS
            - Inappropriate, off-topic, non-empathetic, or socially unaware response = FAILURE
    2.  **Assess Challenge Complexity**: Based on the 'Previous Challenge Details', determine its complexity to inform your scoring.
        *   **Pronunciation**: Simple = single-syllable words (e.g., 'shine'). Complex = multi-syllabic words with blends (e.g., 'glistening', 'spectacular').
        *   **Fluency**: Simple = short phrase (5-7 words). Complex = long alliterative sentence (10+ words).
        *   **DLD/Social**: Simple = basic 'what' question. Complex = 'why' or 'how' question requiring detailed reasoning.
    3.  **Set Scores (CRITICAL)**:
        *   creativityScore **MUST BE 0** (no creativity points during challenge responses).
        *   speechFeedback.scoreChange **MUST BE a positive score from +5 (for simple challenges) to +15 (for complex challenges) if the child succeeded. It MUST BE -5 if they failed**. Use your complexity assessment from step 2 to assign a fair score.
    4.  **DO NOT CREATE A NEW CHALLENGE (ABSOLUTE RULE)**: The \`challenge\` field for THIS turn **MUST BE null**. Your only job is to evaluate. You will decide whether to create a new challenge on the next turn.
    5.  **Write a Story Chunk with Praise or Guidance, then return to normal flow (CRITICAL)**:
        *   **Part 1 - Feedback**: Your storyChunk MUST be narratively consistent and start with praise (if success) or acknowledgement (if failure). Then provide specific, gentle feedback as described below.
            *   **If challengeSuccess is TRUE**: Write a celebratory continuation. Examples: "Excellent! As you said '${userInput}', the magic happened!", "Wonderful! The path lit up as you spoke the word!".
            *   **If challengeSuccess is FALSE**: Provide gentle, encouraging, and specific guidance. Start by acknowledging the attempt ("That was a good try!" or "Almost!"). Then, provide specific guidance based on the therapy type:
                *   For **'pronunciation'**: Gently correct the word and give a simple tip. Example: "Almost! The magic word was **dragon**, with a 'drrr' sound at the beginning. Let's practice that sound later! For now, the dragon just tilts its head, confused."
                *   For **'fluency'**: Give a gentle tip about smooth speech. Example: "That was a good try! Remember to take a nice deep breath and let the words flow out smoothly, like a calm river. The magic fizzled out, but we can try again on the next challenge!"
                *   For **'dld'**: Model a more complete sentence. Example: "Good start! We could also say, 'I would give the gnome a big, red apple because he is hungry.' The gnome still looks hungry, but maybe you can help him in another way!"
                *   For **'social'**: Model a more empathetic response. Example: "That's one idea! A kind thing to say could be, 'Are you okay? I can help you look for it.' The fairy still looks sad, but she appreciates you talking to her."
        *   **Part 2 - Story Continuation & Transition to Normal Flow**: After the feedback, continue the story in a way that reflects the outcome but allows the story to move forward. The challenge is over for now. Since you are NOT creating a challenge this turn (challenge field is null), your story chunk MUST end with an open-ended question for the child (e.g., "What does Leo do now?"). You MUST then provide three new, creative, and distinct suggestions in the \`suggestions\` array for the next action. The suggestions array MUST NOT be empty unless the game is ending.
    6.  **Check for Game End (ONLY TWO CONDITIONS)**:
        *   **WIN (Level Up)**: If this success means they have now completed ${CHALLENGES_PER_LEVEL} challenges (current count: ${speechChallengesCompleted}, this success makes it ${speechChallengesCompleted + 1}), set endingType to 'happy'. Write a celebratory final paragraph celebrating their level-up achievement and awarding them a unique badge. suggestions MUST be empty array. challenge MUST be null (no challenges when story ends).
        *   **LOSE (Focus Stars)**: If this failure means they now have 0 stars (current stars: ${focusStars}, this failure makes it ${focusStars - 1}), set endingType to 'sad'. Write a gentle, encouraging concluding paragraph. suggestions MUST be empty array. challenge MUST be null (no challenges when story ends).
        *   Otherwise, endingType **MUST BE null**. The story MUST continue.
        *   **CRITICAL**: When endingType is set to 'happy' or 'sad', you MUST set challenge to null. The story is ending, so there are NO MORE CHALLENGES.

    --- MODE 2: REGULAR STORY MODE (Because 'Was the previous turn a challenge?' is FALSE) ---
    This is a creative story turn. You MUST follow these rules.

    **CRITICAL PRE-CHECK**: Before doing ANYTHING else, check regularTurnsSinceLastChallenge = ${regularTurnsSinceLastChallenge}:
    - If this value is 0: You are ABSOLUTELY FORBIDDEN from creating a challenge. You MUST continue the story normally with no challenge.
    - If this value is 1: You MAY create a challenge OR continue the story (your choice).
    - If this value is 2+: You MUST create a challenge (unless story is ending).

    1.  **CRITICAL \`storyChunk\` ENDING RULE**: Your decision on whether to create a challenge dictates how you end the \`storyChunk\`:
        *   **If you are creating a challenge this turn**: The \`storyChunk\` MUST be a short statement setting the scene. It **ABSOLUTELY MUST NOT** end with a question mark (?). This is FORBIDDEN. The storyChunk should be a descriptive statement that sets up the scene for the challenge. Example: "Leo sees a sparkling waterfall blocking the path." (Notice: ends with a period, NOT a question mark!)
        *   **If you are NOT creating a challenge this turn**: The \`storyChunk\` MUST continue the story and **MUST** end with an open-ended question for the child. Example: "...and they all laughed. What happens next?"

    2.  **Analyze Input**: 
        *   Analyze the child's creative input ("${userInput}") for creativity, relevance, and emotional fit.
        *   **ALSO analyze their speech** for the chosen therapy goal (${therapyType}):
            - **Pronunciation**: Look for sound substitutions, omissions, or distortions in their speech
            - **Fluency**: Look for repetitions, prolongations, or blocks in their speech flow
            - **DLD**: Look for grammar, sentence complexity, and vocabulary usage
            - **Social**: Look for perspective-taking, empathy, and social appropriateness
        *   This analysis helps you understand their progress, but scoring happens separately (see below).

    3.  **Set Scores (CRITICAL)**:
        *   \`speechFeedback.scoreChange\` **MUST BE 0** (no therapy score change on regular story turns).
        *   \`challengeSuccess\` **MUST BE null** (not a challenge turn).
        *   Score \`creativityScore\` from 1-10:
            - 8-10: Original, creative idea that fits the story well
            - 4-6: Child used one of your suggestions (still good, but less creative)
            - 0-2: Off-topic, nonsensical, or repetitive response

    4.  **Weave the Story**: 
        *   Your \`storyChunk\` MUST seamlessly incorporate the child's idea into the narrative.
        *   Continue the story naturally, building on what the child said.
        *   Make the child feel like their input matters and shapes the story.

    5.  **Decide Next Action (Challenge OR Continue - NO NATURAL END)**:
        *   **CRITICAL PRE-CHECK - STORY ENDING CONDITIONS**: BEFORE deciding to create a challenge, you MUST check:
            - **WIN CONDITION**: If Challenges Completed This Level is ${speechChallengesCompleted} and this is a challenge response turn where challengeSuccess is true, then completing this challenge means they've reached ${speechChallengesCompleted + 1} challenges. If ${speechChallengesCompleted + 1} >= ${CHALLENGES_PER_LEVEL}, you MUST set endingType to 'happy' and MUST NOT create a challenge.
            - **LOSE CONDITION**: If Focus Stars is ${focusStars} and this is a challenge response turn where challengeSuccess is false, then failing this challenge means stars drop to ${focusStars - 1}. If ${focusStars - 1} <= 0, you MUST set endingType to 'sad' and MUST NOT create a challenge.
            - **FORBIDDEN**: You are ABSOLUTELY FORBIDDEN from creating a challenge if endingType is set to 'happy' or 'sad'. When the story ends, there are NO MORE CHALLENGES.
        *   **A) CREATE A CHALLENGE?** (CRITICAL: Introduce challenges regularly, BUT ONLY IF STORY IS NOT ENDING):
            *   **CHALLENGE TIMING**: The \`regularTurnsSinceLastChallenge\` is ${regularTurnsSinceLastChallenge}.
                - **🚫 ABSOLUTE RULE - NO EXCEPTIONS**: If \`regularTurnsSinceLastChallenge\` is 0: **YOU ARE 100% FORBIDDEN FROM CREATING ANY CHALLENGE. PERIOD.** This means you JUST evaluated a challenge and must continue the story normally. SET challenge TO null. DO NOT CREATE A CHALLENGE.
                - If \`regularTurnsSinceLastChallenge\` is 1: You MAY create a challenge OR continue normally (your choice).
                - If \`regularTurnsSinceLastChallenge\` is 2 or more: **YOU MUST CREATE A CHALLENGE NOW** (but ONLY if endingType is null - story is not ending).
                - **SPECIAL CASE - FIRST CHALLENGE**: If no challenge has been introduced yet (${!hasAnyChallengeBeenIntroduced}), you **MUST introduce the first challenge NOW**, regardless of turn count (but ONLY if endingType is null).
            *   **ACTION IF CREATING A CHALLENGE**:
                - **🚨 CRITICAL PRE-CHECK 🚨**: Before creating ANY challenge, verify you are in MODE 2. If wasPreviousTurnChallenge is TRUE, you are in MODE 1 and CANNOT create challenges.
                - **CRITICAL CHECK**: You can ONLY create a challenge if \`endingType\` is null. If \`endingType\` is 'happy' or 'sad', you are FORBIDDEN from creating a challenge. The story must end.
                - **CRITICAL RULE #1 - ABSOLUTELY FORBIDDEN**: The \`storyChunk\` MUST be a setup statement and MUST NOT end with a question mark (?). If you end it with a question mark, the system will automatically remove it, but you should NOT generate it that way. The storyChunk should be a simple descriptive statement that sets the scene. Example: "Willow the Whisperer took a deep breath, her heart fluttering with curiosity, and began to follow the delicate, bell-like tinkle. It led her past ancient oaks and glowing moss, deeper into the woods than she had ever dared venture alone. The sound grew stronger until she found herself before a magnificent, iridescent flower that shimmered with all the colors of the sunrise. It seemed to pulse with the very source of the mysterious sound, but its petals were tightly closed." (Notice: NO question mark at the end!)
                - The full instruction goes in \`challenge.prompt\`. To avoid text duplication, do not repeat the instruction in both fields.
                - \`suggestions\` array MUST be empty.
                - \`endingType\` MUST be null (if endingType is set, you cannot create a challenge).
                - **CHALLENGE FORMAT (CRITICAL)**: 
                    - Pronunciation and Fluency prompts MUST be commands or statements (e.g., "Say the magic word: Glistening!"). They MUST NOT be questions. DLD and Social prompts MUST be questions to elicit a creative response (e.g., "What would you do and why?").
                    - The \`challenge.prompt\` MUST contain the COMPLETE, self-contained instruction that will be displayed to the child. It should be a full sentence that naturally flows from the story context.
                    - Example for Pronunciation: \`challenge.prompt\` = "To open the magic door, you must say the magic word: Spectacular!"
                    - Example for Fluency: \`challenge.prompt\` = "To calm the rushing river, you must whisper the calming phrase: Seven silly swans swam silently."
                    - Example for DLD: \`challenge.prompt\` = "The little gnome looks hungry! What kind of food should you give him and why?"
                    - Example for Social: \`challenge.prompt\` = "Your friend the fairy looks sad because she lost her wand. What could you say or do to help?"
                - **GENERATE NEW CHALLENGE**: Create a completely NEW, unique challenge that fits the current story context. Never reuse challenges. Set the \`challenge\` object with \`type\`, \`prompt\`, \`word\`, and \`target\` as appropriate.

        *   **B) CONTINUE THE STORY?** (If it's not time for a challenge yet):
            *   **ACTION IF CONTINUING STORY**:
                - **REMEMBER RULE #1**: The \`storyChunk\` MUST end with a question.
                - \`challenge\` field MUST be null.
                - Provide three new, creative suggestions (2-4 words each, like "Explore the cave", "Follow the sound", "Ask the butterfly").
                - \`endingType\` MUST be null (story continues - remember, story ONLY ends on win/lose conditions).
    
    --- THERAPY SPECIFICS (APPLIES TO ALL TYPES: pronunciation, fluency, DLD, social) ---
    1. Challenges should be of the type '${therapyType}'.
    2. **CRITICAL: Every challenge MUST be NEW and UNIQUE**. Never reuse the same challenge. Generate fresh, creative challenges that fit the current story context. This applies to ALL therapy types.
    3. **FORBIDDEN WORDS FOR PRONUNCIATION CHALLENGES**: You MUST NEVER use these example words: "rabbit", "ladder", "dragon", "treasure", "sparkle", "castle", "rainbow", "lion", "wizard", "thunder", "princess", "magic", "forest", "crystal". These are examples only. Generate completely original words with similar sound difficulty.
    4. **Challenge Evaluation Rules (ALL THERAPY TYPES)**:
        *   Stars change ONLY during challenges: +1 for success, -1 for failure
        *   Creativity score is ALWAYS 0 during challenge responses
        *   Level increases ONLY after completing all 5 challenges
        *   Story ends ONLY when stars reach 0 (lose) or 5 challenges completed (win)
    5. **Challenge Formats - EXACT EXAMPLES (generate new ones each time, never hardcode)**:
        *   **Pronunciation**: 
            - The challenge.prompt MUST be a complete statement like: "To open the magic door, you must say the magic word: [word]!" It MUST NOT be a question.
            - The target word should contain sounds children struggle with (r, l, s, th, ch, sh, blends).
            - CRITICAL: Generate COMPLETELY NEW words each time. Never reuse words from examples. Create original magic words that fit the current story context.
            - The word must be age-appropriate, magical, and fit naturally into the story.
            - Example: challenge.prompt = "To unlock the ancient treasure chest, you must say the magic word: Glimmering!"
        *   **Fluency**: 
            - The challenge.prompt MUST be a complete statement like: "To [action], you must whisper the calming phrase: [phrase]." It MUST NOT be a question.
            - The phrase should be moderately long (8-12 words) with sounds that can trigger disfluencies.
            - Generate NEW phrases each time - never reuse the same phrase.
            - Example: challenge.prompt = "To calm the rushing river, you must whisper the calming phrase: Seven silly swans swam silently."
        *   **DLD (Language)**: 
            - The challenge.prompt MUST be a complete question or scenario requiring explanation.
            - The question should require complete sentences with cause-and-effect or descriptive language.
            - Generate NEW scenarios and questions each time based on the current story context.
            - Example: challenge.prompt = "The little gnome looks hungry! What kind of food should you give him and why?"
        *   **Social**: 
            - The challenge.prompt MUST be a complete scenario with a question about appropriate social response.
            - The scenario should test perspective-taking, empathy, or social problem-solving.
            - Generate NEW social scenarios each time that fit the current story.
            - Example: challenge.prompt = "Your friend the fairy looks sad because she lost her wand. What could you say or do to help?"
    6. **Challenge Evaluation Criteria (CRITICAL: TEXT TRANSCRIPTION ONLY)** (challengeSuccess) is ONLY based on what appears in the TEXT TRANSCRIPTION, NOT audio sounds:
        *   **Pronunciation**: 
            - Success: The EXACT, COMPLETE target word appears in the text transcription (case-insensitive, but must be the full word)
            - Failure: Text shows ANY deviation from the target word:
              * Sound omissions: Target "glimmering" → Text "glimmer" (missing sounds) = FAILURE
              * Sound substitutions: Target "rabbit" → Text "wabbit" (sound substitution) = FAILURE
              * Sound omissions: Target "rabbit" → Text "rabit" (missing sounds) = FAILURE
            - **CRITICAL**: Partial matches are FAILURES. If target is "glimmering" but text shows "glimmer", that's a sound omission error = FAILURE
            - Evaluate ONLY what's visible in the text, not audio clarity
        *   **Fluency**: 
            - Success: Text shows smooth, flowing speech without visible repetitions (e.g., "b-b-ball"), prolongations (e.g., "ssssun"), or blocks (incomplete phrases)
            - Failure: Text shows disfluency markers like repetitions, prolongations, or blocks
            - Evaluate ONLY what appears in the text transcription
        *   **DLD**: 
            - Success: Text shows complete sentences with proper grammar, good vocabulary, and ability to express complex ideas
            - Failure: Text shows short phrases, missing words, incorrect grammar, or limited vocabulary
            - Evaluate grammar, sentence structure, and complexity visible in the TEXT
        *   **Social**: 
            - Success: Text shows appropriate social response with empathy, perspective-taking, and helpful suggestions
            - Failure: Text shows inappropriate response, lack of empathy, or inability to understand the social situation
            - Evaluate social appropriateness and empathy visible in the TEXT
    `;

    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: TEXT_GENERATION_MODEL,
                contents: [...historyContents, { role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    topP: 0.95,
                    topK: 64,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json",
                    responseSchema: storyContinuationSchema,
                },
            });
        });

        const content = response.text || '';
        const json = JSON.parse(content);
        
        // Add comprehensive debug logging for AI response
        console.log('AI Response Analysis:', {
            wasPreviousTurnChallenge,
            regularTurnsSinceLastChallenge,
            hasAnyChallengeBeenIntroduced,
            hasChallenge: !!json.challenge,
            challengeSuccess: json.challengeSuccess,
            endingType: json.endingType,
            speechScoreChange: json.speechFeedback?.scoreChange,
            creativityScore: json.creativityScore,
            userInput: userInput.substring(0, 50) + '...',
            storyLength: story.length
        });

        if (!json.speechFeedback || !json.thematicFeedback) {
            throw new Error("Invalid response from AI: Missing feedback fields.");
        }
        
        // Validate storyChunk exists and is a string
        if (!json.storyChunk || typeof json.storyChunk !== 'string') {
            throw new Error("Invalid response from AI: storyChunk is missing or not a string.");
        }
        
        // CRITICAL FIX: Remove trailing question marks from storyChunk ONLY when creating NEW challenges (not during challenge evaluation)
        // During challenge evaluation (MODE 1), the story chunk SHOULD end with a question mark
        // Only when creating NEW challenges (MODE 2) should story chunks NOT end with question marks
        if (json.challenge && !wasPreviousTurnChallenge && json.storyChunk.trim().endsWith('?')) {
            const originalChunk = json.storyChunk;
            json.storyChunk = json.storyChunk.trim().replace(/\?+$/, '').trim();
            console.warn('AI ERROR FIXED: Removed trailing question mark(s) from storyChunk when creating NEW challenge.', {
                original: originalChunk,
                fixed: json.storyChunk,
                challengeType: json.challenge.type,
                mode: 'Challenge Creation (MODE 2)'
            });
        }
        
        // CRITICAL FIX: Handle string 'null' values and convert to actual null
        if (json.endingType === 'null' || json.endingType === 'undefined' || json.endingType === '') {
            console.warn('AI ERROR FIXED: Converting string null/undefined/empty to actual null for endingType', {
                originalValue: json.endingType
            });
            json.endingType = null;
        }
        
        // CRITICAL FIX: Handle string challengeSuccess values
        if (json.challengeSuccess === 'null' || json.challengeSuccess === 'undefined') {
            console.warn('AI ERROR FIXED: Converting string null/undefined to actual null for challengeSuccess');
            json.challengeSuccess = null;
        }
        
        // CRITICAL FIX: Remove challenge if endingType is set - story should end, no challenges allowed
        if (json.endingType && json.challenge) {
            console.warn('AI ERROR FIXED: Removed challenge when endingType is set. Story should end without challenges.', {
                endingType: json.endingType,
                challengeType: json.challenge.type,
                challengePrompt: json.challenge.prompt
            });
            json.challenge = null;
            // Also ensure suggestions are empty when story ends
            if (json.suggestions && json.suggestions.length > 0) {
                console.warn('AI ERROR FIXED: Removed suggestions when endingType is set.');
                json.suggestions = [];
            }
        }
        
        // CRITICAL FIX: Prevent challenges during challenge evaluation mode
        if (wasPreviousTurnChallenge && json.challenge) {
            console.warn('AI ERROR FIXED: Removed challenge from challenge evaluation mode. AI must NOT create challenges when evaluating previous challenge.', {
                wasPreviousTurnChallenge,
                challengeType: json.challenge.type,
                regularTurnsSinceLastChallenge,
                mode: 'Challenge Evaluation (MODE 1) - Challenges Forbidden'
            });
            json.challenge = null;
            // Ensure suggestions are provided for challenge evaluation turns
            if (!json.suggestions || json.suggestions.length === 0) {
                json.suggestions = ["Look around", "Try something else", "Continue exploring"];
            }
            // IMPORTANT: In challenge evaluation mode, story chunks SHOULD end with question marks
            // because we're continuing the story after providing feedback
        }
        
        // CRITICAL VALIDATION: Ensure challengeSuccess is properly set for challenge responses
        if (wasPreviousTurnChallenge) {
            console.log('CHALLENGE EVALUATION:', {
                targetWord,
                userInput,
                challengeType: lastChallenge?.type,
                aiResponse: json.challengeSuccess
            });
            
            // CRITICAL FIX: Infer challengeSuccess if AI returns null/undefined,
            // based on speechFeedback.scoreChange which is always provided.
            if (json.challengeSuccess === null || json.challengeSuccess === undefined) {
                console.warn(`AI returned null/undefined for challengeSuccess on a challenge turn. Inferring from speechFeedback.scoreChange.`);
                if (json.speechFeedback.scoreChange > 0) { // Any positive score means success
                    json.challengeSuccess = true;
                } else if (json.speechFeedback.scoreChange <= 0) { // Negative or zero score means failure
                    json.challengeSuccess = false;
                } else {
                    // Fallback in case scoreChange is also unexpected, though it shouldn't be based on prompt
                    console.error(`Unexpected speechFeedback.scoreChange (${json.speechFeedback.scoreChange}) for challenge turn where challengeSuccess was null/undefined. Defaulting challengeSuccess to false.`);
                    json.challengeSuccess = false;
                }
            }
            // Now, challengeSuccess should definitely be a boolean.
            if (typeof json.challengeSuccess !== 'boolean') {
                // This scenario should now be much rarer after inference, but good to keep a final check
                throw new Error(`Invalid response from AI: challengeSuccess must be a boolean after inference. Got: ${typeof json.challengeSuccess}`);
            }
            
            // Additional validation for pronunciation challenges
            if (lastChallenge?.type === 'pronunciation' && targetWord) {
                const userInputLower = userInput.toLowerCase();
                const targetWordLower = targetWord.toLowerCase();
                const shouldBeSuccess = userInputLower.includes(targetWordLower);
                
                if (shouldBeSuccess !== json.challengeSuccess) {
                    console.warn(`POTENTIAL AI EVALUATION ERROR: Target="${targetWord}", User="${userInput}", AI said ${json.challengeSuccess ? 'SUCCESS' : 'FAILURE'}, but analysis suggests ${shouldBeSuccess ? 'SUCCESS' : 'FAILURE'}`);
                }
            }
            
            // Validate scoring is correct for challenge responses
            if (json.creativityScore !== 0) {
                console.warn("AI Error: creativityScore should be 0 for challenge responses. Fixing...");
                json.creativityScore = 0;
            }
            const expectedScoreChange = json.challengeSuccess ? json.speechFeedback.scoreChange : -5;
            if (json.speechFeedback.scoreChange !== expectedScoreChange) {
                console.warn(`AI Error: speechFeedback.scoreChange is inconsistent. Challenge success: ${json.challengeSuccess}, score given: ${json.speechFeedback.scoreChange}. Fixing...`);
                json.speechFeedback.scoreChange = expectedScoreChange;
                if (json.challengeSuccess && (json.speechFeedback.scoreChange < 5 || json.speechFeedback.scoreChange > 15)) {
                    json.speechFeedback.scoreChange = 10; // Default to a medium score if AI gives invalid positive score
                }
            }
            
            // Validate story consistency
            if (json.challengeSuccess === false && json.storyChunk && !json.storyChunk.toLowerCase().includes('not') && !json.storyChunk.toLowerCase().includes("wasn't") && !json.storyChunk.toLowerCase().includes('wrong') && !json.storyChunk.toLowerCase().includes('closed') && !json.storyChunk.toLowerCase().includes('locked')) {
                console.warn("AI Error: Story chunk doesn't seem to acknowledge the challenge failure. This may confuse the child.");
            }
        } else {
            // For regular story turns, challengeSuccess should be null and speechFeedback.scoreChange should be 0
            if (json.challengeSuccess !== null && json.challengeSuccess !== undefined) { // Check for both null and undefined
                console.warn("AI Error: challengeSuccess should be null for regular story turns. Fixing...");
                json.challengeSuccess = null;
            }
            if (json.speechFeedback.scoreChange !== 0) {
                console.warn("AI Error: speechFeedback.scoreChange should be 0 for regular story turns. Fixing...");
                json.speechFeedback.scoreChange = 0;
            }
            
            // CRITICAL FIX: Remove challenges from regular story turns when they shouldn't be there
            // This can happen when AI ignores the mode detection logic
            if (json.challenge) {
                if (regularTurnsSinceLastChallenge === 0) {
                    console.warn('AI ERROR FIXED: Removed challenge from regular story turn immediately after challenge evaluation. AI should not create challenges on consecutive turns.', {
                        regularTurnsSinceLastChallenge,
                        wasPreviousTurnChallenge,
                        challengeType: json.challenge.type
                    });
                    json.challenge = null;
                    // Ensure suggestions are provided for regular story turns
                    if (!json.suggestions || json.suggestions.length === 0) {
                        json.suggestions = ["Continue exploring", "Look around", "Try something else"];
                    }
                } else {
                    console.log('CHALLENGE CREATED:', {
                        challengeType: json.challenge.type,
                        regularTurnsSinceLastChallenge,
                        hasAnyChallengeBeenIntroduced,
                        prompt: json.challenge.prompt?.substring(0, 50) + '...'
                    });
                }
            }
            
            // CRITICAL FIX: Ensure regular story turns (no challenge) end with question marks
            if (!json.challenge && json.storyChunk && !json.storyChunk.trim().endsWith('?')) {
                // Only add question mark if the story chunk seems to be asking for user input
                const lowerChunk = json.storyChunk.toLowerCase();
                if (lowerChunk.includes('what') || lowerChunk.includes('where') || lowerChunk.includes('how') || 
                    lowerChunk.includes('do next') || lowerChunk.includes('want to') || lowerChunk.includes('should')) {
                    const originalChunk = json.storyChunk;
                    json.storyChunk = json.storyChunk.trim() + '?';
                    console.warn('AI ERROR FIXED: Added missing question mark to regular story turn.', {
                        original: originalChunk,
                        fixed: json.storyChunk,
                        mode: 'Regular Story Turn'
                    });
                }
            }
        }
        
        return {
            storyChunk: json.storyChunk,
            emotion: json.emotion,
            suggestions: json.suggestions,
            creativityScore: json.creativityScore,
            speechFeedback: json.speechFeedback,
            thematicFeedback: json.thematicFeedback,
            languageFeedback: json.languageFeedback,
            challengeSuccess: json.challengeSuccess,
            challenge: json.challenge,
            endingType: json.endingType
        };
    } catch (error: any) {
        console.error("Error in continueStory:", error);
        throw new Error(`Failed to continue story: ${error.message || 'Unknown error'}`);
    }
};

export const generateRewardContent = async (
    endingType: EndingType, 
    totalScore: number, 
    level: number,
    character: Character | null,
    theme: Theme | null,
    therapyType: TherapyType,
    childAge?: ChildAge
): Promise<RewardContent> => {
    // Fetch child age from onboarding if not provided
    const age = childAge || await getChildAgeFromOnboarding();
    const ageDescription = age.years > 0 
        ? `${age.years} year${age.years !== 1 ? 's' : ''}${age.months > 0 ? ` and ${age.months} month${age.months !== 1 ? 's' : ''}` : ''} old`
        : '5-7 years old';
    
    const prompt = `
        The storytelling game has ended.
        - Final story tone: ${endingType}
        - Final creativity score: ${totalScore}
        - Final therapy level: ${level}
        - Character: ${character?.name || 'a brave hero'}
        - Theme: ${theme || 'a wondrous land'}
        - Therapy Focus: ${therapyType}
        - Child's Age: ${ageDescription}

        Generate a short, positive, and personalized reward message for the ${ageDescription} child.
        - The title should be celebratory and age-appropriate.
        - The message should briefly mention the character and theme.
        - Use language and concepts appropriate for a ${ageDescription} child.
        - The badge text should be a fun, creative title based on their performance.
        - If the final therapy level is greater than 1, this is a WIN! Make the message extra celebratory and congratulate them on leveling up their skills.
    `;

    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: TEXT_GENERATION_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: rewardSchema,
                },
            });
        });
        const content = response.text || '';
        return JSON.parse(content);
    } catch (error: any) {
        console.error("Error generating reward content:", error);
        throw new Error(`Failed to generate reward content: ${error.message || 'Unknown error'}`);
    }
};

export const generatePronunciationAssessmentPrompts = async (): Promise<{ scenario: string, action: string, targetWord: string }[]> => {
    const prompt = `
        Generate exactly three unique and highly engaging items for a pronunciation (articulation and phonological) assessment for a 5-7 year old child.
        The goal is to make this feel like a fun, interactive magic word game, not a boring test.
        
        **DIFFICULTY RAMP**: You must structure the three prompts with increasing difficulty:
        - **Round 1 (Medium Difficulty)**: Target a common error sound in a simple, single or two-syllable word (e.g., 'r', 'l', 's' sounds).
        - **Round 2 (Difficult)**: Target a consonant blend or a less common sound in a slightly more complex word (e.g., 'sp', 'th', 'ch', 'br', 'fl').
        - **Round 3 (Extremely Difficult)**: Target a complex, multi-syllabic word containing multiple tricky sounds or blends (e.g., 'spectacular', 'chrysanthemum', 'strawberry').
        
        **CLINICAL PURPOSE**: This assessment tests for articulation disorders and phonological problems, specifically:
        - Sound substitutions (e.g., saying "wabbit" instead of "rabbit")
        - Sound omissions (e.g., saying "ca" instead of "cat")
        - Sound distortions (e.g., lisps on 's' sounds)
        
        **CRITICAL REQUIREMENTS**:
        1. The 'scenario' must create a natural, magical story context where a magic word is needed.
        2. The 'action' MUST clearly and directly ask the child to repeat a single magic word. It should sound natural and exciting, like: "To open the magic door, you must say the magic word: [word]!" or "The wizard needs you to repeat the magic word: [word]!"
        3. The 'targetWord' MUST be a SINGLE WORD (not a phrase or sentence). Choose words with sounds that children often struggle with, following the difficulty ramp above.
        
        **CRITICAL: WORD GENERATION RULES**:
        - You MUST generate COMPLETELY NEW and UNIQUE words. NEVER reuse words from the examples above.
        - The examples (rabbit, ladder, dragon, treasure, sparkle, castle, etc.) are ONLY for reference to show the TYPE of sounds to target.
        - Generate creative, age-appropriate words that children would find fun and magical.
        - Each of the three prompts must have DIFFERENT target words - no duplicates within the same assessment.
        - Think of words like: "glimmer", "thunder", "prism", "whisper", "crystal", "forest", "bridge", "flame", "storm", "treasure", "dragon", "princess" - but then create NEW ones that are similar in difficulty but completely different.
        
        **FORMAT REQUIREMENTS**:
        - 'scenario': One engaging sentence that sets up a magical situation where a magic word is needed
        - 'action': A clear, direct instruction that asks the child to repeat the magic word. Must include the exact word in quotes or clearly stated
        - 'targetWord': The single magic word the child needs to repeat (just the word, no quotes, no extra text)

        **GOOD EXAMPLES** (follow this format exactly):
        { 
          "scenario": "A magical door appears in front of you, but it's locked! The door needs a special magic word to open.", 
          "action": "To open the magic door, you must say the magic word: 'rabbit'! Can you repeat it?", 
          "targetWord": "rabbit" 
        }
        
        { 
          "scenario": "The wizard's crystal ball is glowing, but it needs a magic word to show you a vision!", 
          "action": "The wizard needs you to say the magic word: 'treasure'! Repeat it after me: 'treasure'!", 
          "targetWord": "treasure" 
        }
        
        { 
          "scenario": "A friendly dragon wants to be your friend, but first you need to say the magic word!", 
          "action": "Say the magic word to befriend the dragon: 'sparkle'! Can you say 'sparkle'?", 
          "targetWord": "sparkle" 
        }
        
        { 
          "scenario": "The fairy's wand is broken and needs a magic word to fix it!", 
          "action": "To fix the wand, repeat this magic word: 'castle'! Say 'castle'!", 
          "targetWord": "castle" 
        }

        **BAD EXAMPLES** (DO NOT use these):
        - "Let's say 'Hello, elephant!'" (too long, not a single word)
        - "Can you say the word 'diamond'?" (not magical enough, not clear it's a magic word)
        - "Say 'Hello, rabbit!'" (includes extra words, not just the magic word)
        - Reusing words from the examples above like "rabbit", "ladder", "dragon", "treasure", "sparkle", "castle" (these are examples only, you must create NEW words)
        
        **REMEMBER**: The words in the examples are FORBIDDEN. You must create completely original magic words that are similar in difficulty but never before seen in these examples.
    `;
    
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: pronunciationPromptsSchema,
                },
            });
        });
        
        const content = response.text || '';
        const json = JSON.parse(content);
        if (!json.prompts || !Array.isArray(json.prompts) || json.prompts.length !== 3) {
            throw new Error("Invalid response format from API");
        }
        return json.prompts;
    } catch (error: any) {
        console.error("Error generating pronunciation prompts:", error);
        throw new Error(`Failed to generate pronunciation prompts: ${error.message || 'Unknown error'}`);
    }
};


export const generateFluencyAssessmentSentences = async (): Promise<{ scenario: string, action: string, targetPhrase: string }[]> => {
    const prompt = `
        Generate exactly three unique and highly engaging items for a fluency/stuttering assessment for a 5-7 year old child.
        The goal is to make this feel like a fun, interactive game, not a boring test.
        
        **DIFFICULTY RAMP**: You must structure the three target phrases with increasing difficulty:
        - **Round 1 (Medium Difficulty)**: A moderately long sentence (8-10 words) with some alliteration and a few plosives.
        - **Round 2 (Difficult)**: A longer sentence (10-12 words) with multiple plosives ('p', 'b', 't', 'd', 'k', 'g') and several consonant blends.
        - **Round 3 (Extremely Difficult)**: A very long sentence (12-15 words) that is a classic, complex tongue-twister designed to be very challenging for fluency.

        **CLINICAL PURPOSE**: This assessment tests for childhood-onset fluency disorder (stuttering), specifically:
        - Sound/syllable repetitions (e.g., "b-b-ball", "I-I-I want")
        - Sound prolongations (e.g., "ssssun", "mmmmom")
        - Blocks (getting stuck on words, no sound comes out)
        - Disruptions in the natural flow of speech
        
        Each item MUST consist of three parts:
        1. 'scenario': A fun, one-sentence story context that creates excitement and sets up a scene. Make it engaging and age-appropriate.
        2. 'action': An interactive, story-driven instruction that tells the child what to say. Frame it as something the character needs to do to advance the story (like saying a magic spell, a secret password, or a command). It MUST include the target phrase they need to repeat. Encourage them to say it "smoothly" or "without stopping."
        3. 'targetPhrase': The specific phrase or sentence the child needs to say. This should be fun, age-appropriate, and follow the difficulty ramp above.

        Good Example:
        { 
            "scenario": "Oh no! The brave knight needs to say a magic spell quickly to save the castle from the dragon!", 
            "action": "Say this magic spell smoothly and clearly without stopping: 'Peter Piper picked a peck of pickled peppers!'", 
            "targetPhrase": "Peter Piper picked a peck of pickled peppers." 
        }
        Another Good Example:
        { 
            "scenario": "The robot needs a special code word to activate its superpowers!", 
            "action": "Say this code smoothly from start to finish: 'Ten tiny turtles tiptoed on the tall, tilted table.'", 
            "targetPhrase": "Ten tiny turtles tiptoed on the tall, tilted table." 
        }
        Another Good Example (testing for blocks on plosives):
        { 
            "scenario": "The treasure chest needs a secret password to open!", 
            "action": "Say this password smoothly: 'Big blue birds bring bright berries.'", 
            "targetPhrase": "Big blue birds bring bright berries." 
        }
    `;
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: fluencyPromptsSchema,
                },
            });
        });
        
        const content = response.text || '';
        const json = JSON.parse(content);
        if (!json.prompts || !Array.isArray(json.prompts) || json.prompts.length !== 3) {
            throw new Error("Invalid response format from API");
        }
        return json.prompts;
    } catch (error: any) {
        console.error("Error generating fluency prompts:", error);
        throw new Error(`Failed to generate fluency prompts: ${error.message || 'Unknown error'}`);
    }
};

export const generateDldAssessmentSentences = async (): Promise<{ scenario: string, action: string, targetConcept: string }[]> => {
    const prompt = `
        Generate exactly three unique and highly engaging items for a language (Developmental Language Disorder - DLD) assessment for a 5-7 year old child.
        The goal is to make this feel like a fun, interactive storytelling game, not a boring test.
        
        **DIFFICULTY RAMP**: You must structure the three prompts to elicit responses of increasing linguistic complexity:
        - **Round 1 (Medium Difficulty)**: The 'action' should prompt for a simple descriptive sentence, possibly using a conjunction like 'and' (e.g., "Describe the magical key and what it looks like.").
        - **Round 2 (Difficult)**: The 'action' should prompt for a complex sentence requiring cause-and-effect reasoning (using 'because' or 'so') (e.g., "The baby dragon is crying. Why do you think it's sad?").
        - **Round 3 (Extremely Difficult)**: The 'action' should prompt for a multi-sentence narrative, a sequence of events, or a conditional statement (e.g., "What would happen if you gave the giant a giggling potion? Tell me the whole story!").

        **CLINICAL PURPOSE**: This assessment tests for Developmental Language Disorder, specifically:
        - Ability to form grammatically correct sentences (not just single words or short phrases)
        - Vocabulary knowledge and ability to express ideas
        - Sentence complexity (using conjunctions, descriptive words, cause-and-effect)
        - Following instructions and telling stories
        - Common errors: missing words, incorrect grammar (e.g., "Her go to the store" instead of "She goes to the store")
        
        Each item MUST consist of three parts:
        1. 'scenario': A fun, one-sentence story context that creates excitement and gives the child a role or situation to respond to. Make it engaging, relatable, and age-appropriate. Frame it as an adventure or story moment.
        2. 'action': An interactive, story-driven question or prompt that follows the difficulty ramp above.
        3. 'targetConcept': The specific language concept being assessed, reflecting the difficulty level (e.g., 'descriptive language', 'cause and effect reasoning', 'narrative skills').

        Good Example:
        { 
            "scenario": "Imagine you're a superhero with amazing powers! You're about to go on your first adventure!", 
            "action": "Tell me about your superpower and why you chose it! Use complete sentences.", 
            "targetConcept": "complex sentences with cause and effect" 
        }
        Another Good Example:
        { 
            "scenario": "You're exploring a magical forest and you discover a hidden treasure chest!", 
            "action": "Describe what's inside the treasure chest and explain how you found it!", 
            "targetConcept": "descriptive vocabulary and sequencing" 
        }
        Another Good Example:
        { 
            "scenario": "You're a chef in a magical kitchen and you need to create the most amazing meal ever!", 
            "action": "Tell me what ingredients you would use and how you would make your special dish!", 
            "targetConcept": "vocabulary expansion and complex sentence formation" 
        }
    `;
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: dldPromptsSchema,
                },
            });
        });
        
        const content = response.text || '';
        const json = JSON.parse(content);
        if (!json.prompts || !Array.isArray(json.prompts) || json.prompts.length !== 3) {
            throw new Error("Invalid response format from API");
        }
        return json.prompts;
    } catch (error: any) {
        console.error("Error generating DLD prompts:", error);
        throw new Error(`Failed to generate DLD prompts: ${error.message || 'Unknown error'}`);
    }
};

export const generateSocialAssessmentScenarios = async (): Promise<{ scenario: string, question: string }[]> => {
    const prompt = `
        Generate exactly three unique, simple social scenarios for a social communication assessment for a 5-7 year old child.
        
        **DIFFICULTY RAMP**: You must structure the three scenarios with increasing social complexity:
        - **Round 1 (Medium Difficulty)**: A simple, common scenario with a clear, obvious emotion (e.g., a friend is sad because they fell down).
        - **Round 2 (Difficult)**: A more nuanced scenario involving a conflict, disagreement, or misunderstanding that requires problem-solving (e.g., two friends want to play with the same toy).
        - **Round 3 (Extremely Difficult)**: A complex scenario that requires understanding indirect social cues, another person's complex perspective, or a moral dilemma (e.g., a friend tells you a secret and another friend asks you what it is).

        **CLINICAL PURPOSE**: This assessment tests for Social (Pragmatic) Communication Disorder, which is often related to neurodevelopmental conditions. It tests:
        - Perspective-taking (understanding others' feelings and situations)
        - Social reciprocity (appropriate conversational responses)
        - Problem-solving in social situations
        - Appropriate language use for social context
        - Understanding social cues and emotions
        - Common issues: limited social communication, difficulty with conversation flow, echolalia (repeating others' words)
        
        Each scenario should:
        1. Be one sentence describing a relatable situation following the difficulty ramp above.
        2. Be appropriate for a 5-7 year old child.
        3. Test different social skills.
        
        For each scenario, provide a simple, open-ended question that prompts the child to respond appropriately to the social situation.
        
        Example Scenario: "You see your friend crying on the playground."
        Example Question: "What could you say or do?"
        
        Another Good Example:
        Scenario: "Your classmate is sitting alone at lunch and looks sad."
        Question: "What would you do?"
        
        Another Good Example:
        Scenario: "Someone accidentally bumps into you and says 'Sorry!'"
        Question: "How would you respond?"
    `;
    try {
        const response = await retryApiCall(async (ai) => {
            return await ai.models.generateContent({
                model: ASSESSMENT_MODEL,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 1,
                    // maxOutputTokens: 1024, // Removed to prevent truncation
                    responseMimeType: "application/json",
                    responseSchema: socialScenariosSchema,
                },
            });
        });
        
        const content = response.text || '';
        const json = JSON.parse(content);
        if (!json.scenarios || !Array.isArray(json.scenarios) || json.scenarios.length !== 3) {
            throw new Error("Invalid response format from API");
        }
        return json.scenarios;
    } catch (error: any) {
        console.error("Error generating social assessment scenarios:", error);
        throw new Error(`Failed to generate social scenarios: ${error.message || 'Unknown error'}`);
    }
};