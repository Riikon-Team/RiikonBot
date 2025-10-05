import dotenv from 'dotenv';
dotenv.config();
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

// validateEnvVariables();

export const E = {
  "warning": "<:warning:1360826772047699988>",
  "warning_1": "<:warning98:1360826751072342077>",
  "warning_2": "<:warning:1360826740301103276>",
  "decline": "<:w98_decline:1360826727135187176>",
  "VinylRecord": "<:VinylRecord:1360826710727327805>",
  "timeout": "<:timeout:1360826695736889354>",
  "success": "<:success:1360826685767028907>",
  "Skip": "<:Skip:1360826672055717908>",
  "SearchingPepe": "<:SearchingPepe:1360826660395548823>",
  "Resume": "<:Resume:1360826649511203048>",
  "Pause": "<:Pause:1360826635971985428>",
  "MusicBeat": "<:MusicBeat:1360826622986686666>",
  "KittyPaw17": "<:KittyPaw17:1360826606855389397>",
  "CatHeadPat": "<:CatHeadPat:1360826589906206760>",
  "99847serveurs": "<:99847serveurs:1360826573720387716>",
  "85722bot": "<:85722bot:1360826544196554882>",
  "add": "<:add:1360826522977701928>",
  "84613mail": "<:84613mail:1360826508733710408>",
  "84613like": "<:84613like:1360826467746971839>",
  "80091fermer": "<:80091fermer:1360826449694822400>",
  "75565management": "<:75565management:1360826427938832584>",
  "75219regles": "<:75219regles:1360826404081635348>",
  "67811jeu": "<:67811jeu:1360826381650497720>",
  "67516moins": "<:67516moins:1360826371504345189>",
  "66880info": "<:66880info:1360826358682615848>",
  "64005web": "<:64005web:1360826347324313763>",
  "63157dislike": "<:63157dislike:1360826332069494844>",
  "62470logs": "<:62470logs:1360826294069231626>",
  "60226check": "<:60226check:1360826283810095226>",
  "59411bocchicringe": "<:59411bocchicringe:1360826269066989648>",
  "52657staff": "<:52657staff:1360826251706892435>",
  "50494lien": "<:50494lien:1360826241086914671>",
  "47886identifiant": "<:47886identifiant:1360826229435011172>",
  "45228cybersecurite": "<:45228cybersecurite:1360826186405511278>",
  "41378statistiques": "<:41378statistiques:1360826175831806059>",
  "administrateur": "<:administrateur:1360826166121857114>",
  "search": "<:search:1360826155258740796>",
  "27932membre": "<:27932membre:1360826137403719752>",
  "23786proprietaire": "<:23786proprietaire:1360826121599455393>",
  "21362bocchitherock": "<:21362bocchitherock:1360826117652611122>",
  "19492membres": "<:19492membres:1360826102049931374>",
  "error": "<:error:1360826094240010290>",
  "16121certifier": "<:16121certifier:1360826086350655589>",
  "trash": "<:trash:1360826078746247178>",
  "13431profil": "<:13431profil:1360826071389573302>",
  "13206moderateur": "<:13206moderateur:1360826064015986791>",
  "11569crayon": "<:11569crayon:1360826052280062074>",
  "9068ouvert": "<:9068ouvert:1360825981337735269>",
  "8311hiroilaugh": "<:8311hiroilaugh:1360825974547288246>",
  "5456bocchioverload": "<:5456bocchioverload:1360825971032326194>",
  "4285bocchihappy": "<:4285bocchihappy:1360825958046761111>",
  "4119bocchislime": "<:4119bocchislime:1360825943152791614>",
  "1033bocchi": "<:1033bocchi:1360825929475031371>",
  "switchoff": "<:switchoff:1424289451869208606>",
  "switchon": "<:switchon:1424289437331886080>",
  "exit":"<:exit:1424290578253746236>",
  "spotify":"<:spotify:1424294465178439700>",
  "youtube":"<:youtube:1424294473004748840>",
  "loop":"<:loop:1424305094337495102>"
};
