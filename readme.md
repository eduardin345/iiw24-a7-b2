# 🚗 Garagem Inteligente Unificada 🔧

## Visão Geral

A Garagem Inteligente Unificada é uma aplicação web completa que combina um simulador de veículos, um robusto sistema de gerenciamento de garagem com persistência de dados e um módulo de previsão do tempo. Desenvolvida com HTML, CSS e JavaScript puro (OOP), a aplicação busca dados de um backend Node.js próprio, publicado na nuvem, que serve tanto um "arsenal de dados" quanto a previsão do tempo via proxy.

Este projeto demonstra conceitos de Herança, Polimorfismo, manipulação do DOM, LocalStorage e comunicação cliente-servidor (Frontend-Backend).

---

## 🚀 Demo Ao Vivo

**Experimente a aplicação completa em funcionamento:**

**https://garagem-inteligente-unificada.vercel.app/** 
*(Exemplo, substitua pelo seu link Vercel/Netlify)*

---

## ✨ Funcionalidades Principais

*   **Simulador de Veículos:** Um "test drive" rápido com Carros, Carros Esportivos e Caminhões.
*   **Gerenciamento de Garagem:** Adicione e gerencie uma garagem persistente de veículos, salva no LocalStorage.
*   **Detalhes e Manutenção:** Modal interativo para ver detalhes, executar ações (ligar, acelerar, ativar turbo) e gerenciar histórico de manutenções.
*   **Previsão do Tempo:** Módulo que consome uma API externa através do nosso backend para exibir a previsão.
*   **Conteúdo Dinâmico do Backend:**
    *   Exibe **Veículos em Destaque**.
    *   Lista os **Serviços Oferecidos**.
    *   Apresenta **Dicas Rápidas de Manutenção**.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+ Classes), Flatpickr
*   **Backend:** Node.js, Express, Axios, DotEnv
*   **Hospedagem:**
    *   Frontend: Vercel / Netlify / GitHub Pages
    *   Backend: Render

---

## ⚙️ Como Executar Localmente

O código do frontend detecta automaticamente se está rodando localmente (`localhost`) ou na nuvem, e aponta para o backend correto.

### 1. Backend

1.  Clone o repositório para sua máquina.
2.  Navegue até a pasta do projeto no seu terminal.
3.  Crie um arquivo `.env` na raiz do projeto e adicione sua chave da OpenWeatherMap:
    ```
    OPENWEATHER_API_KEY=sua_chave_secreta_aqui
    ```
4.  Instale as dependências do Node.js:
    ```bash
    npm install
    ```
5.  Inicie o servidor backend:
    ```bash
    node server.js
    ```
    O servidor estará escutando em `http://localhost:3001`. Mantenha este terminal aberto.

### 2. Frontend

1.  Com o servidor backend rodando, abra o arquivo `index.html` em seu navegador.
2.  A maneira mais fácil é usar uma extensão como o **"Live Server"** no VS Code.
3.  O frontend se conectará automaticamente ao seu backend local em `localhost:3001`.

---

## 📖 API Endpoints Implementados

O backend (publicado em **`https://iiw24-a7-b2.onrender.com`**) expõe os seguintes endpoints GET:

*   **`GET /api/garagem/veiculos-destaque`**
    *   **Descrição:** Retorna uma lista de veículos em destaque para a vitrine.
    *   **Exemplo de Resposta:** `[{"modelo":"McLaren P1","ano":2015,"destaque":"Um ícone híbrido da performance.","imagemUrl":"img/mclaren.jpg"}, ...]`

*   **`GET /api/garagem/servicos-oferecidos`**
    *   **Descrição:** Retorna a lista de serviços que a garagem oferece.
    *   **Exemplo de Resposta:** `[{"nome":"Alinhamento e Balanceamento","descricao":"...","precoEstimado":"R$ 180,00"}, ...]`

*   **`GET /api/garagem/dicas-manutencao`**
    *   **Descrição:** Retorna uma lista de dicas rápidas sobre manutenção veicular.
    *   **Exemplo de Resposta:** `[{"dica":"Verifique o nível do óleo do motor a cada 1.000 km."}, ...]`
    
*   **`GET /api/previsao/:cidade`**
    *   **Descrição:** Atua como um proxy para a API OpenWeatherMap, retornando a previsão do tempo para a cidade especificada de forma segura.
    *   **Exemplo de Chamada:** `/api/previsao/curitiba`

---

## 👋 Contato

*   **Nome:** Eduardo
*   **GitHub:** [https://github.com/eduardo345]