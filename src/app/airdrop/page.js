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

  const AirdropContractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ADDRESS_HOLESKY_V2;
  const AirdropABI = abi;

  const addresses = [
    '0xe856fe9c604C03E43860703334D639a7bc6617D9',
    '0xD3B5a2d4bAb5F72e31465c2E459E6cDFe9620EC9',
    '0xfE2862EA01cCf2faE0A6b791546e4f75A4Cd376c',
    '0x5e8a77A09ffA838a4622531b3Dab29dB43fCC210',
    '0x91A12A52904E1F7bCd005E965Bf61F992E482ecA',
    '0x23CC7Aa91050eB100240209fc4C9De8651194EB6',
    '0xDC1e142edfF0C3915d85Ab17846eDaF8D1659211',
    '0xb8ADA9A34320d45B98d17a52e9079f6bf1B2097F',
    '0x2c8e4216c8E6d737385E2C2031fD61c688119B64',
    '0x9580e9af740d29fF38B09A09503DB9EBa18C1143',
    '0x5F944FF3C77B8729628e8aC1154a3bbe839A8EAb',
    '0x1793a7F41C6228584d1754D995720a0B2E870d4d',
    '0xA9f6FD26A06B9Ce386D6672975890e9a74DF69A9',
    '0x5Bf69E88316422a34e6BAe00d1382F46252D63E6',
    '0x4717f5E8b230E486D15B3ad04E88fB16ada1598B',
    '0x0b91911ee086B8FE527d9AA92c0b856B0cDf6916',
    '0xC3e15c1E36cD8fAc340e2d90f528cb044338e9B0',
    '0x3D0f8864Cc483E937A184119Cc9AE8f651eb07fa',
    '0xa41c949453d132aBEE72fBFBE2fb935Ee6D785C2',
    '0x23D8aeB858001324DAB793786B6EEb277F498DC4'
  ]

  const tokensPerUser = 100;

  const eligibleUsers = addresses.map(address => ({
    address,
    amount: ethers.parseEther(tokensPerUser.toString())
  }));

  //calls airdrop function of smart contract
  const claimTokens = async () => {
    if (!provider || !account || !isEligible || claimedAmount === '' || claimedAmount <= 0) return;

    try {
      setIsMetaMaskBusy(true);
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      const { witnesses } = merkleProof(eligibleUsers, { address: account, amount: ethers.parseEther(totalAssigned) });
      const tx = await airdropContract.airdrop(witnesses, ethers.parseEther(totalAssigned), ethers.parseEther(claimedAmount));
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
              Tokens MTK Poseídos:
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
