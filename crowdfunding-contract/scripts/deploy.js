const hre = require("hardhat");

// Adresy USDC na różnych sieciach Base
const USDC_ADDRESSES = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC na Base mainnet
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" // USDC na Base Sepolia testnet
};

async function main() {
  // Pobieranie informacji o sieci
  const network = hre.network.name;
  console.log(`🚀 Deploying CrowdfundingPlatform to ${network} network...`);

  // Wybór adresu USDC na podstawie sieci
  let usdcAddress;
  if (network === "base") {
    usdcAddress = USDC_ADDRESSES.base;
  } else if (network === "baseSepolia") {
    usdcAddress = USDC_ADDRESSES.baseSepolia;
  } else {
    throw new Error(`Unsupported network: ${network}. Use 'base' or 'baseSepolia'`);
  }

  console.log("📋 Deployment parameters:");
  console.log(`   USDC Address: ${usdcAddress}`);
  console.log(`   Platform Fee: 2.5%`);
  console.log(`   Min Campaign Goal: 100 USDC`);
  console.log(`   Max Campaign Duration: 365 days`);

  // Pobieranie kontraktu
  const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform");

  // Deployment kontraktu
  console.log("⏳ Deploying platform contract...");
  const crowdfundingPlatform = await CrowdfundingPlatform.deploy(usdcAddress);

  await crowdfundingPlatform.waitForDeployment();
  const contractAddress = await crowdfundingPlatform.getAddress();

  console.log("✅ CrowdfundingPlatform deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);

  // Pobieranie informacji o deploymencie
  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("\n📊 Deployment Summary:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Deployer Balance: ${hre.ethers.formatEther(deployerBalance)} ETH`);
  console.log(`   Network: ${network}`);
  console.log(`   Contract: ${contractAddress}`);

  // Sprawdzenie informacji o platformie
  const platformInfo = await crowdfundingPlatform.getPlatformInfo();
  
  console.log("\n🏗️ Platform Configuration:");
  console.log(`   Total Campaigns: ${platformInfo[0]}`);
  console.log(`   Platform Fee: ${Number(platformInfo[1])/100}%`);
  console.log(`   Fee Recipient: ${platformInfo[2]}`);
  console.log(`   Min Goal: ${hre.ethers.formatUnits(platformInfo[3], 6)} USDC`);
  console.log(`   Max Duration: ${Number(platformInfo[4])/(24*60*60)} days`);

  // Weryfikacja kontraktu (jeśli to mainnet lub testnet)
  if (network !== "localhost" && network !== "hardhat") {
    console.log("\n🔍 Verifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [usdcAddress],
      });
      console.log("✅ Contract verified on Basescan!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }

  console.log("\n🎉 Platform deployment completed successfully!");
  console.log(`\n📝 Platform Features:`);
  console.log(`   ✅ Multi-campaign support`);
  console.log(`   ✅ Automatic fee collection (2.5%)`);
  console.log(`   ✅ Campaign creation for anyone`);
  console.log(`   ✅ All-or-nothing funding model`);
  console.log(`   ✅ Built-in refund mechanism`);
  console.log(`\n📝 To interact with the platform, use:`);
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Network: ${network}`);
}

// Obsługa błędów
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 