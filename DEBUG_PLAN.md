# Plano de Caça-Fantasma - Garagem Inteligente Unificada

## Prioridade Alta (Bugs Críticos)

- [ ] **Problema:** As seções "Veículos em Destaque", "Serviços", "Dicas" e a "Previsão do Tempo" não carregam no frontend.
  - **Hipótese:** As requisições `fetch` para os endpoints `/api/garagem/*` e `/api/previsao/:cidade` estão falhando ou demorando para sempre. A análise do `server.js` revelou que as funções desses endpoints estão vazias, fazendo com que o servidor não envie nenhuma resposta.
  - **Como Investigar:**
    1.  Abrir a aba 'Network' no console do navegador e observar as requisições para esses endpoints. Verificar se o status delas fica como "(pending)".
    2.  Confirmar no código `server.js` que as funções das rotas estão vazias.
  - **Plano de Correção:** Implementar a lógica que retorna os dados estáticos ou faz a chamada à API externa dentro de cada rota correspondente no `server.js`.

- [ ] **Problema:** A aplicação pode quebrar ao tentar registrar um usuário ou realizar qualquer operação de banco de dados.
  - **Hipótese:** O servidor está tentando importar o modelo `User` de dentro da pasta `public` (`./public/js/models/user.js`). Arquivos de backend não devem estar em pastas públicas. Isso pode causar falhas inesperadas de resolução de módulo ou erros de segurança.
  - **Como Investigar:**
    1.  Verificar a linha `import User from './public/js/models/user.js';` no `server.js`.
    2.  Verificar a estrutura de pastas do projeto.
  - **Plano de Correção:** Mover o arquivo `user.js` da pasta `public/js/models` para a pasta `Models` na raiz do backend e atualizar a linha de importação no `server.js` para `import User from './Models/user.js';`.

## Prioridade Média (Melhorias e Boas Práticas)

- [ ] **Problema:** Dependência `bcryptjs` está instalada, mas o código utiliza `bcrypt`.
  - **Hipótese:** A dependência `bcryptjs` é redundante e está apenas inflando o `node_modules` e o `package.json`.
  - **Como Investigar:**
    1.  Revisar `package.json` para confirmar a presença das duas dependências.
    2.  Fazer uma busca global no projeto por "bcryptjs" para garantir que não está sendo usado em nenhum lugar.
  - **Plano de Correção:** Executar o comando `npm uninstall bcryptjs` para remover a dependência desnecessária.

## Prioridade Baixa (Bugs Menores)

- (Nenhum bug menor óbvio foi encontrado na análise do backend. Focar nos bugs críticos primeiro e depois testar a interface para identificar problemas de UX/UI.)