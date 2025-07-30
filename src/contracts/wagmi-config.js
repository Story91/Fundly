import { createConfig, http } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

// Use environment variable for a reliable Alchemy RPC URL for Base Mainnet
const alchemyBaseRpcUrl = process.env.REACT_APP_ALCHEMY_BASE_RPC_URL;

if (!alchemyBaseRpcUrl) {
  console.warn(
    `️️REACT_APP_ALCHEMY_BASE_RPC_URL is not defined in your .env.local file. 
    The app is falling back to a public RPC endpoint. 
    This may cause rate-limiting issues and a degraded user experience. 
    Please get a free key from https://www.alchemy.com/`
  );
}

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    coinbaseWallet({
      appName: 'Fundly - Crowdfunding Platform',
      appLogoUrl: 'https://base.org/logo.png',
    }),
    injected(),
  ],
  transports: {
    // For testnet, a public RPC is usually fine.
    [baseSepolia.id]: http(),
    // For mainnet, use the dedicated RPC if available.
    [base.id]: http(alchemyBaseRpcUrl || 'https://mainnet.base.org'),
  },
});
