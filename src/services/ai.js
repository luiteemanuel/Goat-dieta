import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// NOTE: Ideally this key should be in environment variables (VITE_GEMINI_API_KEY)
// For now, I'll rely on the user providing it or setting it up.
// I will fetch it from a hypothetical config or expect env var.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("CRITICAL: VITE_GEMINI_API_KEY is missing in environment variables!");
} else {
    console.log("Gemini API Key loaded successfully (starts with " + API_KEY.substring(0, 4) + ")");
}

export const genAI = new GoogleGenerativeAI(API_KEY || "invalid_key");

export async function analyzeFood(description) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      Analise o seguinte alimento ou refeição e retorne uma estimativa nutricional em formato JSON.
      Descrição: "${description}"
      
      Retorne APENAS o JSON no seguinte formato, sem markdown ou explicações adicionais:
      {
        "name": "Nome curto e claro do prato",
        "calories": 0, (numero inteiro)
        "protein": 0, (gramas, numero inteiro)
        "carbs": 0, (gramas, numero inteiro)
        "fat": 0, (gramas, numero inteiro)
        "amount": "Tamanho da porção estimada (ex: 1 prato, 200g)"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw new Error("Não foi possível analisar o alimento.");
    }
}

export async function chatWithNutritionist(history, message, userContext) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Prepare context prompt
        const systemInstruction = `
      Você é um nutricionista IA experiente e amigável.
      
      Dados do usuário:
      - Peso: ${userContext?.profile?.weight || '?'} kg
      - TMB/Meta: ${userContext?.profile?.tmb || '?'} kcal
      - Objetivo: ${userContext?.profile?.goal || 'Manter peso'}
      - Consumo Hoje: ${userContext?.consumed?.calories || 0} kcal (Meta: ${userContext?.goals?.calories || 0})
      
      Responda de forma concisa, motivadora e baseada em ciência.
      Se o usuário perguntar sobre receitas, sugira algo que se encaixe nos macros restantes dele se possível.
    `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Como posso ajudar com sua dieta hoje?" }],
                },
                ...history
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        throw new Error("Erro ao conectar com o assistente.");
    }
}

export async function calculateNutritionalProfile(userData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        Com base nestes dados:
        - Peso: ${userData.weight} kg
        - Altura: ${userData.height} cm
        - Idade: ${userData.age} anos
        - Gênero: ${userData.gender}

        Calcule:
        1. Taxa Metabólica Basal (TMB/BMR) exata usando a fórmula de Mifflin-St Jeor.
        IMPORTANTE: Não aplique nenhum fator de atividade. Quero apenas o valor de repouso (Inércia).
        
        Retorne APENAS um JSON neste formato:
        
        Retorne APENAS um JSON neste formato:
        {
            "tmb": 0, (numero inteiro)
            "explanation": "Breve explicação de 1 frase"
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error("AI Calc Error:", error);
        throw new Error("Não foi possível calcular o perfil.");
    }
}
