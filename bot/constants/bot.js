import dotenv from 'dotenv';
dotenv.config();
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));


export const PREFIX = 'rii!';

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const DISCORD_CLIENT_PUBLIC_KEY = process.env.DISCORD_CLIENT_PUBLIC_KEY;
export const DATABASE_URL = process.env.DATABASE_URL;

export const PROJECT_INFO = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    repositoryUrl: packageJson.repository ? packageJson.repository.url.replace('git+', '').replace('.git', '') : null,
    author: packageJson.author,
    license: packageJson.license,
    language: packageJson.language || 'JavaScript',
    issueTracker: packageJson.bugs ? packageJson.bugs.url : null,
};

export const DISCORD_VOICE_REGIONS = {
  "automatic": "Automatic",
  "brazil": "Brazil", 
  "hongkong": "Hong Kong",
  "india": "India",
  "japan": "Japan",
  "rotterdam": "Rotterdam",
  "singapore": "Singapore",
  "south-africa": "South Africa",
  "sydney": "Sydney",
  "us-central": "US Central",
  "us-east": "US East", 
  "us-south": "US South",
  "us-west": "US West"
};

export const getRegionName = (code) => DISCORD_VOICE_REGIONS[code] || code;
export const isValidRegion = (code) => Object.keys(DISCORD_VOICE_REGIONS).includes(code);

const validateEnvVariables = () => {
  const requiredVars = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_CLIENT_PUBLIC_KEY', 'DATABASE_URL'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

validateEnvVariables();
