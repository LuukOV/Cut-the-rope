class GameObject {
    graphics: any = new PIXI.Graphics;
    physics: any;
    constructor() {
        container.addChild(this.graphics);
    }

    update(deltaTime:number){
        this.graphics.x = this.physics.position.x;
        this.graphics.y = this.physics.position.y;
    }
}