// Konfiguracja kontraktu CrowdfundingPlatform
export const CONTRACT_CONFIG = {
  // Adresy kontraktu na różnych sieciach
  addresses: {
    baseSepolia: "0xdEEd47D0b073B1dEF70813FFA1D6E9ac1Df0E3EF",
    base: "", // Do uzupełnienia po deploymencie na mainnet
  },
  
  // Adresy USDC na różnych sieciach
  usdcAddresses: {
    baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  
  // Ustawienia platformy
  settings: {
    platformFee: 250, // 2.5% (250/10000)
    minGoal: 100, // 100 USDC minimum
    maxDuration: 365, // 365 dni maksimum
  },
  
  // Chain IDs
  chainIds: {
    baseSepolia: 84532,
    base: 8453,
  }
};

// Helper function to get contract address for current chain
export const getContractAddress = (chainId) => {
  switch (chainId) {
    case 84532: // Base Sepolia
      return CONTRACT_CONFIG.addresses.baseSepolia;
    case 8453: // Base Mainnet
      return CONTRACT_CONFIG.addresses.base;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

// Helper function to get USDC address for current chain
export const getUSDCAddress = (chainId) => {
  switch (chainId) {
    case 84532: // Base Sepolia
      return CONTRACT_CONFIG.usdcAddresses.baseSepolia;
    case 8453: // Base Mainnet
      return CONTRACT_CONFIG.usdcAddresses.base;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};