import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './../lib/abi/Token';


const useTokenBalance = (account, balanceUpdated) => {
    const [balance, setBalance] = useState(null);

    useEffect(() => {
        if (!account) return;

        const fetchBalance = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum)
                const tokenContract = new ethers.Contract(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS_HOLESKY_V2, abi, provider);
                console.log('Fetching balance for account:', account, tokenContract);
                const balance = await tokenContract.balanceOf(account);
                console.log('Balance:', balance.toString());
                setBalance(balance.toString());
            } catch (error) {
                console.error('Failed to fetch balance:', error);
            }
        };

        fetchBalance();

    }, [account, balanceUpdated]);

    return balance;
};

export default useTokenBalance;