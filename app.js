PIXI.utils.sayHello();

var app = new PIXI.Application({ width: 640, height: 360, transparent: false });

document.getElementById('display').appendChild(app.view);

var container = new PIXI.Container();
var star;

setup();

function setup() {
	app.stage.addChild(container);
	var star = new PIXI.Sprite(PIXI.Texture.from("star.png"));
	
	
	star.x = app.screen.width / 2;
	star.y = app.screen.height /2;
	star.anchor.set(0.5);
	
	container.addChild(star);
	
	var circle = new PIXI.Graphics();
	circle.beginFill(0x5cafe2);
	circle.drawCircle(0, 0, 80);
	circle.x = 320;
	circle.y = 180;
	
	//container.addChild(circle);
	
	app.ticker.add((delta) => {
    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    star.rotation += 0.8 * delta;
	});
}



/*
var app = new PIXI.Application({ width: 640, height: 360, transparent: true });

document.getElementById('display').appendChild(app.view);

var circle = new PIXI.Graphics();
circle.beginFill(0x5cafe2);
circle.drawCircle(0, 0, 80);
circle.x = 320;
circle.y = 180;

app.stage.addChild(circle);*/