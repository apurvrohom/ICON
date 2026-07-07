import useAuthStore from '../store/useAuthStore';

describe('Zustand Auth Store Unit Tests', () => {
  it('should initialize with default states', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.initialized).toBe(false);
  });
});
