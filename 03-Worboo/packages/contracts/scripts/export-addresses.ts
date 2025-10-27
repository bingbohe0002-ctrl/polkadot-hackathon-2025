import fs from "fs";
import path from "path";

type ChainMeta = {
  id: number;
  label: string;
};

const knownChains: Record<string, ChainMeta> = {
  moonbase: { id: 1287, label: "Moonbase Alpha" },
  moonbeam: { id: 1284, label: "Moonbeam" },
};

const resolveDeploymentFile = (chainId: number) => {
  const base = path.join(__dirname, "..", "ignition", "deployments");
  const entries = fs.existsSync(base) ? fs.readdirSync(base, { withFileTypes: true }) : [];
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.includes(String(chainId))) {
      const candidate = path.join(base, entry.name, "deployed_addresses.json");
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
};

const chainKey = process.argv[2] ?? "moonbase";
const meta = knownChains[chainKey];

if (!meta) {
  console.error(`Unknown chain "${chainKey}". Supported keys: ${Object.keys(knownChains).join(", ")}`);
  process.exit(1);
}

const deploymentFile = resolveDeploymentFile(meta.id);
if (!deploymentFile) {
  console.error(`Could not find deployment output for chainId ${meta.id}. Run ignition deploy first.`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(deploymentFile, "utf8")) as Record<string, string>;

const registry = raw["WorbooModule#WorbooRegistry"];
const token = raw["WorbooModule#WorbooToken"];
const shop = raw["WorbooModule#WorbooShop"];

console.log(`# Worboo contracts on ${meta.label}`);
console.log(`REACT_APP_WORBOO_REGISTRY=${registry ?? ""}`);
console.log(`REACT_APP_WORBOO_TOKEN=${token ?? ""}`);
console.log(`REACT_APP_WORBOO_SHOP=${shop ?? ""}`);

