import mongoose from 'mongoose';

// 1. Definir o Schema para os documentos aninhados (subdocumentos)
const manutencaoSchema = new mongoose.Schema({
    data: {
        type: Date,
        required: [true, 'A data da manutenção é obrigatória.'],
        default: Date.now
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
}, { _id: true }); // Mongoose adicionará um _id a cada manutenção por padrão


// 2. Definir o Schema Principal do Veículo
const veiculoSchema = new mongoose.Schema({
    placa: {
        type: String,
        required: [true, 'A placa é obrigatória.'],
        unique: true, // Garante que não hajam duas placas iguais no banco
        trim: true,
        uppercase: true // Sempre salva a placa em maiúsculas para consistência
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
        // Enum garante que apenas estes valores são permitidos
        enum: ['Carro', 'CarroEsportivo', 'Caminhao'] 
    },

    // --- Campos Específicos para cada tipo ---
    
    // Campo para CarroEsportivo
    turbo: {
        type: Boolean,
        default: false
    },
    
    // Campos para Caminhao
    capacidadeCarga: {
        type: Number,
        // Este campo só é obrigatório se o tipoVeiculo for 'Caminhao'
        required: function() { return this.tipoVeiculo === 'Caminhao'; },
        min: [0, 'A capacidade de carga não pode ser negativa.']
    },
    cargaAtual: {
        type: Number,
        default: 0,
        min: [0, 'A carga atual não pode ser negativa.']
    },

    // --- Campo de Array com Subdocumentos ---
    historicoManutencao: [manutencaoSchema]

}, {
    // 3. Opções do Schema
    timestamps: true // Adiciona os campos `createdAt` e `updatedAt` automaticamente
});


// 4. Compilar o Schema em um Modelo
const Veiculo = mongoose.model('Veiculo', veiculoSchema);

// 5. Exportar o Modelo
export default Veiculo;