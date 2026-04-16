/**
 * Shared emotion model for the real-time emotional visualization system.
 * These types and data are platform-agnostic and can be used by both the backend
 * and frontend components of the system.
 */

/**
 * Represents an emotion type with associated metadata.
 */
export interface Emotion {
  /** Unique string identifier for this emotion */
  id: string;
  /** Keywords associated with this emotion for matching and classification */
  keywords: string[];
  /** RGB color values for visualization (0-255 range) */
  colorRGB: [number, number, number];
}

/**
 * Represents the dynamic state of an emotion at a given moment.
 */
export interface EmotionState {
  /** Current intensity value of the emotion (typically 0-1) */
  value: number;
  /** Rate of change of the emotion intensity */
  velocity: number;
}

/**
 * Collection of defined emotions for the system.
 * Each emotion includes keywords for classification and a low-saturation
 * color for visualization purposes.
 */
export const EMOTIONS: readonly Emotion[] = [
  {
    id: 'serene',
    keywords: [
      'calm', 'peaceful', 'tranquil', 'relaxed', 'quiet', 'still', 'gentle',
      'chill', 'cozy', 'soothing', 'mellow', 'zen', 'sleep', 'sleeping',
      'rest', 'nap', 'bed', 'tired', 'goodnight', 'morning', 'coffee',
      'rain', 'slow', 'breathe', 'meditate', 'easy',
    ],
    colorRGB: [135, 169, 158], // Muted teal-green
  },
  {
    id: 'vibrant',
    keywords: [
      'energetic', 'lively', 'dynamic', 'active', 'awake', 'alert', 'spirited',
      'hype', 'hyped', 'pumped', 'lets go', 'fire', 'lit', 'amazing',
      'incredible', 'insane', 'wild', 'crazy', 'omg', 'wow', 'lol',
      'lmao', 'haha', 'funny', 'hilarious', 'exciting', 'party',
      'love', 'awesome', 'yay', 'woohoo', 'epic', 'banger',
    ],
    colorRGB: [173, 147, 135], // Soft terracotta
  },
  {
    id: 'melancholy',
    keywords: [
      'sad', 'somber', 'pensive', 'wistful', 'reflective', 'blue', 'down',
      'miss', 'missing', 'lost', 'gone', 'alone', 'lonely', 'cry',
      'crying', 'tears', 'heartbreak', 'grief', 'sorry', 'hurt',
      'pain', 'depressed', 'struggling', 'hard', 'tough', 'exhausted',
      'broken', 'sigh', 'wish', 'regret', 'ugh', 'worst',
    ],
    colorRGB: [145, 155, 175], // Muted slate blue
  },
  {
    id: 'curious',
    keywords: [
      'interested', 'inquisitive', 'wondering', 'exploring', 'attentive', 'eager',
      'how', 'why', 'what', 'anyone', 'question', 'think', 'thinking',
      'wonder', 'curious', 'learn', 'learning', 'research', 'reading',
      'interesting', 'fascinating', 'cool', 'weird', 'wild', 'new',
      'discovered', 'found', 'noticed', 'idea', 'theory', 'hmm',
    ],
    colorRGB: [165, 160, 145], // Soft warm gray
  },
  {
    id: 'content',
    keywords: [
      'satisfied', 'happy', 'pleased', 'fulfilled', 'grateful', 'comfortable',
      'good', 'great', 'nice', 'lovely', 'beautiful', 'perfect', 'blessed',
      'thankful', 'thanks', 'thank', 'glad', 'enjoy', 'enjoyed', 'wonderful',
      'sweet', 'kind', 'proud', 'accomplished', 'done', 'finished',
      'home', 'family', 'friend', 'friends', 'warm', 'safe', 'smile',
    ],
    colorRGB: [155, 165, 145], // Muted olive green
  },
] as const;

/**
 * Map of emotion IDs to their corresponding Emotion objects.
 * Provides efficient lookup by emotion identifier.
 */
export const EMOTION_MAP: Readonly<Record<string, Emotion>> = Object.fromEntries(
  EMOTIONS.map((emotion) => [emotion.id, emotion])
);

/**
 * Array of all emotion IDs for easy iteration.
 */
export const EMOTION_IDS: readonly string[] = EMOTIONS.map((emotion) => emotion.id);
