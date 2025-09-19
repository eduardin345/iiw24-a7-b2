import { Manutencao } from './models/Manutencao.js';
import { Carro } from './models/Carro.js';
import { CarroEsportivo } from './models/CarroEsportivo.js';
import { Caminhao } from './models/Caminhao.js';

// === VARIÁVEIS GLOBAIS ===
let garagem = [];
let veiculoSimuladorAtivo = null;
// CORRIGIDO: URL de produção correta.
const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001' 
    : 'https://iiw24-a7-b2.onrender.com';
const modal = document.getElementById('modalDetalhesVeiculo');


// ========================================================================================
// === PASSO 1: DECLARAR TODAS AS FUNÇÕES QUE SERÃO EXPOSTAS (A CORREÇÃO PRINCIPAL) ===
// ========================================================================================

// Estas funções SÃO AS ÚNICAS que o HTML poderá "ver" e chamar via onclick.
window.mostrarTela = (idTela) => {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    const telaAtiva = document.getElementById(idTela);
    if (telaAtiva) {
        telaAtiva.classList.add('tela-ativa');
    }
};

window.selecionarVeiculoSimulador = (tipo) => {
    switch (tipo) {
        case 'Carro':
            veiculoSimuladorAtivo = new Carro('Ford Ka', 'Prata');
            break;
        case 'CarroEsportivo':
            veiculoSimuladorAtivo = new CarroEsportivo('Corvette', 'Amarelo');
            break;
        case 'Caminhao':
            veiculoSimuladorAtivo = new Caminhao('Volvo FH', 'Azul', 25000);
            break;
    }
    renderizarSimulador();
};

window.acaoSimulador = (acao, param = null) => {
    if (!veiculoSimuladorAtivo) {
        window.exibirNotificacao('Nenhum veículo no simulador.', 'error');
        return;
    }
    try {
        const metodo = veiculoSimuladorAtivo[acao];
        if (typeof metodo === 'function') {
            metodo.call(veiculoSimuladorAtivo, param); // Executa a ação
            window.exibirNotificacao(`Ação '${acao}' executada.`, 'success');
        } else {
            throw new Error(`Ação '${acao}' não encontrada.`);
        }
    } catch (e) {
        window.exibirNotificacao(e.message, 'error');
    }
    renderizarSimulador();
};

window.fecharModal = () => {
    if (modal) {
        modal.style.display = 'none';
    }
};

window.abrirModalDetalhes = (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) {
        window.exibirNotificacao('Veículo não encontrado.', 'error');
        return;
    }
    
    document.getElementById('modalTituloVeiculo').textContent = `${veiculo.modelo} (${veiculo.placa})`;
    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    document.getElementById('manutencaoVeiculoId').value = veiculo.id;
    
    renderizarHistoricoManutencaoModal(veiculo.id);
    flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today" });
    if (modal) {
        modal.style.display = 'flex';
    }
};

window.removerVeiculo = async (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo || !confirm(`Tem certeza que deseja remover o ${veiculo.modelo}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao remover do servidor.');
        window.exibirNotificacao('Veículo removido com sucesso!', 'success');
        await carregarGaragem();
    } catch (error) {
        window.exibirNotificacao(error.message, 'error');
    }
};

// CORRIGIDO: Criei a função que estava faltando no Caminhao.js
window.atualizarInfoVeiculoNoModal = (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const idNoModal = document.getElementById('manutencaoVeiculoId').value;
    if (veiculo && modal.style.display === 'flex' && veiculo.id === idNoModal) {
        document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    }
};

// ==========================================================
// === PASSO 2: FUNÇÕES INTERNAS DA APLICAÇÃO ===
// ==========================================================

window.exibirNotificacao = (mensagem, tipo = 'info', duracaoMs = 4000) => {
    const div = document.getElementById('notificacoes');
    if (!div) return;
    if (div.timeoutId) clearTimeout(div.timeoutId);
    div.textContent = mensagem;
    div.className = '';
    div.classList.add(tipo, 'show');
    div.timeoutId = setTimeout(() => div.classList.remove('show'), duracaoMs);
};

function criarVeiculoDeJSON(json) {
    if (!json || !json.tipoVeiculo) return null;
    let veiculo;
    try {
        const id = json._id || json.id; // Compatível com MongoDB e frontend
        switch (json.tipoVeiculo) {
            case 'Carro': veiculo = new Carro(json.modelo, json.cor, id); break;
            case 'CarroEsportivo': veiculo = new CarroEsportivo(json.modelo, json.cor, json.turbo, id); break;
            case 'Caminhao': veiculo = new Caminhao(json.modelo, json.cor, json.capacidadeCarga, json.cargaAtual, id); break;
            default: return null;
        }
        veiculo.placa = json.placa;
        if(json.historicoManutencao && Array.isArray(json.historicoManutencao)) {
            veiculo.historicoManutencao = json.historicoManutencao.map(m => new Manutencao(m.data, m.tipo, m.custo, m.descricao));
        }
        return veiculo;
    } catch (e) { console.error("Falha ao criar Veículo de JSON", e); return null; }
}

async function carregarGaragem() {
    const container = document.getElementById('listaVeiculos');
    container.innerHTML = '<p>Carregando sua garagem...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`);
        if (!response.ok) throw new Error('Não foi possível conectar ao servidor.');
        const data = await response.json();
        garagem = data.map(criarVeiculoDeJSON).filter(v => v);
        renderizarGaragem();
        renderizarAgendamentosFuturos(); // Chamada após a garagem ser carregada
    } catch (error) {
        container.innerHTML = `<p style="color:red; text-align:center;">${error.message}</p>`;
        console.error("Erro ao carregar garagem:", error);
    }
}

function renderizarGaragem() {
    const container = document.getElementById('listaVeiculos');
    container.innerHTML = garagem.length === 0 ? '<p>Sua garagem está vazia.</p>' : '';
    // Ordena os veículos mais recentes primeiro
    garagem.sort((a, b) => (b.id > a.id) ? 1 : -1);
    garagem.forEach(veiculo => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'vehicle-item';
        itemDiv.innerHTML = `
            <span><strong>${veiculo.modelo}</strong> (${veiculo.placa || 'Sem Placa'})</span>
            <div class="actions">
                <button onclick="abrirModalDetalhes('${veiculo.id}')" class="button button-secondary">Detalhes</button>
                <button onclick="removerVeiculo('${veiculo.id}')" class="button button-danger">Remover</button>
            </div>`;
        container.appendChild(itemDiv);
    });
}

function renderizarSimulador() {
    const container = document.getElementById('simulador-veiculo-container');
    if (!veiculoSimuladorAtivo) {
        container.innerHTML = '<h2>Selecione um veículo para começar o test drive.</h2>';
        return;
    }
    const imagemSrc = `assets/img/car-placeholder.png`;
    container.innerHTML = `
        <img src="${imagemSrc}" alt="Imagem do Veículo" class="sim-vehicle-image">
        <div class="info-box">${veiculoSimuladorAtivo.exibirInformacoesCompletaHTML()}</div>
        <div class="button-group-simulador">
             <button onclick="acaoSimulador('ligar')" class="button"><i class="fas fa-play"></i> Ligar</button>
             <button onclick="acaoSimulador('desligar')" class="button"><i class="fas fa-stop"></i> Desligar</button>
             <button onclick="acaoSimulador('acelerar', 15)" class="button"><i class="fas fa-forward"></i> Acelerar</button>
             <button onclick="acaoSimulador('buzinar')" class="button"><i class="fas fa-volume-up"></i> Buzinar</button>
        </div>
    `;
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    document.getElementById('modalHistoricoManutencao').innerHTML = veiculo ? veiculo.getHistoricoHTML() : '<p>Veículo não encontrado.</p>';
}

// CORRIGIDO: Lógica implementada para buscar e exibir agendamentos.
function renderizarAgendamentosFuturos() {
    const container = document.getElementById('listaAgendamentosFuturos');
    const hoje = new Date();
    const agendamentos = [];

    garagem.forEach(veiculo => {
        veiculo.historicoManutencao.forEach(manutencao => {
            if (manutencao.data > hoje) {
                agendamentos.push({ ...manutencao, veiculo: veiculo });
            }
        });
    });

    agendamentos.sort((a, b) => a.data - b.data); // Ordena por data

    if (agendamentos.length === 0) {
        container.innerHTML = '<p>Nenhum agendamento futuro.</p>';
        return;
    }
    
    container.innerHTML = '<ul>' + agendamentos.map(m => `<li>${m.formatar(true, m.veiculo.modelo)}</li>`).join('') + '</ul>';
}

// CORRIGIDO: Função fetchData e renderizadores do Arsenal de Dados
async function fetchData(endpoint, containerId, renderer) {
    const container = document.getElementById(containerId);
    try {
        const response = await fetch(`${backendUrl}/api/garagem/${endpoint}`);
        if (!response.ok) throw new Error('Falha ao carregar dados do servidor.');
        const data = await response.json();
        renderer(data, container);
    } catch (error) {
        container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

function renderizarDestaques(data, container) {
    container.innerHTML = data.map(veiculo => `
        <div class="veiculo-card">
            <img src="${veiculo.imagemUrl}" alt="${veiculo.modelo}" class="veiculo-card-imagem">
            <div class="veiculo-card-conteudo">
                <h3>${veiculo.modelo} (${veiculo.ano})</h3>
                <p>${veiculo.destaque}</p>
            </div>
        </div>
    `).join('');
}

function renderizarServicos(data, container) {
    container.innerHTML = data.map(servico => `
        <li class="servico-item">
            <strong>${servico.nome}</strong>
            <p>${servico.descricao}</p>
            <span>Preço Estimado: ${servico.precoEstimado}</span>
        </li>
    `).join('');
}

function renderizarDicas(data, container) {
    container.innerHTML = data.map(item => `
        <div class="dica-item">
            <i class="fas fa-lightbulb"></i>
            <p>${item.dica}</p>
        </div>
    `).join('');
}

// ==========================================================
// === PASSO 3: INICIALIZAÇÃO DA APLICAÇÃO (ENTRY POINT) ===
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    // Define o estado inicial da UI
    window.mostrarTela('telaSimulador');
    window.selecionarVeiculoSimulador('Carro');

    // Carrega todos os dados dinâmicos do backend
    carregarGaragem();
    // CORRIGIDO: Chamadas fetchData para o arsenal de dados
    fetchData('veiculos-destaque', 'veiculos-destaque-container', renderizarDestaques);
    fetchData('servicos-oferecidos', 'servicos-oferecidos-lista', renderizarServicos);
    fetchData('dicas-manutencao', 'dicas-manutencao-container', renderizarDicas);


    // Configura os listeners dos formulários
    const formManutencao = document.getElementById('formManutencao');
    if (formManutencao) {
        formManutencao.addEventListener('submit', async (event) => {
            event.preventDefault();
            const veiculoId = document.getElementById('manutencaoVeiculoId').value;
            const dados = {
                data: document.getElementById('manutencaoData').value,
                tipo: document.getElementById('manutencaoTipo').value,
                custo: parseFloat(document.getElementById('manutencaoCusto').value),
                descricao: document.getElementById('manutencaoDescricao').value
            };

            try {
                const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                if(!response.ok) throw new Error('Falha ao salvar manutenção.');
                const veiculoAtualizadoJSON = await response.json();
                
                const index = garagem.findIndex(v => v.id === veiculoId);
                if(index > -1) garagem[index] = criarVeiculoDeJSON(veiculoAtualizadoJSON);
                
                renderizarHistoricoManutencaoModal(veiculoId);
                renderizarAgendamentosFuturos();
                window.exibirNotificacao('Manutenção salva com sucesso!', 'success');
                event.target.reset();

            } catch(e) {
                window.exibirNotificacao(e.message, 'error');
            }
        });
    }

    // CORRIGIDO: Listener para o form de Adicionar Veículo...
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    if(formAdicionarVeiculo) {
        formAdicionarVeiculo.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const novoVeiculo = {
                tipoVeiculo: document.getElementById('tipoVeiculo').value,
                placa: document.getElementById('placaVeiculo').value,
                modelo: document.getElementById('modeloVeiculo').value,
                cor: document.getElementById('corVeiculo').value
            };
            
            if (novoVeiculo.tipoVeiculo === 'Caminhao') {
                novoVeiculo.capacidadeCarga = parseFloat(document.getElementById('capacidadeCargaVeiculo').value) || 0;
            }

            try {
                const response = await fetch(`${backendUrl}/api/veiculos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoVeiculo)
                });
                if(!response.ok) throw new Error('Falha ao adicionar veículo. Verifique os dados.');

                await carregarGaragem(); // Recarrega a garagem para exibir o novo veículo
                window.exibirNotificacao('Veículo adicionado com sucesso!', 'success');
                event.target.reset(); // Limpa o formulário

            } catch(e) {
                window.exibirNotificacao(e.message, 'error');
            }
        });
    }

    // Listener para mostrar/esconder o campo de capacidade de carga
    document.getElementById('tipoVeiculo').addEventListener('change', (e) => {
        const campoCarga = document.getElementById('campoCapacidadeCarga');
        campoCarga.style.display = e.target.value === 'Caminhao' ? 'flex' : 'none';
    });

    // Fecha o modal ao clicar fora dele
    window.onclick = (event) => {
        if (event.target == modal) {
            window.fecharModal();
        }
    };

    console.log("Garagem Inteligente INICIALIZADA.");
});