import { describe, expect, beforeEach, it } from 'vitest';
import { loadConfig } from '../src/config';

const ORIGINAL_ENV = { ...process.env };

describe('loadConfig', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.RELAYER_RPC_URL;
    delete process.env.RELAYER_PRIVATE_KEY;
    delete process.env.RELAYER_REGISTRY_ADDRESS;
    delete process.env.RELAYER_TOKEN_ADDRESS;
    delete process.env.RELAYER_REWARD_PER_WIN;
    delete process.env.RELAYER_MAX_RETRIES;
    delete process.env.RELAYER_BACKOFF_MS;
    delete process.env.RELAYER_CACHE_PATH;
  });

  it('throws when required variables are missing', () => {
    expect(() => loadConfig()).toThrow(/RELAYER_RPC_URL/);

    process.env.RELAYER_RPC_URL = 'https://rpc.example';
    expect(() => loadConfig()).toThrow(/RELAYER_PRIVATE_KEY/);
  });

  it('normalises addresses and applies defaults', () => {
    process.env.RELAYER_RPC_URL = 'https://rpc.example';
    process.env.RELAYER_PRIVATE_KEY = '0xabc1234567890abc1234567890abc1234567890abc1234567890abc1234567';
    process.env.RELAYER_REGISTRY_ADDRESS = '0x1111111111111111111111111111111111111111';
    process.env.RELAYER_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222';

    const config = loadConfig();
    expect(config.rpcUrl).toBe('https://rpc.example');
    expect(config.registryAddress).toBe('0x1111111111111111111111111111111111111111');
    expect(config.tokenAddress).toBe('0x2222222222222222222222222222222222222222');
    expect(config.rewardPerWin.toString()).toBe('10000000000000000000'); // 10 WBOO default
    expect(config.maxRetries).toBe(3);
    expect(config.backoffMs).toBe(1000);
    expect(config.cachePath).toBeUndefined();
  });

  it('honours custom reward amounts', () => {
    process.env.RELAYER_RPC_URL = 'https://rpc.example';
    process.env.RELAYER_PRIVATE_KEY = '0xabc1234567890abc1234567890abc1234567890abc1234567890abc1234567';
    process.env.RELAYER_REGISTRY_ADDRESS = '0x1111111111111111111111111111111111111111';
    process.env.RELAYER_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222';
    process.env.RELAYER_REWARD_PER_WIN = '42.5';

    const config = loadConfig();
    expect(config.rewardPerWin.toString()).toBe('42500000000000000000'); // 42.5 WBOO
  });

  it('parses retry/backoff overrides and cache path', () => {
    process.env.RELAYER_RPC_URL = 'https://rpc.example';
    process.env.RELAYER_PRIVATE_KEY = '0xabc1234567890abc1234567890abc1234567890abc1234567890abc1234567';
    process.env.RELAYER_REGISTRY_ADDRESS = '0x1111111111111111111111111111111111111111';
    process.env.RELAYER_TOKEN_ADDRESS = '0x2222222222222222222222222222222222222222';
    process.env.RELAYER_MAX_RETRIES = '5';
    process.env.RELAYER_BACKOFF_MS = '1500';
    process.env.RELAYER_CACHE_PATH = '/tmp/custom.jsonl';

    const config = loadConfig();
    expect(config.maxRetries).toBe(5);
    expect(config.backoffMs).toBe(1500);
    expect(config.cachePath).toBe('/tmp/custom.jsonl');
  });
});
