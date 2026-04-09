/**
 * Emotion Detector - Signal Analysis Layer
 *
 * This module processes raw data from the firehose to detect emotional signals.
 * It's responsible for transforming raw data points into meaningful emotional indicators.
 * The emotion detector handles:
 * - Analyzing raw data for emotional patterns
 * - Converting data into standardized emotional signals
 * - Filtering noise and irrelevant data
 * - Forwarding detected signals to the signal processor
 * - Windowing emotion hits and computing normalized ratios
 */

import { EventEmitter } from 'events';
import { EMOTIONS, Emotion, EMOTION_IDS } from '@emotion-hero/shared/emotions.js';

/**
 * Window duration in milliseconds for emotion aggregation.
 * Configurable: 1000-2000ms (1-2 seconds)
 */
export const WINDOW_MS = 1500;

/**
 * Normalized emotion ratios emitted for each time window.
 * Each ratio represents the proportion of that emotion's hits
 * relative to the total hits in the window.
 */
export interface EmotionRatios {
  /** Timestamp when the window ended */
  timestamp: number;
  /** Window duration in milliseconds */
  windowDuration: number;
  /** Total number of emotion hits in the window */
  totalHits: number;
  /** Ratios for each emotion (emotionId -> ratio) */
  ratios: Record<string, number>;
}

/**
 * Raw data point from the firehose
 * Can be either a plain string (post text) or a structured object
 */
export interface RawDataPoint {
  timestamp: number;
  source: string;
  data: string;
}

/**
 * Emotional signal emitted by the detector
 */
export interface EmotionalSignal {
  timestamp: number;
  source: string;
  emotions: {
    [key: string]: number; // emotion id -> hit count
  };
  confidence: number;
  metadata?: any;
}

/**
 * Configuration for the emotion detector
 */
export interface DetectorConfig {
  models: Array<{
    id: string;
    type: string;
    parameters: any;
  }>;
  thresholds: {
    [emotion: string]: number;
  };
  /** Optional custom window duration in milliseconds */
  windowDuration?: number;
}

/**
 * Pre-compiled regex patterns for word-boundary matching.
 * Using \b prevents false positives like "bluetooth" matching "blue".
 */
const KEYWORD_PATTERNS: Map<string, RegExp[]> = new Map(
  EMOTIONS.map((emotion) => [
    emotion.id,
    emotion.keywords.map((kw) => new RegExp(`\\b${kw}\\b`, 'i')),
  ])
);

/**
 * Process text and detect emotion keyword hits
 * Performs case-insensitive word-boundary matching for each emotion's keywords
 *
 * @param text - The raw post text to analyze
 * @returns A record mapping emotion IDs to hit counts
 */
function processText(text: string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const emotion of EMOTIONS) {
    counts[emotion.id] = 0;
    const patterns = KEYWORD_PATTERNS.get(emotion.id);
    if (patterns) {
      for (const pattern of patterns) {
        counts[emotion.id] += pattern.test(text) ? 1 : 0;
      }
    }
  }

  return counts;
}

export class EmotionDetector extends EventEmitter {
  private config: DetectorConfig;
  private isRunning: boolean = false;
  
  // Windowing state
  private windowStartTime: number = 0;
  private windowDuration: number;
  private windowCounts: Record<string, number> = {};
  private windowTimerId: NodeJS.Timeout | null = null;

  private keywordMap: Record<string, string[]>;

  constructor(config: DetectorConfig) {
    super();
    this.config = config;
    this.windowDuration = config.windowDuration ?? WINDOW_MS;
    this.keywordMap = {};
    for (const emotion of EMOTIONS) {
      this.keywordMap[emotion.id] = [...emotion.keywords];
    }
    this.initializeWindowCounts();
  }

  /**
   * Initialize window counts for all emotions to zero
   */
  private initializeWindowCounts(): void {
    this.windowCounts = {};
    for (const emotionId of EMOTION_IDS) {
      this.windowCounts[emotionId] = 0;
    }
  }

  /**
   * Start the emotion detector
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Emotion detector is already running');
    }
    
    this.isRunning = true;
    this.windowStartTime = performance.now();
    this.startWindowTimer();
    this.emit('started');
  }

  /**
   * Start the window timer that triggers ratio emission at regular intervals
   */
  private startWindowTimer(): void {
    if (this.windowTimerId) {
      clearInterval(this.windowTimerId);
    }

    this.windowTimerId = setInterval(() => {
      this.emitWindowRatios();
    }, this.windowDuration);
  }

  /**
   * Stop the window timer
   */
  private stopWindowTimer(): void {
    if (this.windowTimerId) {
      clearInterval(this.windowTimerId);
      this.windowTimerId = null;
    }
  }

  /**
   * Stop the emotion detector
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.stopWindowTimer();
    this.emit('stopped');
  }

  /**
   * Process raw data and detect emotional signals
   * Accepts either a plain string (post text) or a RawDataPoint object
   */
  processRawData(dataPoint: RawDataPoint | string): void {
    if (!this.isRunning) {
      return;
    }

    try {
      // Handle both string and object input
      const text = typeof dataPoint === 'string' ? dataPoint : dataPoint.data;
      if (typeof text !== 'string') return;
      const timestamp = typeof dataPoint === 'string' ? Date.now() : dataPoint.timestamp;
      const source = typeof dataPoint === 'string' ? 'firehose' : dataPoint.source;

      // Detect emotion keyword hits
      const emotionCounts = processText(text);

      // Aggregate counts into the current window
      this.aggregateWindowCounts(emotionCounts);

      // Calculate confidence based on total hits
      const totalHits = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
      const confidence = totalHits > 0 ? Math.min(totalHits / EMOTION_IDS.length, 1) : 0;

      // Create emotional signal
      const signal: EmotionalSignal = {
        timestamp,
        source,
        emotions: emotionCounts,
        confidence,
      };

      // Emit the detected signal
      this.emit('signal', signal);
      this.emit('emotionDetected', signal);
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Aggregate emotion counts into the current window
   */
  private aggregateWindowCounts(emotionCounts: Record<string, number>): void {
    for (const [emotionId, count] of Object.entries(emotionCounts)) {
      if (this.windowCounts[emotionId] !== undefined) {
        this.windowCounts[emotionId] += count;
      }
    }
  }

  /**
   * Emit normalized emotion ratios for the current window
   * Uses monotonic timer to track window intervals
   *
   * Artistic Intent: 1500ms window creates an emotional rhythm, like a heartbeat
   * This duration captures the essence of feeling without losing immediacy
   * A shorter window (<1000ms) would make emotions flicker nervously, anxious
   * A longer window (>2000ms) would make emotions sluggish, unresponsive
   * 1.5 seconds mirrors the natural cadence of human emotional expression
   * Each window is a stanza in the poem of collective feeling
   *
   * Artistic Intent: Ratio normalization creates emotional harmony
   * By dividing each emotion's count by total hits, we create a zero-sum game
   * This means emotions exist in relation to each other, not in isolation
   * Joy gains meaning through sadness's presence, anger through calm's absence
   * The ratios dance together, creating a balanced emotional ecosystem
   * No single emotion can dominate without others receding - the nature of feeling
   */
  private emitWindowRatios(): void {
    const now = performance.now();
    const windowEndTime = now;

    // Calculate total hits in the window
    const totalHits = Object.values(this.windowCounts).reduce((sum, count) => sum + count, 0);

    // Calculate ratios with NaN protection
    // ratio = counts[e] / max(total, 1) ensures no division by zero
    const ratios: Record<string, number> = {};
    const denominator = Math.max(totalHits, 1);

    for (const emotionId of EMOTION_IDS) {
      const count = this.windowCounts[emotionId] ?? 0;
      ratios[emotionId] = count / denominator;
    }

    // Create and emit the ratios object
    const emotionRatios: EmotionRatios = {
      timestamp: Date.now(),
      windowDuration: this.windowDuration,
      totalHits,
      ratios,
    };

    this.emit('ratios', emotionRatios);

    // Reset window counts for the next window
    this.initializeWindowCounts();
    this.windowStartTime = windowEndTime;
  }

  getKeywords(): Record<string, string[]> {
    return { ...this.keywordMap };
  }

  updateKeywords(updates: Record<string, string[]>): void {
    for (const [emotionId, keywords] of Object.entries(updates)) {
      if (EMOTION_IDS.includes(emotionId) && Array.isArray(keywords)) {
        this.keywordMap[emotionId] = [...keywords];
        KEYWORD_PATTERNS.set(
          emotionId,
          keywords.map((kw) => new RegExp(`\\b${kw}\\b`, 'i')),
        );
      }
    }
    this.emit('keywordsUpdated', this.getKeywords());
  }

  setWindowDuration(durationMs: number): void {
    this.windowDuration = durationMs;
    if (this.isRunning) {
      this.stopWindowTimer();
      this.startWindowTimer();
    }
  }

  getWindowDuration(): number {
    return this.windowDuration;
  }

  /**
   * Get current detector status and statistics
   */
  getStatus(): {
    isRunning: boolean;
    config: DetectorConfig;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
    };
  }
}
