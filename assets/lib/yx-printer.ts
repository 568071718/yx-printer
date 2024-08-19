import { _decorator, Component, Graphics, Mask, UITransform } from 'cc';
const { ccclass, property, help } = _decorator;

@ccclass('YXPrinter')
@help(`https://gitee.com/568071718/yx-printer`)
export class YXPrinter extends Component {

    /**
     * 打印进度变化事件  
     */
    static PRINT_POSITION_CHANGE: string = `PRINT_POSITION_CHANGE`

    /**
     * 打印结束事件
     */
    static PRINT_ENDED: string = `PRINT_FINISH`

    /**
     * 遮罩方式实现打字机业务  
     */
    private graphics: Graphics = null

    /**
     * 约定的要打印的每行内容的高度  
     */
    @property({ tooltip: `约定的每行内容的高度` })
    lineHeight: number = 40

    /**
     * 打字速度，遮罩移动速度  
     */
    @property({ tooltip: `打字速度，遮罩移动速度` })
    speed: number = 1000

    /**
     * 应理解为当前打印光标的位置，也就是当前打字进度是打到哪个位置了  
     * 注意: 参考坐标系系是以左上角为起点的坐标系  
     */
    private x: number = 0
    private y: number = 0

    /**
     * 记录是否正在执行打印逻辑
     */
    private running: boolean = false

    /**
     * 获取当前打字机运行状态  
     */
    get isRunning(): boolean {
        return this.running
    }

    /**
     * 开始执行打字逻辑
     * @param reset 是否从头开始，默认 true
     */
    print(reset: boolean = true) {
        if (this.lineHeight <= 0) {
            throw new Error("YXPrinter: rowHeight 配置错误，请确定行高");
        }
        if (reset) {
            this.setClear()
            this.x = 0
            this.y = this.lineHeight
        }
        this.running = true
    }

    /**
     * 暂停  
     * 恢复需要通过 print(false) 实现  
     * 未测试的功能  
     */
    pause() {
        this.running = false
    }

    /**
     * 是否打完了
     */
    isFull(): boolean {
        let width = this.node.getComponent(UITransform).width
        let height = this.node.getComponent(UITransform).height
        if (this.x >= width) {
            if (this.y >= height) {
                return true
            }
        }
        return false
    }

    /**
     * 直接设置显示全部内容  
     */
    setFull() {
        let width = this.node.getComponent(UITransform).width
        let height = this.node.getComponent(UITransform).height
        this.x = width
        this.y = height
        this.running = true
    }

    /**
     * 不显示任何内容
     */
    setClear() {
        this.graphics.clear()
        this.graphics.fill()
        this.running = false
    }

    /**
     * 
     */
    protected onLoad(): void {
        this.node.getComponent(Mask) || this.node.addComponent(Mask)
        this.graphics = this.node.getComponent(Graphics) || this.node.addComponent(Graphics)
        this.setClear()
    }

    protected update(dt: number): void {
        if (this.running == false) { return }
        let width = this.node.getComponent(UITransform).width
        let height = this.node.getComponent(UITransform).height

        this.x += this.speed * dt
        this.x = Math.min(this.x, width)

        let startX = - width * 0.5
        let startY = height * 0.5
        this.graphics.clear()
        this.graphics.moveTo(startX, startY)
        this.graphics.lineTo(startX, startY - this.y)
        this.graphics.lineTo(startX + this.x, startY - this.y)
        this.graphics.lineTo(startX + this.x, startY - this.y + this.lineHeight)
        this.graphics.lineTo(startX + width, startY - this.y + this.lineHeight)
        this.graphics.lineTo(startX + width, startY)
        this.graphics.close()
        this.graphics.fill()

        this.node.emit(YXPrinter.PRINT_POSITION_CHANGE, this.x, this.y)

        // 更新光标位置
        if (this.x >= width) {
            // 检查是否打完了
            if (this.y >= height) {
                this.running = false
                this.node.emit(YXPrinter.PRINT_ENDED, this.x, this.y)
                return
            }
            // 换行
            this.x = 0
            this.y = this.y + this.lineHeight
        }
    }
}

