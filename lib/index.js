//import * as katex from 'katex'
// uncomment this line instead of the above before compiling, use the above for intellisense type support
const katex = require('katex');
import katex_css from "../node_modules/katex/dist/katex.min.css";
export class TexMathBase extends HTMLElement {
    constructor(block) {
        super();
        this.m_tex = "";
        this.block = false;
        this.block = block;
        console.log(this.innerHTML);
        // Create a shadowRoot to display the content
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML =
            // style (katex css)
            "<style>" + katex_css + "</style>" +
                // hidden slot
                '<slot style="display:none;"></slot>' +
                // katex display
                '<span style="color:red;"></span>';
        console.log("shadow content: ", shadowRoot.innerHTML);
        this.m_slot = shadowRoot.querySelectorAll('slot')[0];
        this.m_display = shadowRoot.querySelectorAll('span')[0];
        let _this_ = this;
        this.m_slot.addEventListener('slotchange', function (e) {
            _this_.render();
            e;
        });
        console.log(this.m_slot);
    }
    get tex() {
        return this.m_tex;
    }
    render() {
        if (!this.m_slot)
            return;
        let nodes = this.m_slot.assignedNodes();
        let tex = "";
        for (let node of nodes) {
            tex += node.textContent;
        }
        // save tex
        this.m_tex = tex;
        console.log("tex: ", tex);
        // render using katex
        katex.render(tex, this.m_display, {
            displayMode: this.block,
            output: "html"
        });
    }
}
export class TexMath extends TexMathBase {
    constructor() {
        super(true);
    }
}
if (!customElements.get('tex-math'))
    customElements.define('tex-math', TexMath);
export class IMath extends TexMathBase {
    constructor() {
        super(false);
    }
}
if (!customElements.get('i-math'))
    customElements.define('i-math', IMath);
