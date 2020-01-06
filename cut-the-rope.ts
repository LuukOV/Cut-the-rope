import * as PIXI from "pixi.js"
import { threadId } from "worker_threads";
import { runInThisContext } from "vm";
//var Matter = require('matter-js');

PIXI.utils.sayHello("hi");

var Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Constraint = Matter.Constraint, Events = Matter.Events, Composite = Matter.Composite, Body = Matter.Body;

var app = new PIXI.Application({ width: 640, height: 640, transparent: false });
document.getElementById('display')?.appendChild(app.view);
var container = new PIXI.Container(); // main stage
var engine;

// variable for cutting ropes
let dragging = false;
let startPos = {x: 0, y: 0};
let endPos = {x: 0, y: 0};
let drawLine:PIXI.Graphics;

// default gameobject class
class GameObject {
    graphics: any = new PIXI.Graphics;
    physics: any;
    constructor() {
        container.addChild(this.graphics);
    }

    update(deltaTime:number){
        // match graphics(pixi.js) with physics(matter.js)
        this.graphics.x = this.physics.position.x;
        this.graphics.y = this.physics.position.y;
    }
}

// End point of the game
class EndPoint extends GameObject {
    range :number = 0;
    candy :Candy = new PIXI.Graphics();

    constructor(x: number, y: number, size: number, color: number, candy:Candy){
        super();
        this.range = size;
        this.candy = candy;
        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, size);
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.pivot.x = 0;
        this.graphics.pivot.y = 0;
    }

    // Check if candy within range of end point
    CheckForWin(){
        let x = this.candy.graphics.x - this.graphics.x;
        let y = this.candy.graphics.y - this.graphics.y;
        let distance = Math.sqrt((x * x) + (y * y));
        if(distance < this.range){
            let text = new PIXI.Text('You win!',{fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
            text.pivot.x = text.width / 2; text.pivot.y - text.height / 2;
            text.x = (app.renderer.screen.width / 2); text.y = app.renderer.screen.height / 2;
            container.addChild(text);
            this.candy.graphics.clear();
        }
    }

    update(deltaTime:number){
        //super.update(deltaTime);
        this.CheckForWin();
    }
}

// bubble object which toggles the gravity upwards for the candy
class Bubble extends GameObject {
    range :number = 0;
    candy :Candy = new PIXI.Graphics();

    constructor(x: number, y: number, size: number, color: number, candy:Candy){
        super();
        this.range = size;
        this.candy = candy;
        this.graphics.lineStyle(1, color, 1);
        this.graphics.drawCircle(0, 0, size);
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.pivot.x = 0;
        this.graphics.pivot.y = 0;
    }

    // Check if candy is touching the bubble
    CheckForTouch(){
        let x = this.candy.graphics.x - this.graphics.x;
        let y = this.candy.graphics.y - this.graphics.y;
        let distance = Math.sqrt((x * x) + (y * y));
        if(distance < this.range){
            this.candy.Bubble();
            this.graphics.clear();
            let index = Objects.indexOf(this);
            if(index > -1){
                Objects.splice(index, 1);
            }
        }
    }

    update(deltaTime:number){
        //super.update(deltaTime);
        this.CheckForTouch();
    }
}


// simple obstructing object
class Wall extends GameObject {
    constructor(x: number, y: number, width: number, height: number, color: number){
        super();
        this.graphics.beginFill(color);
        this.graphics.drawRect(0, 0, width, height);
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.pivot.x = width / 2;
        this.graphics.pivot.y = height / 2;
        this.physics = Bodies.rectangle(x, y, width, height, { isStatic: true });
    }

    update(deltaTime:number){
        super.update(deltaTime);
    }
}

// The main object
class Candy extends GameObject {
    world: any;
    size: number;
    bubbled: boolean = false;
    bubble: PIXI.Graphics = new PIXI.Graphics();

    constructor(x: number, y: number, size: number, color: number, world: any, isStatic: boolean){
        super();
        this.world = world;
        this.size = size;
        this.graphics.beginFill(color);
        this.graphics.drawCircle(0, 0, size);
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.pivot.x = 0;
        this.graphics.pivot.y = 0;
        this.physics = Bodies.circle(x, y, size, { isStatic: isStatic, frictionAir: 0 });
        Body.setMass(this.physics, 0.00001); // low mass for more bouncing
    }

    // Toggle bubble mode on (floating upwards)
    Bubble(){
        if(!this.bubbled){
            Body.setVelocity( this.physics, {x: 0, y: 0});
            this.world.gravity.y = -0.1;

            this.bubble.lineStyle(1, 0xADD8E6, 1);
            this.bubble.drawCircle(0, 0, this.size * 2);
            this.bubble.x = this.graphics.x;
            this.bubble.y = this.graphics.y;
            container.addChild(this.bubble);

            this.bubbled = true;
        }
    }

    update(deltaTime:number){
        super.update(deltaTime);

        if(this.bubbled){
            this.bubble.x = this.graphics.x;
            this.bubble.y = this.graphics.y; 
        }
    }
}

// Points with ropes from where candy can hang
class SuspensionPoint extends GameObject {
    ropeLine:PIXI.Graphics = new PIXI.Graphics();
    availabiltyCircle:PIXI.Graphics = new PIXI.Graphics();
    rope:any;
    ropeList:SuspensionPoint[] = [];
    connectedCandy?:Candy;
    world:any;
    possibleCandy:Candy = new Candy(0,0,0, 0x000000, this.world, true);
    circleSize:number = 2;
    range:number;
    connectionRange = 50;
    stiffness:number;
    connected:boolean = false;
    available:boolean = false;

    constructor(x: number, y: number, ropeRange: number, stiffness: number,  world: any, ropeList:SuspensionPoint[]){
        super();

        this.range = ropeRange;
        this.stiffness = stiffness;
        this.world = world;
        this.ropeList = ropeList;

        this.graphics.beginFill(0xffffff);
        this.graphics.drawCircle(0, 0, this.circleSize);
        this.graphics.x = x;
        this.graphics.y = y;
        this.graphics.pivot.x = 0;
        this.graphics.pivot.y = 0;
        this.physics = Bodies.circle(x, y, this.circleSize, { isStatic: true});
    }

    // Connect a rope to the candy
    SetRope(candy:Candy){
        this.rope = Constraint.create({ 
            bodyA: this.physics, 
            bodyB: candy.physics,
            length: this.range,
            stiffness: this.stiffness
        });
        World.add(this.world, this.rope);
        this.connectedCandy = candy;
        this.connected = true;
        this.ropeList.push(this);
        container.addChild(this.ropeLine);
    }

    // Enable connectable mode
    SetAvailableForConnection(candy:Candy){
        if(!this.connected){
            this.possibleCandy = candy;
            this.available = true;
            this.availabiltyCircle.lineStyle(1, 0x666666, 1);
            this.availabiltyCircle.drawCircle(0, 0, this.connectionRange);
            this.availabiltyCircle.x = this.graphics.x;
            this.availabiltyCircle.y = this.graphics.y;
            container.addChild(this.availabiltyCircle);
        }
    }

    // Disconnect rope
    BreakRope(ropeList:SuspensionPoint[]){
        this.connected = false;
        container.removeChild(this.ropeLine);
        Composite.remove(this.world, this.rope);
        let index = ropeList.indexOf(this);
        if(index > -1){
            ropeList.splice(index, 1);
        }
    }

    // Check if candy is within connecting range
    CheckForConnection(){
        let x = this.possibleCandy.physics.position.x - this.physics.position.x;
        let y = this.possibleCandy.physics.position.y - this.physics.position.y;
        let distance = Math.sqrt((x * x) + (y * y));
        if(distance < this.connectionRange){
            this.SetRope(this.possibleCandy);
            this.available = false;
            this.availabiltyCircle.clear();
        }
    }

    update(deltaTime:number){
        super.update(deltaTime);

        if(this.available){
            this.CheckForConnection();
        }

        if(this.connected){
            let x = this.connectedCandy?.physics.position.x - this.physics.position.x;
            let y = this.connectedCandy?.physics.position.y - this.physics.position.y;
            let distance = Math.sqrt((x * x) + (y * y));
            this.rope.stiffness = distance > this.range ? 0.9 : this.stiffness

            this.ropeLine.clear();
            this.ropeLine.lineStyle(2, 0xb5651d, 1);
            this.ropeLine.moveTo(this.graphics.x, this.graphics.y);
            this.ropeLine.lineTo(this.connectedCandy?.graphics.x, this.connectedCandy?.graphics.y);
        }
    }
}

let Objects:GameObject[] = []; // objects to update
let ConnectedRopes:SuspensionPoint[] = []; // connected ropes to check for cutting

setup();
function setup() {
    engine = Engine.create();
    app.stage.addChild(container);
    var world = engine.world;
    world.gravity.y = 0.5; // make it a bit more floaty
    Engine.run(engine);

    // main candy object
    var theCandy = new Candy(100, 40, 15, 0x5cafe2, world, false);
    World.add(world, theCandy.physics);
    Objects.push(theCandy);

    // obstructing wall
    var wall1 = new Wall(200, 0, 25, 550, 0xffffff);
    World.add(world, wall1.physics);
    Objects.push(wall1);

    // bubble to float upwards with
    var bubble1 = new Bubble(275, 550, 20, 0xADD8E6, theCandy);
    Objects.push(bubble1);

    // finish point
    var finishPoint = new EndPoint(440, 50, 20, 0xffff00, theCandy);
    Objects.push(finishPoint);

    // connection points
    // connection points
    var rope1 = new SuspensionPoint(50, 90, 100, 0.0001, world, ConnectedRopes);
    World.add(world, rope1.physics);
    Objects.push(rope1);
    rope1.SetRope(theCandy);

    var rope2 = new SuspensionPoint(200, 90, 100, 0.0001, world, ConnectedRopes);
    World.add(world, rope2.physics);
    Objects.push(rope2);
    rope2.SetRope(theCandy);
    
    var rope3 = new SuspensionPoint(225, 400, 100, 0.0001, world, ConnectedRopes);
    World.add(world, rope3.physics);
    Objects.push(rope3);
    rope3.SetAvailableForConnection(theCandy);

    var rope4 = new SuspensionPoint(300, 275, 100, 0.0001, world, ConnectedRopes);
    World.add(world, rope4.physics);
    Objects.push(rope4);
    rope4.SetAvailableForConnection(theCandy);

    var rope5 = new SuspensionPoint(400, 200, 100, 0.0001, world, ConnectedRopes);
    World.add(world, rope5.physics);
    Objects.push(rope5);
    rope5.SetAvailableForConnection(theCandy);

    // line which cuts ropes
    drawLine = new PIXI.Graphics();
    drawLine.lineStyle(2, 0xFFFFFF, 1);
    drawLine.moveTo(0, 0);
    drawLine.lineTo(0, 0);
    container.addChild(drawLine);

    // Main update loop
    app.ticker.add(function (delta:number) {
        // run update on objects
        for (var i = 0; i < Objects.length; i++) {
            let child = Objects[i];
            child.update(delta);
        }

        // draw cutting line
        if(dragging){
            endPos = app.renderer.plugins.interaction.mouse.global;
            drawLine.clear();
            drawLine.lineStyle(2, 0xFFFFFF, 1);
            drawLine.moveTo(startPos.x, startPos.y);
            drawLine.lineTo(endPos.x, endPos.y);
        }
    });
}

// cutting rope
document.getElementById('display')?.addEventListener('mousedown', onDragStart, false);
document.getElementById('display')?.addEventListener('touchstart', onDragStart, false);

document.getElementById('display')?.addEventListener('mouseup', onDragEnd, false);
document.getElementById('display')?.addEventListener('touchend', onDragEnd, false);

function onDragStart() {
    dragging = true;
    startPos = Object.assign({}, app.renderer.plugins.interaction.mouse.global);
}

function onDragEnd() {
    dragging = false;
    drawLine.clear();
    drawLine.lineStyle(2, 0xFFFFFF, 1);
    checkForRopeCut();
}

function checkForRopeCut(){
    for(var i = ConnectedRopes.length - 1; i > -1; --i){
        var value = ConnectedRopes[i];
        let intersect = lineIntersect(value.rope.bodyA.position.x,  value.rope.bodyA.position.y,  value.rope.bodyB.position.x,  value.rope.bodyB.position.y, 
            startPos.x, startPos.y, endPos.x, endPos.y);
        if(intersect){
            value.BreakRope(ConnectedRopes);
        }
    }
}

/* Taken from: https://stackoverflow.com/a/15182022 */
function lineIntersect(x1:number,y1:number,x2:number,y2:number, x3:number,y3:number,x4:number,y4:number) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
}