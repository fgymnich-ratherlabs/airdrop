import detectEthereumProvider from '@metamask/detect-provider';

const connectWallet = async (setProvider, setAccount) => {
    try {
      const provider = await detectEthereumProvider();
      if (provider) {
        setProvider(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        provider.on('accountsChanged', (accounts) => setAccount(accounts[0]));
      } else {
        alert('MetaMask no está instalada. Por favor instala MetaMask.');
      }
    } catch (error) {
      console.error('Error conectando a MetaMask:', error);
    }
  };

export default connectWallet;