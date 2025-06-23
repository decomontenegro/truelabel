import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from './api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct base configuration', () => {
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.timeout).toBeDefined();
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have request interceptor configured', () => {
    expect(api.interceptors.request).toBeDefined();
  });

  it('should have response interceptor configured', () => {
    expect(api.interceptors.response).toBeDefined();
  });
});