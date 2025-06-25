import express from 'express';
import dotenv from 'dotenv';       // 1. A biblioteca "dotenv" é importada?
import axios from 'axios';

dotenv.config();                  // 2. ESSA LINHA ESTÁ AQUI, logo após os imports?
                                  //    É ela que "abre o cofre" e lê o arquivo .env

// Linha de DEBUG para ver se a chave foi lida:
console.log("VALOR DE OPENWEATHER_API_KEY DENTRO DO server.js:", process.env.OPENWEATHER_API_KEY);

const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY; // A "Recepcionista" tenta pegar a chave aqui

// ... resto do seu server.js ...
// Middleware CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Em produção, restrinja para seu domínio frontend
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Rota Principal de Teste
app.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo ao Backend Proxy da Garagem Inteligente!' });
});

// ENDPOINT DE PREVISÃO DO TEMPO
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;

    if (!apiKey) {
        console.error("[Servidor Backend] ERRO: Chave da API OpenWeatherMap não configurada.");
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor Backend] Buscando previsão para: ${cidade}`);
        const apiResponse = await axios.get(weatherAPIUrl);
        console.log(`[Servidor Backend] Dados recebidos da OpenWeatherMap para ${cidade}.`);
        res.json(apiResponse.data);
    } catch (error) {
        console.error("[Servidor Backend] Erro ao buscar previsão:", error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo no servidor.';
        res.status(status).json({ error: message });
    }
});

// Middleware para rotas não encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint não encontrado no backend.' });
});

// Middleware de tratamento de erros genérico
app.use((err, req, res, next) => {
    console.error('[Servidor Backend] Erro não tratado:', err.stack);
    res.status(500).json({ error: 'Ocorreu um erro inesperado no servidor backend.' });
});

app.listen(port, () => {
    console.log(`Servidor backend rodando em https://iiw24-a7-b2.onrender.com/:${port}`);
    if (!apiKey) {
        console.warn("[Servidor Backend] ATENÇÃO: OPENWEATHER_API_KEY não está definida no .env!");
    }
});


const PORTA = process.env.PORT || 3001;

// Middlewares essenciais
app.use(cors()); // Permite que seu frontend (de outro domínio) acesse a API
app.use(express.json()); // Permite que o servidor entenda JSON

// ==============================================
// ===== INÍCIO: ARSENAL DE DADOS DA GARAGEM =====
// ==============================================

// --- DADOS MOCK (Simulando um Banco de Dados) ---

const veiculosDestaque = [
    { 
        id: 10, 
        modelo: "Porsche 911 GT3 RS", 
        ano: 2024, 
        destaque: "Engenharia alemã no seu auge. Perfeito para Track-days.", 
        imagemUrl: "https://files.porsche.com/filestore/image/multimedia/none/992-gt3-rs-modelimage-sideshot/model/cfbb8ed3-1a15-11ed-80f5-005056bbdc38/porsche-model.png" 
    },
    { 
        id: 11, 
        modelo: "Tesla Cybertruck", 
        ano: 2024, 
        destaque: "O futuro da robustez. Design disruptivo e performance elétrica.", 
        imagemUrl: "https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Main-Hero-Desktop-LHD.jpg"
    },
    { 
        id: 12, 
        modelo: "Ferrari 296 GTB", 
        ano: 2023, 
        destaque: "A nova era de híbridos V6 de Maranello. Pura emoção.", 
        imagemUrl: "https://www.webmotors.com.br/wp-content/uploads/2022/10/06123908/Ferrari-296-GTB-em-Sao-Paulo-1.jpg"
    }
];

const servicosGaragem = [
    { id: "svc001", nome: "Revisão Premium Completa", descricao: "Check-up de mais de 80 itens, troca de óleo e filtros com produtos de alta performance.", precoEstimado: "R$ 950,00" },
    { id: "svc002", nome: "Alinhamento e Balanceamento 3D", descricao: "Precisão máxima para uma direção segura e maior vida útil dos pneus.", precoEstimado: "R$ 180,00" },
    { id: "svc003", nome: "Estética Automotiva (Detailing)", descricao: "Polimento técnico, vitrificação e higienização interna completa.", precoEstimado: "A consultar" },
    { id: "svc004", nome: "Upgrade de Performance", descricao: "Instalação de kits de performance, remaps e melhorias de exaustão.", precoEstimado: "A consultar" }
];

const dicasManutencao = [
    { id: "tip01", dica: "Calibre seus pneus semanalmente, incluindo o estepe. A pressão correta economiza combustível e aumenta a segurança." },
    { id: "tip02", dica: "Verifique o nível do óleo do motor com o carro frio e em local plano para uma medição precisa." },
    { id: "tip03", dica: "Não ande com o carro na 'reserva'. Isso pode superaquecer a bomba de combustível e puxar impurezas do fundo do tanque." },
    { id: "tip04", dica: "Ao lavar o motor, proteja os componentes eletrônicos (módulos, bateria) para evitar curtos-circuitos." }
];


// --- ENDPOINTS (Rotas da API) ---

app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/veiculos-destaque`);
    // Simula um pequeno delay de rede para teste de UI (ótima prática)
    setTimeout(() => {
        res.json(veiculosDestaque);
    }, 500); // Atraso de 0.5 segundos
});

app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/servicos-oferecidos`);
    res.json(servicosGaragem);
});

app.get('/api/garagem/dicas-manutencao', (req, res) => {
    console.log(`[Servidor] Requisição recebida para /api/garagem/dicas-manutencao`);
    res.json(dicasManutencao);
});

// ============================================
// ===== FIM: ARSENAL DE DADOS DA GARAGEM =====
// ============================================


// ROTA DE PREVISÃO DO TEMPO (EXISTENTE - Mantida)
app.get('/api/previsao/:cidade', async (req, res) => {
    const cidade = req.params.cidade;
    const apiKey = process.env.OPENWEATHER_API_KEY; // Garanta que a sua chave está em um arquivo .env
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Erro ao buscar previsão do tempo:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Falha ao buscar previsão do tempo.' });
    }
});


// Inicialização do Servidor
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});

import cors from 'cors';
// ...
app.use(cors()); // Esta linha é crucial!