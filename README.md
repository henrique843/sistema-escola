# Sistema de Gestão Escolar

Este projeto é um desafio técnico de Front-end que simula um sistema de gerenciamento de alunos, professores e suas relações acadêmicas (Séries e Turmas).

O objetivo principal foi criar uma aplicação funcional sem o uso de frameworks (apenas JavaScript Puro), simulando o consumo de uma API através de arquivos JSON e persistindo dados entre navegações.

 **[Acesse o projeto online aqui](https://henrique843.github.io/sistema-escola/tela1.html)**

## Funcionalidades

### Tela 1: Gestão de Alunos
- **Listagem e Filtros:** Visualização de alunos com filtros dinâmicos por Série (Degree) e Turma (Class) baseados em JSON.
- **Edição Inline:** Possibilidade de editar nome, série e turma do aluno diretamente na tabela.
- **Gerador de Dados:** Botão que gera +300 alunos aleatórios para teste de performance e visualização.
- **Dashboard:** Gráfico interativo (Chart.js) que atualiza em tempo real mostrando a distribuição de alunos por série.
- **Persistência:** Os alunos gerados ou editados são salvos no `localStorage`, permitindo que sejam acessados na Tela 2.

### Tela 2: Gestão de Professores
- **Relacionamentos Complexos:** Visualização de quais matérias e turmas cada professor leciona.
- **Integração entre Telas:** O "Botão Mágico" (Ver Alunos) abre um modal listando os alunos reais daquela série (trazidos da Tela 1 via LocalStorage).
- **Cadastro:** Formulário inteligente para criar novos vínculos de Professor/Matéria/Turma, com validação de duplicidade.

## Tecnologias Utilizadas

- **HTML5 & CSS3:** Estrutura semântica e estilização responsiva.
- **JavaScript (ES6+):**
  - `fetch` API com `async/await` para leitura de arquivos JSON locais.
  - Manipulação avançada do DOM.
  - `localStorage` para simular um banco de dados persistente no navegador.
- **Chart.js:** Biblioteca para renderização dos gráficos.
- **JSON:** Utilizado como "banco de dados" estático simulando uma API REST.

## Estrutura do Projeto

O projeto segue uma arquitetura organizada para separar responsabilidades:

/ ├── Css/ # Estilos globais ├── Js/ # Lógica da aplicação (separada por tela) ├── Json/ # "Database" (arquivos estáticos consumidos via fetch) ├── tela1.html # View de Alunos └── tela2.html # View de Professores


## Como rodar localmente

Como este projeto utiliza a Fetch API para ler arquivos JSON locais, ele precisa ser servido via protocolo HTTP (e não apenas abrindo o arquivo direto no navegador, devido a políticas de CORS).

1. Clone o repositório.
2. Abra a pasta no **VS Code**.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `tela1.html` e escolha **"Open with Live Server"**.
