/**
Kieran O'Day's Tetnis: Tetris without copyright infringement
*/
const LBLOCK = [
  [1,0,0],
  [1,1,1],
  [0,0,0],
];
const JBLOCK = [
  [0,0,1],
  [1,1,1],
  [0,0,0],
];
const ZBLOCK = [
  [0,0,0],
  [2,2,0],
  [0,2,2],
];
const SBLOCK = [
  [0,0,0],
  [0,2,2],
  [2,2,0],
];
const TBLOCK = [
  [3,3,3],
  [0,3,0],
  [0,0,0],
];
const BLOCKYBLOCK = [
  [0,0,0,0],
  [0,4,4,0],
  [0,4,4,0],
  [0,0,0,0],
];
const IBLOCK = [
  [0,0,5,0],
  [0,0,5,0],
  [0,0,5,0],
  [0,0,5,0],
];
const BLOCKS = [LBLOCK, JBLOCK, ZBLOCK, SBLOCK, TBLOCK, IBLOCK, BLOCKYBLOCK];
const STARTSCREEN = 0, PLAYING = 1, GAMEOVER = 2;
var state = STARTSCREEN;
var fall = false;
//makes an empty 2d array with a number of rows and a number of columns
function makeArray(rows, columns){
  var a = new Array(rows);
  for(var i = 0; i < rows; i++){
    a[i] = new Array(columns);
  }
  for (var r = 0; r < rows; r ++){
    for (var c = 0; c < columns; c ++){
      a[r][c] = 0;
    }
  }
  return a;
}
//copies an 2d array's contents not just the reference to the array
function makeCopy(matrix){
  var cpy = makeArray(matrix.length, matrix[0].length);
  for (var r = 0; r < matrix.length; r ++){
    for (var c = 0; c < matrix[r].length; c ++){
      cpy[r][c] = matrix[r][c];
    }
  }
  return cpy;
}
// a falling block in tetris has a matrix and a row and column on the screen
class Block {
  constructor(matrix, row, column){
    this.row = row;
    this.column = column;
    this.matrix = makeCopy(matrix);
  }
  rotate(num){
    for (var i = 0; i < num; i++){
      var temp = makeCopy(this.matrix);
      //switch the rows and columns
      for (var r = 0; r < this.matrix.length; r ++){
        for (var c = 0; c < this.matrix[0].length; c ++){
          temp[r][c] = this.matrix[c][r];
        }
      }
      //mirror temp's columns to set this.matrix
      this.matrix = makeCopy(temp);

      for (var r = 0; r < temp.length; r ++){
        for (var c = 0; c < temp[0].length; c ++){
          this.matrix[r][c] = temp[r][temp.length - 1 - c];
        }
      }
    }
  }
  moveRight(){
    this.column++;
  }
  moveLeft(){
    this.column--;
  }
  get numRows(){
    return this.matrix.length;
  }
  get numColumns(){
    return this.matrix[0].length;
  }
}
//the screen is pretty much the whole game
class Screen {
  constructor(rows, columns){
    this.score = 0;
    this.grid = makeArray(rows,columns);
    this.nextBlock = new Block(BLOCKS[Math.floor(Math.random()*7)], 0, Math.floor(this.grid[0].length/2 - 2));
    this.block = this.spawnBlock();
    this.fallSpeed = 500;
    this.lastDrop = 0;
  }
  startover(){
    this.grid = makeArray(this.grid.length,this.grid[0].length);
    this.block = this.spawnBlock();
    this.fallSpeed = 500;
    this.score = 0;
    this.lastDrop = 0;
  }
  // uses the next block to make the new falling block and spawns a new next block
  spawnBlock(){
    var b = new Block(makeCopy(this.nextBlock.matrix),0,Math.floor(this.grid[0].length/2 - 2));
    this.nextBlock = new Block(BLOCKS[Math.floor(Math.random()*7)], 0,0);
    b.rotate(Math.floor(Math.random()*4));
    return b;
  }
  // if the falling block on the screen hit the floor return true
  blockBricked(){
    for(var r = 0; r < this.block.numRows; r ++){
      for(var c = 0; c < this.block.numColumns; c ++){
        if(this.block.matrix[r][c] != 0 && this.block.matrix[r][c] <= 5){
          if((this.block.row + r >= this.grid.length - 1)||(this.grid[this.block.row + r + 1][this.block.column + c] > 5))
            return true;
        }
      }
    }
    return false;
  }
  //if the falling block has space to rotate return true
  blockCanRotate(){
    this.block.rotate(1);
    for(var r = 0; r < this.block.numRows; r ++){
      for(var c = 0; c < this.block.numColumns; c ++){
        if(this.block.column + c < 0 || this.block.column + c > this.grid[0].length - 1 || this.block.row + r < 0 || this.block.row + r > this.grid.length - 1|| this.grid[this.block.row + r][this.block.column + c] > 5){
          this.block.rotate(3);
          return false;
        }
      }
    }
    this.block.rotate(3);
    return true;
  }
  //if the block can move horizontally in direction d return true
  //d is direction 1 for right -1 for left
  blockCanMove(d){
    for(var r = 0; r < this.block.numRows; r ++){
      for(var c = 0; c < this.block.numColumns; c ++){
        if(this.block.matrix[r][c] != 0 && this.block.matrix[r][c] <= 5){
          if(this.block.column + c + d < 0 || this.block.column + c + d > this.grid[0].length - 1 || this.grid[this.block.row + r][this.block.column + c + d] > 5)
            return false;
        }
      }
    }
    return true;
  }
  //removes a row and shifts the rows above it down
  removeRow(row){
    var newArray = makeCopy(this.grid);
    for(var c = 0; c < newArray[0].length; c ++)
      newArray[0][c] = 0;
    for(var r = 1; r < newArray.length; r ++)
      for(var c = 0; c < newArray[r].length; c ++)
        if(r <= row)
          newArray[r][c] = this.grid[r-1][c];
        else
          newArray[r][c] = this.grid[r][c];
    this.grid = newArray;
  }
  //returns true if a block is built touching the top of the screen
  gameOver(){
    for(var c = 0; c < this.grid[0].length; c ++)
      if(this.grid[0][c] > 5)
        return true;
    return false;
  }
  //returns a row number of the first row that is filled, or -1 if no row is full
  rowFilled(){
    for(var r = 0; r < this.grid.length; r ++){
      for(var c = 0; c < this.grid[r].length; c ++){
        if(this.grid[r][c] == 0)
          break
        if(c == this.grid[r].length - 1)
          return r;
        }
      }
    return -1;
  }
  //updates the screen so the block falls
  update(){
     //clears the falling block
    for(var r = 0; r < this.grid.length; r ++){
      for(var c = 0; c < this.grid[0].length; c ++){
        if(this.grid[r][c] <= 5){
          this.grid[r][c] = 0;
        }
      }
    }
    //moves the block down if it can
    for(var r = 0; r < this.block.numRows; r ++){
      for(var c = 0; c < this.block.numColumns; c ++){
        if(this.block.matrix[r][c] != 0 && this.block.matrix[r][c] <= 5){
          if(!this.blockBricked()){
            if(millis() - this.lastDrop > this.fallSpeed || fall && millis() - this.lastDrop > 30){
              this.block.row ++;
              this.lastDrop = millis();
            }
          }
          this.grid[this.block.row + r][this.block.column + c] = this.block.matrix[r][c];
        }
      }
    }
    //if the block hit another block or the bottom of the screen, sets the screen to a permant version of the block
    if(millis() - this.lastDrop > this.fallSpeed || fall && millis() - this.lastDrop > 30){
      if (this.blockBricked()){
        for(var r = 0; r < this.block.numRows; r ++){
          for(var c = 0; c < this.block.numColumns; c ++){
            if(this.block.matrix[r][c] != 0 && this.block.matrix[r][c] <= 5)
              this.grid[this.block.row + r][this.block.column + c] = this.block.matrix[r][c] + 5; //numbers over five on the grid are permanant
          }
        }
        //removes all the filled rows
        this.block = this.spawnBlock();
        var count = 0;
        while(this.rowFilled() != -1){
          count ++;
          this.removeRow(this.rowFilled())
        }
        //dishes points for stuff
        var pospoints = [0,40,100,300,1200];
        this.score += pospoints[count];
      }
    }
  }
  //draws the screen
  draw(x, y, w, h){
    push();
    translate(x,y);
    for (var r = 0; r < this.grid.length; r ++){
      for (var c = 0; c < this.grid[0].length; c ++){
        if(this.grid[r][c] == 0){ //nothing there
          fill(100,150);
        }else{
          if(this.grid[r][c]%5 == 0) //color coded blocks mod to keep fallen blocks same color as they used to be
            fill(0,255,255,150);
          else if(this.grid[r][c]%5 == 1)
            fill(255,153,0,150);
          else if(this.grid[r][c]%5 == 2)
            fill(0,255,0,150);
          else if(this.grid[r][c]%5 == 3)
            fill(255,0,0,150);
          else
            fill(255,0,255,150);
        }
        rect(w*c,h * r,w,h);
        rect(w*c + w*.1,h * r + h*.1,w*.8,h*.8);
        fill(255);
      }
    }
    //draws the next block and text for the game next to the screen
    for (var r = 0; r < 4; r ++){
      for (var c = 0; c < 4; c ++){
        if(r > this.nextBlock.matrix.length - 1 || c > this.nextBlock.matrix[0].length - 1|| this.nextBlock.matrix[r][c] == 0){
          fill(100,150);
        }else{
          if(this.nextBlock.matrix[r][c]%5 == 0)
            fill(0,255,255,150);
          else if(this.nextBlock.matrix[r][c]%5 == 1)
            fill(255,153,0,150);
          else if(this.nextBlock.matrix[r][c]%5 == 2)
            fill(0,255,0,150);
          else if(this.nextBlock.matrix[r][c]%5 == 3)
            fill(255,0,0,150);
          else
            fill(255,0,255,150);
        }
        push();
        translate(this.grid[0].length * w + 25,0);
        rect(w*c,h * r,w,h);
        rect(w*c + w*.1,h * r + h*.1,w*.8,h*.8);
        fill(100);
        textSize(50);
        text("TETNIS", 100, height/2)
        textSize(10);
        textSize(25);
        text("Score: " + this.score, 100, height/2 + 100);
        pop();
      }
    }
    pop();
  }
}

var s = new Screen(20,10);
var a = new Block (TBLOCK,0,0);

function setup(){
  var canvas = createCanvas(500, 500);
  canvas.parent("game");
  document.getElementById("game").style = "width: " + width + "px; height: " + height + "px";
  textFont(loadFont("/../style/arcade_font.ttf"));
  noStroke();
  textAlign(CENTER);
}
function draw(){
  background(0);
  switch(state){
    case STARTSCREEN: // intro screen to the game
      s.draw(25,25,(height-50)/20,(height-50)/20);
      fill(100,100);
      rect(0,0,width,height);
      fill(150);
      textSize(50);
      text("Press SPACE to play", width/2, height/2);
      break;
    case PLAYING: // game is playing
      s.draw(25,25,(height-50)/20,(height-50)/20);
      s.update(); //screen actually updates in this one so parts move
      if (s.gameOver())
        state = GAMEOVER;
      break;
    case GAMEOVER: //game is over red screen big L
      s.draw(25,25,(height-50)/20,(height-50)/20);
      fill(255,0,0,100);
      rect(0,0,width,height);
      fill(150);
      textSize(50);
      text("GAMEOVER", width/2, height/2);
      textSize(25);
      text("press ENTER to submit your score", width/2, height/2 + 35);
      text("or press BACKSPACE to discard it", width/2, height/2 + 65);
      break;
  }
}

function keyPressed(){
  if(state === STARTSCREEN){
    if (key === ' ')
      state = PLAYING;
  }else if(state === PLAYING){
    if(keyCode == UP_ARROW){ //rotates the block
      if(s.blockCanRotate())
        s.block.rotate(1);
    }
    if(keyCode == DOWN_ARROW){ //makes the block do a soft drop
      fall = true;
    }
    if(keyCode == RIGHT_ARROW){// moves the block right
      if(s.blockCanMove(1))
        s.block.moveRight();
    }
    if(keyCode == LEFT_ARROW){ // moves the block left
      if(s.blockCanMove(-1))
        s.block.moveLeft();
    }
  }else if(state === GAMEOVER){
    if(keyCode === ENTER)
      postScore({
        game: "tetris",
        score: s.score
      });
    if(keyCode === BACKSPACE){
      state = STARTSCREEN;
      s.startover();
    }
  }
}
//stops the blcok from falling
function keyReleased(){
  if(keyCode == DOWN_ARROW){
    fall = false;
  }
}
