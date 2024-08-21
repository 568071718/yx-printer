import { _decorator, Component, Label, log, Node, NodeEventType, tween, UIOpacity, UITransform } from 'cc';
import { YXPrinter } from '../lib/yx-printer';
import { YXTypewriter } from '../lib/yx-typewriter';
const { ccclass, property } = _decorator;

@ccclass('demo')
export class demo extends Component {

    @property(YXTypewriter)
    comp: YXTypewriter = null

    @property(Node)
    nextButton: Node = null

    protected onLoad(): void {

        this.comp.node.on(YXPrinter.PRINT_POSITION_CHANGE, this.onPrint, this)
        this.comp.node.on(YXPrinter.PRINT_ENDED, this.onPrintEnded, this)
        this.node.on(NodeEventType.TOUCH_END, this.onTouchEnd, this)

        // 使用代码调整参数
        // this.comp.richText.fontSize = 30
        // this.comp.richText.lineHeight = this.comp.node.getComponent(UITransform).height / 4 // 分 x 行打
        // this.comp.printer.lineHeight = this.comp.richText.lineHeight

        // 开始打字
        this.comp.richText.string = `在那悠悠的清晨，阳光透过窗帘的缝隙，像是天上的<color=#FF0000>小猫咪</color>悄悄溜进了房间。空气中飘荡着一股混合着刚刚烘焙出的面包香和一丝未完全散去的梦境的味道。时钟的秒针在墙上画着一个个小圆圈，它的声音仿佛在诉说着宇宙间最深邃的秘密，而这些秘密的密码是“午饭还没到”。于是，我们在这无尽的等待中，无声地与时间对峙，仿佛我们是宇宙的一部分，而宇宙只是一个被无限循环的咖啡杯环绕的平面。在这里，所有的事情都有可能发生，或者说，所有的事情都在平行的维度中静静地等待着被揭示，只是我们还未曾真正发现罢了。`
        this.comp.commitConfig()
        this.comp.printer.print()
    }

    onPrint(x: number, y: number) {

    }

    onPrintEnded(x: number, y: number) {
        if (this.comp.hasNextPage()) {
            this.nextButton.active = true
            tween(this.nextButton.getComponent(UIOpacity)).set({ opacity: 0 }).to(0.5, { opacity: 255 }).start()
            return
        }
        this.nextButton.active = true
        this.nextButton.getChildByName(`label`).getComponent(Label).string = `完`
        tween(this.nextButton.getComponent(UIOpacity)).set({ opacity: 0 }).to(0.5, { opacity: 255 }).start()
    }

    onTouchNextButton() {
        if (this.comp.hasNextPage()) {
            this.nextButton.active = false
            this.comp.scrollToNextPage()
            this.comp.printer.print() // 翻页之后，再从头开始打
            return
        }
    }

    onTouchEnd() {
        // 跳过打字阶段，如果可以的话
        if (this.comp.printer.isFull() == false) {
            this.comp.printer.setFull()
            return
        }
    }
}

