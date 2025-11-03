import { compile } from '@parity/resolc';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { basename, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compileContract = async (solidityFilePath, outputDir) => {
  try {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Read the Solidity file
    const source = readFileSync(solidityFilePath, 'utf8');

    // Construct the input object for the compiler
    const input = {
      [basename(solidityFilePath)]: { content: source },
    };

    console.log(`Compiling contract: ${basename(solidityFilePath)}...`);

    // Compile the contract
    const out = await compile(input);

    for (const contracts of Object.values(out.contracts)) {
      for (const [name, contract] of Object.entries(contracts)) {
        console.log(`✓ Compiled contract: ${name}`);

        // Write the ABI
        const abiPath = join(outputDir, `${name}.json`);
        writeFileSync(abiPath, JSON.stringify(contract.abi, null, 2));
        console.log(`✓ ABI saved to ${abiPath}`);

        // Write the bytecode
        if (contract.evm && contract.evm.bytecode && contract.evm.bytecode.object) {
          const bytecodePath = join(outputDir, `${name}.polkavm`);
          writeFileSync(
            bytecodePath,
            Buffer.from(contract.evm.bytecode.object, 'hex')
          );
          console.log(`✓ Bytecode saved to ${bytecodePath}`);
        } else {
          console.warn(`⚠ No bytecode found for contract: ${name}`);
        }
      }
    }

    console.log('\n✓ Compilation completed successfully!');
  } catch (error) {
    console.error('✗ Error compiling contracts:', error);
    process.exit(1);
  }
};

const outputDir = join(__dirname, '../src/contracts');

// Compile all contracts
const contracts = [
  'PulseChat.sol',
  'PulseGroups.sol',
  'PulseChannels.sol',
  'PulseFriends.sol',
  'PulsePrivateMessages.sol',
  'PulseAI.sol'
];

(async () => {
  for (const contractFile of contracts) {
    const solidityFilePath = join(__dirname, '../contracts', contractFile);
    await compileContract(solidityFilePath, outputDir);
    console.log(''); // Add spacing between contracts
  }
})();

