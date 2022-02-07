//import * as katex from 'katex'
// uncomment this line instead of the above before compiling, use the above for intellisense type support
const katex = require('katex');
import katex_css_ulr from "../node_modules/katex/dist/katex.min.css";
export class TexMathBase extends HTMLElement {
    constructor(block) {
        super();
        this.m_tex = "";
        this.block = false;
        this.block = block;
        // Create a shadowRoot to display the content
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML =
            // style (katex css), we have to insert the stylesheet here since the shadowRoot cannot inherit styles
            `<link rel="stylesheet" href="` + katex_css_ulr + `">` +
                // hidden slot, just to receive the content
                '<slot id="src" style="display:none;"></slot>' +
                // katex math display here
                '<span id="display"></span>';
        this.m_slot = shadowRoot.querySelectorAll('#src')[0];
        this.m_display = shadowRoot.querySelectorAll('#display')[0];
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
    set tex(_tex) {
        this.textContent = _tex;
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
        // render using katex
        katex.render(tex, this.m_display, {
            displayMode: this.block,
            display: this.block,
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
// katex requires some fonts that have to be loaded outside
// the shadowRoot since styles inside shadowRoot cannot load fonts
let style_sheet = document.createElement("link");
style_sheet.setAttribute('rel', "stylesheet");
style_sheet.setAttribute('href', katex_css_ulr);
document.head.append(style_sheet);
