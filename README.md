# sketchboard-ep1-redes

EP1 da disciplina de Redes de Computadores do curso de Sistemas de Informação da EACH USP.

Este é um EP desenvolvido pelos alunos:

- Caio dos Santos Ambrosio 10687875
- Maurício Ryuzo Tocura 10783100
- Pedro Augusto Santos Giorgi 10828972

Trata-se de um sketch board online, no qual um usuário que esteja conectado a uma determinada room, ao desenhar na tela, todos os outros usuários conectados à mesma room verão em tempo real o que está sendo desenhado e vice-versa.

As principais funcionalidades implementadas foram a de entrar em uma room (determinada pelo proprio usuário, ou seja, o nome que ele der a room será o id dela), desenhar na tela, escolher a cor do traço, escolher a largura do traço, ver quantas pessoas estão conectadas na mesma room e apagar todo o desenho presente na tela.

Este foi um trabalho desenvolvido a partir do node, html5 e css, utilizando as bibliotecas do express, http e socket.io.

Para poder estar utilizando esta aplicação será primeiramente necessário ter instalado em seu computador o node, após isso basta clonar este repositório e, no diretório principal dos aquivos digitar o seguinte comando para instalar as dependências:

npm install

Feito isto basta agora rodar o server, que estará rodando localhost na porta 3000, para isto basta digitar o seguinte comando no diretório principal dos arquivos:

node server.js

Também está incluso um executável, basta abrir o diretório onde está salvo o executável no terminal e digitar ./sketchboard-ep1 (linux) ou clicar duas vezes no .exe no windows, após você verá uma mensagem no temrinal de que o servidor está rodando na porta 3000, bastando apenas digitar localhost:3000 no browser.
