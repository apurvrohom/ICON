import { registerSchema, projectSchema } from '../utils/validators';

describe('Zod Validation Schema Tests', () => {
  describe('Registration Password Strength validation', () => {
    it('should validate a strong and secure password matching all rules', () => {
      const result = registerSchema.safeParse({
        username: 'coder_john',
        name: 'John Doe',
        email: 'john@domain.com',
        password: 'Password123!'
      });
      expect(result.success).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        username: 'coder_john',
        name: 'John Doe',
        email: 'john@domain.com',
        password: 'Pass1!'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors.find(e => e.path.includes('password'))?.message;
        expect(errorMsg).toContain('Password must be at least 8 characters long');
      }
    });

    it('should reject passwords missing special characters', () => {
      const result = registerSchema.safeParse({
        username: 'coder_john',
        name: 'John Doe',
        email: 'john@domain.com',
        password: 'Password123'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors.find(e => e.path.includes('password'))?.message;
        expect(errorMsg).toContain('Password must contain at least one special character');
      }
    });

    it('should reject passwords missing numbers', () => {
      const result = registerSchema.safeParse({
        username: 'coder_john',
        name: 'John Doe',
        email: 'john@domain.com',
        password: 'Password!'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors.find(e => e.path.includes('password'))?.message;
        expect(errorMsg).toContain('Password must contain at least one number');
      }
    });
  });

  describe('Project Creation validation', () => {
    it('should validate correct project properties', () => {
      const result = projectSchema.safeParse({
        name: 'My New Startup',
        description: 'Building a collaborative MERN web platform with drag-and-drop features.',
        isPublic: true
      });
      expect(result.success).toBe(true);
    });

    it('should reject descriptions shorter than 10 characters', () => {
      const result = projectSchema.safeParse({
        name: 'Short Desc Startup',
        description: 'Short',
        isPublic: true
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMsg = result.error.errors.find(e => e.path.includes('description'))?.message;
        expect(errorMsg).toContain('Description must be at least 10 characters');
      }
    });
  });
});
