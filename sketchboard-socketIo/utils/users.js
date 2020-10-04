/* Classe baseada no vídeo https://youtu.be/jD7FnbI76Hg */

// variável para armazenar todos os usuários
const users = []

// função que armazena as informações do usuário conectado
function userJoin(id, username, room) {
    const user = { id, username, room }

    users.push(user)

    return user
}

// função que retorna o usuário atual
function getCurrentUser(id) {
    return users.find(user => user.id === id)
}

// função que retorna usuário que está diconectando
function userDisconnect(id) {
    const index = users.findIndex(user => user.id === id)

    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
}

// retorna os usuários que estão em uma determinada room
function getRoomUsers(room) {
    const user = users.filter(usr => {
        if(usr.room === room) {
            return usr
        }
    })

    return user
}

// função que retorna o array com todos os usuários que estão conectados
function getAllUsersConnected() {
    return users
}

// função que retorna o número de usuários conectados a uma determinada room
function getNumUsersRoom(room) {
    const roomUsers = getRoomUsers(room)
    
    return roomUsers.length
}

// permite com que acessemos essas funções no server.js
module.exports = {
    userJoin,
    getCurrentUser,
    userDisconnect,
    getRoomUsers,
    getAllUsersConnected,
    getNumUsersRoom
}