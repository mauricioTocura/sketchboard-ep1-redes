/*
    declaração dos pacotes e métodos que estaremos utilizando
*/
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const { userJoin, getCurrentUser, userDisconnect, getRoomUsers, getNumUsersRoom } = require('./utils/users')

// criação de uma aplicação no express
const app = express()

// criação de um server http
const server = http.createServer(app)

// criação de um socket que ficará escutando o server http
const io = socketIo.listen(server)

// torna os recursos presentes na pasta public como static para que possam ser utilizados no browser
app.use(express.static(__dirname + '/public'))

let usersConnected = 0
let drawHistory = []

/*
    Event listener que lida com as novas conexões, ou seja, para cada nova conexão
    será executado todos as funções que estão presentes na função de callback
    que recebe como parâmetro as informações do socket conectado
    Fontes:
    https://youtu.be/jD7FnbI76Hg (principalmente na questão das rooms e users)
    https://youtu.be/s-RCuZflUe4 (principalmente na questão de lidar e trasmitir as informações e eventos)
*/
io.on('connect', (socket) => {

    /*
        Função criada para registrar as informações do usuário.
        Suas informações são adicionadas no array de users de users.js, 
        após isso fazemos a inscrição deste socket na room que ele escolheu (socket.join(user.room));
        pegamos o número de usuários que estão na mesma room e passamos o histórico de desenho para esta nova conexão
        e então enviamos para o client o número de usuários conectados para que possa ser mostrado na tela.
    */
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        usersConnected = getNumUsersRoom(user.room)

        drawHistory.forEach(({drawColor, lineWidth, lastPos, pos, room}) => {
            if(user.room === room) {
                socket.emit('drawing', drawColor, lineWidth, lastPos, pos, room)
            }
        })

        io.to(user.room).emit('usersConnected', usersConnected)
    })    
    
    /*
        Função criada para receber as informações do que está sendo desenhado na tela de algum usuário.
        Esta função recebe 5 parâmetros, sendo eles referente a cor do traço, grossura do traço, última posição do mouse na tela,
        a posição final do mouse na tela e em qual room, respectivamente.
        Após isso emitimos para todos os sockets conectados, inclusive para o que estava desenhando na tela essas informações, e
        no client side recebemos estes dados e os renderizamos na tela. 
        Ou seja, o usuário que está desenhando está mandando as informações das linhas que estão sendo feitas na tela para o nosso backend
        e, com essas informações sendo recebidas no server, as emitimos para todos os sockets que estão conectados na mesma room.
        Permitindo que todos os usuários conectados a uma mesma room vejam o que está sendo desenhado na tela em tempo real.
        Para mandarmos somente para a room na qual o usuário está conectado, pegamos a informação do usuário atual que está realizando tal ação
        para que assim tenhamos acesso a sua room. Além disso sempre guardamos o que está sendo desenhado em um histórico para que os novos usuários
        que entrem nessa room possam ver o que estava desenhado anteriormente.
    */
    socket.on('drawing', (drawColor, lineWidth, lastPos, pos, room) => {
        const user = getCurrentUser(socket.id)
        drawHistory.push({drawColor, lineWidth, lastPos, pos, room})
        io.to(room).emit('drawing', drawColor, lineWidth, lastPos, pos, room)
    })
    
    /*
        Função responsável por limpar tudo o que estava na tela.
        Para apargamos somente a tela dos usuários que estão em uma mesma room precisamos pegar a informação do usuário atual
        que está querendo apagar toda a tela, e com isto apagamos do histórico de desenhos, somente o históricos daquela room
        para que os usuários que entrem depois disso, ou que façam um refresh na página, não recebam de volta esse histórico.
        Após isso emitimos o comando de limpara a tela para o client side.
    */
    socket.on('clearCanvas', (room) => {
        const user = getCurrentUser(socket.id)
        drawHistory = drawHistory.filter(history => {
            if(history.room !== room) {
                return history
            }
        })
        io.to(user.room).emit('clearCanvas')
    })
    
    /*
        Função que para lidar com a disconexão de algum usuário.
        Aqui eliminamos a informação do usuário do nosso "banco" de usuários, e,
        por fim atualizamos o número de usuários conectados àquela room.
    */
    socket.on('disconnect', () => {
        const user = userDisconnect(socket.id)

        if(user) {
            usersConnected = getNumUsersRoom(user.room)
            io.to(user.room).emit('usersConnected', usersConnected)
        }
    })

})

// server localhost que está rodando na porta 3000
// localhost:3000
server.listen(3000, () => console.log('> Server is running on port 3000'))