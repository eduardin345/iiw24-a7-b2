// Local: backend/server.js (VERSÃO FINAL E CORRETA PARA MONGODB)

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt'; // <<== LINHA CORRIGIDA
import jwt from 'jsonwebtoken';

// Modelos do Banco de Dados
import Veiculo from './Models/veiculo.js';
import User from './public/js/models/user.js';

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

// REGISTRAR NOVO USUÁRIO
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

// FAZER LOGIN
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
// Todas as rotas abaixo agora exigem um Token JWT válido

// READ ALL - Listar todos os veículos DO USUÁRIO logado
app.get('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const veiculos = await Veiculo.find({ owner: req.userId }).sort({ createdAt: -1 });
        res.json(veiculos);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CREATE - Criar um novo veículo PARA O USUÁRIO logado
app.post('/api/veiculos', authMiddleware, async (req, res) => {
    try {
        const dadosDoVeiculo = {
            ...req.body,
            owner: req.userId // O ID do usuário vem do middleware!
        };
        const veiculo = new Veiculo(dadosDoVeiculo);
        await veiculo.save();
        res.status(201).json(veiculo);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// DELETE - Remover um veículo (se pertencer ao usuário logado)
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

// ROTA PARA ADICIONAR MANUTENÇÃO (já protege com authMiddleware)
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


// --- ROTAS DO ARSENAL DE DADOS (Públicas, não precisam de login) ---
// Estas podem continuar como estavam, pois não são dados de usuário.
app.get('/api/garagem/veiculos-destaque', (req, res) => { /* ... seu código ... */ });
app.get('/api/garagem/servicos-oferecidos', (req, res) => { /* ... seu código ... */ });
app.get('/api/garagem/dicas-manutencao', (req, res) => { /* ... seu código ... */ });
app.get('/api/previsao/:cidade', async (req, res) => { /* ... seu código da previsão ... */ });


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}. Acesse http://localhost:${PORT}`));