import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Servidor autónomo en .next/standalone (lo usa el Dockerfile para Easypanel, SPEC-002).
  // En Vercel no cambia nada: Vercel usa su propio empaquetado.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
