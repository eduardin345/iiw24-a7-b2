import { Manutencao } from './Manutencao.js';

class Veiculo {
    constructor(modelo, cor, id = null, tipoVeiculo = 'Veiculo') {
        this.id = id || `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = [];
        this.tipoVeiculo = tipoVeiculo;
        this.placa = ''; // Placa será preenchida posteriormente
    }

    ligar() {
        if (this.ligado) {
            console.warn(`${this.modelo} já está ligado.`);
            return;
        }
        this.ligado = true;
    }

    desligar() {
        if (!this.ligado) {
            console.warn(`${this.modelo} já está desligado.`);
            return;
        }
        if (this.velocidade > 0) {
            console.error(`Não é possível desligar ${this.modelo} em movimento!`);
            return;
        }
        this.ligado = false;
    }

    acelerar(valor) {
        if (!this.ligado) {
            console.error(`Ligue o ${this.modelo} antes de acelerar.`);
            return;
        }
        this.velocidade = Math.max(0, this.velocidade + (valor || 10));
    }
    
    buzinar() {
        console.log(`${this.modelo} está buzinando: Beep! Beep!`);
    }

    adicionarManutencao(manutencao) {
        if (manutencao instanceof Manutencao && manutencao.validar().length === 0) {
            this.historicoManutencao.push(manutencao);
            return true;
        }
        return false;
    }
    
    removerManutencaoPorId(idManutencao) {
        const index = this.historicoManutencao.findIndex(m => m.id === idManutencao);
        if (index > -1) {
            this.historicoManutencao.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getHistoricoHTML() {
        if (this.historicoManutencao.length === 0) {
            return '<p>Nenhum registro de manutenção.</p>';
        }
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
        return '';
    }
    
    exibirInformacoesCompletaHTML() {
        return this.getInfoBasicaHTML() + this.getInfoEspecificaHTML();
    }
    
    toJSON() {
        return {
            id: this.id,
            placa: this.placa,
            modelo: this.modelo,
            cor: this.cor,
            ligado: this.ligado,
            velocidade: this.velocidade,
            tipoVeiculo: this.tipoVeiculo,
            historicoManutencao: this.historicoManutencao.map(m => m.toJSON())
        };
    }
}

export { Veiculo };