
//import * as katex from 'katex'
// uncomment this line instead of the above before compiling, use the above for intellisense type support
const katex = require('katex');

import katex_css_ulr from "../node_modules/katex/dist/katex.min.css"

export abstract class TexMathBase extends HTMLElement {

	private m_tex : string = "";
	private blockDisplay : boolean = false;
	private m_slot? : HTMLSlotElement;
	private m_display? : HTMLElement;
	private m_number : HTMLElement;
	private m_container : HTMLElement;
	private number : number = -1;

	static equation_counter = 0;

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
		'<span id="container"><span id="display" style="overflow-x:auto"></span><div id="number"></div></span>';

		// find the slot
		this.m_slot = shadowRoot.querySelectorAll('#src')[0] as HTMLSlotElement;

		// find the display element
		this.m_display = shadowRoot.querySelectorAll('#display')[0] as HTMLElement;

		// find the container element
		let container = shadowRoot.querySelectorAll('#container')[0] as HTMLElement;
		this.m_container = container;

		// find the number element
		this.m_number = shadowRoot.querySelectorAll('#number')[0] as HTMLElement;
		this.m_number.style.display = "none";

		{
			container.style.display = "inline";
			container.style.alignContent = "center";
			this.m_display.style.flexGrow = "1";
			this.m_number.style.display = "none";
			this.m_number.style.flexGrow = "0";
			this.m_number.style.width = "4em";
			this.m_number.style.position = "relative";
		}

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
		if (this.m_display) {
			try {
				katex.render(tex, this.m_display, {
					displayMode: this.blockDisplay,
					//display: this.blockDisplay,
					output: "html"
				});
			} catch (error) {
				this.m_display.innerHTML = '<span style="color:red;">' + error + "</span>";
			}
		}
	}

	createLinkPreview(preview : HTMLElement) : void {
		let eq = document.createElement('tex-math') as TexMathBase;
		eq.tex = this.tex;
		preview.appendChild(eq);
	}

	refDisplay() : HTMLElement {
		let number = document.createElement('span');
		number.innerHTML = this.number.toString();
		return number
	}

	connectedCallback() {
		if (this.number < 0 && (this.hasAttribute('id') || this.hasAttribute('number') || this.hasAttribute('n'))) {
			this.number = ++TexMathBase.equation_counter;
		}
		
		if (this.number > 0) {
			this.m_number.innerHTML = "(" + this.number.toString() + ")";
			this.m_number.innerHTML = "<div style=\"position:absolute; top:50%; right:0; transform: translate(-0.5em, -50%);\">(" + this.number.toString() + ")</div>";
			this.m_number.style.display = "block";
			this.m_container.style.display = "flex";
		}
		
		this.render();
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

export class TexEditor extends HTMLElement {
	constructor() {
		super();

		const shadowRoot = this.attachShadow({ mode : "open" });

		let div = document.createElement("div");
		div.style.height = "15em";
		div.style.width = "100%";
		div.style.display = "flex";
		div.style.flexDirection = "row";
		shadowRoot.append(div);

		let editor = document.createElement("div");
		editor.style.padding = "0.5em";
		editor.style.background = "rgb(30, 30, 30)";
		editor.style.color = "rgb(200, 200, 200)";
		editor.style.border = "solid 1px gray"
		editor.contentEditable = "true";
		editor.innerText = "x";
		editor.style.width = "100%";
		editor.style.overflow = "auto";
		editor.style.borderRadius = "0.5em";
		editor.style.overflow = "hidden";
		editor.style.flexBasis = "2";

		let preview = document.createElement('tex-math') as TexMath;
		preview.style.width = "100%";
		//preview.style.border = "solid 1px gray"
		preview.style.flexBasis = "1";
		preview.style.overflow = "auto";
		div.append(editor);
		div.append(preview);

		// https://stackoverflow.com/questions/1391278/contenteditable-change-events
		editor.addEventListener("input", function({} : Event) {
			preview.tex = editor.innerText;
		});
	}

	connectedCallback() {
		this.innerHTML = "";
	}
}
if (!customElements.get('tex-editor'))
	customElements.define('tex-editor', TexEditor);
export function setupStyles(element? : HTMLElement) {

	if (!element) {
		element = document.head;
	}

	// katex requires some fonts that have to be loaded outside
	// the shadowRoot since styles inside shadowRoot cannot load fonts
	let style_sheet = document.createElement("link");
	style_sheet.setAttribute('rel', "stylesheet");
	style_sheet.setAttribute('href', katex_css_ulr);
	element.append(style_sheet);
}