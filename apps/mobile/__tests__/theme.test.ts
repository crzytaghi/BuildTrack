import { colors, spacing, radius, fontSize } from '../src/theme';

describe('theme', () => {
  describe('colors', () => {
    it('exports pageBg as the dark background', () => {
      expect(colors.pageBg).toBe('#0b1118');
    });

    it('exports primary as sky-500', () => {
      expect(colors.primary).toBe('#0ea5e9');
    });

    it('exports errorBg and errorText', () => {
      expect(colors.errorBg).toBeDefined();
      expect(colors.errorText).toBeDefined();
    });

    it('has no undefined color values', () => {
      for (const [key, value] of Object.entries(colors)) {
        expect(typeof value).toBe('string');
        expect(value.startsWith('#')).toBe(true);
      }
    });
  });

  describe('spacing', () => {
    it('values increase from xs to xxl', () => {
      expect(spacing.xs).toBeLessThan(spacing.sm);
      expect(spacing.sm).toBeLessThan(spacing.md);
      expect(spacing.md).toBeLessThan(spacing.lg);
      expect(spacing.lg).toBeLessThan(spacing.xl);
      expect(spacing.xl).toBeLessThan(spacing.xxl);
    });
  });

  describe('radius', () => {
    it('full is 999', () => {
      expect(radius.full).toBe(999);
    });
  });

  describe('fontSize', () => {
    it('xs is the smallest', () => {
      expect(fontSize.xs).toBeLessThan(fontSize.sm);
      expect(fontSize.sm).toBeLessThan(fontSize.base);
    });
  });
});
