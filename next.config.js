/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'tamagui',
    '@tamagui/core',
    '@tamagui/web',
    '@tamagui/config'
  ],
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web'
    }
  }
}

module.exports = nextConfig