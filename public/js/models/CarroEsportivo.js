import { Veiculo } from './veiculo.js';

class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, turbo = false, id = null) {
        super(modelo, cor, id, 'CarroEsportivo');
        this.turbo = turbo;
    }

    ativarTurbo() {
        if (this.turbo) {
            return; // Evita notificação se já está ativado
        }
         if (!this.ligado) {
             throw new Error('Ligue o carro esportivo antes de ativar o turbo!');
         }
        this.turbo = true;
    }

    desativarTurbo() {
        if (!this.turbo) {
            return;
        }
        this.turbo = false;
    }

    getInfoEspecificaHTML() {
        return `<p><strong>Turbo:</strong> <span class="status-${this.turbo ? 'on' : 'off'}">${this.turbo ? 'Ativado' : 'Desativado'}</span></p>`;
    }

    toJSON() {
        const json = super.toJSON();
        json.turbo = this.turbo;
        return json;
    }
}

export { CarroEsportivo };