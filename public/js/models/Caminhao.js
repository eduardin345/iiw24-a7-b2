// Local: public/js/models/Caminhao.js

import { Veiculo } from './veiculo.js';

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga, id = null, tipoVeiculo = 'Caminhao', imagemUrl, cargaAtual = 0) {
        super(modelo, cor, id, tipoVeiculo, imagemUrl);
        this.capacidadeCarga = Math.max(0, parseFloat(capacidadeCarga) || 0);
        this.cargaAtual = Math.max(0, parseFloat(cargaAtual) || 0);
    }

    _validarPeso(peso) {
         const pesoNumerico = parseFloat(peso);
         if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
             throw new Error('Peso inválido. Insira um número positivo.');
         }
         return pesoNumerico;
    }

    carregar(peso) {
        const pesoNumerico = this._validarPeso(peso);
        if (this.cargaAtual + pesoNumerico > this.capacidadeCarga) {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            throw new Error(`Carga excede a capacidade! Espaço livre: ${espacoLivre.toLocaleString('pt-BR')}kg.`);
        }
        this.cargaAtual += pesoNumerico;
    }

    descarregar(peso) {
        const pesoNumerico = this._validarPeso(peso);
        if (this.cargaAtual < pesoNumerico) {
            throw new Error(`Não é possível descarregar ${pesoNumerico.toLocaleString('pt-BR')}kg. Carga atual é ${this.cargaAtual.toLocaleString('pt-BR')}kg.`);
        }
        this.cargaAtual -= pesoNumerico;
    }

    getInfoEspecificaHTML() {
        const percentual = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
        return `
            <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
            <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percentual.toFixed(1)}%)</p>
            <progress value="${this.cargaAtual}" max="${this.capacidadeCarga}" style="width: 100%; height: 15px;"></progress>
        `;
    }
}

export { Caminhao };