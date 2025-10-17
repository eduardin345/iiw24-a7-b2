// Local: public/js/models/Carro.js

// Importa a classe pai 'Veiculo'
import { Veiculo } from './veiculo.js';

class Carro extends Veiculo {
    // O construtor repassa todos os parâmetros para o construtor da classe Veiculo
    constructor(modelo, cor, id = null, tipoVeiculo = 'Carro', imagemUrl) {
        super(modelo, cor, id, tipoVeiculo, imagemUrl);
    }
}

// Exporta a classe Carro
export { Carro };