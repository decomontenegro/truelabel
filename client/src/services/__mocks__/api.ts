import { vi } from 'vitest';

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
      handlers: [],
    },
    response: {
      use: vi.fn(),
      handlers: [],
    },
  },
};

export const handleApiError = vi.fn();

export default mockApi;