'use client';

import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';

/**
 * 生成投票承诺哈希
 * @param {number} vote - 投票选项 (1: 支持原告, 2: 支持被告)
 * @param {string} salt - 随机盐值 (32字节的十六进制字符串)
 * @returns {string} 投票哈希
 */
export function generateVoteHash(vote, salt) {
  try {
    // 确保 salt 是正确的格式
    if (!salt.startsWith('0x')) {
      salt = '0x' + salt;
    }
    
    // 使用与智能合约相同的编码方式
    const encoded = encodeAbiParameters(
      parseAbiParameters('uint8, bytes32'),
      [vote, salt]
    );
    
    return keccak256(encoded);
  } catch (error) {
    console.error('Error generating vote hash:', error);
    throw new Error('Failed to generate vote hash');
  }
}

/**
 * 生成随机盐值
 * @returns {string} 32字节的随机十六进制字符串
 */
export function generateRandomSalt() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证投票哈希
 * @param {number} vote - 投票选项
 * @param {string} salt - 盐值
 * @param {string} expectedHash - 期望的哈希值
 * @returns {boolean} 是否匹配
 */
export function verifyVoteHash(vote, salt, expectedHash) {
  try {
    const generatedHash = generateVoteHash(vote, salt);
    return generatedHash.toLowerCase() === expectedHash.toLowerCase();
  } catch (error) {
    console.error('Error verifying vote hash:', error);
    return false;
  }
}

/**
 * 投票选项的文本描述
 */
export const VOTE_OPTIONS = {
  1: '支持原告',
  2: '支持被告'
};

/**
 * 案件状态的文本描述
 */
export const CASE_STATUS_TEXT = {
  0: '已创建',
  1: '投票中',
  2: '判决中', 
  3: '已判决',
  4: '上诉中',
  5: '上诉已判决'
};

/**
 * 格式化时间戳为可读格式
 * @param {number|string} timestamp - Unix时间戳
 * @returns {string} 格式化的时间字符串
 */
export function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 计算剩余时间
 * @param {number|string} deadline - 截止时间戳
 * @returns {object} 剩余时间信息
 */
export function getTimeRemaining(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const remaining = Number(deadline) - now;
  
  if (remaining <= 0) {
    return { expired: true, text: '已过期' };
  }
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  
  let text = '';
  if (days > 0) text += `${days}天 `;
  if (hours > 0) text += `${hours}小时 `;
  if (minutes > 0) text += `${minutes}分钟 `;
  if (seconds > 0 && days === 0) text += `${seconds}秒`;
  
  return { expired: false, text: text.trim() || '即将到期' };
}