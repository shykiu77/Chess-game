/*TODO: 
*promoting
*/
const WHITE = 'rgb(238, 238, 210)'
const BLACK = 'rgb(118, 150, 86)'

function makeElement(elementType,elementClass){
    const element = document.createElement(elementType)
    element.className = elementClass
    return element
}

function makeMatrix(m,n){
    matrix = []
    for(let i=0;i<8;i++)
        this.matrix[i] = new Array(8)
    return matrix
}

function clearChild(element){
    while(element.firstChild)
        element.removeChild(element.firstChild)
}



class Piece{
    constructor(type,color,position){
        this.type = type
        this.color = color
        this.hasMoved = false
        this.enPassantAble = false
        this.position = position

        this.element = makeElement('img','piece')
        this.element.src = `./imgs/${color}_${type}.png`

        this.element.draggable = true
        this.element.ondragstart = e => e.dataTransfer.setData('position',this.position)
    }

    promove(type){
        this.type = type
        this.element.src = `./imgs/${this.color}_${this.type}.png`
    }
}

class Tile{
    constructor(color){
        this.element = makeElement('div','tile')
        this.element.style.background = color
    }
}

function makePromotion(callback,piecePos){
    const select = makeElement('div','promotionBar')
    select.style.left = `calc(30% + ${piecePos.split(',')[1]*60+1}px)`
    select.style.top = 'calc(10% - 31px)'
    const pieceList = new Array()
    pieceList.push(new Piece('queen','white'))
    pieceList.push(new Piece('rook','white'))
    pieceList.push(new Piece('bishop','white'))
    pieceList.push(new Piece('knight','white'))
    pieceList.forEach(piece => piece.element.onclick = e => {
        callback(piece.type)
    })

    pieceList.forEach(piece => select.appendChild(piece.element))
    return select
}

class Board{
    constructor(parentElement){
        this.element = makeElement('div','board')
        this.parentElement = parentElement
        const tiles = makeMatrix(8,8)
        const pieces = makeMatrix(8,8)
        let waitForPromotion = false
        let turn = 'white'

        for(let i=0;i<8;i++){
            for(let j=0;j<8;j++){
                tiles[i][j] = new Tile((i+j)%2 ? BLACK : WHITE )
            }
        }

        for(let i=0;i<8;i++){
            const line =  makeElement('div','line')
            for(let j=0;j<8;j++){
                line.appendChild(tiles[i][j].element)
            }
            this.element.appendChild(line)
        }

        this.createPieces(pieces)

        for(let i=0;i<8;i++){
            for(let j=0;j<8;j++){
                if(pieces[i][j])
                    tiles[i][j].element.appendChild(pieces[i][j].element)

                tiles[i][j].element.ondragover = e => e.preventDefault()
                tiles[i][j].element.ondrop = e => {
                    const position = e.dataTransfer.getData('position')
                    const piece = pieces[position.split(',')[0]][position.split(',')[1]]
                    const isEnPassant = piece.type === 'pawn' && j - position.split(',')[1] !== 0 && !pieces[i][j]
                    const isCastling = piece.type === 'king' && Math.abs(j - position.split(',')[1]) === 2
                    if(!waitForPromotion && this.isValidMovement(position,`${i},${j}`,piece) && this.notJumpingPieces(position,`${i},${j}`,pieces) && this.isRightTurn(piece,turn) && !this.isInCheck(position,`${i},${j}`, JSON.parse(JSON.stringify(pieces)),isEnPassant,isCastling,turn)){

                        this.removeEnPassantAble(pieces)
                        if(piece.type === 'pawn' && Math.abs(position.split(',')[0] - i) === 2)
                            piece.enPassantAble = true

                        
                        this.move(position,`${i},${j}`,pieces,tiles)

                        if(isEnPassant){
                            const removePos = `${i + (piece.color === 'white' ? 1 : -1)},${j}`
                            this.move(removePos,removePos,pieces,tiles)
                        }
                        if(isCastling){
                            const newPos = `${i},${j < 3 ? 3 : 5}`
                            const oldPos = `${i},${j < 3 ? 0 : 7}`
                            this.move(oldPos,newPos,pieces,tiles) 
                        }

                        if(piece.type === 'pawn'){
                            const pieceY = piece.position.split(',')[0]
                            if(piece.color === 'black' && pieceY == 7 || piece.color === 'white' && pieceY == 0){
                                waitForPromotion = true
                                this.parentElement.appendChild(makePromotion( newType => {
                                    piece.promove(newType)
                                    this.parentElement.removeChild(this.parentElement.querySelector('.promotionBar'))
                                    waitForPromotion = false
                                },piece.position))
                            }
                        }
                        turn = turn === 'white' ? 'black' : 'white'
                    }
                }
            }
        }
        this.parentElement.appendChild(this.element)
    }
    createPieces(pieces){
        for(let i=0;i<8;i++){
            pieces[6][i] = new Piece('pawn','white',`${6},${i}`)
            pieces[1][i] = new Piece('pawn','black',`${1},${i}`)
        }
        pieces[0][7] = new Piece('rook','black',`${0},${7}`)
        pieces[0][0] = new Piece('rook','black',`${0},${0}`)
        pieces[7][0] = new Piece('rook','white',`${7},${0}`)
        pieces[7][7] = new Piece('rook','white',`${7},${7}`)

        pieces[0][1] = new Piece('knight','black',`${0},${1}`)
        pieces[0][6] = new Piece('knight','black',`${0},${6}`)
        pieces[7][1] = new Piece('knight','white',`${7},${1}`)
        pieces[7][6] = new Piece('knight','white',`${7},${6}`)

        pieces[0][2] = new Piece('bishop','black',`${0},${2}`)
        pieces[0][5] = new Piece('bishop','black',`${0},${5}`)
        pieces[7][2] = new Piece('bishop','white',`${7},${2}`)
        pieces[7][5] = new Piece('bishop','white',`${7},${5}`)

        pieces[0][3] = new Piece('queen','black',`${0},${3}`)
        pieces[7][3] = new Piece('queen','white',`${7},${3}`)

        pieces[0][4] = new Piece('king','black',`${0},${4}`)
        pieces[7][4] = new Piece('king','white',`${7},${4}`)
    }

    move(src,dest,pieces,tiles){
        let srcSplit = src.split(',')
        let destSplit = dest.split(',')
        
        const temp = pieces[srcSplit[0]][srcSplit[1]]
        

        clearChild(tiles[destSplit[0]][destSplit[1]].element)
        clearChild(tiles[srcSplit[0]][srcSplit[1]].element)
        delete pieces[srcSplit[0]][srcSplit[1]]
        delete pieces[destSplit[0]][destSplit[1]]


        if(src !== dest){
            pieces[destSplit[0]][destSplit[1]] = temp
            tiles[destSplit[0]][destSplit[1]].element.appendChild(pieces[destSplit[0]][destSplit[1]].element)
            pieces[destSplit[0]][destSplit[1]].position = dest
            pieces[destSplit[0]][destSplit[1]].hasMoved = true
        } 

    }
    removeEnPassantAble(pieces){
        pieces.forEach(line => line.forEach(piece => piece.enPassantAble = false))
    }
    
    
    isValidMovement(piecePos,tilePos,piece){
        const [pieceY,pieceX] = piecePos.split(',').map(pos => parseInt(pos,10))
        const [tileY,tileX] = tilePos.split(',').map(pos => parseInt(pos,10))
    
        const deltaX = Math.abs(tileX-pieceX)
        const deltaY = Math.abs(tileY-pieceY)
        
        switch(piece.type){
            case 'pawn':
                const direction = piece.color === 'white' ? -1 : 1
                return (pieceX === tileX && (pieceY+direction === tileY || (!piece.hasMoved && pieceY + 2*direction === tileY))) || (deltaX === deltaY && deltaX === 1 && tileY-pieceY === direction)
            case 'knight':
                return (deltaX === 2 && deltaY === 1) || (deltaX === 1 && deltaY === 2)
            case 'bishop':
                return deltaX === deltaY && deltaX > 0
            case 'rook':
                return (deltaX === 0 && deltaY > 0) || (deltaY === 0 &&  deltaX > 0)
            case 'queen':
                return (deltaX === deltaY && deltaX > 0) || ((deltaX === 0 && deltaY > 0) || (deltaY === 0 &&  deltaX > 0))
            case 'king':
                return (deltaX <= 1 && deltaY <= 1 && (deltaX > 0 || deltaY > 0)) || (deltaX === 2 && deltaY === 0)
            default:
                return false
        }
    }
    
    
    notJumpingPieces(piecePos,tilePos,pieces){
        const [pieceY,pieceX] = piecePos.split(',').map(pos => parseInt(pos,10))
        const [tileY,tileX] = tilePos.split(',').map(pos => parseInt(pos,10))
    
        const deltaX = Math.abs(tileX-pieceX)
        const deltaY = Math.abs(tileY-pieceY)
    
        const directionX = (tileX - pieceX)/deltaX || 0
        const directionY = (tileY - pieceY)/deltaY || 0 
    
        const pieceColor = pieces[pieceY][pieceX].color
    
        if(deltaX === deltaY || deltaX === 0 || deltaY === 0){
            for(let i = 1;i<(deltaX || deltaY);i++)
                if(pieces[pieceY + i*directionY][pieceX + i*directionX])
                    return false
        }   
        if(pieces[tileY][tileX] && pieces[tileY][tileX].color == pieceColor)
            return false
    
        if(pieces[pieceY][pieceX].type === 'pawn'){
            if(tileX - pieceX !== 0){
                if(!pieces[tileY][tileX]){
                    const direction = pieceColor === 'white' ? 1 : -1
                    if(!pieces[tileY + direction][tileX] || pieces[tileY + direction][tileX].color === pieceColor || !pieces[tileY + direction][tileX].enPassantAble)
                        return false
                }
            }
            else{
                if(pieces[tileY][tileX])
                    return false
            }
        }
        if(pieces[pieceY][pieceX].type === 'king' && deltaX === 2){
            if(pieces[pieceY][pieceX].hasMoved)
                return false
            
            if(tileX < 3){
                if(pieces[pieceY][1] || !pieces[pieceY][0] || pieces[pieceY][0].type !== 'rook' || pieces[pieceY][0].hasMoved)
                    return false
            }
            else{
                if(!pieces[pieceY][7] || pieces[pieceY][7].type !== 'rook' || pieces[pieceY][7].hasMoved)
                    return false
            }
    
            if(this.checkForChecks(pieces,pieces[pieceY][pieceX].color))
                return false
        }
        return true
    }
    
    isRightTurn(piece,turn){
        return piece.color === turn
    }
    
    checkForChecks(pieces,color){
        let kingPos
        pieces.forEach(line => line.forEach(piece => {
            if(piece && piece.type === 'king' && piece.color === color)
                kingPos = piece.position
        }))
    
        let isChecked = false
        pieces.forEach(line => line.forEach(piece => {
            if(piece && piece.color !== color){
                isChecked = isChecked || (this.isValidMovement(piece.position,kingPos,piece) && this.notJumpingPieces(piece.position,kingPos,pieces))
            }
        }))
        return isChecked
    }
    
    isInCheck(piecePos,tilePos,pieces,isEnPassant,isCastling,turn){
        const [pieceY,pieceX] = piecePos.split(',').map(pos => parseInt(pos,10))
        const [tileY,tileX] = tilePos.split(',').map(pos => parseInt(pos,10))
    
        pieces[tileY][tileX] = pieces[pieceY][pieceX]
        pieces[tileY][tileX].position = tilePos
        pieces[tileY][tileX].hasMoved = true
        delete pieces[pieceY][pieceX]
        
    
        if(isEnPassant){
            const direction = pieces[tileY][tileX].color === 'white' ? 1 : -1
            delete pieces[tileY+direction][tileX]
        }
        if(isCastling){
            const newX = tileX < 3 ? 3 : 5
            const oldX = tileX < 3 ? 0 : 7
            pieces[tileY][newX] =  pieces[tileY][oldX]
            delete pieces[tileY][oldX]
            pieces[tileY][newX].position = `${tileY},${newX}`
        }
    
        return this.checkForChecks(pieces,turn)
    }
}



let board = new Board(document.querySelector('[gameArea]'))