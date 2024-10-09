'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './../lib/abi/Airdrop.js';
import connectWallet from '../utils/connectWallet';

export default function AdminPage() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [totalClaimedTokens, setTotalClaimedTokens] = useState(0);
  const [recentClaimers, setRecentClaimers] = useState([]);
  const [contractPaused, setContractPaused] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const AirdropContractAddress = process.env.NEXT_PUBLIC_AIRDROP_CONTRACT_ADDRESS_LOCAL;
  const AirdropABI = abi;

  // Fetch owner address and compare with connected account
  const checkIfOwner = async () => {
    if (!provider || !account) return;

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      const ownerAddress = await airdropContract.owner();
      setIsOwner(account.toLowerCase() === ownerAddress.toLowerCase());
    } catch (error) {
      console.error('Error fetching owner address:', error);
    }
  };

  // Fetch total claimed tokens
  const fetchTotalClaimed = async () => {
    if (!provider || !account) return;

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      const totalAssigned = await airdropContract.getAirdropTokenBalance();
      setTotalClaimedTokens(ethers.formatEther(totalAssigned));
    } catch (error) {
      console.error('Error fetching total claimed tokens:', error);
    }
  };

  // Fetch recent claimers
  const fetchRecentClaimers = async () => {
    // Simulated data, in a real case, this would come from events or contract calls.
    const claimers = [
      { address: '0xf39Fd6...', amount: ethers.parseEther('100') },
      { address: '0x709979...', amount: ethers.parseEther('50') },
    ];
    setRecentClaimers(claimers);
  };

  const fetchPaused = async () =>{
    if (!provider || !account) return;

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);

      const isPaused = await airdropContract.paused();
      setContractPaused(isPaused);

    } catch (error) {
      console.error('Error fetching paused state:', error);
    }
  }

  // Toggle pause/unpause
  const togglePause = async () => {
    if (!provider || !account) return;

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      console.log("signer: ", signer);
      const airdropContract = new ethers.Contract(AirdropContractAddress, AirdropABI, signer);
      const ownerAddress = await airdropContract.owner();
      console.log("ownerAddress: ", ownerAddress);
      console.log("account: ", account);

      if (ownerAddress.toLowerCase() !== account.toLowerCase()) {
        console.error("Error: La cuenta conectada no es el propietario del contrato");
        return;
      }   

      if (contractPaused) {
        console.log("Unpausing...");
        const tx = await airdropContract.unpause();
        await tx.wait();

        //check if it's paused
        const isPaused = await airdropContract.paused();
        setContractPaused(isPaused);

      } else {
        console.log("Pausing...");
        const tx = await airdropContract.pause(); 
        await tx.wait();

        const isPaused = await airdropContract.paused();
        setContractPaused(isPaused);
      }
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  useEffect(() => {
    if (account) {
      fetchTotalClaimed();
      fetchRecentClaimers();
      checkIfOwner();
      fetchPaused();
    }
  }, [account]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl font-extrabold mb-8 px-4 py-2 rounded-lg text-gradient bg-gradient-to-r from-purple-400 to-blue-500">
        Admin - MTK Airdrop
      </h1>

      <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg w-full max-w-lg text-center">
        {!account ? (
          <button
            onClick={() => {
                connectWallet(setProvider, setAccount);
                checkIfOwner();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300"
          >
            Conectar MetaMask
          </button>
        ) : (
          <div className="text-lg rounded font-semibold">
            <p className="text-green-400">Conectado: {account}</p>
          </div>
        )}
      </div>

      {account && isOwner ? (
        <div className="flex flex-col items-center mt-6 p-6 bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl">
          <div className="mb-4">
            <p className="text-2xl text-transparent font-[family-name:var(--font-geist-mono)] bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-bold shadow-md">
              Total Tokens Reclamados:
              <span className="ml-2 px-2 py-1 bg-yellow-500 rounded-lg shadow-lg text-black">
                {totalClaimedTokens}
              </span>
            </p>
          </div>

          <div className="mb-4">
            <p className="text-2xl text-transparent font-[family-name:var(--font-geist-mono)] bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-bold shadow-md">
              Últimos reclamados:
            </p>
            <ul className="list-disc text-left text-lg ml-6">
              {recentClaimers.map((claimer, index) => (
                <li key={index} className="text-white">
                  {claimer.address} - {ethers.formatEther(claimer.amount)} MTK
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={togglePause}
            className={`px-8 py-3 ${contractPaused ? 'bg-red-500 enabled:hover:bg-red-600' : 'bg-green-500 enabled:hover:bg-green-600'}  text-white font-bold rounded-lg shadow-lg transition duration-300`}
          >
            {contractPaused ? 'Reanudar Airdrop' : 'Pausar Airdrop'}
          </button>
        </div>
      ) : (
        account && (
          <p className="text-red-500 text-2xl">Acceso denegado. Esta página es solo para el owner del contrato.</p>
        )
      )}
    </div>
  );
}
