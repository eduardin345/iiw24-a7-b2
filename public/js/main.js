// Local: public/js/main.js (VERSÃO 100% COMPLETA)

import { Manutencao } from './models/Manutencao.js';
import { Carro } from './models/Carro.js';
import { CarroEsportivo } from './models/CarroEsportivo.js';
import { Caminhao } from './models/Caminhao.js';

// === VARIÁVEIS GLOBAIS ===
let garagem = [];
let veiculoSimuladorAtivo = null;
const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3001' 
    : 'https://iiw24-a7-b2.onrender.com';
const modal = document.getElementById('modalDetalhesVeiculo');

// Helper para obter o token salvo no navegador.
const getToken = () => localStorage.getItem('jwt_token');

// Helper para criar os cabeçalhos de autenticação para as requisições.
const getAuthHeaders = () => {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};


// ==========================================================
// === FUNÇÕES GLOBAIS EXPOSTAS (onclick) ===
// ==========================================================

window.mostrarTela = (idTela) => {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    document.getElementById(idTela)?.classList.add('tela-ativa');
};

window.mostrarForm = (formId) => {
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');

    if (formId === 'login') {
        formLogin.classList.remove('form-hidden');
        formRegister.classList.add('form-hidden');
        tabLoginBtn.classList.add('active');
        tabRegisterBtn.classList.remove('active');
    } else {
        formLogin.classList.add('form-hidden');
        formRegister.classList.remove('form-hidden');
        tabLoginBtn.classList.remove('active');
        tabRegisterBtn.classList.add('active');
    }
};

window.logout = () => {
    localStorage.removeItem('jwt_token');
    window.exibirNotificacao('Você saiu da sua conta.', 'info');
    garagem = [];
    renderizarGaragem();
    document.getElementById('listaAgendamentosFuturos').innerHTML = '<p>Nenhum agendamento futuro.</p>';
    mostrarTela('telaLogin');
};


window.selecionarVeiculoSimulador = (tipo) => {
    switch (tipo) {
        case 'Carro': veiculoSimuladorAtivo = new Carro('Mustang GT', 'Vermelho', null, 'Carro', 'assets/img/sim-carro.png'); break;
        case 'CarroEsportivo': veiculoSimuladorAtivo = new CarroEsportivo('Porsche 911 GT3', 'Branco', null, 'CarroEsportivo', 'assets/img/sim-carro-esportivo.png'); break;
        case 'Caminhao': veiculoSimuladorAtivo = new Caminhao('Optimus Prime', 'Vermelho e Azul', 25000, null, 'Caminhao', 'assets/img/sim-caminhao.png'); break;
    }
    renderizarSimulador();
};

window.acaoSimulador = (acao, param = null) => {
    if (!veiculoSimuladorAtivo) return window.exibirNotificacao('Nenhum veículo no simulador.', 'error');
    try {
        const metodo = veiculoSimuladorAtivo[acao];
        if (typeof metodo === 'function') {
            metodo.call(veiculoSimuladorAtivo, param);
            window.exibirNotificacao(`Ação '${acao}' executada.`, 'success');
        } else throw new Error(`Ação '${acao}' não encontrada.`);
    } catch (e) {
        window.exibirNotificacao(e.message, 'error');
    }
    renderizarSimulador();
};

window.fecharModal = () => { if (modal) modal.style.display = 'none'; };

window.abrirModalDetalhes = (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return window.exibirNotificacao('Veículo não encontrado.', 'error');
    document.getElementById('modalTituloVeiculo').textContent = `${veiculo.modelo} (${veiculo.placa})`;
    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    document.getElementById('manutencaoVeiculoId').value = veiculo.id;
    renderizarHistoricoManutencaoModal(veiculo.id);
    flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today" });
    if (modal) modal.style.display = 'flex';
};

window.removerVeiculo = async (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo || !confirm(`Tem certeza de que deseja remover o ${veiculo.modelo}?`)) return;
    try {
        const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error((await response.json()).error || 'Falha ao remover do servidor.');
        window.exibirNotificacao('Veículo removido com sucesso!', 'success');
        await carregarGaragem();
    } catch (error) {
        window.exibirNotificacao(error.message, 'error');
    }
};

window.atualizarInfoVeiculoNoModal = (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const idNoModal = document.getElementById('manutencaoVeiculoId').value;
    if (veiculo && modal.style.display === 'flex' && veiculo.id === idNoModal) {
        document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    }
};

// ==========================================================
// === FUNÇÕES INTERNAS DA APLICAÇÃO ===
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
        const id = json._id || json.id;
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
    if (!getToken()) {
        container.innerHTML = '<p>Você precisa fazer login para ver sua garagem.</p>';
        return;
    }
    container.innerHTML = '<p>Carregando sua garagem...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/veiculos`, { method: 'GET', headers: getAuthHeaders() });
        if (response.status === 401) {
            logout();
            throw new Error('Sessão expirada. Faça o login novamente.');
        }
        if (!response.ok) throw new Error((await response.json()).error || 'Não foi possível carregar a garagem.');
        const data = await response.json();
        garagem = data.map(criarVeiculoDeJSON).filter(v => v);
        renderizarGaragem();
        renderizarAgendamentosFuturos();
    } catch (error) {
        container.innerHTML = `<p style="color:red; text-align:center;">${error.message}</p>`;
    }
}

function renderizarGaragem() {
    const container = document.getElementById('listaVeiculos');
    container.innerHTML = garagem.length === 0 ? '<p>Sua garagem está vazia. Adicione um veículo!</p>' : '';
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
        container.innerHTML = "<p>Selecione um tipo de veículo abaixo para começar.</p>";
        return;
    }
    
    // AGORA ESTA LINHA FUNCIONA, pois veiculoSimuladorAtivo.imagemUrl existe.
    const imagemSrc = veiculoSimuladorAtivo.imagemUrl; 

    // O código aqui vai gerar a URL correta e não mais "/public/undefined"
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

function renderizarAgendamentosFuturos() {
    const container = document.getElementById('listaAgendamentosFuturos');
    const hoje = new Date();
    const agendamentos = [];
    garagem.forEach(veiculo => {
        veiculo.historicoManutencao.forEach(manutencao => {
            if (new Date(manutencao.data) > hoje) {
                agendamentos.push({ ...manutencao, veiculo: veiculo });
            }
        });
    });
    agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data));
    if (agendamentos.length === 0) {
        container.innerHTML = '<p>Nenhum agendamento futuro.</p>';
        return;
    }
    container.innerHTML = '<ul>' + agendamentos.map(m => `<li>${m.formatar(true, m.veiculo.modelo)}</li>`).join('') + '</ul>';
}

async function fetchData(endpoint, containerId, renderer) {
    const container = document.getElementById(containerId);
    try {
        const response = await fetch(`${backendUrl}/api/garagem/${endpoint}`);
        if (!response.ok) throw new Error('Falha ao carregar dados.');
        const data = await response.json();
        renderer(data, container);
    } catch (error) {
        container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

function renderizarDestaques(data, container) { container.innerHTML = data.map(v => `<div class="veiculo-card"><img src="${v.imagemUrl}" alt="${v.modelo}" class="veiculo-card-imagem"><div class="veiculo-card-conteudo"><h3>${v.modelo} (${v.ano})</h3><p>${v.destaque}</p></div></div>`).join(''); }
function renderizarServicos(data, container) { container.innerHTML = data.map(s => `<li class="servico-item"><strong>${s.nome}</strong><p>${s.descricao}</p><span>Preço Estimado: ${s.precoEstimado}</span></li>`).join(''); }
function renderizarDicas(data, container) { container.innerHTML = data.map(d => `<div class="dica-item"><i class="fas fa-lightbulb"></i><p>${d.dica}</p></div>`).join(''); }

// ==========================================================
// === INICIALIZAÇÃO DA APLICAÇÃO (ENTRY POINT) ===
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    if (getToken()) {
        mostrarTela('telaGerenciamento');
        carregarGaragem();
    } else {
        mostrarTela('telaEntrada');
    }

    selecionarVeiculoSimulador('Carro');
    fetchData('veiculos-destaque', 'veiculos-destaque-container', renderizarDestaques);
    fetchData('servicos-oferecidos', 'servicos-oferecidos-lista', renderizarServicos);
    fetchData('dicas-manutencao', 'dicas-manutencao-container', renderizarDicas);
    
    // --- LÓGICA DE EVENTOS ---
    
    document.getElementById('formRegister').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        try {
            const response = await fetch(`${backendUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha ao registrar.');
            window.exibirNotificacao('Usuário registrado com sucesso! Faça o login.', 'success');
            mostrarForm('login');
            e.target.reset();
        } catch (error) { window.exibirNotificacao(error.message, 'error'); }
    });

    document.getElementById('formLogin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Falha no login.');
            localStorage.setItem('jwt_token', data.token);
            window.exibirNotificacao('Login realizado com sucesso!', 'success');
            e.target.reset();
            mostrarTela('telaGerenciamento');
            await carregarGaragem();
        } catch (error) { window.exibirNotificacao(error.message, 'error'); }
    });

    document.getElementById('formManutencao').addEventListener('submit', async (event) => {
        event.preventDefault();
        const veiculoId = document.getElementById('manutencaoVeiculoId').value;
        const dados = {
            data: document.getElementById('manutencaoData').value,
            tipo: document.getElementById('manutencaoTipo').value,
            custo: parseFloat(document.getElementById('manutencaoCusto').value),
            descricao: document.getElementById('manutencaoDescricao').value
        };
        try {
            const response = await fetch(`${backendUrl}/api/veiculos/${veiculoId}/manutencoes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(dados) });
            if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar manutenção.');
            const veiculoAtualizadoJSON = await response.json();
            const index = garagem.findIndex(v => v.id === veiculoId);
            if (index > -1) garagem[index] = criarVeiculoDeJSON(veiculoAtualizadoJSON);
            renderizarHistoricoManutencaoModal(veiculoId);
            renderizarAgendamentosFuturos();
            window.exibirNotificacao('Manutenção salva com sucesso!', 'success');
            event.target.reset();
        } catch (e) { window.exibirNotificacao(e.message, 'error'); }
    });

    document.getElementById('formAdicionarVeiculo').addEventListener('submit', async (event) => {
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
            const response = await fetch(`${backendUrl}/api/veiculos`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novoVeiculo) });
            if (!response.ok) throw new Error((await response.json()).error || 'Falha ao adicionar veículo.');
            await carregarGaragem();
            window.exibirNotificacao('Veículo adicionado com sucesso!', 'success');
            event.target.reset();
        } catch (e) { window.exibirNotificacao(e.message, 'error'); }
    });

    document.getElementById('tipoVeiculo').addEventListener('change', (e) => {
        document.getElementById('campoCapacidadeCarga').style.display = e.target.value === 'Caminhao' ? 'flex' : 'none';
    });

    window.onclick = (event) => { if (event.target == modal) fecharModal(); };

    console.log("Garagem Inteligente INICIALIZADA.");
});