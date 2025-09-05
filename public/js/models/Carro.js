// CORRIGIDO: Adiciona o import com o caminho relativo correto
import { Veiculo } from './veiculo.js';

class Carro extends Veiculo {
    constructor(modelo, cor, id = null) {
        super(modelo, cor, id, 'Carro');
    }
}

// CORRIGIDO: Adiciona a exportação
export { Carro };