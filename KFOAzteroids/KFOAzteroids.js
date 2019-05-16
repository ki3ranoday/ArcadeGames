var asteroids = [];
var explosions = [];
var saucers = [];
var portals = [];
var saucytimer = 0;
var ship = undefined;
var right = false;
var left = false;
var forward = false;
var points = 0;
var lives = 3;
var lifeships = [];
const STARTSCREEN = 0, PLAYING = 1, SPAWNING = 2, GAMEOVER = 3, HELP = 4;
var state = STARTSCREEN;
var timer = 0;
var spawnlimit = 0;
var level = 1;
var levels = "2,3 3,3 4,3 5,3 6,3 7,3 8,3";
var FLIP = 0, HYPER = 1, SHIELD = 2;
var selection = 0;
class Asteroid{
  constructor(bigness, loc){
    this.bigness = bigness;
    this.size = Math.pow(2, bigness) * 50;
    this.velocity = createVector(Math.random()*2 - 1, Math.random() * 2 - 1);
    this.velocity.setMag(3/(bigness+1));
    this.loc = loc;
  }
  run(){
    this.loc.add(this.velocity);
    if(this.loc.x - this.size/2 > width)
      this.loc.set(-this.size/2, this.loc.y);
    if(this.loc.x + this.size/2 < 0)
      this.loc.set(width + this.size/2, this.loc.y);
    if(this.loc.y - this.size/2 > height)
      this.loc.set(this.loc.x, -this.size/2);
    if(this.loc.y + this.size/2 < 0)
      this.loc.set(this.loc.x, height + this.size/2);
  }
  smash(){
    var astpoints = [100, 50, 20];
    points += astpoints[this.bigness];
    explosions.push(new Explosion(this.loc.copy(), this.size));
    if(this.bigness > 0){
      asteroids.push(new Asteroid(this.bigness-1, this.loc.copy()));
      asteroids.push(new Asteroid(this.bigness-1, this.loc.copy()));
    }
  }
  draw(){
    fill("#888");
    ellipse(this.loc.x, this.loc.y, this.size, this.size);
  }
  update(){
    this.draw()
    this.run()
  }
  hit(ship){
    return dist(this.loc.x, this.loc.y, ship.loc.x, ship.loc.y) < this.size/2 + 2*ship.size/6;
  }
}
class Portal{
  constructor(x,y,x2,y2){
    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.timer = 0;
    this.size = 50;
  }
  draw(){
    if(this.timer < this.size){
      fill('#99f9');
      ellipse(this.x2, this.y2, this.timer, this.timer);
      ellipse(this.x, this.y, this.size - this.timer,this.size - this.timer);
    }
    this.timer += 5;
  }
  finished(){
    return this.timer > this.size;
  }
}
class Ship{
  constructor(x, y){
    this.loc = createVector(x, y);
    this.velocity = createVector(0,0);
    this.size = 30;
    this.lazers = [];
    this.acc = createVector(0,-.05);
    this.shielded = false;
    this.shieldtime = 0;
    this.forward = false;
    this.right = false;
    this.left = false;
  }
  run(){
    this.loc.add(this.velocity);
    if(this.right)
      this.acc.rotate(radians(4));
    if(this.left)
      this.acc.rotate(radians(-4));
    if(this.forward){
      this.velocity.add(ship.acc);
      if(this.velocity.mag() > 4)
        this.velocity.setMag(4);
    }else{
      this.velocity.mult(.99);
    }
    if(this.loc.x > width)
      this.loc.set(0, this.loc.y);
    if(this.loc.x < 0)
      this.loc.set(width, this.loc.y);
    if(this.loc.y > height)
      this.loc.set(this.loc.x, 0);
    if(this.loc.y < 0)
      this.loc.set(this.loc.x, height);
  }
  shoot(){
    this.lazers.push(new Lazer(this.loc.copy(), p5.Vector.fromAngle(this.acc.heading(),10)));
  }
  draw(){
    push();
    translate(this.loc.x, this.loc.y);
    rotate(this.acc.heading());
    if(this.forward && parseInt(Math.random()*5) > 0){
      push();
      noStroke();
      translate(-this.size/2, 0);
      fill("#A00")
      ellipse(0, 0, this.size/2, this.size/4);
      fill("#FF0")
      ellipse(0, 0, this.size/3, this.size/8);
      pop();
    }
    stroke('#000');
    fill("#AAF");
    triangle(0,0,-this.size/2, -this.size/2,-this.size/2,this.size/2);
    fill("#BBB");
    ellipse(0, 0, this.size, this.size/2);
    fill("#333");
    ellipse(this.size/5, 0, this.size/4, this.size/4);
    if(this.shielded){
      fill('#2dfbff99');
      ellipse(0,0,this.size*2,this.size*2);
      if(millis() - this.shieldtime > 3000)
        this.shielded = false;
    }
    pop();
  }
  update(){
    this.run()
    for(var i = this.lazers.length - 1; i >= 0; i--){
      this.lazers[i].update();
      var hit = this.lazers[i].hit(asteroids);
      if(hit != -1){
        asteroids[hit].smash();
        asteroids.splice(hit,1);
        this.lazers.splice(i,1);
        continue;
      }
      hit = this.lazers[i].hit(saucers);
      if(hit != -1){
        saucers[hit].smash();
        saucers.splice(hit,1);
        this.lazers.splice(i,1);
        continue;
      }
      if(this.lazers[i].offscreen() || this.lazers[i].outrange())
        this.lazers.splice(i,1);
    }
    if(state === SPAWNING){
      if(millis() - timer < 250){
        this.draw()
      }else if(millis()- timer > 500){
        timer = millis();
      }
    }else{
      this.draw();
    }
  }
}
class Saucer{
  constructor(x, bigness){
    this.loc = createVector(x, Math.random()*height);
    if(x < width)
      this.velocity = createVector(1,0);
    else
      this.velocity = createVector(-1,0);
    this.size = 30 * bigness;
    this.stupid = (bigness === 2);
    this.shootTime = 0;
    this.lazers = [];
  }
  shoot(){
    if(this.stupid)
      this.lazers.push(new Lazer(this.loc.copy(), p5.Vector.fromAngle(Math.random()* 2 * PI, 10)));
    else
      this.lazers.push((new Lazer(this.loc.copy(), p5.Vector.sub(ship.loc, this.loc))).setMag(10));
    this.shootTime = millis();
  }
  smash(){
    var saucepoints = [0,1000,200];
    points += saucepoints[this.size/30];
    saucytimer = millis();
    explosions.push(new Explosion(this.loc.copy(), this.size));
  }
  draw(){
    push();
    noStroke();
    translate(this.loc.x, this.loc.y);
    fill("#6cd");
    ellipse(0,-this.size/8, this.size/3, this.size/3);
    fill("#222");
    ellipse(0,0,this.size, this.size/4);
    fill('#6cd')
    for (var i = -1; i <= 1; i++)
      ellipse(i * this.size/4, 0, this.size/30,  this.size/30);
    push();
    translate(0,-this.size/8);
    rotate(radians(-60));
    fill("#fff");
    ellipse(this.size/8, 0, this.size/16, this.size/8);
    pop();
    pop();
  }
  update(){
    this.draw();
    var angle = p5.Vector.sub(ship.loc, this.loc).heading() - this.velocity.heading();
    if(angle < 0 || angle > PI)
      this.velocity.rotate(radians(-1));
    else if(angle > 0 || angle < -PI)
      this.velocity.rotate(radians(1));
    this.loc.add(this.velocity);
    if(millis() - this.shootTime > 1000)
      this.shoot();
    if(this.loc.x > width)
      this.loc.set(0, this.loc.y);
    if(this.loc.x < 0)
      this.loc.set(width, this.loc.y);
    if(this.loc.y > height)
      this.loc.set(this.loc.x, 0);
    if(this.loc.y < 0)
      this.loc.set(this.loc.x, height);
    for(var i = this.lazers.length - 1; i >= 0; i--){
      this.lazers[i].update();
      if(this.lazers[i].offscreen() || this.lazers[i].outrange())
        this.lazers.splice(i,1);
    }
  }
}
class Lazer{
  constructor(loc,velocity){
    this.velocity = velocity;
    this.loc = loc;
    this.loc = loc.copy();
    this.range = 500;
    this.startloc = loc.copy();
  }
  outrange(){
    return dist(this.loc.x, this.loc.y, this.startloc.x, this.startloc.y) > this.range;
  }
  hit(things){
    for (var i = things.length - 1; i >= 0; i --){
      if(dist(this.loc.x, this.loc.y, things[i].loc.x, things[i].loc.y) < things[i].size/2){
        return i;
      }
    }
    return -1;
  }
  run(){
    this.loc.add(this.velocity);
  }
  offscreen(){
    if(this.loc.x > width)
      return true;
    if(this.loc.x < 0)
      return true;
    if(this.loc.y > height)
      return true;
    if(this.loc.y < 0)
      return true;
    return false;
  }
  draw(){
    push();
    translate(this.loc.x, this.loc.y);
    rotate(this.velocity.heading());
    fill("#ffcc00");
    stroke("#ff3300");
    strokeWeight(4);
    line(0, 0, 5, 0);
    pop();
  }
  update(){
    this.draw()
    this.run()
  }
}
class Explosion{
  constructor(loc, size){
    this.loc = loc;
    this.size = 0;
    this.maxsize = size;
    this.time = millis();
  }
  draw(){
    if(this.size<this.maxsize)
      this.size += this.maxsize/10;
    fill('#ff000055');
    noStroke();
    for(var i = 0; i < 15; i ++){
      var r = Math.random()*this.size;
      ellipse(this.loc.x - this.size/2 + Math.random()*this.size, this.loc.y - this.size/2 + Math.random()*this.size,r, r);
    }
  }
}
function spawnAst(num, bigness){
  for (var i = 0; i < num; i ++)
    asteroids.push(new Asteroid(2,spawnloc()));
}
function spawnloc(){
  var x = 0;
  var y = 0;
  if(parseInt(Math.random()* 2) == 0){
    x = [0,width][parseInt(Math.random() * 2)];
    y = Math.random() * height;
  }else{
    x = Math.random() * width;
    y = [0,height][parseInt(Math.random() * 2)];
  }
  return createVector(x,y);
}
function start(){
  asteroids = [];
  explosions = [];
  level = 1;
  lives = 3;
  points = 0;
  right = false;
  left = false;
  forward = false;
  spawnAst(2,3);
  ship = new Ship(width/2, height/2);
  for (var i = 0; i < 3; i ++)
    lifeships.push(new Ship(50 + 25*i,50));
}
function drawFlip(x, y){
  stroke('#000');
  fill('#0000');
  push();
  translate(x,y);
  ellipse(0,0,30,30);
  fill('#000');
  rotate(radians(90));
  triangle(15,0,12,5,18,5);
  triangle(-15,0,-12,-5,-18,-5);
  pop();
  textSize(10);
  fill('#fff');
  text("Flip",x,y);
}
function drawHyper(x, y){
  stroke('#000');
  fill('#0000');
  push();
  translate(x,y);
  for(var i = 0; i < 8; i ++){
    rotate(radians(i*45));
    line(5,0,15,0);
    fill('#000');
    triangle(15,0,13,3,13,-3);
  }
  pop();
  textSize(10);
  fill('#fff');
  text("Hyper\nSpace",x,y);
}
function drawShield(x, y){
  stroke('#000');
  fill('#0000');
  for(var i = 0; i < 10; i ++){
    ellipse(x,y,3*i, 3*i)
  }
  textSize(10);
  fill('#fff');
  text("Shield",x,y);
}
function shiphit(){
  for(var i = 0; i < asteroids.length; i++)
    if(asteroids[i].hit(ship))
      return true;
  for(var i = 0; i < saucers.length; i ++)
    for(var j = 0; j < saucers[i].lazers.length; j ++)
      if(saucers[i].lazers[j].hit([ship]) > -1)
        return true;
  return false;
}
function to6digits(points){
  var p = "" + points;
  while (p.length < 6)
    p = '0' + p;
  return p.substring(0,3) + "," + p.substring(3,6);
}
function play(){
  background(0);
  if (state === STARTSCREEN){
      push();
      scale(2);
      fill('#fff');
      textSize(40);
      text("AZTEROIDS", width/4, height/4 - 35);
      textSize(20);
      text("press SPACE to play", width/4, height/4);
      textSize(10);
      text("[H] - help", width/2 - 30, height/2 - 15);
      fill('#777');
      stroke('#000');
      for (var i = 0; i < 3; i ++)
        rect(width/4 + (i-1) * 50, height/4 + 45, 40, 40);
      drawFlip(width/4 - 50, height/4 + 45);
      drawHyper(width/4, height/4 + 45);
      drawShield(width/4 + 50, height/4 + 45);
      fill('#00000000');
      stroke('#f00');
      rect(width/4 + (selection - 1) * 50, height/4 + 45, 45, 45);
      pop();
    }else if(state === HELP){
      fill('#fff');
      textSize(20);
      textAlign(LEFT, CENTER);
      text("[SPACE] - Shoot", width/5, height/4);
      text("[UP] - Use Thrusters", width/5, height/4 + 25);
      text("[RIGHT] - Rotate Right", width/5, height/4 + 50);
      text("[LEFT] - Rotate Left", width/5, height/4 + 75);
      text("[DOWN] - Use Powerup", width/5, height/4 + 100);
      textAlign(LEFT,TOP);
      text("      POWERUPS:\nFLIP - Turns the spaceship 180 degrees\nHYPER SPACE - Teleport to a random spot on the screen\nSHIELD - Shield your ship for 3 seconds", width/5, height/4 + 150);
      text("Fly around and break the asteroids.\nDont get broken", width/2, height/4);
      textAlign(CENTER,CENTER);
    }else if(state === PLAYING || state === SPAWNING){
      textSize(50);
      text(to6digits(points), width - 150, 50);
      if(millis() - spawnlimit > 3000)
        state = PLAYING;
      for(var i = explosions.length-1; i >= 0; i--){
        explosions[i].draw();
        if(millis() - explosions[i].time > 150)
          explosions.splice(i,1);
      }
      for(var i = portals.length-1; i >= 0; i--){
        portals[i].draw();
        if(portals[i].finished())
          portals.splice(i,1);
      }
      for(var i = 0; i < asteroids.length; i++)
        asteroids[i].update();
      for(var i = 0; i < saucers.length; i++)
        saucers[i].update();
      for (var i = 0; i < lifeships.length; i ++)
        lifeships[i].draw();
      if(state === PLAYING && !ship.shielded){
        if(shiphit()){
          lifeships.splice(0,1);
          ship.velocity.set(0,0);
          explosions.push(new Explosion(ship.loc.copy() , 500));
          ship.loc.set(width/2, height/2);
          state = SPAWNING;
          spawnlimit = millis();
        }
        if(lifeships.length === 0)
          state = GAMEOVER;
      }
      ship.update();
      if (asteroids.length === 0){
        level ++;
        spawnAst(2, level + 1)
      }
      if (millis() - saucytimer > 10000 && saucers.length < 1){
        if (Math.random() * 40000 < points)
          saucers.push(new Saucer([0,width][parseInt(Math.random()*2)], 1));
        else
          saucers.push(new Saucer([0,width][parseInt(Math.random()*2)], 2));
      }
    } else if(state === GAMEOVER){
      textSize(40);
      text("GAMEOVER", width/2, height/2);
      textSize(20);
      text("press ENTER to post your score", width/2, height/2 + 35);
      text("press SPACE to play again", width/2, height/2 + 60);
      textSize(50);
      text(to6digits(points), width - 150, 50);
    }
}
function keyPressed(){
  if(state === STARTSCREEN){
      if(keyCode === RIGHT_ARROW)
        if(selection < 2)
          selection ++;
      if(keyCode === LEFT_ARROW)
        if(selection > 0)
          selection --;
      if(key === ' '){
        state = SPAWNING;
        spawnlimit = millis();
        start();
      }
      if(key === 'h' || key === 'H')
        state = HELP;
  }else if(state === PLAYING || state === SPAWNING){
    if(keyCode === RIGHT_ARROW)
      ship.right = true;
    if(keyCode === LEFT_ARROW)
      ship.left = true;
    if(keyCode === UP_ARROW)
      ship.forward = true;
    if(key === ' ')
      ship.shoot();
    if(keyCode === DOWN_ARROW){
      if(selection === FLIP)
        ship.acc.rotate(radians(180));
      else if (selection === HYPER){
        var tempx = ship.loc.x, tempy = ship.loc.y;
        ship.loc.set(Math.random() * width, Math.random() * height);
        while (shiphit()){
          ship.loc.set(Math.random() * width, Math.random() * height);
        }
        portals.push(new Portal(tempx, tempy, ship.loc.x, ship.loc.y));
      } else if (selection === SHIELD){
        ship.shielded = true;
        ship.shieldtime = millis();
      }
    }
  }else if(state === GAMEOVER){
    if(keyCode === ENTER)
      postScore({
        game: "asteroids",
        score: points
      });
    if(key === ' ')
      state = STARTSCREEN;
  }
}
function keyReleased(){
  if (state === PLAYING || SPAWNING){
    if(keyCode === RIGHT_ARROW)
      ship.right = false;
    if(keyCode === LEFT_ARROW)
      ship.left = false;
    if(keyCode === UP_ARROW)
      ship.forward = false;
  }
  if(state === HELP)
    if(key === 'h' || key === 'H')
      state = STARTSCREEN;
}
function setup(){
  canvas = createCanvas(1000, 600);
  canvas.parent("game");
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  //textFont(loadFont("/../style/arcade_font.ttf"));
}
function draw(){
  background(0);
  play();
}
