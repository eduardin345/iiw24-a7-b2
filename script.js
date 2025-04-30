// --- Gerenciamento da Garagem e LocalStorage ---
let garagem = []; // Array para armazenar as instâncias dos veículos
const STORAGE_KEY = 'minhaGaragemInteligente_v2'; // Mudar a chave se a estrutura de dados mudar significativamente

// Variáveis para o modal (declaradas aqui, definidas no DOMContentLoaded)
let modal;
let modalContent;


function salvarGaragem() {
    try {
        // Usa o método toJSON de cada veículo para garantir a serialização correta
        // Adiciona verificação para garantir que v.toJSON é uma função
        const garagemJSON = JSON.stringify(garagem.map(v => (typeof v.toJSON === 'function' ? v.toJSON() : null)).filter(v => v !== null));
        localStorage.setItem(STORAGE_KEY, garagemJSON);
        // console.log("Garagem salva:", garagemJSON); // Log para debug (pode ser extenso)
    } catch (error) {
        console.error("Erro crítico ao salvar garagem no LocalStorage:", error);
        exibirNotificacao("ERRO GRAVE: Não foi possível salvar os dados da garagem. Alterações recentes podem ser perdidas ao fechar.", 'error', 0); // 0 = não esconder automaticamente
    }
}

function carregarGaragem() {
    try {
        const garagemJSON = localStorage.getItem(STORAGE_KEY);
        if (garagemJSON) {
            const garagemGenerica = JSON.parse(garagemJSON);
            // Reidrata os objetos: transforma JSON genérico em instâncias de classes
            // Depende do método estático Veiculo.fromJSON
            // Adiciona checagem se Veiculo e Veiculo.fromJSON existem
            if (typeof Veiculo !== 'undefined' && typeof Veiculo.fromJSON === 'function') {
                 garagem = garagemGenerica.map(veiculoJSON => Veiculo.fromJSON(veiculoJSON))
                                     .filter(v => v !== null); // Filtra veículos que falharam na reidratação

                 if (garagem.length !== garagemGenerica.length) {
                    console.warn("Alguns veículos não puderam ser carregados corretamente do LocalStorage.");
                    exibirNotificacao("Aviso: Alguns dados de veículos podem não ter sido carregados corretamente.", 'warning');
                 }
            } else {
                 console.error("Classe Veiculo ou Veiculo.fromJSON não estão definidos. Impossível carregar garagem.");
                 exibirNotificacao("Erro crítico: Código base dos veículos não encontrado.", 'error');
                 garagem = []; // Garante que a garagem esteja vazia
            }

            // console.log(`Garagem carregada: ${garagem.length} veículos.`); // Log para debug
        } else {
            garagem = []; // Inicia vazia se não houver nada salvo
            // console.log("Nenhuma garagem salva encontrada. Iniciando vazia.");
        }
    } catch (error) {
        console.error("Erro ao carregar ou parsear garagem do LocalStorage:", error);
        exibirNotificacao("Erro ao carregar dados da garagem. Verifique o console para detalhes. Iniciando com garagem vazia.", 'error');
        garagem = []; // Reseta em caso de erro grave de parse para evitar mais problemas
        // Opcional: tentar limpar o localStorage corrompido
        // localStorage.removeItem(STORAGE_KEY);
    }
    // Atualiza a UI após carregar/falhar
    renderizarGaragem();
    renderizarAgendamentosFuturos();
    verificarAgendamentosProximos(); // Verifica lembretes ao iniciar
}

// --- Funções de Renderização da UI ---

function renderizarGaragem() {
    const listaVeiculosDiv = document.getElementById('listaVeiculos');
     if (!listaVeiculosDiv) { // Verifica se o elemento existe
        console.error("Elemento #listaVeiculos não encontrado no DOM.");
        return;
    }
    listaVeiculosDiv.innerHTML = ''; // Limpa a lista atual

    if (garagem.length === 0) {
        listaVeiculosDiv.innerHTML = '<p style="text-align: center; color: #777;">Sua garagem está vazia. Adicione um veículo acima!</p>';
        return;
    }

    // Ordena a garagem (ex: por modelo) antes de renderizar - opcional
    garagem.sort((a, b) => a.modelo.localeCompare(b.modelo));

    garagem.forEach(veiculo => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('vehicle-item');
        itemDiv.setAttribute('data-id', veiculo.id); // Adiciona ID para referência futura
        itemDiv.innerHTML = `
            <span><strong style="color: #2980b9;">${veiculo.modelo}</strong> (${veiculo.tipoVeiculo}) - Cor: ${veiculo.cor}</span>
            <div class="actions">
                <button onclick="abrirModalDetalhes('${veiculo.id}')" title="Ver detalhes, histórico e agendar manutenção">Detalhes / Manutenção</button>
                <button class="warning" onclick="removerVeiculo('${veiculo.id}')" title="Remover veículo permanentemente">Remover</button>
            </div>
        `;
        listaVeiculosDiv.appendChild(itemDiv);
    });
}

function renderizarHistoricoManutencaoModal(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    const historicoDiv = document.getElementById('modalHistoricoManutencao');
    if (!historicoDiv) {
        console.error("Elemento #modalHistoricoManutencao não encontrado no modal.");
        return;
    }

    if (!veiculo) {
        console.error("Veículo não encontrado para renderizar histórico:", veiculoId);
        historicoDiv.innerHTML = '<p>Erro: Veículo não encontrado.</p>';
        return;
    }
    // Usa o método getHistoricoHTML da classe Veiculo
    // Verifica se o método existe
    if (typeof veiculo.getHistoricoHTML === 'function') {
        historicoDiv.innerHTML = veiculo.getHistoricoHTML();
    } else {
        console.error("Método getHistoricoHTML não encontrado no objeto Veiculo.");
        historicoDiv.innerHTML = '<p>Erro ao carregar histórico.</p>';
    }
}


function renderizarAgendamentosFuturos() {
    const listaAgendamentosDiv = document.getElementById('listaAgendamentosFuturos');
     if (!listaAgendamentosDiv) {
        console.error("Elemento #listaAgendamentosFuturos não encontrado no DOM.");
        return;
    }
    listaAgendamentosDiv.innerHTML = '';
    const agora = new Date();
    let agendamentos = [];

    // Coleta todos os agendamentos futuros de todos os veículos
    garagem.forEach(veiculo => {
        // Verifica se historicoManutencao é um array antes de iterar
        if (Array.isArray(veiculo.historicoManutencao)) {
            veiculo.historicoManutencao.forEach(manutencao => {
                // Verifica se a data é válida e futura
                if (manutencao.data instanceof Date && !isNaN(manutencao.data.getTime()) && manutencao.data > agora) {
                    agendamentos.push({ veiculo: veiculo, manutencao: manutencao });
                }
            });
        }
    });

    // Ordena por data (mais próximo primeiro)
    agendamentos.sort((a, b) => a.manutencao.data - b.manutencao.data);

    if (agendamentos.length === 0) {
        listaAgendamentosDiv.innerHTML = '<p style="text-align: center; color: #777;">Nenhum agendamento futuro.</p>';
        return;
    }

    agendamentos.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('schedule-item');
         itemDiv.setAttribute('data-id', item.manutencao.id);
        // Formata a manutenção incluindo o nome do veículo
        // Depende do método formatar da classe Manutencao
        // Adiciona verificação se o método formatar existe
        const itemFormatado = (typeof item.manutencao.formatar === 'function')
            ? item.manutencao.formatar(true, `${item.veiculo.modelo} (${item.veiculo.cor})`)
            : `Agendamento ${item.manutencao.id || item.manutencao.tipo} inválido`;

        itemDiv.innerHTML = `
             <span>${itemFormatado}</span>
             <button class="small-warning" onclick="removerManutencao('${item.veiculo.id}', '${item.manutencao.id}')" title="Cancelar este agendamento">Cancelar</button>
        `;
        listaAgendamentosDiv.appendChild(itemDiv);
    });
}

// --- Funções do Modal e Ações do Veículo ---
// Modal e modalContent são definidos no DOMContentLoaded

function abrirModalDetalhes(veiculoId) {
     // Verifica se o modal foi encontrado no DOM
     if (!modal) {
         exibirNotificacao("Erro: Estrutura do modal não encontrada na página.", "error");
         return;
     }

    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) {
        exibirNotificacao("Erro: Veículo não encontrado.", "error");
        return;
    }

    // Elementos internos do modal (verifica se existem)
    const tituloEl = document.getElementById('modalTituloVeiculo');
    const manutencaoIdEl = document.getElementById('manutencaoVeiculoId');
    const formManutencaoEl = document.getElementById('formManutencao');
    const dataInputEl = document.getElementById('manutencaoData'); // Campo para Flatpickr

    if (!tituloEl || !manutencaoIdEl || !formManutencaoEl || !dataInputEl) {
        exibirNotificacao("Erro: Elementos internos do modal não encontrados.", "error");
        console.error("Elementos faltando no modal: ", {tituloEl, manutencaoIdEl, formManutencaoEl, dataInputEl});
        return;
    }


    tituloEl.textContent = `Detalhes: ${veiculo.modelo} (${veiculo.cor})`;
    manutencaoIdEl.value = veiculoId; // Associa formulário ao veículo

    atualizarInfoVeiculoNoModal(veiculoId); // Popula infos e botões de ação
    renderizarHistoricoManutencaoModal(veiculoId); // Popula histórico e agendamentos do veículo

    // Limpa e configura formulário de manutenção
    formManutencaoEl.reset();
    // Configura o datepicker para o campo de data (Assume que flatpickr está carregado)
    if (typeof flatpickr !== 'undefined') {
         // Destrói instância anterior se existir (evita duplicatas)
         if (dataInputEl._flatpickr) {
            dataInputEl._flatpickr.destroy();
         }
        flatpickr(dataInputEl, { // Passa o elemento diretamente
            enableTime: true,
            dateFormat: "Y-m-d H:i", // Formato ISO compatível com new Date()
            // minDate: "today", // Descomente se quiser impedir datas passadas
            locale: "pt", // Usa localização em português
            time_24hr: true
        });
    } else {
        console.warn("Flatpickr não carregado. Campo de data será texto simples.");
    }

    modal.style.display = 'block';
    // Força reflow antes de adicionar classe de animação (melhora consistência)
    modal.scrollTop;
    // Adiciona classe para animação de entrada (se houver)
    if (modalContent) modalContent.classList.add('animate-in'); // Crie a animação CSS correspondente
    modal.classList.remove('animate-out-bg'); // Garante que fundo não esteja animando para sair
    if(modalContent) modalContent.classList.remove('animate-out');

}

function fecharModal() {
    if (!modal) return; // Segurança

    // Adiciona classe para animação de saída (opcional)
    if (modalContent) modalContent.classList.add('animate-out');
    modal.classList.add('animate-out-bg'); // Anima o fundo também

    // Espera a animação terminar antes de esconder o modal
    // Usa 'animationend' para maior precisão
    const animationHandler = () => {
        modal.style.display = 'none';
        if (modalContent) modalContent.classList.remove('animate-in', 'animate-out'); // Limpa classes de animação
        modal.classList.remove('animate-out-bg');
        // Remove o listener para não ser chamado múltiplas vezes
        if(modalContent) modalContent.removeEventListener('animationend', animationHandler);
        modal.removeEventListener('animationend', animationHandler); // Remove listener do fundo também
    };

    if (modalContent) {
        modalContent.addEventListener('animationend', animationHandler, { once: true });
    } else {
         // Se não houver modalContent, apenas esconde após um tempo fixo
         setTimeout(() => {
             modal.style.display = 'none';
             modal.classList.remove('animate-out-bg');
         }, 300); // Tempo da animação CSS
    }
}


// Fecha o modal se clicar fora do conteúdo (no fundo escuro)
window.onclick = function(event) {
    if (modal && event.target == modal) { // Verifica se modal existe
        fecharModal();
    }
}
// Fecha o modal ao pressionar a tecla ESC
window.addEventListener('keydown', function(event) {
    // Verifica se modal existe e está visível
    if (modal && event.key === 'Escape' && modal.style.display === 'block') {
        fecharModal();
    }
});

function atualizarInfoVeiculoNoModal(veiculoId) {
    // Verifica se o modal existe e está visível
    if (!modal || modal.style.display !== 'block' || document.getElementById('manutencaoVeiculoId')?.value !== veiculoId) {
        return;
    }


    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) return; // Segurança extra

    const infoDiv = document.getElementById('modalInfoVeiculo');
    const acoesDiv = document.getElementById('modalAcoesVeiculo');

    if (!infoDiv || !acoesDiv) {
        console.error("Elementos #modalInfoVeiculo ou #modalAcoesVeiculo não encontrados no modal.");
        return;
    }


    // Usa o método exibirInformacoesCompletaHTML da classe Veiculo (e suas filhas)
    if (typeof veiculo.exibirInformacoesCompletaHTML === 'function') {
        infoDiv.innerHTML = veiculo.exibirInformacoesCompletaHTML();
    } else {
         infoDiv.innerHTML = '<p>Erro ao carregar informações detalhadas.</p>';
    }
    acoesDiv.innerHTML = ''; // Limpa ações anteriores para reconstruir

    // Botões de Ação Comuns
    if (!veiculo.ligado) {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ligar')" title="Ligar o motor"><span role="img" aria-label="Chave">🔑</span> Ligar</button>`;
    } else {
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desligar')" title="Desligar o motor"><span role="img" aria-label="Botão Power Off">🔌</span> Desligar</button>`;
        acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'acelerar', 10)" title="Aumentar velocidade em 10 km/h"><span role="img" aria-label="Pedal">💨</span> Acelerar (+10)</button>`;
    }
    acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'buzinar')" title="Tocar a buzina"><span role="img" aria-label="Megafone">📣</span> Buzinar</button>`;

    // Botões de Ação Específicos por Tipo
    if (veiculo instanceof CarroEsportivo) {
        if (!veiculo.turbo) {
            acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'ativarTurbo')" title="Ativar o turbo (requer motor ligado)"><span role="img" aria-label="Foguete">🚀</span> Ativar Turbo</button>`;
        } else {
            acoesDiv.innerHTML += `<button onclick="executarAcaoVeiculo('${veiculo.id}', 'desativarTurbo')" title="Desativar o turbo"><span role="img" aria-label="Caracol">🐌</span> Desativar Turbo</button>`;
        }
    } else if (veiculo instanceof Caminhao) {
        // Cria um container flex para os controles de carga
        const cargaContainer = document.createElement('div');
        // Estilos agora vêm do CSS
        // cargaContainer.style.display = 'flex'; ...
        cargaContainer.innerHTML = `
            <input type="number" id="pesoCargaModal_${veiculo.id}" placeholder="Peso (kg)" min="1" style="width: 120px; margin-right: 5px; padding: 8px;" title="Digite o peso para carregar ou descarregar">
            <button onclick="executarAcaoVeiculo('${veiculo.id}', 'carregar')" title="Adicionar carga ao caminhão"><span role="img" aria-label="Seta para cima">⬆️</span> Carregar</button>
            <button onclick="executarAcaoVeiculo('${veiculo.id}', 'descarregar')" title="Remover carga do caminhão"><span role="img" aria-label="Seta para baixo">⬇️</span> Descarregar</button>
        `;
         acoesDiv.appendChild(cargaContainer);
    }
}

// Função genérica para chamar métodos do veículo a partir da UI
function executarAcaoVeiculo(veiculoId, acao, param = null) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) {
         exibirNotificacao("Erro interno: Veículo não encontrado para executar ação.", "error");
         return;
     }

    // Tratamento especial para carregar/descarregar caminhão para pegar o valor do input
    if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
        const inputPeso = document.getElementById(`pesoCargaModal_${veiculo.id}`);
        if (!inputPeso) {
            console.error("Input de peso não encontrado no modal para caminhão.");
            return;
        }
        param = inputPeso.value; // Pega o valor atual do input
         // inputPeso.value = ''; // Limpar ou não o campo é opcional
    }

    // Verifica se o método existe no objeto veículo
    if (typeof veiculo[acao] === 'function') {
        try {
            veiculo[acao](param); // Chama o método correspondente
            // A responsabilidade de atualizar UI/salvar está dentro dos métodos das classes
        } catch (error) {
             console.error(`Erro ao executar ação '${acao}' no veículo ${veiculo.id}:`, error);
             exibirNotificacao(`Erro ao executar ${acao}: ${error.message}`, 'error');
        }
    } else {
        console.error(`Ação '${acao}' não é uma função válida no veículo ${veiculo.id}`);
        exibirNotificacao(`Erro interno: Ação '${acao}' desconhecida.`, 'error');
    }
}

// --- Manipulação de Formulários e Eventos ---

// Inicializa event listeners e outros códigos dependentes do DOM apenas quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {

    // Define as variáveis do modal AQUI, quando o DOM está pronto
    modal = document.getElementById('modalDetalhesVeiculo');
    modalContent = modal ? modal.querySelector('.modal-content') : null;

    // Verifica se o modal e seu conteúdo foram encontrados
    if (!modal || !modalContent) {
        console.error("Elemento do modal (#modalDetalhesVeiculo) ou seu conteúdo (.modal-content) não encontrado no DOM! Funcionalidades do modal desabilitadas.");
        // Poderia desabilitar botões que abrem o modal aqui
    }

    // Formulário Adicionar Veículo
    const formAdicionarVeiculo = document.getElementById('formAdicionarVeiculo');
    if (formAdicionarVeiculo) { // Verifica se o formulário existe
        formAdicionarVeiculo.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede recarregamento da página

            const tipoEl = document.getElementById('tipoVeiculo');
            const modeloEl = document.getElementById('modeloVeiculo');
            const corEl = document.getElementById('corVeiculo');
            const capacidadeInputEl = document.getElementById('capacidadeCargaVeiculo'); // Para caminhão

            if (!tipoEl || !modeloEl || !corEl) {
                 console.error("Elementos do formulário de adicionar veículo não encontrados.");
                 return;
            }

            const tipo = tipoEl.value;
            const modelo = modeloEl.value;
            const cor = corEl.value;

            if (!tipo || !modelo.trim() || !cor.trim()) {
                 exibirNotificacao("Por favor, preencha tipo, modelo e cor do veículo.", 'warning');
                 return;
            }

            let novoVeiculo;
            try {
                // Depende das classes Carro, CarroEsportivo, Caminhao
                switch (tipo) {
                    case 'Carro':
                        novoVeiculo = new Carro(modelo, cor);
                        break;
                    case 'CarroEsportivo':
                        novoVeiculo = new CarroEsportivo(modelo, cor);
                        break;
                    case 'Caminhao':
                         if (!capacidadeInputEl) {
                              exibirNotificacao("Erro interno: Campo de capacidade não encontrado.", 'error');
                              return;
                         }
                        const capacidade = capacidadeInputEl.value;
                        if (!capacidade || isNaN(parseFloat(capacidade)) || parseFloat(capacidade) < 0) {
                            exibirNotificacao("Capacidade de carga inválida para o caminhão.", 'error');
                            capacidadeInputEl.focus();
                            return;
                        }
                        novoVeiculo = new Caminhao(modelo, cor, capacidade);
                        break;
                    default:
                        exibirNotificacao("Tipo de veículo selecionado é inválido.", 'error');
                        return;
                }

                garagem.push(novoVeiculo);
                salvarGaragem();
                renderizarGaragem(); // Atualiza a lista na tela principal
                exibirNotificacao(`Veículo ${modelo} adicionado com sucesso!`, 'success');
                formAdicionarVeiculo.reset(); // Limpa o formulário
                // Esconde campo do caminhão após adicionar
                 const campoCapacidadeDiv = document.getElementById('campoCapacidadeCarga');
                 if (campoCapacidadeDiv) campoCapacidadeDiv.style.display = 'none';


            } catch (error) {
                console.error("Erro ao criar ou adicionar veículo:", error);
                exibirNotificacao(`Erro ao adicionar veículo: ${error.message}`, 'error');
            }
        });
    } else {
        console.warn("Formulário #formAdicionarVeiculo não encontrado.");
    }


    // Mostra/Esconde campo de capacidade ao mudar tipo de veículo
    const tipoVeiculoSelect = document.getElementById('tipoVeiculo');
     if (tipoVeiculoSelect) { // Verifica se o select existe
        tipoVeiculoSelect.addEventListener('change', function() {
            const campoCapacidadeDiv = document.getElementById('campoCapacidadeCarga');
            const capacidadeInput = document.getElementById('capacidadeCargaVeiculo');

             if (!campoCapacidadeDiv || !capacidadeInput) {
                 console.error("Elementos do campo de capacidade (#campoCapacidadeCarga ou #capacidadeCargaVeiculo) não encontrados.");
                 return;
             }

            const show = (this.value === 'Caminhao');

            campoCapacidadeDiv.style.display = show ? 'block' : 'none';
            capacidadeInput.required = show;
             if (!show) {
                 capacidadeInput.value = '';
             }
        });
         // Configuração inicial do campo de capacidade ao carregar a página
         const campoCapacidadeDivInit = document.getElementById('campoCapacidadeCarga');
         const capacidadeInputInit = document.getElementById('capacidadeCargaVeiculo');
         if (tipoVeiculoSelect.value === 'Caminhao' && campoCapacidadeDivInit && capacidadeInputInit) {
            campoCapacidadeDivInit.style.display = 'block';
            capacidadeInputInit.required = true;
         } else if (campoCapacidadeDivInit) {
              campoCapacidadeDivInit.style.display = 'none';
         }

    } else {
        console.warn("Select #tipoVeiculo não encontrado.");
    }

    // Formulário Adicionar/Agendar Manutenção (dentro do Modal)
    const formManutencao = document.getElementById('formManutencao');
    if (formManutencao) { // Verifica se o formulário existe
        formManutencao.addEventListener('submit', function(event) {
            event.preventDefault();

            const veiculoIdEl = document.getElementById('manutencaoVeiculoId');
            const dataInputEl = document.getElementById('manutencaoData');
            const tipoInputEl = document.getElementById('manutencaoTipo');
            const custoInputEl = document.getElementById('manutencaoCusto');
            const descricaoInputEl = document.getElementById('manutencaoDescricao');

            if (!veiculoIdEl || !dataInputEl || !tipoInputEl || !custoInputEl || !descricaoInputEl) {
                console.error("Elementos do formulário de manutenção não encontrados.");
                exibirNotificacao("Erro interno: Formulário de manutenção incompleto.", "error");
                return;
            }

            const veiculoId = veiculoIdEl.value;
            const veiculo = garagem.find(v => v.id === veiculoId);

            if (!veiculo) {
                exibirNotificacao("Erro: Veículo não encontrado para adicionar manutenção.", 'error');
                return;
            }

            const data = dataInputEl.value; // Flatpickr retorna string formatada
            const tipo = tipoInputEl.value;
            const custo = custoInputEl.value;
            const descricao = descricaoInputEl.value;

             if (!data || !tipo.trim() || custo === '' || parseFloat(custo) < 0) {
                 exibirNotificacao("Preencha Data, Tipo e Custo (não negativo) corretamente.", 'warning');
                 return;
             }

            try {
                // Cria a instância (a classe Manutencao também valida internamente)
                // Depende da classe Manutencao
                const novaManutencao = new Manutencao(data, tipo, custo, descricao);

                // Tenta adicionar ao histórico do veículo
                // Depende do método adicionarManutencao da classe Veiculo
                const adicionadoComSucesso = veiculo.adicionarManutencao(novaManutencao);

                if (adicionadoComSucesso) {
                    renderizarHistoricoManutencaoModal(veiculoId); // Atualiza a lista no modal
                    renderizarAgendamentosFuturos(); // Atualiza lista geral de agendamentos
                    formManutencao.reset(); // Limpa o formulário
                    // Fecha o datepicker se estiver aberto (caso use Flatpickr)
                    const fpInstance = dataInputEl._flatpickr; // Flatpickr anexa a instância ao elemento
                    if (fpInstance) fpInstance.close();
                    verificarAgendamentosProximos(); // Re-verifica lembretes
                }
                // Se não adicionou com sucesso, a notificação de erro já foi exibida por adicionarManutencao

            } catch (error) {
                console.error("Erro ao criar ou adicionar manutenção via formulário:", error);
                exibirNotificacao(`Erro no formulário de manutenção: ${error.message}`, 'error');
            }
        });
    } else {
        console.warn("Formulário #formManutencao não encontrado.");
    }

    // --- Inicialização do Flatpickr e Carregamento da Garagem ---
    if (typeof flatpickr !== 'undefined' && flatpickr.l10ns && flatpickr.l10ns.pt) {
        flatpickr.localize(flatpickr.l10ns.pt);
    } else {
         console.warn("Flatpickr ou localização 'pt' não encontrados. Datepicker usará inglês ou padrão.");
    }

    carregarGaragem(); // Carrega os dados e renderiza a UI inicial

    console.log("Garagem Inteligente inicializada.");

}); // Fim do DOMContentLoaded

// --- Funções que não dependem diretamente de elementos específicos no DOMContentLoaded ---
// (Podem ficar fora do listener, mas precisam ser chamadas após a definição das classes)

// Função para remover veículo da garagem
function removerVeiculo(veiculoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) {
         exibirNotificacao("Erro: Veículo não encontrado para remoção.", "error");
         return;
     }

    if (confirm(`ATENÇÃO!\nTem certeza que deseja remover PERMANENTEMENTE o veículo "${veiculo.modelo} (${veiculo.cor})"?\n\nTodo o histórico de manutenção será perdido.`)) {
        garagem = garagem.filter(v => v.id !== veiculoId);
        salvarGaragem();
        renderizarGaragem();
        renderizarAgendamentosFuturos();
        exibirNotificacao(`Veículo ${veiculo.modelo} removido com sucesso.`, 'success');

        // Se o modal estiver aberto para este veículo, feche-o
        if (modal && modal.style.display === 'block' && document.getElementById('manutencaoVeiculoId')?.value === veiculoId) {
            fecharModal();
        }
    }
}

// Função para remover uma manutenção/agendamento específico (chamada pelos botões)
function removerManutencao(veiculoId, manutencaoId) {
    const veiculo = garagem.find(v => v.id === veiculoId);
    if (!veiculo) {
         exibirNotificacao("Erro: Veículo não encontrado para remover manutenção.", "error");
         return;
     }

     // Encontra a manutenção específica para exibir detalhes na confirmação
     // Verifica se historicoManutencao é um array
     const manutencao = Array.isArray(veiculo.historicoManutencao)
        ? veiculo.historicoManutencao.find(m => m.id === manutencaoId)
        : null;

     if (!manutencao) {
         exibirNotificacao("Erro: Registro de manutenção não encontrado.", "error");
         return;
     }

     // Formata data para confirmação (se válida)
     const dataFormatadaConfirm = (manutencao.data instanceof Date && !isNaN(manutencao.data))
        ? manutencao.data.toLocaleDateString('pt-BR')
        : 'Data inválida';

    if (confirm(`Tem certeza que deseja remover o registro:\n"${manutencao.tipo}" em ${dataFormatadaConfirm}?`)) {
        // Depende do método removerManutencaoPorId da classe Veiculo
        const removido = (typeof veiculo.removerManutencaoPorId === 'function')
            ? veiculo.removerManutencaoPorId(manutencaoId)
            : false;


        if (removido) {
            exibirNotificacao('Manutenção/Agendamento removido.', 'success');
             // Atualiza as UIs relevantes
             if (modal && modal.style.display === 'block' && document.getElementById('manutencaoVeiculoId')?.value === veiculoId) {
                renderizarHistoricoManutencaoModal(veiculoId); // Atualiza no modal se aberto
             }
            renderizarAgendamentosFuturos(); // Atualiza na lista geral
            verificarAgendamentosProximos(); // Re-verifica lembretes
        } else {
            exibirNotificacao('Não foi possível remover a manutenção.', 'error');
        }
    }
}

// --- Notificações e Lembretes ---
let notificationTimeout; // Armazena o ID do timeout da notificação

function exibirNotificacao(mensagem, tipo = 'info', duracaoMs = 5000) { // Tipos: 'info', 'success', 'warning', 'error'
    const notificacaoDiv = document.getElementById('notificacoes');
    if (!notificacaoDiv) { // Verifica se a div de notificações existe
        console.warn("Elemento #notificacoes não encontrado para exibir: ", mensagem);
        return;
    }


    notificacaoDiv.textContent = mensagem;
    notificacaoDiv.className = ''; // Limpa classes de tipo anteriores
    notificacaoDiv.classList.add(tipo); // Adiciona a classe do tipo atual
    notificacaoDiv.classList.add('show'); // Adiciona classe para mostrar (ativa transição)

    // Limpa timeout anterior se uma nova notificação chegar rapidamente
    clearTimeout(notificationTimeout);

    // Esconde a notificação após a duração especificada (se > 0)
    if (duracaoMs > 0) {
        notificationTimeout = setTimeout(() => {
            notificacaoDiv.classList.remove('show'); // Remove classe show (ativa transição de saída)
        }, duracaoMs);
    }
     // Se duracaoMs for 0, a notificação permanecerá visível até a próxima chamada ou reload.
}

function verificarAgendamentosProximos() {
    const agora = new Date();
    const amanha = new Date(agora);
    amanha.setDate(agora.getDate() + 1);
    const limite = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000); // Próximas 48 horas

    let lembretes = [];

    garagem.forEach(veiculo => {
         // Verifica se historicoManutencao é um array
         if (Array.isArray(veiculo.historicoManutencao)) {
            veiculo.historicoManutencao.forEach(manutencao => {
                 // Verifica se data é válida, futura e dentro do limite
                if (manutencao.data instanceof Date && !isNaN(manutencao.data.getTime()) &&
                    manutencao.data > agora && manutencao.data < limite)
                {
                    const dataManutencao = manutencao.data;
                    let quando = '';
                    const hora = dataManutencao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                     const hojeStr = agora.toDateString();
                     const amanhaStr = amanha.toDateString();
                     const dataManutencaoStr = dataManutencao.toDateString();

                    if (dataManutencaoStr === hojeStr) {
                        quando = `HOJE às ${hora}`;
                    } else if (dataManutencaoStr === amanhaStr) {
                        quando = `AMANHÃ às ${hora}`;
                    } else {
                         quando = `em ${dataManutencao.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} às ${hora}`;
                     }
                    lembretes.push(`🔔 LEMBRETE: ${manutencao.tipo} (${veiculo.modelo}) ${quando}.`);
                }
            });
         }
    });


    // Exibe os lembretes se houver algum
    if (lembretes.length > 0) {
        exibirNotificacao(lembretes.join('\n'), 'warning', 10000); // Dura 10 segundos
    }
}