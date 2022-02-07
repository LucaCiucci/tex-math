
//import * as katex from 'katex'
// uncomment this line instead of the above before compiling, use the above for intellisense type support
const katex = require('katex');

import katex_css_ulr from "../node_modules/katex/dist/katex.min.css"

export abstract class TexMathBase extends HTMLElement {

	private m_tex : string = "";
	private blockDisplay : boolean = false;
	private m_slot? : HTMLSlotElement;
	private m_display? : HTMLElement;

	get tex() : string {
		return this.m_tex;
	}
	set tex(_tex : string) {
		this.textContent = _tex;
	}

	constructor(blockDisplay : boolean) {
		super();

		// store display mode
		this.blockDisplay = blockDisplay;

		// Create a shadowRoot to display the content
		const shadowRoot = this.attachShadow({ mode: 'open' });

		shadowRoot.innerHTML =
		// style (katex css), we have to insert the stylesheet here since the shadowRoot cannot inherit styles
		`<link rel="stylesheet" href="` + katex_css_ulr + `">` +
		// hidden slot, just to receive the content
		'<slot id="src" style="display:none;"></slot>' +
		// katex math display here
		'<span id="display"></span>';

		// find the slot
		this.m_slot = shadowRoot.querySelectorAll('#src')[0] as HTMLSlotElement;

		// find the display element
		this.m_display = shadowRoot.querySelectorAll('#display')[0] as HTMLElement;

		// add an event listener to the slot in order to change the 
		let _this_ = this;
		let slot = this.m_slot;
		this.m_slot.addEventListener('slotchange', function({/* unused event parameter */} : Event) {
			_this_.render();

			// listen for nodes changes
			// https://stackoverflow.com/questions/47378194/fire-a-function-when-innerhtml-of-element-changes
			let nodes = slot.assignedNodes();
			for (let node of nodes) {
				node.addEventListener('DOMSubtreeModified', function() {
					_this_.render();
				});
			}
		});
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
			displayMode: this.blockDisplay,
			//display: this.blockDisplay,
			output: "html"
		});
	}

}

// inline math element
export class IMath extends TexMathBase {
	constructor() {
		super(false);
	}
}
if (!customElements.get('i-math'))
	customElements.define('i-math', IMath);

// math display element
export class TexMath extends TexMathBase {
	constructor() {
		super(true);
	}
}
if (!customElements.get('tex-math'))
	customElements.define('tex-math', TexMath);


// katex requires some fonts that have to be loaded outside
// the shadowRoot since styles inside shadowRoot cannot load fonts
let style_sheet = document.createElement("link");
style_sheet.setAttribute('rel', "stylesheet");
style_sheet.setAttribute('href', katex_css_ulr);
document.head.append(style_sheet);