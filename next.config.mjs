/** @type {import('next').NextConfig} */
const nextConfig = {
    redirects: async () => {
        return [
          {
            source: '/',
            destination: '/airdrop',
            permanent: false, //this redirect is not cached by the browser
          },
        ];
      }, 
};

export default nextConfig;
