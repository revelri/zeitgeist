import { describe, it, expect } from 'vitest';
import { SignalProcessor } from '../signalProcessor.js';

describe('SignalProcessor', () => {
  describe('process', () => {
    it('returns a value and velocity for a known emotion', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      const result = sp.process('serene', 0.5);

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('velocity');
      expect(typeof result.value).toBe('number');
      expect(typeof result.velocity).toBe('number');
    });

    it('handles unknown emotion IDs by initializing state', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      const result = sp.process('unknown_emotion', 0.7);

      expect(result.value).toBeGreaterThan(0);
    });

    it('produces values in [0,1] range for inputs in [0,1]', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });

      for (let i = 0; i < 20; i++) {
        const result = sp.process('serene', Math.random());
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThanOrEqual(1);
      }
    });

    it('converges toward a constant input', () => {
      // Use higher minCutoff for faster convergence in rapid-fire calls
      const sp = new SignalProcessor({ minCutoff: 10.0, beta: 0.007 });

      let lastValue = 0;
      for (let i = 0; i < 100; i++) {
        const result = sp.process('serene', 0.8);
        lastValue = result.value;
      }

      // Return value is now baseline-adjusted + normalized (consistent with 'processed' event).
      // With 10% baseline on 5 emotions and serene converging to raw 0.8:
      // normalized ≈ (0.8 + 0.1) / (0.8 + 4*0.1 + 0.1) = 0.9/1.3 ≈ 0.69
      // Dominant emotion should hold more than equal share (1/5 = 0.2)
      expect(lastValue).toBeGreaterThan(0.3);
      expect(lastValue).toBeLessThanOrEqual(1);
    });

    it('smooths out rapid changes via adaptive low-pass', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });

      // Feed steady values then a spike
      sp.process('serene', 0.5);
      sp.process('serene', 0.5);
      sp.process('serene', 0.5);
      sp.process('serene', 0.5);
      const spikeResult = sp.process('serene', 10.0);

      // One-Euro filter should smooth the spike significantly
      // Value should be much less than 10.0
      expect(spikeResult.value).toBeLessThan(5.0);
    });

    it('tracks velocity as delta between consecutive values', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });

      sp.process('serene', 0.0);
      const r2 = sp.process('serene', 1.0);

      // Velocity should be positive (value increased)
      expect(r2.velocity).toBeGreaterThan(0);
    });

    it('emits processed event with all emotion states', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      const events: Record<string, any>[] = [];
      sp.on('processed', (states) => events.push(states));

      sp.process('serene', 0.5);

      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('serene');
      expect(events[0]).toHaveProperty('vibrant');
      expect(events[0]).toHaveProperty('melancholy');
      expect(events[0]).toHaveProperty('curious');
      expect(events[0]).toHaveProperty('content');
    });
  });

  describe('adaptive behavior', () => {
    it('responds faster to high-speed changes with higher beta', () => {
      const slowSp = new SignalProcessor({ minCutoff: 1.0, beta: 0.001 });
      const fastSp = new SignalProcessor({ minCutoff: 1.0, beta: 0.1 });

      // Process a jump from 0 to 1
      slowSp.process('serene', 0.0);
      fastSp.process('serene', 0.0);

      const slowResult = slowSp.process('serene', 1.0);
      const fastResult = fastSp.process('serene', 1.0);

      // Higher beta should track faster (closer to 1.0)
      expect(fastResult.value).toBeGreaterThanOrEqual(slowResult.value);
    });
  });

  describe('getState / getAllStates', () => {
    it('returns state for initialized emotion', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      const state = sp.getState('serene');
      expect(state).toBeDefined();
      expect(state!.value).toBe(0);
    });

    it('returns current state after processing', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      sp.process('serene', 0.5);
      const state = sp.getState('serene');
      expect(state).toBeDefined();
      expect(state!.value).toBeGreaterThan(0);
    });

    it('getAllStates returns all emotion states', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      sp.process('serene', 0.5);
      const allStates = sp.getAllStates();
      expect(allStates.size).toBeGreaterThanOrEqual(5);
      expect(allStates.has('serene')).toBe(true);
    });
  });

  describe('config', () => {
    it('uses default config when none provided', () => {
      const sp = new SignalProcessor();
      const config = sp.getConfig();
      expect(config.minCutoff).toBe(1.0);
      expect(config.beta).toBe(0.007);
    });

    it('accepts custom config', () => {
      const sp = new SignalProcessor({ minCutoff: 2.0, beta: 0.01 });
      const config = sp.getConfig();
      expect(config.minCutoff).toBe(2.0);
      expect(config.beta).toBe(0.01);
    });

    it('updateConfig merges partial config', () => {
      const sp = new SignalProcessor({ minCutoff: 1.0, beta: 0.007 });
      sp.updateConfig({ beta: 0.05 });
      const config = sp.getConfig();
      expect(config.minCutoff).toBe(1.0);
      expect(config.beta).toBe(0.05);
    });
  });
});
