// === IMPORTS E CONFIGURAÇÕES INICIAIS ===
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';
import Veiculo from './models/veiculo.js'; // Modelo Mongoose
import path,{dirname} from 'path'
import { fileURLToPath } from 'url';
const __filename=fileURLToPath(import.meta.url)
const __dirname=dirname(__filename);
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// === MIDDLEWARES ESSENCIAIS ===
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')))

// === CONEXÃO COM O MONGODB ===
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB conectado com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao conectar no MongoDB:", error.message);
        process.exit(1);
    }
};
connectDB();

// === CRUD DE VEÍCULOS ===

// CREATE
app.post('/api/veiculos', async (req, res) => {
    try {
        const veiculoCriado = await Veiculo.create(req.body);
        res.status(201).json(veiculoCriado);
    } catch (error) {
        if (error.code === 11000)
            return res.status(409).json({ error: 'Veículo com esta placa já existe.' });
        if (error.name === 'ValidationError')
            return res.status(400).json({ error: Object.values(error.errors).map(val => val.message).join(' ') });
        res.status(500).json({ error: 'Erro interno ao criar veículo.' });
    }
});

// READ
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find();
        res.json(todosOsVeiculos);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao buscar veículos.' });
    }
});

// UPDATE
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ error: 'ID inválido.' });

        const atualizado = await Veiculo.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!atualizado) return res.status(404).json({ error: 'Veículo não encontrado.' });

        res.json(atualizado);
    } catch (error) {
        if (error.name === 'ValidationError')
            return res.status(400).json({ error: Object.values(error.errors).map(val => val.message).join(' ') });
        res.status(500).json({ error: 'Erro interno ao atualizar.' });
    }
});

// DELETE
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ error: 'ID inválido.' });

        const deletado = await Veiculo.findByIdAndDelete(req.params.id);

        if (!deletado) return res.status(404).json({ error: 'Veículo não encontrado.' });

        res.json({ message: 'Veículo removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno ao remover veículo.' });
    }
});

// === ENDPOINTS DA GARAGEM ===

const veiculosDestaque = [/* ... seus objetos ... */];
const servicosGaragem = [/* ... seus objetos ... */];
const dicasManutencao = [/* ... seus objetos ... */];

app.get('/api/garagem/veiculos-destaque', (req, res) => {
    setTimeout(() => {
        res.json(veiculosDestaque);
    }, 500);
});

app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    res.json(servicosGaragem);
});

app.get('/api/garagem/dicas-manutencao', (req, res) => {
    res.json(dicasManutencao);
});

// === ROTA DE PREVISÃO DO TEMPO ===
app.get('/api/previsao/:cidade', async (req, res) => {
    const cidade = req.params.cidade;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await axios.get(apiUrl);
        res.json(response.data);
    } catch (error) {
        console.error("Erro ao buscar previsão:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Falha ao buscar previsão do tempo.' });
    }
});

// === MIDDLEWARES DE ERRO ===
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado.' });
});

app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err.stack);
    res.status(500).json({ error: 'Erro interno no servidor.' });
});

// === INICIALIZAÇÃO DO SERVIDOR ===
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
