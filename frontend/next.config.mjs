/** @type {import('next').NextConfig} */
// /api/* is handled by app/api/[...path]/route.ts, which forwards to the backend
// and adds the X-Service-Secret header on the server (never sent to the browser).
const nextConfig = {};
export default nextConfig;
