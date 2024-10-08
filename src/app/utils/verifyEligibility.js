import { ethers } from 'ethers';

const verifyEligibility = async (account, eligibleUsers, setIsEligible, setTotalAssigned, updateStatusMessage) => {
    if (!account) return;

    const user = eligibleUsers.find(user => user.address.toLowerCase() === account.toLowerCase());

    if (user) {
      setIsEligible(true);
      setTotalAssigned(ethers.formatEther(user.amount));
      updateStatusMessage('Eres elegible para el airdrop.', 'success');
    } else {
      setIsEligible(false);
      setTotalAssigned(0);
      updateStatusMessage('No eres elegible para el airdrop.', 'error');
    }
  };

export default verifyEligibility;