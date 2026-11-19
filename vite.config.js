import react from '@vitejs/plugin-react'
import { isIP } from 'node:net'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const config = { plugins: [react()] }

  if (mode === 'android-public') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const rawUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || ''
    let url

    try {
      url = new URL(rawUrl.trim())
    } catch {
      throw new Error('Build Android publik memerlukan VITE_API_URL di .env. Isi dengan URL HTTPS backend ngrok, bukan URL halaman website.')
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    const localDomain = !hostname.includes('.') ||
      ['.localhost', '.local', '.internal', '.home.arpa'].some(suffix => hostname.endsWith(suffix))

    if (url.protocol !== 'https:' || isIP(hostname) || localDomain ||
        url.username || url.password || url.search || url.hash) {
      throw new Error('VITE_API_URL untuk Android publik harus memakai domain HTTPS publik (misalnya ngrok), tanpa kredensial, query, atau fragment. Alamat localhost, emulator, dan IP lokal tidak dapat dipakai.')
    }

    // Pin the validated value into the bundle; never use the local development fallback.
    config.define = {
      'import.meta.env.VITE_API_URL': JSON.stringify(url.href.replace(/\/+$/, '')),
    }
  }

  return config
})
