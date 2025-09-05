import { Manutencao } from './models/Manutencao.js';

import { Veiculo } from './models/veiculo.js';
// As classes Carro, CarroEsportivo, Caminhao já foram carregadas por Veiculo.js
// e anexadas ao objeto window para acesso global, simplificando as chamadas.

let garagem = [];
let veiculoSimuladorAtivo = null;

// ====================================================================
// ==================== CONFIGURAÇÃO DO BACKEND =======================
// ====================================================================

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const backendUrl = isLocal ? 'http://localhost:3001' : 'https://iiw24-a7-b2.onrender.com';

// ====================================================================
// =================== NAVEGAÇÃO E LÓGICA DE UI =======================
// ====================================================================

window.mostrarTela = function (idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    const telaAtiva = document.getElementById(idTela);
    if (telaAtiva) {
        telaAtiva.classList.add('tela-ativa');
    }
}

window.exibirNotificacao = function (mensagem, tipo = 'info', duracaoMs = 4000) {
    const notificacaoDiv = document.getElementById('notificacoes');
    if (!notificacaoDiv) return;

    if (notificacaoDiv.timeoutId) clearTimeout(notificacaoDiv.timeoutId);

    notificacaoDiv.textContent = mensagem;
    notificacaoDiv.className = '';
    notificacaoDiv.classList.add(tipo, 'show');

    notificacaoDiv.timeoutId = setTimeout(() => {
        notificacaoDiv.classList.remove('show');
        notificacaoDiv.timeoutId = null;
    }, duracaoMs);
}

function exibirMensagemSimulador(mensagem, tipo = 'info') {
    const mensagemDiv = document.getElementById('mensagem');
    if (mensagemDiv) {
        mensagemDiv.textContent = mensagem;
        mensagemDiv.className = `message-area ${tipo}`;
        mensagemDiv.style.display = 'block';
    }
}


// ====================================================================
// ===================== LÓGICA DO SIMULADOR ==========================
// ====================================================================

function renderizarSimulador() {
    const container = document.getElementById('simulador-veiculo-container');
    if (!veiculoSimuladorAtivo) {
        container.innerHTML = "<p>Selecione um tipo de veículo abaixo para começar.</p>";
        return;
    }
    const imagens = {
        Carro: 'images (1).jpg',
        CarroEsportivo: 'png-transparent-ford-gt-shelby-mustang-california-special-mustang-2018-ford-mustang-gt-premium-ford-car-performance-car-vehicle.png', // Exemplo
        Caminhao: 'images.jpg',
    };
    const imagemSrc = `assets/img/${imagens[veiculoSimuladorAtivo.tipoVeiculo] || 'placeholder.jpg'}`;
    
    let html = `
        <h2>${veiculoSimuladorAtivo.modelo}</h2>
        <img src="${imagemSrc}" alt="Imagem de um ${veiculoSimuladorAtivo.tipoVeiculo}" class="vehicle-image">
        <div class="info-box">${veiculoSimuladorAtivo.exibirInformacoesCompletaHTML()}</div>
        <div class="button-group">
            <button onclick="acaoSimulador('ligar')" class="button button-success"><i class="fas fa-play"></i> Ligar</button>
            <button onclick="acaoSimulador('desligar')" class="button button-danger"><i class="fas fa-stop"></i> Desligar</button>
            <button onclick="acaoSimulador('acelerar', 15)" class="button button-primary"><i class="fas fa-forward"></i> Acelerar</button>
            <button onclick="acaoSimulador('buzinar')" class="button button-primary"><i class="fas fa-volume-up"></i> Buzinar</button>
    `;
    if (veiculoSimuladorAtivo instanceof window.CarroEsportivo) {
        html += veiculoSimuladorAtivo.turbo ? `<button onclick="acaoSimulador('desativarTurbo')" class="button" style="background-color: #95a5a6;"><i class="fas fa-snowflake"></i> Turbo OFF</button>`
                                           : `<button onclick="acaoSimulador('ativarTurbo')" class="button button-warning"><i class="fas fa-fire"></i> Turbo ON</button>`;
    }
    html += `</div>`;
    if (veiculoSimuladorAtivo instanceof window.Caminhao) {
        html += `
            <div class="cargo-section">
                <label for="pesoCargaSimulador">Peso da Carga (kg):</label>
                <input type="number" id="pesoCargaSimulador" placeholder="1000">
                <button onclick="acaoSimulador('carregar')" class="button button-warning"><i class="fas fa-truck-loading"></i> Carregar</button>
                <button onclick="acaoSimulador('descarregar')" class="button" style="background-color: #34495e;"><i class="fas fa-truck-unloading"></i> Descarregar</button>
            </div>`;
    }
    container.innerHTML = html;
}

window.acaoSimulador = function(acao, param = null) {
    if (!veiculoSimuladorAtivo) return;
    const originalNotificacao = window.exibirNotificacao;
    window.exibirNotificacao = exibirMensagemSimulador; 
    try {
        if (acao === 'carregar' || acao === 'descarregar') {
            param = document.getElementById('pesoCargaSimulador')?.value;
        }
        veiculoSimuladorAtivo[acao](param);
    } catch(e) {
        console.error("Erro na ação do simulador:", e);
        exibirMensagemSimulador("Ação não pôde ser executada.", 'error');
    }
    renderizarSimulador();
    window.exibirNotificacao = originalNotificacao; 
}

window.selecionarVeiculoSimulador = function(tipo) {
    switch (tipo) {
        case 'Carro': veiculoSimuladorAtivo = new window.Carro('Carro Padrão', 'Cinza'); break;
        case 'CarroEsportivo': veiculoSimuladorAtivo = new window.CarroEsportivo('Mustang GT', 'Vermelho'); break;
        case 'Caminhao': veiculoSimuladorAtivo = new window.Caminhao('Scania R450', 'Branco', 15000); break;
    }
    document.getElementById('mensagem').style.display = 'none';
    renderizarSimulador();
}


// ====================================================================
// =========== GERENCIAMENTO DA GARAGEM COM BACKEND (CRUD) ============
// ====================================================================

async function carregarGaragem() {
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
        if (!response.ok) {
            throw new Error('Falha na rede ao buscar veículos do servidor.');
        }

        const veiculosDoBanco = await response.json();
        garagem = veiculosDoBanco
            .map(vJson => Veiculo.fromJSON(vJson))
            .filter(v => v !== null);

    } catch (error) {
        console.error("Erro ao carregar garagem do backend:", error);
        exibirNotificacao('Não foi possível carregar a garagem. Verifique se o servidor backend está online.', 'error');
        garagem = [];
    }
    
    renderizarGaragem();
    renderizarAgendamentosFuturos();
}

function renderizarGaragem() {
    const listaVeiculosDiv = document.getElementById('listaVeiculos');
    listaVeiculosDiv.innerHTML = (garagem.length === 0) ? '<p style="text-align: center; color: #777;">Sua garagem está vazia.</p>' : '';
    
    garagem.forEach(veiculo => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'vehicle-item';
        
        itemDiv.innerHTML = `
            <span><strong>${veiculo.modelo}</strong> (${veiculo.placa}) - Cor: ${veiculo.cor}</span>
            <div class="actions">
                <button onclick="abrirModalParaEdicao('${veiculo.id}')">Editar</button>
                <button onclick="abrirModalDetalhes('${veiculo.id}')">Detalhes</button>
                <button class="button-danger" onclick="removerVeiculo('${veiculo.id}')">Remover</button>
            </div>`;
        listaVeiculosDiv.appendChild(itemDiv);
    });
}

window.removerVeiculo = async function(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    if (confirm(`Tem certeza que deseja remover o veículo ${veiculo.modelo} [${veiculo.placa}]?`)) {
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
                method: 'DELETE',
            });
            
            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.error || 'Falha ao remover o veículo.');
            }
            
            exibirNotificacao(resultado.message || `${veiculo.modelo} removido com sucesso.`, 'success');
            await carregarGaragem();
            
        } catch (error) {
            console.error("Erro ao remover veículo:", error);
            exibirNotificacao(`Não foi possível remover: ${error.message}`, 'error');
        }
    }
}

window.abrirModalParaEdicao = async function(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    const novoModelo = prompt("Editar modelo:", veiculo.modelo);
    const novaCor = prompt("Editar cor:", veiculo.cor);

    if (novoModelo !== null && novaCor !== null) {
        if (!novoModelo || !novaCor) {
            exibirNotificacao("Modelo e Cor não podem ser vazios.", "error");
            return;
        }

        const dadosAtualizados = {
            modelo: novoModelo,
            cor: novaCor,
        };

        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });

            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.error || "Falha ao atualizar.");
            }
            
            exibirNotificacao(`Veículo ${resultado.modelo} atualizado com sucesso!`, 'success');
            await carregarGaragem();

        } catch (error) {
            exibirNotificacao(`Erro ao atualizar: ${error.message}`, 'error');
        }
    }
}


// ====================================================================
// ============= MODAL DE DETALHES E MANUTENÇÃO =======================
// ====================================================================

const modal = document.getElementById('modalDetalhesVeiculo');

window.abrirModalDetalhes = function(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;
    document.getElementById('modalTituloVeiculo').textContent = `Detalhes: ${veiculo.modelo}`;
    document.getElementById('manutencaoVeiculoId').value = veiculoId;
    atualizarInfoVeiculoNoModal(veiculoId);
    renderizarHistoricoManutencaoModal(veiculoId);
    flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today", locale: "pt" });
    modal.style.display = 'block';
}

window.fecharModal = function() { 
    if(modal) modal.style.display = 'none';
}

window.atualizarInfoVeiculoNoModal = function(veiculoId) {
    if (!modal || modal.style.display !== 'block' || document.getElementById('manutencaoVeiculoId').value !== veiculoId) return;
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;
    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if(veiculo) document.getElementById('modalHistoricoManutencao').innerHTML = veiculo.getHistoricoHTML();
}

function renderizarAgendamentosFuturos() {
    const listaAgendamentosDiv = document.getElementById('listaAgendamentosFuturos');
    const agora = new Date();
    const agendamentos = garagem
        .flatMap(veiculo => (veiculo.historicoManutencao || []).map(manutencao => ({ veiculo, manutencao })))
        .filter(item => item.manutencao.data instanceof Date && !isNaN(item.manutencao.data) && item.manutencao.data > agora)
        .sort((a, b) => a.manutencao.data - b.manutencao.data);

    listaAgendamentosDiv.innerHTML = (agendamentos.length === 0) ? '<p style="text-align: center; color: #777;">Nenhum agendamento futuro.</p>' : '';
    agendamentos.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'schedule-item';
        itemDiv.innerHTML = `
             <span>${item.manutencao.formatar(true, `${item.veiculo.modelo} (${item.veiculo.cor})`)}</span>
             <button class="button-warning" onclick="removerManutencao('${item.veiculo.id}', '${item.manutencao.id}')">Cancelar</button>`;
        listaAgendamentosDiv.appendChild(itemDiv);
    });
}

window.removerManutencao = function(veiculoId, manutencaoId) {
    // AVISO: Lógica de manutenção ainda é LOCAL
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (veiculo && veiculo.removerManutencaoPorId(manutencaoId)) {
        exibirNotificacao('Manutenção removida.', 'success');
        renderizarHistoricoManutencaoModal(veiculoId);
        renderizarAgendamentosFuturos();
    }
}


// ====================================================================
// ============= CONSUMO DOS ENDPOINTS DO ARSENAL DE DADOS ============
// ====================================================================

async function fetchData(endpoint, container, renderer) {
    try {
        const response = await fetch(`${backendUrl}${endpoint}`);
        if (!response.ok) throw new Error(`Falha na rede (status ${response.status}) ao buscar ${endpoint}`);
        const data = await response.json();
        renderer(data, container);
    } catch (error) {
        console.error(`Erro ao carregar dados de ${endpoint}:`, error);
        container.innerHTML = `<p style="color:red; text-align:center;">Não foi possível carregar. Verifique a rota e o servidor.</p>`;
    }
}

function renderDestaques(data, container) {
    container.innerHTML = '';
    data.forEach(v => {
        const card = document.createElement('div');
        card.className = 'veiculo-card';
        card.innerHTML = `<img src="${v.imagemUrl || 'assets/img/placeholder.jpg'}" alt="${v.modelo}" class="veiculo-card-imagem">
                          <div class="veiculo-card-conteudo"><h3>${v.modelo} (${v.ano})</h3><p>${v.destaque}</p></div>`;
        container.appendChild(card);
    });
}

function renderServicos(data, container) {
    container.innerHTML = '';
    data.forEach(s => {
        const item = document.createElement('li');
        item.className = 'servico-item';
        item.innerHTML = `<strong>${s.nome}</strong> ${s.descricao}<br><span>Preço: ${s.precoEstimado}</span>`;
        container.appendChild(item);
    });
}

function renderDicas(data, container) {
    container.innerHTML = '';
    data.forEach(d => {
        const item = document.createElement('div');
        item.className = 'dica-item';
        item.innerHTML = `<i class="fas fa-lightbulb"></i> <p>${d.dica}</p>`;
        container.appendChild(item);
    });
}

// ====================================================================
// ====================== INICIALIZAÇÃO GERAL =========================
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(`Rodando em ambiente ${isLocal ? 'Local' : 'Produção'}. Usando backend em: ${backendUrl}`);
    if (window.flatpickr && flatpickr.l10ns.pt) flatpickr.localize(flatpickr.l10ns.pt);

    mostrarTela('telaSimulador');
    selecionarVeiculoSimulador('Carro');

    carregarGaragem(); 

    // Carrega o "arsenal de dados" do backend
    fetchData('/api/garagem/veiculos-destaque', document.getElementById('veiculos-destaque-container'), renderDestaques);
    fetchData('/api/garagem/servicos-oferecidos', document.getElementById('servicos-oferecidos-lista'), renderServicos);
    fetchData('/api/garagem/dicas-manutencao', document.getElementById('dicas-manutencao-container'), renderDicas);
    
    document.getElementById('formAdicionarVeiculo').addEventListener('submit', async (event) => {
        event.preventDefault();
        const tipo = document.getElementById('tipoVeiculo').value;
        const modelo = document.getElementById('modeloVeiculo').value;
        const cor = document.getElementById('corVeiculo').value;
        const placa = document.getElementById('placaVeiculo').value;
        const capacidadeCarga = document.getElementById('capacidadeCargaVeiculo').value;

        if (!placa || !modelo || !cor || !tipo) {
            exibirNotificacao('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const dadosNovoVeiculo = { placa, modelo, cor, tipoVeiculo: tipo };
        if (tipo === 'Caminhao') {
            dadosNovoVeiculo.capacidadeCarga = parseFloat(capacidadeCarga) || 0;
        }

        try {
            const response = await fetch(`${backendUrl}/api/veiculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosNovoVeiculo)
            });

            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.error || 'Erro desconhecido ao adicionar veículo.');
            }

            exibirNotificacao(`Veículo ${resultado.modelo} [${resultado.placa}] adicionado!`, 'success');
            event.target.reset();
            document.getElementById('campoCapacidadeCarga').style.display = 'none';
            await carregarGaragem();

        } catch (error) {
            console.error('Erro ao adicionar veículo:', error);
            exibirNotificacao(`Não foi possível adicionar: ${error.message}`, 'error');
        }
    });

    document.getElementById('tipoVeiculo').addEventListener('change', function() {
        document.getElementById('campoCapacidadeCarga').style.display = this.value === 'Caminhao' ? 'block' : 'none';
    });
    
    document.getElementById('formManutencao').addEventListener('submit', event => {
        event.preventDefault();
        const veiculoId = document.getElementById('manutencaoVeiculoId').value;
        const veiculo = garagem.find(v => v.id === veiculoId);
        if (veiculo) {
            const novaManutencao = new Manutencao(
                document.getElementById('manutencaoData').value,
                document.getElementById('manutencaoTipo').value,
                document.getElementById('manutencaoCusto').value,
                document.getElementById('manutencaoDescricao').value
            );
            if (veiculo.adicionarManutencao(novaManutencao)) {
                 renderizarHistoricoManutencaoModal(veiculoId);
                 renderizarAgendamentosFuturos();
                 event.target.reset();
            }
        }
    });

    window.onclick = (event) => { 
        if (event.target == modal) fecharModal();
    };
    
    console.log("Garagem Inteligente Unificada INICIALIZADA.");
});

function selecionarVeiculoSimulador(id) {
    console.log("Selecionando veículo com ID:", id);
    // Sua lógica aqui
}

function mostrarTela(telaId) {
    console.log("Mostrando tela:", telaId);
    // Sua lógica aqui
}

// CORRIGIDO: Import correto
import { Veiculo } from './models/veiculo.js';

// Importa as outras classes para instanciar no simulador
import { Carro } from './models/Carro.js';
import { CarroEsportivo } from './models/CarroEsportivo.js';
import { Caminhao } from './models/Caminhao.js';
import { Manutencao } from './models/Manutencao.js';




// ... (todo o seu código de carregarGaragem, renderizarGaragem, etc. continua igual) ...

// ---- INÍCIO DAS FUNÇÕES GLOBAIS ----
// CORRIGIDO: Anexa as funções ao `window` para que o onclick funcione

function mostrarTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    const telaAtiva = document.getElementById(idTela);
    if (telaAtiva) {
        telaAtiva.classList.add('tela-ativa');
    }
}
window.mostrarTela = mostrarTela;

function exibirNotificacao(mensagem, tipo = 'info', duracaoMs = 4000) {
    // ...código da função
}
window.exibirNotificacao = exibirNotificacao;


function selecionarVeiculoSimulador(tipo) {
    switch (tipo) {
        case 'Carro': veiculoSimuladorAtivo = new Carro('Carro Padrão', 'Cinza'); break;
        case 'CarroEsportivo': veiculoSimuladorAtivo = new CarroEsportivo('Mustang GT', 'Vermelho'); break;
        case 'Caminhao': veiculoSimuladorAtivo = new Caminhao('Scania R450', 'Branco', 15000); break;
    }
    document.getElementById('mensagem').style.display = 'none';
    renderizarSimulador(); // Supondo que renderizarSimulador está neste arquivo
}
window.selecionarVeiculoSimulador = selecionarVeiculoSimulador;

// Faça isso para TODAS as funções que são chamadas pelo HTML via onclick.
// Ex: window.acaoSimulador = acaoSimulador;
//     window.abrirModalDetalhes = abrirModalDetalhes;
//     window.removerVeiculo = removerVeiculo;
// etc...

// ---- FIM DAS FUNÇÕES GLOBAIS ----


// ... (o resto do seu código, como o addEventListener de DOMContentLoaded) ...