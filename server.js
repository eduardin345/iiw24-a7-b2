// Local: backend/server.js (VERSÃO CORRIGIDA E COMPLETA)

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios'; // <<== ADICIONE ESTA IMPORTAÇÃO

// Modelos do Banco de Dados
import Veiculo from './Models/veiculo.js';
// Lembre-se de mover o user.js para a pasta Models e corrigir o caminho aqui
import User from './Models/user.js'; // <<== CAMINHO CORRIGIDO

// Middleware de Autenticação
import authMiddleware from './middleware/auth.js';

// --- CONFIGURAÇÃO INICIAL ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM O MONGODB ---
mongoose.connect(process.env.MONGO_URI, {})
    .then(() => console.log("✅ Conectado ao MongoDB Atlas!"))
    .catch(err => {
        console.error("❌ Erro ao conectar ao MongoDB:", err);
        process.exit(1);
    });

// ===========================================
// ===== ROTAS DE AUTENTICAÇÃO (PÚBLICAS) =====
// ===========================================
// ... Suas rotas de /api/auth/register e /api/auth/login ficam aqui ...
// (Não precisa mudar nada nelas)
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

    try {
        if (await User.findOne({ email })) {
            return res.status(409).json({ error: 'Este e-mail já está em uso.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, password: hashedPassword });
        res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor durante o login.' });
    }
});

// ====================================================
// ===== ROTAS DE VEÍCULOS (AGORA PROTEGIDAS) =====
// ====================================================
// ... Suas rotas de /api/veiculos ficam aqui ...
// (Não precisa mudar nada nelas)
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const dadosDoVeiculo = {
            ...req.body,
            owner: req.userId
        };
        const veiculo = new Veiculo(dadosDoVeiculo);
        await veiculo.save();
        res.status(201).json(veiculo);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/veiculos/:id', authMiddleware, async (req, res) => {
    try {
        const veiculo = await Veiculo.findOne({ _id: req.params.id, owner: req.userId });
        if (!veiculo) {
            return res.status(404).json({ error: 'Veículo não encontrado ou você não tem permissão para removê-lo.' });
        }
        await Veiculo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Veículo removido com sucesso.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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
        res.status(400).json({ error: e.message });
    }
});


// ▼▼▼ SEU BLOCO ANTIGO DE ROTAS VAZIAS É SUBSTITUÍDO POR TUDO ISTO AQUI ▼▼▼
// --- ROTAS DO ARSENAL DE DADOS (Públicas, não precisam de login) ---
// ▼▼▼ SUBSTITUA TODO O SEU ANTIGO 'dadosArsenal' POR ESTE BLOCO ABAIXO ▼▼▼
const dadosArsenal = {
    veiculosDestaque: [
        // Mantive o McLaren, mas você pode apagar ou alterar este também se quiser.
        { id: 1, modelo: "McLaren P1", ano: 2015, destaque: "Um ícone híbrido da performance, combinando motor V8 biturbo e elétrico.", imagemUrl: "assets/img/mclaren.jpg" },

        // ====== EDITE A PARTIR DAQUI ======

        // SEU PRIMEIRO CARRO
        { 
            id: 2, 
            modelo: "porsche", // Ex: "Chevrolet Opala"
            ano: 2024, // Ex: 1988
            destaque: "é uma porshe.", // Ex: "O lendário sedan de luxo que marcou uma geração no Brasil."
            // IMPORTANTE: Coloque abaixo o nome exato do seu arquivo de imagem.
            imagemUrl: "assets/img/porsche.jpg" 
        },

        // SEU SEGUNDO CARRO
        { 
            id: 3, 
            modelo: "mustang", // Ex: "Ford Maverick GT"
            ano: 2024, // Ex: 1975
            destaque: "mustang.", // Ex: "Um clássico muscle car com o som inconfundível do motor V8."
            // IMPORTANTE: O nome do arquivo pode ter extensão .png, .webp, etc.
            imagemUrl: "assets/img/png-transparent-ford-gt-shelby-mustang-california-special-mustang-2018-ford-mustang-gt-premium-ford-car-performance-car-vehicle.png" 
        }
        
        // ===================================
    ],
    servicosOferecidos: [
        { id: 's1', nome: "Alinhamento e Balanceamento 3D", descricao: "Garantimos a estabilidade e segurança do seu veículo.", precoEstimado: "R$ 180,00" },
        { id: 's2', nome: "Troca de Óleo e Filtros", descricao: "Serviço essencial para a longevidade do motor.", precoEstimado: "R$ 250,00" },
        { id: 's3', nome: "Diagnóstico Eletrônico Completo", descricao: "Identificamos falhas para otimizar a performance da injeção eletrônica.", precoEstimado: "R$ 150,00" }
    ],
    dicasManutencao: [
        { id: 'd1', dica: "Verifique o nível do óleo do motor a cada 1.000 km, especialmente antes de viagens longas." },
        { id: 'd2', dica: "Mantenha os pneus calibrados para economizar combustível e aumentar a segurança." }
    ]
};

app.get('/api/garagem/veiculos-destaque', (req, res) => {
    res.json(dadosArsenal.veiculosDestaque);
});

app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    res.json(dadosArsenal.servicosOferecidos);
});

app.get('/api/garagem/dicas-manutencao', (req, res) => {
    res.json(dadosArsenal.dicasManutencao);
});

app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const respostaDaAPI = await axios.get(url);
        res.json(respostaDaAPI.data);
    } catch (error) {
        console.error("❌ Erro ao buscar previsão do tempo:", error.response?.data || error.message);
        res.status(500).json({ error: 'Falha ao buscar dados da previsão do tempo.' });
    }
});
// ▲▲▲ FIM DO BLOCO DE CÓDIGO SUBSTITUÍDO ▲▲▲


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}. Acesse http://localhost:${PORT}`));