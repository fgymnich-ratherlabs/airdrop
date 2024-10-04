'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import abi from './../lib/abi/Airdrop.js';
import {merkleProof} from './../lib/scripts/merkleTree';

export default function AirdropPage() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [isEligible, setIsEligible] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [redeemedTokens, setRedeemedTokens] = useState(0);

  const AirdropContractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ADDRESS_LOCAL; // Dirección de tu contrato
  const AirdropABI = abi;

  // Array de elegibilidad en el frontend
  const eligibleUsers = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', amount: ethers.parseEther("100") },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: ethers.parseEther("200") },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', amount: ethers.parseEther("150") },
    { address: process.env.NEXT_PUBLIC_ADDRESS_METAMASK_TESTING, amount: ethers.parseEther("100") },
  ]; 

  // Conectar a MetaMask
  const connectWallet = async () => {
    try {
      const provider = await detectEthereumProvider();
      if (provider) {
        setProvider(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        // Iniciar escucha para cambios de cuenta
        provider.on('accountsChanged', (accounts) => setAccount(accounts[0]));
      } else {
        alert('MetaMask no está instalada. Por favor instala MetaMask.');
      }
    } catch (error) {
      console.error('Error conectando a MetaMask:', error);
    }
  };

  // Verificar elegibilidad usando el array público
  const verifyEligibility = async () => {
    if (!account) return;

    // Buscar si la cuenta conectada está en el array de elegibles
    const user = eligibleUsers.find(user => user.address.toLowerCase() === account.toLowerCase());

    if (user) {
      setIsEligible(true); 
      setTotalAssigned(ethers.formatEther(user.amount)); // Convertir de Wei a Ether
      setStatusMessage('Eres elegible para el airdrop.');
    } else {
      setIsEligible(false);
      setTotalAssigned(0);
      setStatusMessage('No eres elegible para el airdrop.');
    }
  };

  // Función para hacer el claim de los tokens
  const claimTokens = async () => {
    if (!provider || !account || !isEligible || claimedAmount === '' || claimedAmount <= 0) return;

    try { 
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      console.log("signer: ",signer.address);  

      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      // Generate Merkle Proof 
      const { witnesses, path } = merkleProof(eligibleUsers, { address: account, amount: ethers.parseEther(totalAssigned) });

      const tx = await airdropContract.airdrop(witnesses, ethers.parseEther(totalAssigned), ethers.parseEther(claimedAmount), path);
      await tx.wait();

      setStatusMessage(`Has reclamado ${claimedAmount} tokens exitosamente.`);
      setRedeemedTokens(redeemedTokens+claimedAmount); //sumar la cantidad redeemed
      setClaimedAmount(''); // Resetear el campo de cantidad
    } catch (error) {
      console.error('Error al reclamar los tokens:', error);
      alert(`Error: ${error.info.error.message}`);
      setStatusMessage( `Hubo un error al reclamar los tokens. Razón: ${error.reason}`);
    }
  };

  useEffect(() => {
    if (account) verifyEligibility();
  }, [account]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Claim Airdrop</h1>

      <div className="mb-4">
        {!account ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg"
          >
            Conectar MetaMask
          </button>
        ) : (
          <div className="text-lg font-semibold">Address Conectado: {account}</div>
        )}
      </div>

      <div className="mb-4 bg-blue-300 rounded px-2 shadow transition ease-in-out">
        {account && (
          <div>
            <p className="text-xl">{statusMessage}</p>
          </div>
        )}
      </div>

      {isEligible && (
        <div className="flex flex-col items-center mt-4">
          <p className="mb-2 text-lg">Tokens Asignados: {totalAssigned}</p>
          <p className="mb-2 text-lg">Tokens Redimidos: {redeemedTokens}</p>

          <label className="mb-2 text-lg">Cantidad a reclamar:</label>
          <input
            type="number"
            value={claimedAmount}
            onChange={(e) => setClaimedAmount(e.target.value)}
            className="mb-4 px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="0.0"
          />
          <button
            onClick={claimTokens}
            className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg"
          >
            Reclamar Tokens
          </button>
        </div>
      )}
    </div>
  );
}
