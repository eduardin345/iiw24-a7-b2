// Local: public/js/models/veiculo.js

// Importamos a classe Manutencao, que será usada para o histórico
import { Manutencao } from './Manutencao.js';

class Veiculo {
    // Este é o construtor correto, aceitando a URL da imagem como parâmetro.
    constructor(modelo, cor, id = null, tipoVeiculo = 'Veiculo', imagemUrl = 'assets/img/mclaren.jpg') {
        this.id = id || `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = [];
        this.tipoVeiculo = tipoVeiculo;
        this.placa = ''; // Placa será preenchida pelos dados do backend
       
    }

    ligar() {
        if (this.ligado) {
            throw new Error(`${this.modelo} já está ligado.`);
        }
        this.ligado = true;
    }

    desligar() {
        if (!this.ligado) {
            throw new Error(`${this.modelo} já está desligado.`);
        }
        if (this.velocidade > 0) {
            throw new Error(`Não é possível desligar ${this.modelo} em movimento!`);
        }
        this.ligado = false;
    }

    acelerar(valor) {
        if (!this.ligado) {
            throw new Error(`Ligue o ${this.modelo} antes de acelerar.`);
        }
        this.velocidade = Math.max(0, this.velocidade + (valor || 10));
    }
    
    buzinar() {
        // Retorna a mensagem para ser exibida pelo `main.js`
        return `${this.modelo} está buzinando: Beep! Beep!`;
    }

    adicionarManutencao(manutencao) {
        if (manutencao instanceof Manutencao && manutencao.validar().length === 0) {
            this.historicoManutencao.push(manutencao);
            return true;
        }
        return false;
    }
    
    getHistoricoHTML() {
        if (this.historicoManutencao.length === 0) {
            return '<p>Nenhum registro de manutenção para este veículo.</p>';
        }
        // Ordena as manutenções pela data mais recente antes de exibi-las
        this.historicoManutencao.sort((a, b) => new Date(b.data) - new Date(a.data));
        return '<ul>' + this.historicoManutencao.map(m => `<li>${m.formatar()}</li>`).join('') + '</ul>';
    }

    getInfoBasicaHTML() {
        return `
            <p><strong>Placa:</strong> ${this.placa || 'N/A'}</p>
            <p><strong>Modelo:</strong> ${this.modelo}</p>
            <p><strong>Cor:</strong> ${this.cor}</p>
            <p><strong>Status:</strong> <span class="status-${this.ligado ? 'on' : 'off'}">${this.ligado ? 'Ligado' : 'Desligado'}</span></p>
            <p><strong>Velocidade:</strong> ${this.velocidade} km/h</p>
        `;
    }

    getInfoEspecificaHTML() {
        // Este método será sobrescrito pelas classes filhas, se necessário.
        return '';
    }
    
    exibirInformacoesCompletaHTML() {
        // Combina as informações básicas com as específicas
        return this.getInfoBasicaHTML() + this.getInfoEspecificaHTML();
    }
}

// Exporta a classe para que outros arquivos possam importá-la
export { Veiculo };