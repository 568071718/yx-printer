import { _decorator, Component, EventMouse, EventTouch, HorizontalTextAlignment, Node, RichText, ScrollView, UITransform, VerticalTextAlignment, warn, Widget } from 'cc';
import { YXPrinter } from './yx-printer';
const { ccclass, property, executionOrder, help } = _decorator;

class _yx_printer_label_content_scrollView extends ScrollView {
    protected _onMouseWheel(event: EventMouse, captureListeners?: Node[]): void {
        event.propagationStopped = false
    }
    protected _onTouchBegan(event: EventTouch, captureListeners?: Node[]): void {
        event.propagationStopped = false
    }
    protected _onTouchMoved(event: EventTouch, captureListeners?: Node[]): void {
        event.propagationStopped = false
    }
    protected _onTouchEnded(event: EventTouch, captureListeners?: Node[]): void {
        event.propagationStopped = false
    }
    protected _onTouchCancelled(event: EventTouch, captureListeners?: Node[]): void {
        event.propagationStopped = false
    }
}

/**
 * 修复富文本内容包含标签时换行异常的问题  
 */
class _yx_printer_label extends RichText {
    protected splitLongStringOver2048 (text: string, styleIndex: number): string[] {
        return [text]
    }
}

/**
 * 基于 YXPrinter 和 RichText 实现一个文本打字机
 */
@ccclass('YXTypewriter')
@executionOrder(-1)
@help(`https://gitee.com/568071718/yx-printer`)
export class YXTypewriter extends Component {

    /**
     * 编辑器配置字体大小  
     */
    @property({ tooltip: `富文本字体大小`, visible: true })
    private _fontSize: number = 40

    /**
     * 编辑器配置行高  
     */
    @property({ tooltip: `富文本行高`, visible: true })
    private _lineHeight: number = 40

    /**
     * 编辑器配置打字机速度
     */
    @property({ tooltip: `打字机速度`, visible: true })
    private _speed: number = 1000

    /**
     * 内部滚动视图组件
     */
    private get scrollView(): ScrollView {
        let result = this.node.getComponent(_yx_printer_label_content_scrollView)
        if (result == null) {
            result = this.node.addComponent(_yx_printer_label_content_scrollView)
            result.horizontal = false
            result.vertical = true

            let content = new Node(`yx-printer-label-scroll-content`)
            content.addComponent(UITransform)
            content.parent = result.node
            content.layer = content.parent.layer
            result.content = content

            let contentWidget = content.addComponent(Widget)
            contentWidget.isAlignLeft = true
            contentWidget.left = 0
            contentWidget.isAlignRight = true
            contentWidget.right = 0
            contentWidget.updateAlignment()
        }
        return result
    }

    /**
     * 获取内部富文本组件  
     * 修改了 richText 的属性配置后，需要主动执行一次 commitConfig 方法
     */
    get richText(): RichText {
        let content = this.scrollView.content
        let result = content.getChildByName(`yx-printer-label`)
        if (result == null) {
            result = new Node(`yx-printer-label`)
            result.addComponent(UITransform)
            result.parent = content
            result.layer = result.parent.layer

            let richText = result.addComponent(_yx_printer_label)
            richText.lineHeight = 50
            richText.horizontalAlign = HorizontalTextAlignment.LEFT
            richText.verticalAlign = VerticalTextAlignment.CENTER
            richText.fontSize = 40
            richText.maxWidth = this.node.getComponent(UITransform).width
            richText.string = ``

            let resultWidget = result.addComponent(Widget)
            resultWidget.isAlignLeft = true
            resultWidget.left = 0
            resultWidget.isAlignTop = true
            resultWidget.top = 0
            resultWidget.updateAlignment()
        }
        return result.getComponent(_yx_printer_label)
    }

    /**
     * 获取内部打字机组件  
     * 修改了 printer 的属性配置后，需要主动执行一次 commitConfig 方法  
     */
    get printer(): YXPrinter {
        let result = this.node.getComponent(YXPrinter)
        if (result == null) {
            result = this.node.addComponent(YXPrinter)
        }
        return result
    }

    /**
     * 更新配置  
     * 组件开放了 richText 和 printer 的 get 访问，外部可以通过 get 获取到对应组件后随意修改属性配置，但是修改之后必须执行一下这个方法  
     */
    commitConfig() {
        if (this.richText.lineHeight != this.printer.lineHeight) {
            // 这里给个警告吧，暂时不强制去修正这个高度，应该是使用者决定以哪个高度为准 
            warn(`YXPrinter: label 行高跟打字机的行高不一致，打字机显示可能会有异常`)
        }
        let thisWidget = this.node.getComponent(Widget)
        if (thisWidget) { thisWidget.updateAlignment() }
        let contentWidget = this.scrollView.content.getComponent(Widget)
        if (contentWidget) { contentWidget.updateAlignment() }

        let width = this.node.getComponent(UITransform).width
        let height = this.node.getComponent(UITransform).height

        this.richText.maxWidth = width
        let lineCount = this.richText["_lineCount"]
        let labelHeight = (lineCount * this.richText.lineHeight)
        this.scrollView.content.getComponent(UITransform).height = Math.ceil(labelHeight / height) * height
        this.richText.node.getComponent(UITransform).height = labelHeight
        this.richText.node.getComponent(Widget).updateAlignment()

        this.scrollView.scrollToTop()
    }

    /**
     * 是否还有更多内容  
     */
    hasNextPage() {
        let offset = this.scrollView.getScrollOffset()
        let maxOffset = this.scrollView.getMaxScrollOffset()
        return maxOffset.y > offset.y
    }

    /**
     * 切换至下页内容  
     */
    scrollToNextPage() {
        let offset = this.scrollView.getScrollOffset()
        offset.y = offset.y + this.node.getComponent(UITransform).height
        this.scrollView.scrollToOffset(offset)
    }

    /**
     * 打印进度变化  
     */
    onPrintChange(x: number, y: number) {
        let offset = this.scrollView.getScrollOffset()
        let row = Math.ceil((offset.y + y) / this.printer.lineHeight)
        let lineCount = this.richText["_lineCount"]
        if (row == lineCount) {
            let linesWidth = this.richText["_linesWidth"]
            let width = linesWidth[row - 1]
            if (x >= width) {
                this.printer.setFull()
            }
        }
    }

    /**
     * 打印结束  
     */
    onPrintEnded(x: number, y: number) {
    }

    /**
     * 生命周期  
     */
    protected onLoad(): void {
        this.node.on(YXPrinter.PRINT_POSITION_CHANGE, this.onPrintChange, this)
        this.node.on(YXPrinter.PRINT_ENDED, this.onPrintEnded, this)

        this.richText.fontSize = this._fontSize
        this.richText.lineHeight = this._lineHeight
        this.printer.lineHeight = this._lineHeight
        this.printer.speed = this._speed
        this.commitConfig()
    }

    protected onDestroy(): void {
        this.node.off(YXPrinter.PRINT_POSITION_CHANGE, this.onPrintChange, this)
        this.node.off(YXPrinter.PRINT_ENDED, this.onPrintEnded, this)
    }

    protected start(): void {

    }

    protected update(dt: number): void {

    }
}

