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

// Para notificações flutuantes
function exibirNotificacao(mensagem, tipo = 'info', duracaoMs = 4000) {
    const notificacaoDiv = document.getElementById('notificacoes');
    if (!notificacaoDiv) return;

    notificacaoDiv.textContent = mensagem;
    notificacaoDiv.className = ``;
    notificacaoDiv.classList.add(tipo, 'show');

    setTimeout(() => notificacaoDiv.classList.remove('show'), duracaoMs);
}

// Para mensagens fixas na tela do simulador
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

    let html = `
        <h2>${veiculoSimuladorAtivo.modelo}</h2>
        <img src="img/${veiculoSimuladorAtivo.imagem}" alt="Imagem de um ${veiculoSimuladorAtivo.tipoVeiculo}" class="vehicle-image">
        <div class="info-box">${veiculoSimuladorAtivo.exibirInformacoesCompletaHTML()}</div>
        <div class="button-group">
            <button onclick="acaoSimulador('ligar')" class="button button-success"><i class="fas fa-play"></i> Ligar</button>
            <button onclick="acaoSimulador('desligar')" class="button button-danger"><i class="fas fa-stop"></i> Desligar</button>
            <button onclick="acaoSimulador('acelerar')" class="button button-primary"><i class="fas fa-forward"></i> Acelerar</button>
            <button onclick="acaoSimulador('buzinar')" class="button button-primary"><i class="fas fa-volume-up"></i> Buzinar</button>
    `;
    
    // Ações específicas
    if (veiculoSimuladorAtivo instanceof CarroEsportivo) {
        html += `<button onclick="acaoSimulador('ativarTurbo')" class="button button-warning"><i class="fas fa-fire"></i> Turbo</button>`;
    }

    html += `</div>`; // Fecha button-group

    if (veiculoSimuladorAtivo instanceof Caminhao) {
        html += `
            <div class="cargo-section">
                <label for="pesoCargaSimulador">Peso da Carga (kg):</label>
                <input type="number" id="pesoCargaSimulador" placeholder="0">
                <button onclick="acaoSimulador('carregar')" class="button button-warning"><i class="fas fa-truck-loading"></i> Carregar</button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function acaoSimulador(acao) {
    if (!veiculoSimuladorAtivo) return;

    // Redefine a função global para que as classes possam usá-la
    window.exibirNotificacao = exibirMensagemSimulador; 

    try {
        if (acao === 'carregar') {
            const pesoInput = document.getElementById('pesoCargaSimulador');
            if (pesoInput && pesoInput.value) {
                veiculoSimuladorAtivo.carregar(pesoInput.value);
            }
        } else {
             veiculoSimuladorAtivo[acao](); // Chama a ação na instância
        }
    } catch(e) {
        console.error("Erro na ação do simulador:", e);
        exibirMensagemSimulador("Ação não pôde ser executada.", 'error');
    }

    // Após a ação, renderiza novamente o estado do simulador
    renderizarSimulador();
}

function selecionarVeiculoSimulador(tipo) {
    const tempExibirNotificacao = window.exibirNotificacao; // Salva a função global
    window.exibirNotificacao = exibirMensagemSimulador; // Redefine para a do simulador

    switch (tipo) {
        case 'Carro':
            veiculoSimuladorAtivo = new Carro('Carro Padrão', 'Cinza');
            veiculoSimuladorAtivo.imagem = "images.jpg"; // Você precisará ter as imagens na pasta img/
            break;
        case 'CarroEsportivo':
            veiculoSimuladorAtivo = new CarroEsportivo('Mustang', 'Vermelho');
            veiculoSimuladorAtivo.imagem = "png-transparent-ford-gt-shelby-mustang-california-special-mustang-2018-ford-mustang-gt-premium-ford-car-performance-car-vehicle.png";
            break;
        case 'Caminhao':
            veiculoSimuladorAtivo = new Caminhao('Caminhão Scania', 'Branco', 15000);
             veiculoSimuladorAtivo.imagem = "images (1).jpg";
            break;
    }
    document.getElementById('mensagem').style.display = 'none'; // Esconde msg anterior
    renderizarSimulador();
    window.exibirNotificacao = tempExibirNotificacao; // Restaura a função global
}


// ====================================================================
// ============== GERENCIAMENTO AVANÇADO DA GARAGEM ===================
// ====================================================================
let garagem = [];
const STORAGE_KEY = 'minhaGaragemInteligente_v3'; // Versão nova

function salvarGaragem() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garagem.map(v => v.toJSON())));
}

function carregarGaragem() {
    window.exibirNotificacao = exibirNotificacao; // Garante que a notificação correta seja usada
    const garagemJSON = localStorage.getItem(STORAGE_KEY);
    if (garagemJSON) {
        garagem = JSON.parse(garagemJSON)
                      .map(vJson => Veiculo.fromJSON(vJson))
                      .filter(v => v !== null);
    }
    renderizarGaragem();
    renderizarAgendamentosFuturos();
    verificarAgendamentosProximos();
}

function renderizarGaragem() {
    const listaVeiculosDiv = document.getElementById('listaVeiculos');
    listaVeiculosDiv.innerHTML = '';
    if (garagem.length === 0) {
        listaVeiculosDiv.innerHTML = '<p style="text-align: center; color: #777;">Sua garagem está vazia.</p>';
        return;
    }
    garagem.forEach(veiculo => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('vehicle-item');
        itemDiv.innerHTML = `
            <span><strong>${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
            <div class="actions">
                <button onclick="abrirModalDetalhes('${veiculo.id}')">Detalhes / Manutenção</button>
                <button class="button-danger" onclick="removerVeiculo('${veiculo.id}')">Remover</button>
            </div>
        `;
        listaVeiculosDiv.appendChild(itemDiv);
    });
}
// Cole aqui todas as outras funções do seu `script.js` antigo:
// renderizarHistoricoManutencaoModal
// renderizarAgendamentosFuturos
// abrirModalDetalhes
// fecharModal
// atualizarInfoVeiculoNoModal
// executarAcaoVeiculo
// removerVeiculo
// removerManutencao
// verificarAgendamentosProximos
// ... (Copie e cole TODAS essas funções aqui, elas funcionarão como antes)
// NOTA: As funções de notificação já foram definidas no topo do arquivo.

// Funções do `script.js` copiadas e adaptadas:

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const historicoDiv = document.getElementById('modalHistoricoManutencao');
    if (!veiculo) return;
    historicoDiv.innerHTML = veiculo.getHistoricoHTML();
}

function renderizarAgendamentosFuturos() {
    const listaAgendamentosDiv = document.getElementById('listaAgendamentosFuturos');
    listaAgendamentosDiv.innerHTML = '';
    const agora = new Date();
    let agendamentos = [];

    garagem.forEach(veiculo => {
        veiculo.historicoManutencao.forEach(manutencao => {
            if (manutencao.data instanceof Date && !isNaN(manutencao.data.getTime()) && manutencao.data > agora) {
                agendamentos.push({ veiculo, manutencao });
            }
        });
    });

    agendamentos.sort((a, b) => a.manutencao.data - b.manutencao.data);

    if (agendamentos.length === 0) {
        listaAgendamentosDiv.innerHTML = '<p style="text-align: center; color: #777;">Nenhum agendamento futuro.</p>';
        return;
    }

    agendamentos.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('schedule-item');
        itemDiv.innerHTML = `
             <span>${item.manutencao.formatar(true, `${item.veiculo.modelo} (${item.veiculo.cor})`)}</span>
             <button class="button-warning" onclick="removerManutencao('${item.veiculo.id}', '${item.manutencao.id}')">Cancelar</button>
        `;
        listaAgendamentosDiv.appendChild(itemDiv);
    });
}

const modal = document.getElementById('modalDetalhesVeiculo');
function abrirModalDetalhes(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;
    
    // As classes de veículo precisam saber qual função de notificação usar
    window.exibirNotificacao = exibirNotificacao; 

    document.getElementById('modalTituloVeiculo').textContent = `Detalhes: ${veiculo.modelo}`;
    document.getElementById('manutencaoVeiculoId').value = veiculoId;
    
    atualizarInfoVeiculoNoModal(veiculoId);
    renderizarHistoricoManutencaoModal(veiculoId);
    
    flatpickr("#manutencaoData", {
        enableTime: true, dateFormat: "Y-m-d H:i", minDate: "today", locale: "pt"
    });
    
    modal.style.display = 'block';
}

function fecharModal() { modal.style.display = 'none'; }

function atualizarInfoVeiculoNoModal(veiculoId) {
    if (modal.style.display !== 'block') return;
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    document.getElementById('modalInfoVeiculo').innerHTML = veiculo.exibirInformacoesCompletaHTML();
    
    const acoesDiv = document.getElementById('modalAcoesVeiculo');
    acoesDiv.innerHTML = '';

    if (!veiculo.ligado) {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ligar')"><i class="fas fa-key"></i> Ligar</button>`;
    } else {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desligar')"><i class="fas fa-power-off"></i> Desligar</button>`;
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'acelerar')"><i class="fas fa-tachometer-alt"></i> Acelerar</button>`;
    }
     acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'buzinar')"><i class="fas fa-bullhorn"></i> Buzinar</button>`;

    if (veiculo instanceof CarroEsportivo) {
        if (!veiculo.turbo) acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ativarTurbo')"><i class="fas fa-rocket"></i> Ativar Turbo</button>`;
        else acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desativarTurbo')"><i class="fas fa-sliders-h"></i> Desativar Turbo</button>`;
    } else if (veiculo instanceof Caminhao) {
        const cargaHTML = `
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <input type="number" id="pesoCargaModal_${veiculo.id}" placeholder="Peso (kg)" style="width: 120px;">
                <button onclick="executarAcaoVeiculo('${veiculo.id}', 'carregar')"><i class="fas fa-plus"></i> Carregar</button>
                <button onclick="executarAcaoVeiculo('${veiculo.id}', 'descarregar')"><i class="fas fa-minus"></i> Descarregar</button>
            </div>
        `;
        acoesDiv.innerHTML += cargaHTML;
    }
}

function executarAcaoVeiculo(veiculoId, acao) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return;

    let param = null;
    if (acao === 'carregar' || acao === 'descarregar') {
        const input = document.getElementById(`pesoCargaModal_${veiculoId}`);
        param = input.value;
    }
    
    if (typeof veiculo[acao] === 'function') {
        veiculo[acao](param);
    }
}

function removerVeiculo(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (confirm(`Tem certeza que deseja remover o veículo ${veiculo.modelo}?`)) {
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

function verificarAgendamentosProximos() {
    // Implementação mantida a mesma
}


// ====================================================================
// ====================== INICIALIZAÇÃO GERAL =========================
// ====================================================================
// Localize este trecho no seu main.js...
document.addEventListener('DOMContentLoaded', () => {
    flatpickr.localize(flatpickr.l10ns.pt);

    // Inicialização do Simulador
    selecionarVeiculoSimulador('Carro');

    // Inicialização da Garagem Avançada
    carregarGaragem();
    
    // ** ADICIONE ESTAS 3 LINHAS AQUI **
    carregarVeiculosDestaque();
    carregarServicosOferecidos();
    carregarDicasManutencao();
    
    // ... o restante dos listeners de formulário permanece igual
    // Listeners dos formulários
    document.getElementById('formAdicionarVeiculo').addEventListener('submit', event => {
        event.preventDefault();
        window.exibirNotificacao = exibirNotificacao; // Usa a notificação global
        
        const tipo = document.getElementById('tipoVeiculo').value;
        const modelo = document.getElementById('modeloVeiculo').value;
        const cor = document.getElementById('corVeiculo').value;
        
        let novoVeiculo;
        if(tipo === 'Caminhao') {
            const capacidade = document.getElementById('capacidadeCargaVeiculo').value;
            novoVeiculo = new Caminhao(modelo, cor, capacidade);
        } else if(tipo === 'CarroEsportivo') {
            novoVeiculo = new CarroEsportivo(modelo, cor);
        } else {
            novoVeiculo = new Carro(modelo, cor);
        }
        garagem.push(novoVeiculo);
        salvarGaragem();
        renderizarGaragem();
        exibirNotificacao(`${modelo} adicionado à garagem!`, 'success');
        event.target.reset();
    });

    document.getElementById('tipoVeiculo').addEventListener('change', function() {
        document.getElementById('campoCapacidadeCarga').style.display = this.value === 'Caminhao' ? 'block' : 'none';
    });
    
    document.getElementById('formManutencao').addEventListener('submit', event => {
        event.preventDefault();
        window.exibirNotificacao = exibirNotificacao; // Usa a notificação global
        
        const veiculoId = document.getElementById('manutencaoVeiculoId').value;
        const veiculo = garagem.find(v => v.id === veiculoId);
        
        if (veiculo) {
            const data = document.getElementById('manutencaoData').value;
            const tipo = document.getElementById('manutencaoTipo').value;
            const custo = document.getElementById('manutencaoCusto').value;
            const descricao = document.getElementById('manutencaoDescricao').value;
            const novaManutencao = new Manutencao(data, tipo, custo, descricao);
            if (veiculo.adicionarManutencao(novaManutencao)) {
                 renderizarHistoricoManutencaoModal(veiculoId);
                 renderizarAgendamentosFuturos();
                 event.target.reset();
            }
        }
    });

    window.onclick = function(event) { if (event.target == modal) fecharModal(); }

    console.log("Garagem Inteligente Unificada INICIALIZADA.");
});

// ====================================================================
// ============= CONSUMO DOS ENDPOINTS DO ARSENAL DE DADOS ============
// ====================================================================

// Coloque o URL do seu backend do Render aqui quando for fazer o deploy final.
// Para testar localmente, use o de localhost.
const backendUrl = 'http://localhost:3001'; // ATENÇÃO: Altere para a URL do seu Render.com

async function carregarVeiculosDestaque() {
    const container = document.getElementById('veiculos-destaque-container');
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`);
        if (!response.ok) throw new Error(`Falha na rede: ${response.statusText}`);
        const veiculos = await response.json();
        
        container.innerHTML = ''; // Limpa "Carregando..."
        veiculos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'veiculo-card';
            card.innerHTML = `
                <img src="${v.imagemUrl || 'img/placeholder.jpg'}" alt="${v.modelo}" class="veiculo-card-imagem">
                <div class="veiculo-card-conteudo">
                    <h3>${v.modelo} (${v.ano})</h3>
                    <p>${v.destaque}</p>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        container.innerHTML = `<p style="color:red;">Erro ao carregar veículos: ${error.message}</p>`;
    }
}

async function carregarServicosOferecidos() {
    const lista = document.getElementById('servicos-oferecidos-lista');
    try {
        const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`);
        if (!response.ok) throw new Error('Falha ao carregar serviços.');
        const servicos = await response.json();

        lista.innerHTML = '';
        servicos.forEach(s => {
            const item = document.createElement('li');
            item.className = 'servico-item';
            item.innerHTML = `
                <strong>${s.nome}</strong>
                ${s.descricao}<br>
                <span>Preço: ${s.precoEstimado}</span>
            `;
            lista.appendChild(item);
        });

    } catch (error) {
        lista.innerHTML = `<li style="color:red; list-style-type: none;">${error.message}</li>`;
    }
}

async function carregarDicasManutencao() {
    const container = document.getElementById('dicas-manutencao-container');
    try {
        const response = await fetch(`${backendUrl}/api/garagem/dicas-manutencao`);
        if (!response.ok) throw new Error('Falha ao carregar dicas.');
        const dicas = await response.json();

        container.innerHTML = '';
        dicas.forEach(d => {
            const item = document.createElement('div');
            item.className = 'dica-item';
            item.innerHTML = `
                <i class="fas fa-lightbulb"></i>
                <p>${d.dica}</p>
            `;
            container.appendChild(item);
        });

    } catch (error) {
        container.innerHTML = `<p style="color:red;">${error.message}</p>`;
    }
}