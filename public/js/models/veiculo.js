// CORRIGIDO: Adicionado o import da Manutencao
import { Manutencao } from './Manutencao.js';
// CORRIGIDO: Importa as classes filhas para o método estático `fromJSON`
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';


class Veiculo {
    constructor(modelo, cor, id = null, tipoVeiculo = 'Veiculo') {
        this.id = id || `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
        this.modelo = modelo;
        this.cor = cor;
        this.ligado = false;
        this.velocidade = 0;
        this.historicoManutencao = [];
        this.tipoVeiculo = tipoVeiculo;
        this.placa = ''; 
    }

    // (Cole aqui os métodos ligar, desligar, acelerar, etc., que eu enviei anteriormente)
    ligar() { if (this.ligado) return; this.ligado = true; }
    desligar() { if (!this.ligado || this.velocidade > 0) return; this.ligado = false; }
    acelerar(valor) { if (!this.ligado) return; this.velocidade += valor; }
    buzinar() { console.log(`${this.modelo} está buzinando: Beep! Beep!`); }

    adicionarManutencao(manutencao) {
        if (manutencao instanceof Manutencao && manutencao.validar().length === 0) {
            this.historicoManutencao.push(manutencao);
            return true;
        }
        return false;
    }

    getHistoricoHTML() {
        if (this.historicoManutencao.length === 0) return '<p>Nenhum registro.</p>';
        return '<ul>' + this.historicoManutencao.map(m => `<li>${m.formatar()}</li>`).join('') + '</ul>';
    }

    getInfoBasicaHTML() {
        return `<p><strong>Placa:</strong> ${this.placa || 'N/A'}</p> ...`; // etc
    }

    getInfoEspecificaHTML() { return ''; }

    exibirInformacoesCompletaHTML() { return this.getInfoBasicaHTML() + this.getInfoEspecificaHTML(); }
    
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
    // O método `fromJSON` que enviei antes estava correto e continua aqui
    static fromJSON(json) {
        if (!json || !json.tipoVeiculo) return null;
        const idDoVeiculo = json._id || json.id;
        let veiculo;

        try {
            switch (json.tipoVeiculo) {
                case 'Carro': veiculo = new Carro(json.modelo, json.cor, idDoVeiculo); break;
                case 'CarroEsportivo': veiculo = new CarroEsportivo(json.modelo, json.cor, json.turbo, idDoVeiculo); break;
                case 'Caminhao': veiculo = new Caminhao(json.modelo, json.cor, json.capacidadeCarga, json.cargaAtual, idDoVeiculo); break;
                default: return null;
            }
            veiculo.placa = json.placa;
            return veiculo;
        } catch (error) {
            console.error(`Erro ao recriar objeto:`, error);
            return null;
        }
    }
}

// CORRIGIDO: Adiciona a linha de exportação
export { Veiculo };