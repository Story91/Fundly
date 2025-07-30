import React from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_CONFIG, getContractAddress } from '../contracts/contract-config';
import contractAbi from '../contracts/CrowdfundingPlatform.abi.json';

const ContractStatus = ({ styles }) => {
  const { chainId } = useAccount();
  
  // Get total campaigns from contract
  const { data: totalCampaigns } = useReadContract({
    address: chainId ? getContractAddress(chainId) : undefined,
    abi: contractAbi,
    functionName: 'campaignCount',
    enabled: !!chainId,
  });

  if (!chainId) return null;

  return (
    <div style={{
      ...styles.card,
      backgroundColor: chainId === 84532 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      marginBottom: '16px'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
        🏗️ Contract Status
      </div>
      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
        Network: {chainId === 84532 ? 'Base Sepolia ✅' : `Chain ${chainId} ❌`}
      </div>
      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
        Campaigns: {`${Number(totalCampaigns || 0)} total`}
      </div>
      {chainId === 84532 && (
        <div style={{ fontSize: '11px', opacity: 0.8, fontFamily: 'monospace' }}>
          {getContractAddress(chainId).slice(0, 8)}...{getContractAddress(chainId).slice(-6)}
        </div>
      )}
    </div>
  );
};

export default ContractStatus;