import { describe, it, expect } from 'vitest';
import { isAlertResolvable, validateResolutionNote, AlertStatus } from './alert.model';

describe('Alert Domain Rules (alert.model)', () => {
  describe('isAlertResolvable', () => {
    it('should return true for OPEN alerts', () => {
      expect(isAlertResolvable('OPEN')).toBe(true);
    });

    it('should return true for ESCALATED alerts', () => {
      expect(isAlertResolvable('ESCALATED')).toBe(true);
    });

    it('should return false for RESOLVED alerts', () => {
      expect(isAlertResolvable('RESOLVED')).toBe(false);
    });

    it('should return false for AUTO_CLOSED alerts', () => {
      expect(isAlertResolvable('AUTO_CLOSED')).toBe(false);
    });
  });

  describe('validateResolutionNote', () => {
    it('should return invalid for null or undefined', () => {
      expect(validateResolutionNote(null).valid).toBe(false);
      expect(validateResolutionNote(undefined).valid).toBe(false);
    });

    it('should return invalid for empty string', () => {
      const result = validateResolutionNote('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be whitespace only');
    });

    it('should return invalid for whitespace-only string', () => {
      const result = validateResolutionNote('     ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be whitespace only');
    });

    it('should return valid for legitimate note', () => {
      const result = validateResolutionNote('Restarted consumer group and scaled pods.');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for note surrounded by spaces', () => {
      const result = validateResolutionNote('  Valid note with padding  ');
      expect(result.valid).toBe(true);
    });
  });
});
