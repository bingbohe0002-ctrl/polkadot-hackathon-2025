import { Wallet, Contract, JsonRpcProvider } from 'ethers';
import { loadConfig } from './config';
import registryArtifact from '../../contracts/artifacts/contracts/WorbooRegistry.sol/WorbooRegistry.json';
import tokenArtifact from '../../contracts/artifacts/contracts/WorbooToken.sol/WorbooToken.json';

type GameRecordedEvent = {
  player: string;
  dayId: bigint;
  wordHash: string;
  guesses: number;
  victory: boolean;
  streak: bigint;
  totalGames: bigint;
  totalWins: bigint;
};

const processedEvents = new Set<string>();

async function main() {
  const cfg = loadConfig();

  const provider = new JsonRpcProvider(cfg.rpcUrl);
  const wallet = new Wallet(cfg.privateKey, provider);

  const registry = new Contract(cfg.registryAddress, registryArtifact.abi, provider);
  const token = new Contract(cfg.tokenAddress, tokenArtifact.abi, wallet);

  console.log('[relayer] starting Worboo reward listener');
  console.log(` - registry: ${cfg.registryAddress}`);
  console.log(` - token:    ${cfg.tokenAddress}`);
  console.log(` - reward:   ${cfg.rewardPerWin.toString()} wei`);
  console.log(` - operator: ${wallet.address}`);

  registry.on(
    'GameRecorded',
    async (
      player: string,
      dayId: bigint,
      wordHash: string,
      guesses: number,
      victory: boolean,
      streak: bigint,
      totalGames: bigint,
      totalWins: bigint,
      event
    ) => {
      const key = `${event.transactionHash}:${event.logIndex}`;
      if (processedEvents.has(key)) {
        return;
      }

      processedEvents.add(key);

      const payload: GameRecordedEvent = {
        player,
        dayId,
        wordHash,
        guesses,
        victory,
        streak,
        totalGames,
        totalWins,
      };

      console.log(`[relayer] GameRecorded -> ${JSON.stringify(payload)}`);

      if (!victory) {
        console.log('[relayer] skipping (loss)');
        return;
      }

      try {
        const tx = await token.mintTo(player, cfg.rewardPerWin);
        console.log(`[relayer] minting reward -> tx ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`[relayer] reward confirmed in block ${receipt.blockNumber}`);
      } catch (error) {
        console.error('[relayer] mint transaction failed', error);
      }
    }
  );

  process.on('SIGINT', () => {
    console.log('Shutting down relayer...');
    registry.removeAllListeners();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('[relayer] fatal error', error);
  process.exit(1);
});

