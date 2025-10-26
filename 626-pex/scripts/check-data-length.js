const d = process.env.DATA || '';
console.log('len', d.length);
console.log('startsWith0x', d.startsWith('0x'));
console.log('last20', d.slice(-20));