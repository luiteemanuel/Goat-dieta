import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple .env parser
function loadEnv() {
    try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const envPath = path.join(__dirname, '.env');
        const data = fs.readFileSync(envPath, 'utf8');
        const env = {};
        data.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim();
            }
        });
        return env;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const API_KEY = env.VITE_GEMINI_API_KEY;

console.log("---------------------------------------------------");
console.log("Teste Raw Listing Models");
console.log("---------------------------------------------------");

if (!API_KEY) {
    console.error("ERRO: VITE_GEMINI_API_KEY não encontrada");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
    try {
        console.log(`Fazendo request para: ${url.replace(API_KEY, 'API_KEY')}`);
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`Erro HTTP: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error("Detalhes:", errorBody);
            return;
        }

        const data = await response.json();
        console.log("\nModelos Disponíveis:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("Nenhum modelo encontrado no retorno.");
            console.log(data);
        }

    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

listModels();
