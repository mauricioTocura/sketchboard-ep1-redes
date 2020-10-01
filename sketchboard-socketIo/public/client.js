// get username e room da url
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// criação do socket do lado do cliente
const socket = io()

// função que realiza o "login" do usuário na sala passada como parâmetro
socket.emit('joinRoom', {username, room})

createPalette()

// função que cria a paleta de cores disponíveis na tela
function createPalette() {
    const COLORS = [
        'black',
        'grey',
        'silver',
        'white',
        'lightblue',
        'cyan',
        'blue',
        'darkblue',
        'purple',
        'magenta',
        'red',
        'orange',
        'yellow',
        'lime',
        'green',
        'olive',
        'brown',
        'maroon'
    ]

    const palette = document.getElementById('palette')

    COLORS.forEach(color => {
        const colorElement = document.createElement('div')
        colorElement.classList.add('colorSquare')
        colorElement.style.backgroundColor = color
        palette.appendChild(colorElement)
    })
}

// variáveis para podermos obter e lidar com as informações da tela
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// objeto que representa uma linha que está sendo desenhado na tela
const line = {
    painting: false,
    pos: {
        x: 0,
        y: 0
    },
    lastPos: null
}

// inicialização das variáveis com valores padrão para cor e grossura da linha
let drawColor = 'black'
let lineWidth = '15'

/*
    EventListener que obtém a informação de que o usuário está clicando na tela para desenhar algo.
    Então "setamos" o atributo painting como true, para indicar que o usuário está desenhando e chamamos o método de desenhar
*/
canvas.addEventListener('mousedown', (evt) => {
    line.painting = true
    draw(evt)
})

/*
    EventListener que obtém a informação de que o usuário está movendo o mouse na tela.
    Caso ele esteja desenhando (mouse clickado) chamamos a função de desenhar.
*/
canvas.addEventListener('mousemove', (evt) => {
    // line.pos = getMousePos(evt)
    
    if(line.painting) {
        draw(evt)
    }
})

/*
    EventListener que obtém a informação de que o usuário não está mais clicando na tela.
    Então "setamos" o atributo painting para false e apagamos a sua última posição.
*/
document.addEventListener('mouseup', (evt) => {
    line.painting = false
    line.lastPos = null
})

/*
    EventListener que obtém a informação de que o usuário não está mais na área de desenho na tela.
    Então apagamos a sua última posição.
*/
canvas.addEventListener('mouseleave', (evt) => {
    line.lastPos = null
})

/*
    Função para pegar a posição real do mouse na área de desenho.
*/
function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect(), // tamanho da área de desenho
    scaleX = canvas.width / rect.width,    // relação bitmap vs. elemento para X
    scaleY = canvas.height / rect.height;  // relação bitmap vs. elemento para Y
      
    return {
        x: (evt.clientX - rect.left) * scaleX,   // escala das coordenadas do mouse depois deles
        y: (evt.clientY - rect.top) * scaleY     // terem sido ajustados para ficarem relativos à área de desenho
    }
}

/*
    Função que irá emitir a função de desenho para o server side.
    Obtemos primeiramente a posição relativa do mouse na área de desenho,
    verificamos se ele tem uma última posição para podermos começar o desenho,
    caso contrário somente atribuímos uma última posição.
*/
function draw(evt) {

    line.pos = getMousePos(evt)

    if(line.lastPos) {
        socket.emit('drawing', drawColor, lineWidth, line.lastPos, line.pos, room)
    }
    
    line.lastPos = {
        x: line.pos.x,
        y: line.pos.y
    }
}

/*
    Função que recebe o comando emitido pelo server side de desenhar na tela.
    Recebemos então a cor, grossura, posição inicial, posição final e a room,
    e renderizamos o traço na tela.
*/
socket.on('drawing', (color, width, startPos, endPos, room) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.moveTo(startPos.x, startPos.y)
    ctx.lineTo(endPos.x, endPos.y)
    ctx.closePath()
    ctx.stroke()     
})

/*
    Função que obtem a informação de que o usuário quer limpar toda a tela de desenho.
    Emitimos então essa informação para o server side que faz os tratamento necessário e
    envia de volta o comando para limparmos a tela.
*/
document.getElementById('clearBtn').addEventListener('click', () => {
    socket.emit('clearCanvas', room)
})

/*
    Função que recebe o comando para limparmos a tela de desenho do server side.
    Aqui apenas pintamos toda a tela de branco novamente.
*/
socket.on('clearCanvas', (room) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
})

/*
    Obtemos as informações referentes à paleta de cores que está visível na tela do browser
    e aplicamos a cor escolhida na variável de cor da linha
*/
document.querySelectorAll('.colorSquare').forEach(square => {
    square.addEventListener('click', () => {
        drawColor = square.style.backgroundColor

        document.querySelectorAll('.widthExample').forEach(ex => {
            ex.style.backgroundColor = drawColor
        })
    })
})

/*
    Obtemos as informações referentes à grossura da linha que está visível no browser
    e aplicamos a espessura escolhida na variável de grossura da linha.
*/
document.querySelectorAll('.widthExample').forEach(ex => {
    ex.addEventListener('click', () => {
        lineWidth = ex.clientWidth
        document.querySelectorAll('.widthExample').forEach(other => {
            other.style.opacity = 0.4
        })
        ex.style.opacity = 1
    })
})

/*
    Função que recebe o comando para mostrar quantos usuários estão conectados em uma determinada room.
*/
socket.on('usersConnected', (numUsers) => {
    document.getElementById("counter").innerText = numUsers
})