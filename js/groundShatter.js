class GroundShatter {
    constructor(x) {
        this.x = x;
        this.life = 120; // Tồn tại 2 giây
        this.img = new Image();
        this.img.src = 'nui_da.png';
        this.width = 360;
    }

    update() {
        this.life--;
    }

   draw() {
    if (this.life <= 0) return;
    ctx.save();
    // Đảm bảo không làm ảnh hưởng đến Global Alpha của các vật thể khác
    ctx.globalAlpha = Math.min(1, this.life / 40); 
    // Vẽ núi đá trồi lên từ dưới lên
    ctx.drawImage(this.img, this.x - this.width/2, 150, this.width, canvas.height - 150);
    ctx.restore();
}
}