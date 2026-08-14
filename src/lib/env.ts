function requireEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const env = {
  supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
  appName: import.meta.env.VITE_APP_NAME || 'FoodIQ Admin',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5174',
  webAppUrl: import.meta.env.VITE_WEB_APP_URL || 'http://localhost:5173',
} as const
