// Local: public/js/models/CarroEsportivo.js

import { Veiculo } from './veiculo.js';

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, id = null, tipoVeiculo = 'CarroEsportivo', imagemUrl, turbo = false) {
        super(modelo, cor, id, tipoVeiculo, imagemUrl);
        this.turbo = turbo;
    }

    ativarTurbo() {
        if (this.turbo) {
            throw new Error('O turbo já está ativado!');
        }
        if (!this.ligado) {
             throw new Error('Ligue o carro antes de ativar o turbo!');
        }
        this.turbo = true;
    }

    desativarTurbo() {
        if (!this.turbo) {
            throw new Error('O turbo já está desativado.');
        }
        this.turbo = false;
    }

    getInfoEspecificaHTML() {
        return `<p><strong>Turbo:</strong> <span class="status-${this.turbo ? 'on' : 'off'}">${this.turbo ? 'Ativado' : 'Desativado'}</span></p>`;
    }
}

export { CarroEsportivo };