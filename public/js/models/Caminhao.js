import { Veiculo } from './veiculo.js';

class Caminhao extends Veiculo {
    constructor(modelo, cor, capacidadeCarga, cargaAtual = 0, id = null) {
        super(modelo, cor, id, 'Caminhao');
        this.capacidadeCarga = Math.max(0, parseFloat(capacidadeCarga) || 0);
        this.cargaAtual = Math.max(0, parseFloat(cargaAtual) || 0);
    }

    _validarPeso(peso) {
         const pesoNumerico = parseFloat(peso);
         if (isNaN(pesoNumerico) || pesoNumerico <= 0) {
             window.exibirNotificacao('Peso inválido. Insira um número positivo.', 'error');
             return null;
         }
         return pesoNumerico;
    }

    carregar(peso) {
        const pesoNumerico = this._validarPeso(peso);
        if (pesoNumerico === null) return;

        if (this.cargaAtual + pesoNumerico <= this.capacidadeCarga) {
            this.cargaAtual += pesoNumerico;
            window.exibirNotificacao(`Caminhão carregado com ${pesoNumerico.toLocaleString('pt-BR')} kg. Carga atual: ${this.cargaAtual.toLocaleString('pt-BR')} kg.`, 'success');
            // A função window.atualizar... foi criada no main.js para resolver o bug
            window.atualizarInfoVeiculoNoModal(this.id);
        } else {
            const espacoLivre = this.capacidadeCarga - this.cargaAtual;
            window.exibirNotificacao(`Carga (${pesoNumerico.toLocaleString('pt-BR')}kg) excede a capacidade! Espaço livre: ${espacoLivre.toLocaleString('pt-BR')}kg.`, 'error');
        }
    }

    descarregar(peso) {
        const pesoNumerico = this._validarPeso(peso);
         if (pesoNumerico === null) return;

        if (this.cargaAtual >= pesoNumerico) {
            this.cargaAtual -= pesoNumerico;
            window.exibirNotificacao(`Caminhão descarregado em ${pesoNumerico.toLocaleString('pt-BR')} kg. Carga atual: ${this.cargaAtual.toLocaleString('pt-BR')} kg.`, 'success');
            // A função window.atualizar... foi criada no main.js para resolver o bug
            window.atualizarInfoVeiculoNoModal(this.id);
        } else {
            window.exibirNotificacao(`Não é possível descarregar ${pesoNumerico.toLocaleString('pt-BR')}kg. Carga atual é ${this.cargaAtual.toLocaleString('pt-BR')}kg.`, 'error');
        }
    }

    getInfoEspecificaHTML() {
        const percentualCarga = this.capacidadeCarga > 0 ? (this.cargaAtual / this.capacidadeCarga) * 100 : 0;
        return `
            <p><strong>Capacidade:</strong> ${this.capacidadeCarga.toLocaleString('pt-BR')} kg</p>
            <p><strong>Carga Atual:</strong> ${this.cargaAtual.toLocaleString('pt-BR')} kg (${percentualCarga.toFixed(1)}%)</p>
            <progress value="${this.cargaAtual}" max="${this.capacidadeCarga}" style="width: 100%; height: 15px;"></progress>
        `;
    }

    toJSON() {
        const json = super.toJSON();
        json.capacidadeCarga = this.capacidadeCarga;
        json.cargaAtual = this.cargaAtual;
        return json;
    }
}

export { Caminhao };