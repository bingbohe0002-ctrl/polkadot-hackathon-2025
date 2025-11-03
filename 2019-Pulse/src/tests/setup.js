import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:5173',
  origin: 'http://localhost:5173',
  pathname: '/',
  search: '',
  hash: '',
  replace: vi.fn(),
};

// Mock window.history
window.history.replaceState = vi.fn();

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock alert and confirm
global.alert = vi.fn();
global.confirm = vi.fn(() => true);

