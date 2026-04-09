/**
 * Shared types and interfaces for the real-time emotional visualization system.
 * These types are platform-agnostic and can be used by both the backend (Node.js/Deno) 
 * and frontend (WebGL2) components of the system.
 */

// Re-export emotion-related types from emotions.ts
export type { Emotion, EmotionState } from './emotions.js';

/**
 * Client-side interpolation state for a single emotion
 */
export interface InterpolationState {
  /** Target value from backend (0-1) */
  targetValue: number;
  /** Current interpolated value (0-1) */
  currentValue: number;
  /** Previous value for velocity calculation */
  prevValue: number;
  /** Calculated from interpolation */
  currentVelocity: number;
  /** Spring velocity for second-order dynamics */
  springVelocity: number;
  /** Timestamp of last backend update (ms) */
  lastUpdateTime: number;
}

/**
 * Configuration for client-side emotion interpolation
 */
export interface InterpolationConfig {
  /** Interpolation rate (0.03-0.08 recommended) - unused with spring, kept for compat */
  lerpFactor: number;
  /** Maximum packet age in ms (drop stale packets) */
  maxPacketAge: number;
  /** Whether interpolation is enabled */
  enableInterpolation: boolean;
  /** Time in ms without updates before triggering degradation mode (e.g., 2000ms) */
  degradationTimeout: number;
  /** Exponential decay factor per frame for velocity - unused with spring */
  velocityDecayRate: number;
  /** Exponential decay factor per frame for emotion values - unused with spring */
  valueDecayRate: number;
  /** Enable/disable degradation mode for handling socket disconnections */
  enableDegradationMode: boolean;
  /** Spring natural frequency in Hz (default 2.0) */
  springFrequency: number;
  /** Spring damping ratio (1.0 = critical, <1.0 = underdamped with overshoot, default 0.95) */
  springDamping: number;
}
