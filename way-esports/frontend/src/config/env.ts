interface Config {
  API_URL: string;
  IS_DEVELOPMENT: boolean;
  TELEGRAM_BOT_USERNAME: string;
}

const config: Config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  TELEGRAM_BOT_USERNAME: process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'WAYEsportsBot',
};

export default config; 