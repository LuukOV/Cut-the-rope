"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var _a, _b, _c, _d, _e;
exports.__esModule = true;
var PIXI = require("pixi.js");
//var Matter = require('matter-js');
PIXI.utils.sayHello("hi");
var Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Constraint = Matter.Constraint, Events = Matter.Events, Composite = Matter.Composite, Body = Matter.Body;
var app = new PIXI.Application({ width: 640, height: 640, transparent: false });
(_a = document.getElementById('display')) === null || _a === void 0 ? void 0 : _a.appendChild(app.view);
var container = new PIXI.Container(); // main stage
var engine;
// variable for cutting ropes
var dragging = false;
var startPos = { x: 0, y: 0 };
var endPos = { x: 0, y: 0 };
var drawLine;
// default gameobject class
var GameObject = /** @class */ (function () {
    function GameObject() {
        this.graphics = new PIXI.Graphics;
        container.addChild(this.graphics);
    }
    GameObject.prototype.update = function (deltaTime) {
        // match graphics(pixi.js) with physics(matter.js)
        this.graphics.x = this.physics.position.x;
        this.graphics.y = this.physics.position.y;
    };
    return GameObject;
}());
// End point of the game
var EndPoint = /** @class */ (function (_super) {
    __extends(EndPoint, _super);
    function EndPoint(x, y, size, color, candy) {
        var _this = _super.call(this) || this;
        _this.range = 0;
        _this.candy = new PIXI.Graphics();
        _this.range = size;
        _this.candy = candy;
        _this.graphics.beginFill(color);
        _this.graphics.drawCircle(0, 0, size);
        _this.graphics.x = x;
        _this.graphics.y = y;
        _this.graphics.pivot.x = 0;
        _this.graphics.pivot.y = 0;
        return _this;
    }
    // Check if candy within range of end point
    EndPoint.prototype.CheckForWin = function () {
        var x = this.candy.graphics.x - this.graphics.x;
        var y = this.candy.graphics.y - this.graphics.y;
        var distance = Math.sqrt((x * x) + (y * y));
        if (distance < this.range) {
            var text = new PIXI.Text('You win!', { fontFamily: 'Arial', fontSize: 24, fill: 0xffffff, align: 'center' });
            text.pivot.x = text.width / 2;
            text.pivot.y - text.height / 2;
            text.x = (app.renderer.screen.width / 2);
            text.y = app.renderer.screen.height / 2;
            container.addChild(text);
            this.candy.graphics.clear();
        }
    };
    EndPoint.prototype.update = function (deltaTime) {
        //super.update(deltaTime);
        this.CheckForWin();
    };
    return EndPoint;
}(GameObject));
// bubble object which toggles the gravity upwards for the candy
var Bubble = /** @class */ (function (_super) {
    __extends(Bubble, _super);
    function Bubble(x, y, size, color, candy) {
        var _this = _super.call(this) || this;
        _this.range = 0;
        _this.candy = new PIXI.Graphics();
        _this.range = size;
        _this.candy = candy;
        _this.graphics.lineStyle(1, color, 1);
        _this.graphics.drawCircle(0, 0, size);
        _this.graphics.x = x;
        _this.graphics.y = y;
        _this.graphics.pivot.x = 0;
        _this.graphics.pivot.y = 0;
        return _this;
    }
    // Check if candy is touching the bubble
    Bubble.prototype.CheckForTouch = function () {
        var x = this.candy.graphics.x - this.graphics.x;
        var y = this.candy.graphics.y - this.graphics.y;
        var distance = Math.sqrt((x * x) + (y * y));
        if (distance < this.range) {
            this.candy.Bubble();
            this.graphics.clear();
            var index = Objects.indexOf(this);
            if (index > -1) {
                Objects.splice(index, 1);
            }
        }
    };
    Bubble.prototype.update = function (deltaTime) {
        //super.update(deltaTime);
        this.CheckForTouch();
    };
    return Bubble;
}(GameObject));
// simple obstructing object
var Wall = /** @class */ (function (_super) {
    __extends(Wall, _super);
    function Wall(x, y, width, height, color) {
        var _this = _super.call(this) || this;
        _this.graphics.beginFill(color);
        _this.graphics.drawRect(0, 0, width, height);
        _this.graphics.x = x;
        _this.graphics.y = y;
        _this.graphics.pivot.x = width / 2;
        _this.graphics.pivot.y = height / 2;
        _this.physics = Bodies.rectangle(x, y, width, height, { isStatic: true });
        return _this;
    }
    Wall.prototype.update = function (deltaTime) {
        _super.prototype.update.call(this, deltaTime);
    };
    return Wall;
}(GameObject));
// The main object
var Candy = /** @class */ (function (_super) {
    __extends(Candy, _super);
    function Candy(x, y, size, color, world, isStatic) {
        var _this = _super.call(this) || this;
        _this.bubbled = false;
        _this.bubble = new PIXI.Graphics();
        _this.world = world;
        _this.size = size;
        _this.graphics.beginFill(color);
        _this.graphics.drawCircle(0, 0, size);
        _this.graphics.x = x;
        _this.graphics.y = y;
        _this.graphics.pivot.x = 0;
        _this.graphics.pivot.y = 0;
        _this.physics = Bodies.circle(x, y, size, { isStatic: isStatic, frictionAir: 0 });
        Body.setMass(_this.physics, 0.00001); // low mass for more bouncing
        return _this;
    }
    // Toggle bubble mode on (floating upwards)
    Candy.prototype.Bubble = function () {
        if (!this.bubbled) {
            Body.setVelocity(this.physics, { x: 0, y: 0 });
            this.world.gravity.y = -0.1;
            this.bubble.lineStyle(1, 0xADD8E6, 1);
            this.bubble.drawCircle(0, 0, this.size * 2);
            this.bubble.x = this.graphics.x;
            this.bubble.y = this.graphics.y;
            container.addChild(this.bubble);
            this.bubbled = true;
        }
    };
    Candy.prototype.update = function (deltaTime) {
        _super.prototype.update.call(this, deltaTime);
        if (this.bubbled) {
            this.bubble.x = this.graphics.x;
            this.bubble.y = this.graphics.y;
        }
    };
    return Candy;
}(GameObject));
// Points with ropes from where candy can hang
var SuspensionPoint = /** @class */ (function (_super) {
    __extends(SuspensionPoint, _super);
    function SuspensionPoint(x, y, ropeRange, stiffness, world, ropeList) {
        var _this = _super.call(this) || this;
        _this.ropeLine = new PIXI.Graphics();
        _this.availabiltyCircle = new PIXI.Graphics();
        _this.ropeList = [];
        _this.possibleCandy = new Candy(0, 0, 0, 0x000000, _this.world, true);
        _this.circleSize = 2;
        _this.connectionRange = 50;
        _this.connected = false;
        _this.available = false;
        _this.range = ropeRange;
        _this.stiffness = stiffness;
        _this.world = world;
        _this.ropeList = ropeList;
        _this.graphics.beginFill(0xffffff);
        _this.graphics.drawCircle(0, 0, _this.circleSize);
        _this.graphics.x = x;
        _this.graphics.y = y;
        _this.graphics.pivot.x = 0;
        _this.graphics.pivot.y = 0;
        _this.physics = Bodies.circle(x, y, _this.circleSize, { isStatic: true });
        return _this;
    }
    // Connect a rope to the candy
    SuspensionPoint.prototype.SetRope = function (candy) {
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
    };
    // Enable connectable mode
    SuspensionPoint.prototype.SetAvailableForConnection = function (candy) {
        if (!this.connected) {
            this.possibleCandy = candy;
            this.available = true;
            this.availabiltyCircle.lineStyle(1, 0x666666, 1);
            this.availabiltyCircle.drawCircle(0, 0, this.connectionRange);
            this.availabiltyCircle.x = this.graphics.x;
            this.availabiltyCircle.y = this.graphics.y;
            container.addChild(this.availabiltyCircle);
        }
    };
    // Disconnect rope
    SuspensionPoint.prototype.BreakRope = function (ropeList) {
        this.connected = false;
        container.removeChild(this.ropeLine);
        Composite.remove(this.world, this.rope);
        var index = ropeList.indexOf(this);
        if (index > -1) {
            ropeList.splice(index, 1);
        }
    };
    // Check if candy is within connecting range
    SuspensionPoint.prototype.CheckForConnection = function () {
        var x = this.possibleCandy.physics.position.x - this.physics.position.x;
        var y = this.possibleCandy.physics.position.y - this.physics.position.y;
        var distance = Math.sqrt((x * x) + (y * y));
        if (distance < this.connectionRange) {
            this.SetRope(this.possibleCandy);
            this.available = false;
            this.availabiltyCircle.clear();
        }
    };
    SuspensionPoint.prototype.update = function (deltaTime) {
        var _a, _b, _c, _d;
        _super.prototype.update.call(this, deltaTime);
        if (this.available) {
            this.CheckForConnection();
        }
        if (this.connected) {
            var x = ((_a = this.connectedCandy) === null || _a === void 0 ? void 0 : _a.physics.position.x) - this.physics.position.x;
            var y = ((_b = this.connectedCandy) === null || _b === void 0 ? void 0 : _b.physics.position.y) - this.physics.position.y;
            var distance = Math.sqrt((x * x) + (y * y));
            this.rope.stiffness = distance > this.range ? 0.9 : this.stiffness;
            this.ropeLine.clear();
            this.ropeLine.lineStyle(2, 0xb5651d, 1);
            this.ropeLine.moveTo(this.graphics.x, this.graphics.y);
            this.ropeLine.lineTo((_c = this.connectedCandy) === null || _c === void 0 ? void 0 : _c.graphics.x, (_d = this.connectedCandy) === null || _d === void 0 ? void 0 : _d.graphics.y);
        }
    };
    return SuspensionPoint;
}(GameObject));
var Objects = []; // objects to update
var ConnectedRopes = []; // connected ropes to check for cutting
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
    app.ticker.add(function (delta) {
        // run update on objects
        for (var i = 0; i < Objects.length; i++) {
            var child = Objects[i];
            child.update(delta);
        }
        // draw cutting line
        if (dragging) {
            endPos = app.renderer.plugins.interaction.mouse.global;
            drawLine.clear();
            drawLine.lineStyle(2, 0xFFFFFF, 1);
            drawLine.moveTo(startPos.x, startPos.y);
            drawLine.lineTo(endPos.x, endPos.y);
        }
    });
}
// cutting rope
(_b = document.getElementById('display')) === null || _b === void 0 ? void 0 : _b.addEventListener('mousedown', onDragStart, false);
(_c = document.getElementById('display')) === null || _c === void 0 ? void 0 : _c.addEventListener('touchstart', onDragStart, false);
(_d = document.getElementById('display')) === null || _d === void 0 ? void 0 : _d.addEventListener('mouseup', onDragEnd, false);
(_e = document.getElementById('display')) === null || _e === void 0 ? void 0 : _e.addEventListener('touchend', onDragEnd, false);
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
function checkForRopeCut() {
    for (var i = ConnectedRopes.length - 1; i > -1; --i) {
        var value = ConnectedRopes[i];
        var intersect = lineIntersect(value.rope.bodyA.position.x, value.rope.bodyA.position.y, value.rope.bodyB.position.x, value.rope.bodyB.position.y, startPos.x, startPos.y, endPos.x, endPos.y);
        if (intersect) {
            value.BreakRope(ConnectedRopes);
        }
    }
}
/* Taken from: https://stackoverflow.com/a/15182022 */
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (isNaN(x) || isNaN(y)) {
        return false;
    }
    else {
        if (x1 >= x2) {
            if (!(x2 <= x && x <= x1)) {
                return false;
            }
        }
        else {
            if (!(x1 <= x && x <= x2)) {
                return false;
            }
        }
        if (y1 >= y2) {
            if (!(y2 <= y && y <= y1)) {
                return false;
            }
        }
        else {
            if (!(y1 <= y && y <= y2)) {
                return false;
            }
        }
        if (x3 >= x4) {
            if (!(x4 <= x && x <= x3)) {
                return false;
            }
        }
        else {
            if (!(x3 <= x && x <= x4)) {
                return false;
            }
        }
        if (y3 >= y4) {
            if (!(y4 <= y && y <= y3)) {
                return false;
            }
        }
        else {
            if (!(y3 <= y && y <= y4)) {
                return false;
            }
        }
    }
    return true;
}
