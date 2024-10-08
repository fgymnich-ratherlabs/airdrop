'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './../lib/abi/Airdrop.js';
import { merkleProof } from './../lib/scripts/merkleTree';
import useTokenBalance from '../hooks/useTokenBalance.js';
import verifyEligibility from '../utils/verifyEligibility';
import connectWallet from '../utils/connectWallet';

export default function AirdropPage() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [isEligible, setIsEligible] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState('text-white');
  const [showGlow, setShowGlow] = useState(false);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [isMetaMaskBusy, setIsMetaMaskBusy] = useState(false); 
  const balance = useTokenBalance(account, statusMessage); //hook que trae el balance del address del token, cuando se conecta la mm o se realiza una tx

  const AirdropContractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ADDRESS_LOCAL;
  const AirdropABI = abi;

  const eligibleUsers = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', amount: ethers.parseEther('100') },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: ethers.parseEther('200') },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', amount: ethers.parseEther('150') },
    { address: process.env.NEXT_PUBLIC_ADDRESS_METAMASK_TESTING, amount: ethers.parseEther('100') },
  ];

  const claimTokens = async () => {
    if (!provider || !account || !isEligible || claimedAmount === '' || claimedAmount <= 0) return;

    try {
      setIsMetaMaskBusy(true);
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      const { witnesses, path } = merkleProof(eligibleUsers, { address: account, amount: ethers.parseEther(totalAssigned) });
      const tx = await airdropContract.airdrop(witnesses, ethers.parseEther(totalAssigned), ethers.parseEther(claimedAmount), path);
      await tx.wait();

      updateStatusMessage(`Has reclamado ${claimedAmount} tokens exitosamente.`, 'success');
      setClaimedAmount('');
    } catch (error) {
      console.error('Error al reclamar los tokens:', error);
      updateStatusMessage(`Hubo un error al reclamar los tokens. Razón: ${error.reason}`, 'error');
    } finally {
      setIsMetaMaskBusy(false); 
    }
  };

  const updateStatusMessage = (message, type) => {
    setStatusMessage(message);
    setStatusColor(type === 'success' ? 'text-green-500' : 'text-red-500');
    setShowGlow(true);

    setTimeout(() => {
      setShowGlow(false); // Quitar el brillo después
    }, 1000);
  };

  useEffect(() => {
    if (account) {
      verifyEligibility(account, eligibleUsers, setIsEligible, setTotalAssigned, updateStatusMessage);
    }
  }, [account]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl font-extrabold mb-8 px-4 py-2 rounded-lg text-gradient bg-gradient-to-r from-purple-400 to-blue-500">
        MTK Claim
      </h1>

      <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg text-center">
        {!account ? (
          <button
            onClick={connectWallet(setProvider, setAccount)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300"
          >
            Conectar MetaMask
          </button>
        ) : (
          <div className="text-lg rounded font-semibold">
            <p className="text-green-400">Conectado: {account}</p>
            <p
              className={`${statusColor} mt-4 text-lg italic rounded transition-all duration-2000 ${
                showGlow ? 'animate-pulse shadow-[0_0_20px_currentColor]' : ''
              }`}
            >
              {statusMessage}
            </p>
          </div>
        )}
      </div>

      {isEligible && account && (
        <div className="flex flex-col items-center mt-6 p-6 bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl">
          <div className="mb-4">
            <p className="text-2xl text-transparent font-[family-name:var(--font-geist-mono)] bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-bold shadow-md">
              Tokens MTK Asignados:
              <span className="ml-2 px-2 py-1 bg-yellow-500 rounded-lg shadow-lg text-black">
                {totalAssigned}
              </span>
            </p>
          </div>
          <div className="mb-4">
            <p className="text-2xl text-transparent font-[family-name:var(--font-geist-mono)] bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-bold shadow-md">
              Tokens MTK Reclamados:
              <span className="ml-2 px-2 py-1 bg-yellow-500 rounded-lg shadow-lg text-black">
                {balance/10**18}
              </span>
            </p>
          </div>

          <div className="w-full">
            <label className="text-xl mb-2 block font-[family-name:var(--font-geist-mono)]">Cantidad a reclamar:</label>
            <input
              type="number"
              value={claimedAmount}
              onChange={(e) => setClaimedAmount(e.target.value)}
              className="mb-4 w-full px-4 py-2 bg-gray-700 text-white border font-[family-name:var(--font-geist-mono)] border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              min="0.0"
            />
           
          </div>

          <button
            onClick={claimTokens}
            className={ `px-8 py-3 bg-green-500 enabled:hover:bg-green-600 text-white font-bold rounded-lg shadow-lg transition duration-300 disabled:bg-gray-400 `}
            disabled={isMetaMaskBusy || (claimedAmount<=0)}
          >
            {isMetaMaskBusy ? 'Procesando...' : 'Reclamar Tokens'}
          </button>
        </div>
      )}
    </div>
  );
}
