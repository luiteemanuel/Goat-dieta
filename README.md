# 🐐 Goat Dieta

**Goat Dieta** é uma aplicação moderna de rastreamento nutricional potencializada por Inteligência Artificial. Seu objetivo é simplificar o controle de dieta, oferecendo cálculos precisos de Basal/TDEE e ferramentas inteligentes para registro de refeições.

![Goat Dieta Icon](./public/goat-icon.png)

## ✨ Principais Funcionalidades

### 🧠 Inteligência Artificial (Gemini AI)
*   **Cálculo de Basal & Metas:** Utiliza a fórmula de *Mifflin-St Jeor* combinada com fatores de atividade e objetivos (Cutting, Manutenção, Bulking) para definir suas metas de calorias e macros personalizadas.
*   **Análise de Alimentos:** Descreva sua refeição (texto) e a IA estimará calorias, proteínas, carboidratos e gorduras automaticamente.
*   **Assistente Nutricional:** Chat integrado com contexto dos seus dados para tirar dúvidas sobre dieta e saúde.

### 📊 Painel & Controle
*   **Dashboard em Tempo Real:** Visualização clara do consumo diário vs metas.
*   **Diário Alimentar:** Registro fácil de refeições (Café, Almoço, Jantar, Lanches).
*   **Progresso de Macros:** Barras de progresso para Proteína, Carbo e Gordura.
*   **Histórico:** Salve seus dados e acompanhe sua evolução.

### ⚙️ Configurações Avançadas
*   Defina seu **Nível de Atividade** (Sedentário a Super Ativo).
*   Escolha seu **Objetivo** (Emagrecer, Manter, Ganhar Massa).
*   Ajuste fino de multiplicadores de proteína (ex: 2.0g/kg).

## 🚀 Tecnologias Utilizadas

*   **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Estilização:** [TailwindCSS](https://tailwindcss.com/) (Design moderno com Glassmorphism)
*   **Backend / Banco de Dados:** [Firebase](https://firebase.google.com/) (Firestore & Auth)
*   **IA:** [Google Gemini API](https://ai.google.dev/) (Modelo `gemini-2.0-flash`)
*   **Ícones:** [Lucide React](https://lucide.dev/)

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado.
*   Conta no Firebase (com Auth e Firestore habilitados).
*   Chave de API do Google Gemini.

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/goat-dieta.git
    cd goat-dieta
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto e preencha com suas chaves:

    ```env
    VITE_FIREBASE_API_KEY=sua_firebase_api_key
    VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=seu_project_id
    VITE_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
    VITE_FIREBASE_APP_ID=seu_app_id
    VITE_GEMINI_API_KEY=sua_gemini_api_key
    ```

4.  **Rode o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

5.  Acesse `http://localhost:5173` no seu navegador.

---

Desenvolvido para ajudar você a atingir o **GOAT** (Greatest of All Time) físico! 💪
