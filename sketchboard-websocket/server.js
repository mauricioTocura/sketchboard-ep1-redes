/*   declaração dos bibliotecas necessárias   */
const express = require('express')
const http = require('http')
const webSocket = require('ws')

const PORT = 3000

/*  criação da aplicação web e do servidor http  */
const app = express()
const server = http.createServer(app)

/*  criação do websocket que ficará escutando o servidor http criado anteriormente  */
const wss = new webSocket.Server({ server })

/*  torna os arquivos dentro do diretório public estáticos para serem renderizados no browser  */
app.use(express.static(__dirname + '/public'))

/*  
    variáveis que irão armazenar o histórico do que foi desenhado na tela 
    e quais são os clients que estão conectados no nosso servidor.
    As inspirações para termos um histórico de desenho e um array de clients vieram
    dos seguintes vídeos no youtube, respectivamente:
    https://youtu.be/s-RCuZflUe4
    https://youtu.be/V_6HVTdVHKI
*/
let drawHistory = []
let clients = []

/*
    Event listener que lida com as novas conexões, ou seja, para cada nova conexão
    será executado todos as funções que estão presentes na função de callback
    que recebe como parâmetro as informações do socket conectado
*/
wss.on('connection', socket => {

    /*
        Todas as trocas de informações feitas entre o cliente e o servidor são feitas através 
        do event listener 'message', que indica que estamos recebendo alguma informação do client.
        Neste nosso caso recebemos um JSON (única forma para podermos passar um objeto como parâmetro) 
        e o transformamos de volta para um objeto, para que assim possamos lidar com diversos tipos de eventos.
    */
    socket.on('message', drawData => {

        const data = JSON.parse(drawData)

        /*
            "Evento" para lidar com o "login" de um usuário em uma determinada room.
            Como o socket (conexão) atual não possui um id, atribuímos o username como 
            sendo o id, atribuímos a qual room o client atual está conectado e identificamos 
            que é a primeira vez que ele está entrando na room, para que caso já tenha algo 
            desenhado nela, ele também veja.
        */
        if(data.event == 'joinRoom') {
            socket.id = data.username
            socket.room = data.room
            socket.firsTime = true
            clients.push(socket)
        }

        /*
            Caso seja a primeira vez que o usuário está entrando na room e a mesma possui 
            já um histórico de desenho, o client atual recebe esse histórico, podendo então 
            o que estava desenhado antes dele ingressar na room.
        */
        if(drawHistory.length > 0 && socket.firsTime) {
            socket.firsTime = false

            drawHistory.forEach(history => {
                broadcast(history, socket)
            })
        }
        
        /*
            "Evento" para lidar com as informações do que está sendo desenhado na tela, essas 
            informações são primeiramente armazenadas no histórico de desenho e depois repassadas 
            para todos os clientes conectados na mesma room.
        */
        if(data.event == 'draw') {
            drawHistory.push(drawData)
            broadcast(drawData, socket)
        }

        /*
            "Evento" para lidar com a função de limpar tudo o que está desenhado na tela,
            então primeiramente apaga-se do histórico de desenho somente as informações
            relacionadas à room que está solicitando tal função, e então repassamos essa
            informação de volta para o client
        */
        if(data.event == 'clearCanvas') {
            drawHistory = drawHistory.filter(history => {
                let data = JSON.parse(history)
                if(data.room !== socket.room) {
                    return history
                }
            })
            broadcast(drawData, socket)
        }

        /*
            Sempre que o servidor recebe alguma informação do client atualizamos também quantos
            usuários estão conectados na room.
        */
        broadcast(JSON.stringify({ event: 'usersConnected', count: 0 }), socket)
    })

    /*
        Evento para lidar com a disconexão de algum client, removemos então ele do array de clients
        conectados e atualizamos o número de usuários conectados àquela room.
    */
    socket.on('close', () => {
        let leavingUser = socket.id
        clients = clients.filter(user => {
            if(user.id !== leavingUser) {
                return user
            }
        })
        broadcast(JSON.stringify({ event: 'usersConnected', count: 0 }), socket)
    })

})

/*  
    Função responsável por transmitir as informações para as rooms corretas.
    Como a message que estamos recebendo como parâmetro está em JSON, também o
    convertemos de volta para um objeto para lidar melhor com as informações.
    Além disso também recebemos as informações do client atual que está fazendo
    as requisições no servidor.
*/
function broadcast(message, socket) {

    let data = JSON.parse(message)

    let roomUsers = []

    /*
        Caso as informações que temos que passar são do evento de desenhar na tela
        temos que verificar se a room passada na "message" é igual a room do client
        no array de clientes e, por fim, também verificar se ela também é igual a room
        do client atual, assim filtramos somente os usuários que estão conectados na mesma 
        room. Tudo isso é necessário principalmente para a parte em que é a primeira vez do 
        usuário nesta room, e ele receba o que já estava anteriormente desenhado na tela. 
        Para os outros eventos precisamos verificar somente se a room do client atual (socket) 
        é igual a do client no array de clients, filtrando também somente os usuários conectados
        à mesma room.
    */
    if(data.event == 'draw') {
        roomUsers = clients.filter(client => {
            if(data.room === client.room && data.room === socket.room) {
                return client
            }
        })
    }
    else {
        roomUsers = clients.filter(client => {
            if(socket.room === client.room) {
                return client
            }
        })
    }

    /*
        Caso tenha pelo menos um usuário conectado à room repassamos a informação
        para o client. E também é nesta parte que verificamos se as informações que 
        devem ser passadas à diante são de obter quantos usuários estão conectados
        na room, para que assim possamos obter essa informação.
    */
    if(roomUsers.length > 0) {

        if(data.event == 'usersConnected') {
            data.count += roomUsers.length

            let numUsers = JSON.stringify(data)

            roomUsers.forEach(user => {
                user.send(numUsers)
            })
        }
        else {
            roomUsers.forEach(user => {
                user.send(message)
            })
        }

    }
}

/*  servidor http localhost estará rodando na porta 3000  */
server.listen(PORT, () => {
    console.log(`> Server is running on PORT: ${PORT}`)
})