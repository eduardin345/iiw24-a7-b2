// Local: public/js/main.js

// Importa as classes do frontend, que são necessárias para criar os objetos.
import { Manutencao } from './models/Manutencao.js';
import { Carro } from './models/Carro.js';
import { CarroEsportivo } from './models/CarroEsportivo.js';
import { Caminhao } from './models/Caminhao.js';

// === VARIÁVEIS GLOBAIS ===
let garagem = [];
let veiculoSimuladorAtivo = null;
const modal = document.getElementById('modalDetalhesVeiculo');
// A variável `backendUrl` não é mais necessária, pois o backend está servindo o frontend.

// === FUNÇÕES HELPERS ===

// Pega o token de autenticação salvo no navegador.
const getToken = () => localStorage.getItem('jwt_token');

// Monta o cabeçalho padrão para requisições autenticadas.
const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};


// ==========================================================
// === FUNÇÕES GLOBAIS (Expostas para uso no onclick do HTML) ===
// ==========================================================

// Controla qual "tela" (div) está visível na aplicação.
window.mostrarTela = (idTela) => {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    document.getElementById(idTela)?.classList.add('tela-ativa');
};

// Alterna entre os formulários de Login e Registro.
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

// Função de Logout do usuário.
window.logout = () => {
    localStorage.removeItem('jwt_token');
    window.exibirNotificacao('Você saiu da sua conta.', 'info');
    garagem = [];
    renderizarGaragem(); // Limpa a lista de veículos da tela
    mostrarTela('telaLogin');
};

// Abre o modal de detalhes de um veículo.
window.abrirModalDetalhes = (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return window.exibirNotificacao('Veículo não encontrado.', 'error');
    
    document.getElementById('modalTituloVeiculo').textContent = `${veiculo.modelo} (${veiculo.placa})`;
    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    document.getElementById('manutencaoVeiculoId').value = veiculo.id;
    
    // Busca e renderiza o histórico de manutenções da API
    carregarManutencoesDoVeiculo(veiculo.id);

    // Inicializa o seletor de data
    flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today" });
    if (modal) modal.style.display = 'flex';
};

// Fecha qualquer modal que esteja aberto.
window.fecharModal = () => { if (modal) modal.style.display = 'none'; };

// Envia uma requisição para remover um veículo.
window.removerVeiculo = async (veiculoId) => {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo || !confirm(`Tem certeza que deseja remover o veículo ${veiculo.modelo}?`)) return;

    try {
        const response = await fetch(`/api/veiculos/${veiculoId}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error((await response.json()).error || 'Falha ao remover o veículo.');
        
        window.exibirNotificacao('Veículo removido com sucesso!', 'success');
        await carregarGaragem(); // Atualiza a lista de veículos da garagem
    } catch (error) {
        window.exibirNotificacao(error.message, 'error');
    }
};


// ==========================================================
// ================ FUNÇÕES DO SIMULADOR ====================
// ==========================================================

window.selecionarVeiculoSimulador = (tipo) => {
    switch (tipo) {
        case 'Carro': veiculoSimuladorAtivo = new Carro('Mustang GT', 'Vermelho', null, 'Carro', 'assets/img/mustang-sim.png'); break;
        case 'CarroEsportivo': veiculoSimuladorAtivo = new CarroEsportivo('Porsche 911 GT3', 'Branco', false, null, 'CarroEsportivo', 'assets/img/porsche.jpg'); break;
        case 'Caminhao': veiculoSimuladorAtivo = new Caminhao('Optimus Prime', 'Vermelho e Azul', 25000, null, 'Caminhao', 'assets/img/optimus-prime-caminhao.webp'); break;
    }
    renderizarSimulador();
};

window.acaoSimulador = (acao, param = null) => {
    if (!veiculoSimuladorAtivo) return window.exibirNotificacao('Nenhum veículo selecionado no simulador.', 'error');
    
    try {
        let mensagem = `Ação '${acao}' executada.`;
        // Certifica-se que o método existe antes de chamar
        if (typeof veiculoSimuladorAtivo[acao] === 'function') {
            const retornoMetodo = veiculoSimuladorAtivo[acao](param);
            if (retornoMetodo) mensagem = retornoMetodo; // Usa a mensagem de retorno da classe, se houver
        } else {
            throw new Error(`Ação '${acao}' é desconhecida.`);
        }
        window.exibirNotificacao(mensagem, 'info');
    } catch (e) {
        window.exibirNotificacao(e.message, 'error'); // Exibe a mensagem de erro vinda da classe (throw new Error)
    }
    renderizarSimulador(); // Re-renderiza para mostrar o novo estado (ligado, velocidade, etc.)
};

function renderizarSimulador() {
    const container = document.getElementById('simulador-veiculo-container');
    if (!veiculoSimuladorAtivo) {
        container.innerHTML = "<p>Selecione um tipo de veículo para começar.</p>";
        return;
    }
    
    const imagemSrc = veiculoSimuladorAtivo.imagemUrl; 
    container.innerHTML = `
       
        <div class="info-box">${veiculoSimuladorAtivo.exibirInformacoesCompletaHTML()}</div>
        <div class="button-group-simulador">
             <button onclick="acaoSimulador('ligar')" class="button"><i class="fas fa-play"></i> Ligar</button>
             <button onclick="acaoSimulador('desligar')" class="button"><i class="fas fa-stop"></i> Desligar</button>
             <button onclick="acaoSimulador('acelerar', 15)" class="button"><i class="fas fa-forward"></i> Acelerar</button>
             <button onclick="acaoSimulador('buzinar')" class="button"><i class="fas fa-volume-up"></i> Buzinar</button>
        </div>
    `;
}

// ==========================================================
// ======== FUNÇÕES DE LÓGICA INTERNA E RENDERIZAÇÃO ========
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

// Transforma os dados brutos da API em objetos de classe do frontend.
function criarVeiculoDeJSON(json) {
    if (!json || !json.tipoVeiculo) return null;
    let veiculo;
    const id = json._id || json.id;
    try {
        switch (json.tipoVeiculo) {
            case 'Carro': veiculo = new Carro(json.modelo, json.cor, id); break;
            case 'CarroEsportivo': veiculo = new CarroEsportivo(json.modelo, json.cor, id, 'CarroEsportivo', null, json.turbo); break;
            case 'Caminhao': veiculo = new Caminhao(json.modelo, json.cor, json.capacidadeCarga, id, 'Caminhao', null, json.cargaAtual); break;
            default: return null;
        }
        veiculo.placa = json.placa;
        return veiculo;
    } catch (e) { console.error("Falha ao criar instância de veículo a partir do JSON", e); return null; }
}

async function carregarGaragem() {
    const container = document.getElementById('listaVeiculos');
    if (!getToken()) {
        container.innerHTML = '<p>Você precisa fazer login para ver sua garagem.</p>';
        return;
    }
    container.innerHTML = '<p>Carregando sua garagem...</p>';
    try {
        const response = await fetch('/api/veiculos', { method: 'GET', headers: getAuthHeaders() });
        if (response.status === 401) {
            logout();
            throw new Error('Sua sessão expirou. Por favor, faça o login novamente.');
        }
        if (!response.ok) throw new Error((await response.json()).error || 'Não foi possível carregar a garagem.');
        const data = await response.json();
        garagem = data.map(criarVeiculoDeJSON).filter(v => v);
        renderizarGaragem();
        
        // Agora, populamos os agendamentos futuros após carregar a garagem
        // carregarAgendamentosGlobais();
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


async function carregarManutencoesDoVeiculo(veiculoId) {
    const container = document.getElementById('modalHistoricoManutencao');
    container.innerHTML = '<p>Carregando histórico...</p>';
    try {
        const response = await fetch(`/api/veiculos/${veiculoId}/manutencoes`, { method: 'GET', headers: getAuthHeaders() });
        if (!response.ok) throw new Error("Não foi possível carregar o histórico.");
        
        const manutencoesJSON = (await response.json()).historicoManutencao;
        const veiculo = garagem.find(v => v.id === veiculoId);
        if (veiculo) {
            veiculo.historicoManutencao = manutencoesJSON.map(m => new Manutencao(m.data, m.descricaoServico, m.custo, ''));
            container.innerHTML = veiculo.getHistoricoHTML();
        }
    } catch (error) {
        container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}

async function fetchData(endpoint, containerId, renderer) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<p>Carregando...</p>`;
    try {
        const response = await fetch(`/api/garagem/${endpoint}`);
        if (!response.ok) throw new Error('Falha ao carregar.');
        const data = await response.json();
        renderer(data, container);
    } catch (error) {
        container.innerHTML = `<p style="color:red; text-align: center;">${error.message}</p>`;
    }
}

function renderizarDestaques(data, container) {
    container.innerHTML = data.map(v => `<div class="veiculo-card"><img src="${v.imagemUrl}" alt="${v.modelo}" class="veiculo-card-imagem" onerror="this.src='assets/img/placeholder.webp';"><div class="veiculo-card-conteudo"><h3>${v.modelo} (${v.ano})</h3><p>${v.destaque}</p></div></div>`).join('');
}
function renderizarServicos(data, container) {
    container.innerHTML = data.map(s => `<li class="servico-item"><strong>${s.nome}</strong><p>${s.descricao}</p><span>Preço: ${s.precoEstimado}</span></li>`).join('');
}
function renderizarDicas(data, container) {
    container.innerHTML = data.map(d => `<div class="dica-item"><i class="fas fa-lightbulb"></i><p>${d.dica}</p></div>`).join('');
}


// ==========================================================
// === PONTO DE ENTRADA DA APLICAÇÃO (INICIALIZAÇÃO) ===
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Verifica se há um token ao carregar a página para decidir qual tela mostrar.
    if (getToken()) {
        mostrarTela('telaGerenciamento');
        carregarGaragem();
    } else {
        mostrarTela('telaEntrada');
    }

    // Inicializa o simulador com o primeiro veículo.
    selecionarVeiculoSimulador('Carro');

    // Busca os dados públicos do "Arsenal".
    fetchData('veiculos-destaque', 'veiculos-destaque-container', renderizarDestaques);
    fetchData('servicos-oferecidos', 'servicos-oferecidos-lista', renderizarServicos);
    fetchData('dicas-manutencao', 'dicas-manutencao-container', renderizarDicas);
    
    // --- LÓGICA DE EVENT LISTENERS DOS FORMULÁRIOS ---
    
    document.getElementById('formRegister').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        try {
            const response = await fetch(`/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
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
            const response = await fetch(`/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
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
            descricaoServico: document.getElementById('manutencaoTipo').value, // ID 'manutencaoTipo' parece errado, o label é 'Serviço'
            custo: parseFloat(document.getElementById('manutencaoCusto').value),
            data: document.getElementById('manutencaoData').value
        };
        try {
            const response = await fetch(`/api/veiculos/${veiculoId}/manutencoes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(dados) });
            if (!response.ok) throw new Error((await response.json()).error || 'Falha ao salvar manutenção.');
            
            await carregarManutencoesDoVeiculo(veiculoId);
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
            cor: document.getElementById('corVeiculo').value,
        };
        if (novoVeiculo.tipoVeiculo === 'Caminhao') {
            novoVeiculo.capacidadeCarga = parseFloat(document.getElementById('capacidadeCargaVeiculo').value) || 0;
        }
        try {
            const response = await fetch(`/api/veiculos`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(novoVeiculo) });
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