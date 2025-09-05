// ====================================================================
// ============ LÓGICA DO MÓDULO DE PREVISÃO DO TEMPO =================
// ====================================================================

// --- 1. SELETORES DO DOM ---
const cidadeInput = document.getElementById('cidade-input');
const verificarClimaBtn = document.getElementById('verificar-clima-btn');
const previsaoResultadoDiv = document.getElementById('previsao-tempo-resultado');
const conselhosGaragemDiv = document.getElementById('conselhos-garagem');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessageDiv = document.getElementById('error-message');

// --- 2. LÓGICA DE CHAMADA À API (com detecção de ambiente) ---
async function buscarPrevisaoDetalhada(cidade) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendApiUrlBase = isLocal ? 'http://localhost:3001' : 'https://iiw24-a7-b2.onrender.com';
    const backendUrl = `${backendApiUrlBase}/api/previsao/${encodeURIComponent(cidade)}`;

    console.log(`[Frontend] Solicitando previsão para: ${cidade} via backend em ${backendUrl}`);
    try {
        const response = await fetch(backendUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
            throw new Error(errorData.error || errorData.message);
        }
        return await response.json();
    } catch (error) {
        console.error("[Frontend] Erro ao buscar previsão detalhada do backend:", error);
        throw error;
    }
}

// --- 3. FUNÇÕES DE PROCESSAMENTO E RENDERIZAÇÃO ---
function processarDadosForecastDiario(dataApi) {
    if (!dataApi?.list?.length) return [];
    const previsoesPorDia = dataApi.list.reduce((acc, item) => {
        const diaISO = item.dt_txt.split(' ')[0];
        if (!acc[diaISO]) acc[diaISO] = { temps: [], weathers: [], hourlyData: [] };
        acc[diaISO].temps.push(item.main.temp);
        acc[diaISO].weathers.push(item.weather[0]);
        acc[diaISO].hourlyData.push(item);
        return acc;
    }, {});

    return Object.entries(previsoesPorDia).map(([diaKey, diaData]) => {
        const representativeWeather = diaData.weathers[Math.floor(diaData.weathers.length / 2)] || diaData.weathers[0];
        return {
            data: diaKey,
            temp_min: Math.min(...diaData.temps),
            temp_max: Math.max(...diaData.temps),
            descricao: representativeWeather.description,
            icone: representativeWeather.icon,
            mainCondition: representativeWeather.main.toLowerCase(),
            hourlyDataForThisDay: diaData.hourlyData,
        };
    }).slice(0, 5);
}

function exibirPrevisaoDetalhada(previsaoDiaria, nomeCidade) {
    previsaoResultadoDiv.innerHTML = `<h2>Previsão para <span class="nome-cidade">${nomeCidade}</span> (5 dias):</h2>`;
    const containerDias = document.createElement('div');
    containerDias.className = 'container-previsao-dias';
    
    previsaoDiaria.forEach(dia => {
        const dataObj = new Date(dia.data + 'T12:00:00'); // Use meio-dia para evitar problemas de fuso
        const nomeDia = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dataCurta = dataObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia-previsao-item';
        diaDiv.innerHTML = `
            <h3>${nomeDia}</h3>
            <span class="data-curta">${dataCurta}</span>
            <img class="weather-icon-daily" src="https://openweathermap.org/img/wn/${dia.icone}@4x.png" alt="${dia.descricao}" title="${dia.descricao}">
            <p class="temperaturas">
                <span class="temp-max">${dia.temp_max.toFixed(0)}°</span> | <span class="temp-min">${dia.temp_min.toFixed(0)}°</span>
            </p>
            <p class="descricao-tempo">${dia.descricao}</p>`;
        containerDias.appendChild(diaDiv);
    });
    previsaoResultadoDiv.appendChild(containerDias);
}

function exibirConselhosGaragem(previsaoDiaria) {
    let dicas = [];
    previsaoDiaria.forEach(dia => {
        if (dia.mainCondition.includes('rain') || dia.mainCondition.includes('thunderstorm')) {
            dicas.push('<li>🌧️ Dias de chuva à frente! Verifique a condição dos limpadores de para-brisa.</li>');
        }
        if (dia.temp_max > 29) {
            dicas.push('<li>☀️ Previsão de calor intenso. Evite deixar eletrônicos ou itens sensíveis no carro.</li>');
        }
        if (dia.temp_min < 10) {
            dicas.push('<li>❄️ Manhãs frias podem afetar a bateria. Se o carro demorar a pegar, considere uma verificação.</li>');
        }
    });
    
    if (dicas.length > 0) {
        // Remove duplicadas e pega as 2 primeiras
        const dicasUnicas = [...new Set(dicas)].slice(0, 2); 
        conselhosGaragemDiv.innerHTML = '<h3>💡 Dicas da Garagem:</h3><ul>' + dicasUnicas.join('') + '</ul>';
    } else {
        conselhosGaragemDiv.innerHTML = '<h3>💡 Dicas da Garagem:</h3><ul><li>Tempo estável previsto. Perfeito para um passeio!</li></ul>';
    }
}

// --- 4. FUNÇÃO PRINCIPAL / HANDLER DE EVENTO ---
async function handleVerificarClima() {
    const cidade = cidadeInput.value.trim();
    if (!cidade) {
        errorMessageDiv.textContent = "Por favor, digite o nome de uma cidade.";
        errorMessageDiv.style.display = 'block';
        return;
    }
    
    errorMessageDiv.style.display = 'none';
    loadingSpinner.style.display = 'flex';
    previsaoResultadoDiv.innerHTML = '';
    conselhosGaragemDiv.innerHTML = '';

    try {
        const dadosApi = await buscarPrevisaoDetalhada(cidade);
        const previsaoProcessada = processarDadosForecastDiario(dadosApi);
        if (previsaoProcessada.length > 0) {
            exibirPrevisaoDetalhada(previsaoProcessada, dadosApi.city.name);
            exibirConselhosGaragem(previsaoProcessada);
        } else {
            errorMessageDiv.textContent = `Não encontramos dados para "${cidade}". Verifique o nome.`;
            errorMessageDiv.style.display = 'block';
        }
    } catch (error) {
        errorMessageDiv.textContent = `Erro ao buscar previsão: ${error.message}`;
        errorMessageDiv.style.display = 'block';
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// --- 5. INICIALIZAÇÃO ---
if (verificarClimaBtn) verificarClimaBtn.addEventListener('click', handleVerificarClima);
if (cidadeInput) cidadeInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleVerificarClima(); });