/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: 'https://pinc-mindsight-production.up.railway.app/api/v1/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
