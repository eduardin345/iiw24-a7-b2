// Local: SEU_PROJETO/Models/user.js

import mongoose from 'mongoose';

// O Schema é a "planta" do nosso documento de usuário.
const userSchema = new mongoose.Schema({
    email: {
        type: String, 
        required: [true, 'O e-mail é obrigatório.'], // Campo obrigatório
        unique: true,                                 // Garante que não existam dois e-mails iguais
        lowercase: true,                              // Salva sempre em letras minúsculas
        trim: true                                    // Remove espaços em branco do início e do fim
    },
    password: {
        type: String, 
        required: [true, 'A senha é obrigatória.']    // A senha (já criptografada) é obrigatória
    }
}, { 
    // Opções do Schema:
    timestamps: true // Adiciona automaticamente os campos `createdAt` e `updatedAt`
});

// "Compilamos" o Schema em um Modelo que o Mongoose pode usar para interagir com o banco.
const User = mongoose.model('User', userSchema);

// Exportamos o modelo para ser usado em outros arquivos (como no server.js).
export default User;