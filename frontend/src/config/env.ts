const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string || 'http://localhost:8000/api',
  APP_ENV: import.meta.env.MODE as string || 'development',
  isDev: import.meta.env.DEV as boolean,
  isProd: import.meta.env.PROD as boolean,
};

export default env;
