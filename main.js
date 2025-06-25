// ====================================================================
// =================== NAVEGAÇÃO E LÓGICA DE UI =======================
// ====================================================================
let veiculoSimuladorAtivo = null;

function mostrarTela(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    const telaAtiva = document.getElementById(idTela);
    if (telaAtiva) {
        telaAtiva.classList.add('tela-ativa');
    }
}

function exibirNotificacao(mensagem, tipo = 'info', duracaoMs = 4000) {
    const notificacaoDiv = document.getElementById('notificacoes');
    if (!notificacaoDiv) return;

    if (notificacaoDiv.timeoutId) clearTimeout(notificacaoDiv.timeoutId);
    
    notificacaoDiv.textContent = mensagem;
    notificacaoDiv.className = ``;
    notificacaoDiv.classList.add(tipo, 'show');

    notificacaoDiv.timeoutId = setTimeout(() => {
         notificacaoDiv.classList.remove('show');
         notificacaoDiv.timeoutId = null;
    }, duracaoMs);
}

function exibirMensagemSimulador(mensagem, tipo = 'info') {
    const mensagemDiv = document.getElementById('mensagem');
    if(mensagemDiv) {
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
        Carro: 'images.jpg',
        CarroEsportivo: 'png-transparent-ford-gt-shelby-mustang-california-special-mustang-2018-ford-mustang-gt-premium-ford-car-performance-car-vehicle.png',
        Caminhao: 'images (1).jpg',
    };
    const imagemSrc = `img/${imagens[veiculoSimuladorAtivo.tipoVeiculo] || 'placeholder.jpg'}`;
    
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
    if (veiculoSimuladorAtivo instanceof CarroEsportivo) {
        html += veiculoSimuladorAtivo.turbo ? `<button onclick="acaoSimulador('desativarTurbo')" class="button" style="background-color: #95a5a6;"><i class="fas fa-snowflake"></i> Turbo OFF</button>`
                                           : `<button onclick="acaoSimulador('ativarTurbo')" class="button button-warning"><i class="fas fa-fire"></i> Turbo ON</button>`;
    }
    html += `</div>`;
    if (veiculoSimuladorAtivo instanceof Caminhao) {
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

function acaoSimulador(acao, param = null) {
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

function selecionarVeiculoSimulador(tipo) {
    switch (tipo) {
        case 'Carro': veiculoSimuladorAtivo = new Carro('Carro Padrão', 'Cinza'); break;
        case 'CarroEsportivo': veiculoSimuladorAtivo = new CarroEsportivo('Mustang GT', 'Vermelho'); break;
        case 'Caminhao': veiculoSimuladorAtivo = new Caminhao('Scania R450', 'Branco', 15000); break;
    }
    document.getElementById('mensagem').style.display = 'none';
    renderizarSimulador();
}

// ====================================================================
// ============== GERENCIAMENTO AVANÇADO DA GARAGEM ===================
// ====================================================================
let garagem = [];
const STORAGE_KEY = 'minhaGaragemInteligente_v3';

function salvarGaragem() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garagem.map(v => v.toJSON())));
}

function carregarGaragem() {
    const garagemJSON = localStorage.getItem(STORAGE_KEY);
    if (garagemJSON) {
        garagem = JSON.parse(garagemJSON)
                      .map(vJson => Veiculo.fromJSON(vJson))
                      .filter(v => v !== null);
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
            <span><strong>${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
            <div class="actions">
                <button onclick="abrirModalDetalhes('${veiculo.id}')">Detalhes / Manutenção</button>
                <button class="button-danger" onclick="removerVeiculo('${veiculo.id}')">Remover</button>
            </div>`;
        listaVeiculosDiv.appendChild(itemDiv);
    });
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if(veiculo) document.getElementById('modalHistoricoManutencao').innerHTML = veiculo.getHistoricoHTML();
}

function renderizarAgendamentosFuturos() {
    const listaAgendamentosDiv = document.getElementById('listaAgendamentosFuturos');
    const agora = new Date();
    const agendamentos = garagem
        .flatMap(veiculo => veiculo.historicoManutencao.map(manutencao => ({ veiculo, manutencao })))
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

const modal = document.getElementById('modalDetalhesVeiculo');
function abrirModalDetalhes(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;
    document.getElementById('modalTituloVeiculo').textContent = `Detalhes: ${veiculo.modelo}`;
    document.getElementById('manutencaoVeiculoId').value = veiculoId;
    atualizarInfoVeiculoNoModal(veiculoId);
    renderizarHistoricoManutencaoModal(veiculoId);
    flatpickr("#manutencaoData", { enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today", locale: "pt" });
    modal.style.display = 'block';
}

function fecharModal() { modal.style.display = 'none'; }

function atualizarInfoVeiculoNoModal(veiculoId) {
    if (modal.style.display !== 'block' || document.getElementById('manutencaoVeiculoId').value !== veiculoId) return;
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    const acoesDiv = document.getElementById('modalAcoesVeiculo');
    acoesDiv.innerHTML = `
        <button onclick="executarAcaoVeiculo('${veiculo.id}', '${veiculo.ligado ? 'desligar' : 'ligar'}')"><i class="fas fa-key"></i> ${veiculo.ligado ? 'Desligar' : 'Ligar'}</button>
        ${veiculo.ligado ? `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'acelerar', 10)"><i class="fas fa-tachometer-alt"></i> Acelerar</button>` : ''}
        <button onclick="executarAcaoVeiculo('${veiculo.id}', 'buzinar')"><i class="fas fa-bullhorn"></i> Buzinar</button>`;
    
    if (veiculo instanceof CarroEsportivo) {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', '${veiculo.turbo ? 'desativarTurbo' : 'ativarTurbo'}')"><i class="fas fa-rocket"></i> ${veiculo.turbo ? 'Desativar Turbo' : 'Ativar Turbo'}</button>`;
    } else if (veiculo instanceof Caminhao) {
        acoesDiv.innerHTML += `
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <input type="number" id="pesoCargaModal_${veiculo.id}" placeholder="Peso (kg)" style="width: 120px;">
                <button onclick="executarAcaoVeiculo('${veiculo.id}', 'carregar')"><i class="fas fa-plus"></i> Carregar</button>
                <button onclick="executarAcaoVeiculo('${veiculo.id}', 'descarregar')"><i class="fas fa-minus"></i> Descarregar</button>
            </div>`;
    }
}

function executarAcaoVeiculo(veiculoId, acao, param = null) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;
    if (acao === 'carregar' || acao === 'descarregar') {
        param = document.getElementById(`pesoCargaModal_${veiculoId}`)?.value;
    }
    if (typeof veiculo[acao] === 'function') veiculo[acao](param);
}

function removerVeiculo(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (veiculo && confirm(`Tem certeza que deseja remover o veículo ${veiculo.modelo}?`)) {
        garagem = garagem.filter(v => v.id !== veiculoId);
        salvarGaragem();
        renderizarGaragem();
        exibirNotificacao(`${veiculo.modelo} removido.`, 'success');
        fecharModal();
    }
}

function removerManutencao(veiculoId, manutencaoId) {
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

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const backendUrl = isLocal ? 'http://localhost:3001' : 'https://iiw24-a7-b2.onrender.com';

async function fetchData(endpoint, container, renderer) {
    try {
        const response = await fetch(`${backendUrl}${endpoint}`);
        if (!response.ok) throw new Error(`Falha na rede (status ${response.status}) ao buscar ${endpoint}`);
        const data = await response.json();
        renderer(data, container);
    } catch (error) {
        console.error(`Erro ao carregar dados de ${endpoint}:`, error);
        container.innerHTML = `<p style="color:red; text-align:center;">Não foi possível carregar os dados. Verifique a rota e se o servidor backend está rodando.</p>`;
    }
}

function renderDestaques(data, container) {
    container.innerHTML = '';
    data.forEach(v => {
        const card = document.createElement('div');
        card.className = 'veiculo-card';
        card.innerHTML = `<img src="${v.imagemUrl || 'img/placeholder.jpg'}" alt="${v.modelo}" class="veiculo-card-imagem">
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
    
    // ================================================
    // AQUI ESTÁ A CORREÇÃO (TENTATIVA 2)
    // Chamadas sem o prefixo `/api`
    // Esta é a nossa próxima hipótese mais provável para o erro 404
    // ================================================
    fetchData('/veiculos-destaque', document.getElementById('veiculos-destaque-container'), renderDestaques);
    fetchData('/servicos-oferecidos', document.getElementById('servicos-oferecidos-lista'), renderServicos);
    fetchData('/dicas-manutencao', document.getElementById('dicas-manutencao-container'), renderDicas);
    
    document.getElementById('formAdicionarVeiculo').addEventListener('submit', event => {
        event.preventDefault();
        const tipo = document.getElementById('tipoVeiculo').value;
        const modelo = document.getElementById('modeloVeiculo').value;
        const cor = document.getElementById('corVeiculo').value;
        let novoVeiculo;
        switch (tipo) {
            case 'Caminhao': novoVeiculo = new Caminhao(modelo, cor, document.getElementById('capacidadeCargaVeiculo').value); break;
            case 'CarroEsportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
            default: novoVeiculo = new Carro(modelo, cor);
        }
        garagem.push(novoVeiculo);
        salvarGaragem();
        renderizarGaragem();
        exibirNotificacao(`${modelo} adicionado à garagem!`, 'success');
        event.target.reset();
        document.getElementById('campoCapacidadeCarga').style.display = 'none';
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

    window.onclick = (event) => { if (event.target == modal) fecharModal(); };
    console.log("Garagem Inteligente Unificada INICIALIZADA.");
});