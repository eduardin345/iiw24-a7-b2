// Local: SEU_PROJETO/Models/veiculo.js

import mongoose from 'mongoose';

// 1. Primeiro, definimos o Schema para as Manutenções.
//    Isto será um "subdocumento", ou seja, parte do documento principal do Veículo.
const manutencaoSchema = new mongoose.Schema({
    data: {
        type: Date,
        required: [true, 'A data da manutenção é obrigatória.']
    },
    tipo: {
        type: String,
        required: [true, 'O tipo de serviço é obrigatório.'],
        trim: true
    },
    custo: {
        type: Number,
        required: [true, 'O custo é obrigatório.'],
        min: [0, 'O custo não pode ser negativo.']
    },
    descricao: {
        type: String,
        trim: true
    }
});


// 2. Agora, definimos o Schema principal do Veículo.
const veiculoSchema = new mongoose.Schema({
    // ----- NOTA IMPORTANTE -----
    // Este campo 'owner' é a ligação entre o veículo e o usuário que o cadastrou.
    // É ESSENCIAL para a segurança e para que as suas rotas protegidas funcionem.
    owner: {
        type: mongoose.Schema.Types.ObjectId, // Armazena o ID único de um usuário
        ref: 'User',                          // Diz que este ID se refere a um documento da coleção 'User'
        required: true                        // Todo veículo DEVE ter um dono.
    },
    // ---------------------------

    placa: {
        type: String,
        required: [true, 'A placa é obrigatória.'],
        unique: true, 
        trim: true,
        uppercase: true 
    },
    modelo: {
        type: String,
        required: [true, 'O modelo é obrigatório.'],
        trim: true
    },
    cor: {
        type: String,
        required: [true, 'A cor é obrigatória.'],
        trim: true
    },
    tipoVeiculo: {
        type: String,
        required: true,
        // 'enum' é uma validação que só permite os valores dentro do array.
        enum: ['Carro', 'CarroEsportivo', 'Caminhao'] 
    },
    
    // Campo para CarroEsportivo
    turbo: {
        type: Boolean,
        default: false
    },
    
    // Campos para Caminhao (com validação condicional)
    capacidadeCarga: {
        type: Number,
        // Este campo só é obrigatório se o 'tipoVeiculo' for 'Caminhao'.
        required: function() { return this.tipoVeiculo === 'Caminhao'; },
        min: [0, 'A capacidade de carga não pode ser negativa.']
    },
    
    // A lista de manutenções usará o Schema que definimos acima.
    historicoManutencao: [manutencaoSchema]

}, {
    timestamps: true 
});

// 3. Compilamos e exportamos o modelo.
const Veiculo = mongoose.model('Veiculo', veiculoSchema);
export default Veiculo;