// Classe CarroEsportivo (Herda de Veiculo)
class CarroEsportivo extends Veiculo {
    constructor(modelo, cor, turbo = false, id = null) {
        super(modelo, cor, id, 'CarroEsportivo');
        this.turbo = turbo;
    }

    ativarTurbo() {
        if (this.turbo) {
            exibirNotificacao('Turbo já está ativado!', 'warning');
            return;
        }
        if (!this.ligado) {
            exibirNotificacao('Ligue o carro esportivo antes de ativar o turbo!', 'error');
            return;
        }
        this.turbo = true;
        exibirNotificacao('🚀 Turbo ativado!', 'success');
        atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
    }

    desativarTurbo() {
        if (!this.turbo) {
            exibirNotificacao('Turbo já está desativado!', 'warning');
            return;
        }
        this.turbo = false;
        exibirNotificacao('Turbo desativado.', 'info');
        atualizarInfoVeiculoNoModal(this.id);
        salvarGaragem();
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
