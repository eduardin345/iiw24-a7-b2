import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import Veiculo from './models/veiculo.js';

// --- CONFIGURAÇÃO INICIAL ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS DO FRONTEND ---
// Esta é a linha mais importante.
// Ela diz ao Express para procurar e servir arquivos (como index.html, CSS, JS)
// da sua pasta 'public' quando o servidor for acessado.
app.use(express.static('public'));

// --- CONEXÃO COM O BANCO DE DADOS ---
// Verifique se o seu arquivo .env tem a variável MONGO_URI
mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log("✅ Conectado ao MongoDB!"))
.catch(err => console.error("❌ Erro ao conectar ao MongoDB:", err));

// --- ROTAS DA API ---
// O frontend chamará essas rotas prefixadas com /api/

// Rota de Teste da API (acessível em /api/teste)
app.get('/api/teste', (req, res) => res.send('<h1>API da Garagem Inteligente no ar!</h1>'));

// ROTAS CRUD DE VEÍCULOS (GET, POST, DELETE, etc.)
app.get('/api/veiculos', async (req, res) => { try { const d = await Veiculo.find().sort({createdAt:-1}); res.json(d); } catch (e) { res.status(500).json({e:e.message}); } });
app.post('/api/veiculos', async (req, res) => { try { const d = new Veiculo(req.body); const s = await d.save(); res.status(201).json(s); } catch (e) { res.status(400).json({e:e.message}); } });
app.delete('/api/veiculos/:id', async (req, res) => { try { const d = await Veiculo.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({e:'Não encontrado'}); res.json({m:'Removido'}); } catch (e) { res.status(500).json({e:e.message}); } });
app.post('/api/veiculos/:id/manutencoes', async (req, res) => { try { const d = await Veiculo.findByIdAndUpdate(req.params.id, {$push:{historicoManutencao:req.body}},{new:true,runValidators:true}); if(!d) return res.status(404).json({e:'Não encontrado'}); res.json(d); } catch (e) { res.status(400).json({e:e.message}); } });

// ROTAS DO ARSENAL DE DADOS (Destaques, Serviços, Dicas)
app.get('/api/garagem/veiculos-destaque', (req, res) => { res.json([{modelo:"McLaren P1",ano:2015,destaque:"Um ícone híbrido da performance.",imagemUrl:"assets/img/mclaren.jpg"},{modelo:"Porsche 911 GT3",ano:2022,destaque:"A mais pura experiência de condução.",imagemUrl:"assets/img/porsche.jpg"}]); });
app.get('/api/garagem/servicos-oferecidos', (req, res) => { res.json([{nome:"Alinhamento e Balanceamento 3D",descricao:"Garante a máxima estabilidade e vida útil dos pneus.",precoEstimado:"R$ 180,00"},{nome:"Troca de Óleo e Filtros Sintéticos",descricao:"Essencial para a saúde do motor, usando produtos de ponta.",precoEstimado:"A partir de R$ 250,00"}]); });
app.get('/api/garagem/dicas-manutencao', (req, res) => { res.json([{dica:"Verifique o nível do óleo do motor com o carro frio e em local plano."}, {dica:"Calibre os pneus semanalmente, incluindo o estepe."}]); });

// ROTA DE PREVISÃO DO TEMPO - COM TRATAMENTO DE ERRO
app.get('/api/previsao/:cidade', async (req, res) => {
  try {
    const { cidade } = req.params;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.error("ERRO: A chave OPENWEATHER_API_KEY não foi encontrada no arquivo .env");
      return res.status(500).json({ error: "Erro de configuração no servidor." });
    }
    
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    const respostaApi = await axios.get(apiUrl);
    res.status(200).json(respostaApi.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
        return res.status(404).json({ error: "Cidade não encontrada." });
    }
    console.error("[Erro na Rota de Previsão]:", error.message);
    res.status(500).json({ error: "Não foi possível obter a previsão do tempo." });
  }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}. Acesse http://localhost:${PORT}`));