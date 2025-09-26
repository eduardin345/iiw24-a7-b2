// Local do arquivo: backend/middleware/auth.js

// Importamos a biblioteca que sabe como ler e verificar os tokens JWT
import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticação.
 * Esta função roda antes das rotas que ela protege.
 * @param {object} req - O objeto da requisição, enviado pelo cliente.
 * @param {object} res - O objeto da resposta, que será enviado de volta.
 * @param {function} next - Uma função que, se chamada, passa a requisição para a próxima etapa (a lógica da rota).
 */
function authMiddleware(req, res, next) {

    // 1. O guarda verifica o cabeçalho 'Authorization'.
    // O frontend deve enviar algo como: 'Authorization: Bearer eyJhbGciOiJIUzI1Ni...'
    const authHeader = req.headers.authorization;

    // 2. Se não houver cabeçalho ou ele não começar com 'Bearer ',
    // a pessoa é barrada na porta imediatamente.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso negado. Token de autenticação não fornecido ou em formato inválido.' });
    }

    // 3. A "credencial" vem no formato "Bearer <token>".
    // Precisamos separar e pegar apenas a parte do token, ignorando o "Bearer ".
    const token = authHeader.split(' ')[1];
    
    // Se, por algum motivo, o token não estiver lá depois de "Bearer ", a pessoa é barrada.
    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Token não encontrado.' });
    }

    try {
        // 4. O guarda tenta validar a credencial (o token).
        // Ele usa o SEGREDO do nosso servidor (.env) para verificar se o token é autêntico.
        // Se o token foi alterado ou está expirado, esta linha dará um erro e o código pulará para o 'catch'.
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. SE O TOKEN FOR VÁLIDO:
        // O guarda anota quem é a pessoa (o ID do usuário que estava dentro do token)
        // em um "crachá temporário" no objeto 'req'.
        // Agora, todas as rotas que rodarem DEPOIS deste middleware terão acesso a 'req.userId'.
        req.userId = decodedPayload.userId;
        
        // 6. O guarda diz "pode passar!". A função next() passa a requisição
        // para a sua rota final (ex: o código do app.get('/api/veiculos', ...)).
        next();

    } catch (error) {
        // 7. SE O TOKEN FOR INVÁLIDO (deu erro no jwt.verify):
        // O guarda barra a pessoa na porta e avisa que a credencial é inválida.
        res.status(401).json({ error: 'Token inválido ou expirado. Faça o login novamente.' });
    }
}

// Exportamos a função "guardião" para que possamos usá-la em outros arquivos (como o server.js)
export default authMiddleware;