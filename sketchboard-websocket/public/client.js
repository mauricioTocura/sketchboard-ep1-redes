/*  Obtem os parâmetros da url  */
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

/* Inicialização do websocket do lado do client na porta 3000 (mesma porta na qual o servidor está rodando) */
const ws = new WebSocket('ws://localhost:3000')

/* 
    Enquanto a conexão entre cliente e servidor está sendo estabelecida inserimos as informações do client 
    no array de clients no servidor, além de também associá-lo a room atual.
*/
ws.onopen = () => {
    ws.send(JSON.stringify({ event: 'joinRoom', username, room }))
}

createPalette()

/*
    Função que cria a paleta de cores disponível no front.
    Fonte: https://youtu.be/s-RCuZflUe4
    Grande parte da lógica de desenhar na tela foi baseada na fonte citada anteriormente.
*/
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

/* variáveis para podermos obter e lidar com as informações da tela */
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

/* objeto que representa uma linha que está sendo desenhado na tela */
const line = {
    painting: false,
    pos: {
        x: 0,
        y: 0
    },
    lastPos: null
}

/* inicialização das variáveis com valores padrão para cor e grossura da linha */
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
    Função que irá emitir o evento de desenho para o server.
    Obtemos primeiramente a posição relativa do mouse na área de desenho,
    verificamos se ele tem uma última posição para podermos começar o desenho,
    caso contrário somente atribuímos uma última posição.
*/
function draw(evt) {

    line.pos = getMousePos(evt)

    if(line.lastPos) {
        let drawData = {
            event: 'draw',
            drawColor,
            lineWidth,
            lastPos: line.lastPos,
            pos: line.pos,
            room
        }

        /* estamos passando as informações do que está sendo desenhado na tela para o servidor */
        ws.send(JSON.stringify(drawData))
    }
    
    line.lastPos = {
        x: line.pos.x,
        y: line.pos.y
    }
}

/*
    "Evento" que recebe as informações passadas pelo server.
    Como o parâmetro recebido está em JSON o convertemos de volta para um objeto,
    e, todos os objetos que são passados entre cliente e servidor possuem um atributo
    chamado "event" para podermos identificar qual ação realizar.
*/
ws.onmessage = drawData => {
    let data = JSON.parse(drawData.data)

    // caso o event seja de desenhar na tela
    if(data.event == 'draw') {
        ctx.beginPath()
        ctx.strokeStyle = data.drawColor
        ctx.lineWidth = data.lineWidth
        ctx.lineJoin = 'round'
        ctx.moveTo(data.lastPos.x, data.lastPos.y)
        ctx.lineTo(data.pos.x, data.pos.y)
        ctx.closePath()
        ctx.stroke()    
    }

    // caso o event seja de limpar a tela
    if(data.event == 'clearCanvas') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    // caso o evento seja o de mostrar quantos usuários estão conectados na room
    if(data.event == 'usersConnected') {
        document.getElementById("counter").innerText = data.count
    }
}

ws.onclose = () => {}

/*
    Função que obtem a informação de que o usuário quer limpar toda a tela de desenho.
    Emitimos então essa informação para o server, o qual faz os tratamento necessário e
    envia de volta o comando para limparmos a tela.
*/
document.getElementById('clearBtn').addEventListener('click', () => {
    ws.send(JSON.stringify({ event: 'clearCanvas' }))
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