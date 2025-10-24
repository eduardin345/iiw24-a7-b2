// Local do arquivo: backend/server.js

// ==========================================================
// ========== 1. IMPORTAÇÃO DE DEPENDÊNCIAS ================
// ==========================================================
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Importação dos seus modelos do banco de dados
import Veiculo from './models/veiculo.js';
import User from './models/user.js';

// Importação do seu middleware de autenticação
import authMiddleware from './middleware/auth.js';

// ==========================================================
// ============ 2. CONFIGURAÇÃO INICIAL DO APP ==============
// ==========================================================
dotenv.config(); // Carrega as variáveis do arquivo .env para process.env
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares Globais (funções que rodam em todas as requisições) ---
app.use(cors());           // Permite requisições de diferentes origens (essencial para a comunicação frontend-backend)
app.use(express.json());   // Habilita o servidor a interpretar o corpo das requisições como JSON
app.use(express.static('public')); // Diz ao Express para servir os arquivos do frontend (HTML, CSS, JS, imagens) da pasta 'public'

// ==========================================================
// =========== 3. CONEXÃO COM O BANCO DE DADOS ==============
// ==========================================================
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
    .catch(err => {
        console.error("❌ Erro ao conectar ao MongoDB:", err);
        process.exit(1); // Encerra a aplicação se a conexão com o banco falhar
    });


// ==========================================================
// ========== 4. ROTAS DE AUTENTICAÇÃO (Públicas) ===========
// ==========================================================

// ROTA PARA REGISTRAR UM NOVO USUÁRIO
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashedPassword });
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        console.error("[ERRO NO REGISTRO]:", error);
        res.status(500).json({ error: 'Erro no servidor ao tentar registrar usuário.' });
    }
});

// ROTA PARA FAZER LOGIN DE UM USUÁRIO
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const user = await User.findOne({ email });
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        if (!user || !isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        console.error("[ERRO NO LOGIN]:", error);
        res.status(500).json({ error: 'Erro interno no servidor durante o login.' });
    }
});


// ==========================================================
// ======== 5. ROTAS DE VEÍCULOS (Protegidas) ===============
// ==========================================================
// O `authMiddleware` é o "guardião" que roda antes de cada uma destas rotas.

// READ ALL - Listar todos os veículos DO USUÁRIO logado
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) {
        console.error("[ERRO GET /api/veiculos]:", e);
        res.status(500).json({ error: 'Erro ao buscar os veículos do usuário.' });
    }
});

// CREATE - Criar um novo veículo PARA O USUÁRIO logado
app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const dadosDoVeiculo = { ...req.body, owner: req.userId };
        const veiculo = new Veiculo(dadosDoVeiculo);
        await veiculo.save();
        res.status(201).json(veiculo);
    } catch (e) {
        console.error("[ERRO POST /api/veiculos]:", e);
        res.status(400).json({ error: e.message });
    }
});

// DELETE - Remover um veículo (apenas se pertencer ao usuário logado)
app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Veiculo.deleteOne({ _id: req.params.id, owner: req.userId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Veículo não encontrado ou você não tem permissão para removê-lo.' });
        }
        res.json({ message: 'Veículo removido com sucesso.' });
    } catch (e) {
        console.error("[ERRO DELETE /api/veiculos/:id]:", e);
        res.status(500).json({ error: 'Erro ao remover o veículo.' });
    }
});

// Adicionar Manutenção a um Veículo (rota protegida)
app.post('/api/veiculos/:id/manutencoes', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findOne({ _id: req.params.id, owner: req.userId });
        if(!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado ou não pertence a você.' });
        }
        
        veiculo.historicoManutencao.push(req.body);
        await veiculo.save();
        res.json(veiculo);
    } catch (e) {
        console.error("[ERRO POST /api/veiculos/:id/manutencoes]:", e);
        res.status(400).json({ error: e.message });
    }
});


// ==========================================================
// ====== 6. ROTAS PÚBLICAS (Arsenal e Previsão) ============
// ==========================================================
const dadosArsenal = {
    veiculosDestaque: [
        { id: 1, modelo: "McLaren 720S", ano: 2022, destaque: "Performance pura encontra design aerodinâmico.", imagemUrl: "assets/img/mclaren.jpg" },
        { id: 2, modelo: "Porsche 911 GT3", ano: 2023, destaque: "O ícone das pistas, legalizado para as ruas.", imagemUrl: "assets/img/porsche.jpg" }
    ],
    servicosOferecidos: [
        { id: 's1', nome: "Diagnóstico Eletrônico Completo", descricao: "Otimize a performance da injeção eletrônica.", precoEstimado: "R$ 150,00" },
        { id: 's2', nome: "Troca de Óleo e Filtros Sintéticos", descricao: "Essencial para a saúde e longevidade do motor.", precoEstimado: "A partir de R$ 250,00" }
    ],
    dicasManutencao: [
        { id: 'd1', dica: "Mantenha os pneus calibrados semanalmente para economizar combustível." },
        { id: 'd2', dica: "Verifique o nível do óleo com o carro frio e em local plano." }
    ]
};

app.get('/api/garagem/veiculos-destaque', (req, res) => res.json(dadosArsenal.veiculosDestaque));
app.get('/api/garagem/servicos-oferecidos', (req, res) => res.json(dadosArsenal.servicosOferecidos));
app.get('/api/garagem/dicas-manutencao', (req, res) => res.json(dadosArsenal.dicasManutencao));

app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "Erro de configuração no servidor." });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const respostaDaAPI = await axios.get(url);
        res.json(respostaDaAPI.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: "Cidade não encontrada." });
        }
        console.error("❌ Erro ao buscar previsão do tempo:", error.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao buscar dados da previsão do tempo.' });
    }
});

// ==========================================================
// =============== 7. INICIALIZAÇÃO DO SERVIDOR ==============
// ==========================================================
app.listen(PORT, () => console.log(`🚀 Servidor rodando. Acesse sua aplicação em http://localhost:${PORT}`));