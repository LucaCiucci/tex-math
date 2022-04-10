
//import * as katex from 'katex'
// uncomment this line instead of the above before compiling, use the above for intellisense type support
const katex = require('katex');

import katex_css_ulr from "../node_modules/katex/dist/katex.min.css"
import basic_css_url from "./basic.css"


// add a basic stylesheet to make i-math display as inline block and tex-math display as block
let css = document.createElement('link');
css.rel = 'stylesheet';
css.href = basic_css_url;
document.head.appendChild(css);
console.log("css:", basic_css_url)

// lc-ref compatibility
/**
 * The [lc-ref](https://www.npmjs.com/package/lc-ref) package.
 * 
 * This variable provides the compatibility with the package when it is loaded as a js file.
 * 
 * We use `declare var` to tell the compiler that this variable is defined in the global scope.
 */
declare var lc_ref : any;

export abstract class TexMathBase extends HTMLElement {

	private m_tex : string = "";
	private blockDisplay : boolean = false;
	private m_slot? : HTMLSlotElement;
	private m_display? : HTMLElement;
	private m_number? : HTMLElement;
	private m_container? : HTMLElement;
	// TODO remove? private number : number = -1;

	private static triggering_attributes : string[] = ['id', 'number', 'n'];

	//static equation_counter = 0;

	public lc_number : string | Function | null = null;

	/**
	 * Get the tex content of the element
	 */
	get tex() : string {
		return this.m_tex;
	}

	/**
	 * Set the text content and updates the display
	 */
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
	}

	connectedCallback() {
		// add an event listener to the slot in order to change the 
		let _this_ = this;
		let slot = this.m_slot!;
		this.m_slot!.addEventListener('slotchange', function({/* unused event parameter */} : Event) {
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

		let obs = new MutationObserver(function(mutations : MutationRecord[]) {
			for (let mutation of mutations) {
				
				if (mutation.type == "attributes") {
					if (TexMathBase.triggering_attributes.includes(mutation.attributeName!)) {
						_this_.update_number();
					}
				}
			}
		});
		obs.observe(this, { attributes: true });

		/*if (this.number < 0 && (this.hasAttribute('id') || this.hasAttribute('number') || this.hasAttribute('n'))) {
			this.number = ++TexMathBase.equation_counter;
		}*/

		this.render();

		this.update_number();
	}

	/**
	 * Update the equation display.
	 * 
	 * Updates the display by parsing the tex content and rendering it,
	 * it also updates the stored tex that can be queryed by `get tex()`
	 * and the number if required.
	 * 
	 * TODO: update the number if required
	 */
	render() : void {

		// In this function we will get all the tex content and then store it
		// for parsing that will be done in the last section of this function

		// if the receiving slot is not defined, we cannot render
		if (!this.m_slot)
			return;

		// we take al the text that is in the slot (if no child with slot attribute
		// is defined, this is equivalent of calling `this.innerText`)
		let nodes = this.m_slot.assignedNodes();
		let tex = "";
		for (let node of nodes) {
			tex += node.textContent;
		}

		// TODO remove indentation to make the tex more readable
		// example:
		//   	\begin{align}
		//   		\frac{1}{2} &= \frac{1}{2} \\
		//   		\frac{1}{2} &= \frac{1}{2} \\
		//   	\end{align}
		// becomes
		// \begin{align}
		// 	\frac{1}{2} &= \frac{1}{2} \\
		// 	\frac{1}{2} &= \frac{1}{2} \\
		// \end{align}

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
				this.m_display.innerHTML = '<span style="color:red; padding-left: 1em; padding-right: 1em;">' + error + "</span>";
			}
		} else {
			console.warn("tex-math internal error, no display element defined, cannot render");
		}
	}

	/**
	 * Builds a peview of the equation.
	 * 
	 * This funtion allows the [lc-ref](https://www.npmjs.com/package/lc-ref) package to create the equation preview on link hover.
	 * 
	 * The preview will be rendered simply as another tex-math element with the same content.
	 * 
	 * @param preview the element to fill with the preview
	 */
	public lc_build_ref_preview(preview : HTMLElement) : void {

		// create a new tex-math element and fill it with our tex content
		let eq = document.createElement('tex-math') as TexMathBase;
		eq.tex = this.tex;

		// add the element to the preview
		preview.appendChild(eq);
	}

	/**
	 * updates the equation number, it also adds/removes the number if necessary
	 */
	private update_number() : void {
		// in any case we ensure the number is shown as required.
		// To do that we check if a triggering attribute is set and if the display is block

		/**
		 * Tells if the number should be shown or not.
		 */
		let numerated : boolean = false;

		// check for triggering attributes
		for (let attr of TexMathBase.triggering_attributes) {
			if (this.hasAttribute(attr)) {
				numerated = true;
				break;
			}
		}

		// disable the number if the display is not block since inline equations cannot
		// have a number, it could be confused with the equation content itself.
		// Maybe in the future we could display the number as a link or with another style or position
		// and therefore inline equations could have a number, too.
		if (!this.blockDisplay) {
			numerated = false;
		}

		// TODO do nothing if not necessary, this is a bit of a hack, we should check if the number is already
		// there and if it is not we should add it.
		if (numerated) {
			this.add_number();
		} else {
			this.remove_number();
		}

		// actual renumeration
		this.renumerate();
	}

	/**
	 * this function does not actually add the number, but it schedules for it to be added when the enumeration is done
	 */
	private add_number() : void {

		// we add the `lc_number` attribute to the element, this will be used by the [lc-ref](https://www.npmjs.com/package/lc-ref)
		// package to know that this element should be numerated. It will set the number to the value of the `number` attribute
		// and display it as a link.
		
		this.lc_number = function(n : number) : Number {
			// TODO remove? this.number = n;
			
			//this.m_number!.innerHTML = "(" + n.toString() + ")";
			this.m_number!.innerHTML = "<div style=\"position:absolute; top:50%; right:0; transform: translate(-0.5em, -50%);\">(" + n.toString() + ")</div>";
			
			// show the number and sets the container display to flex so that the number is visible at the right side
			this.m_number!.style.display = "block";
			this.m_container!.style.display = "flex";

			// need to return the representation that will be used in the <lc-ref> elements
			return n;
		}
	}

	/**
	 * This funciton removes the number display and the `lc_number` attribute so that the [lc-ref](https://www.npmjs.com/package/lc-ref) package
	 * will not try to numerate this element.
	 */
	private remove_number() {
		// tell the lc-ref package that this element should not be numerated
		this.lc_number = null;

		// hide the number and set the container display to block so that the number is not visible
		this.m_number!.style.display = "none";
		this.m_container!.style.display = "inline-block";
	}

	/**
	 * This function renumerates the equations in the document by calling the [lc-ref](https://www.npmjs.com/package/lc-ref)'s `renumerate()` function.
	 * If the lc_ref package is not loaded, this function does nothing.
	 */
	public renumerate() : void {
		// if the lc-ref package is loaded, we call its `renumerate` function
		if (typeof lc_ref != 'undefined') {
			lc_ref.renumerate();
		}
	}
}

/**
 * Inline math element.
 * 
 * @see TexMathBase
 */
export class IMath extends TexMathBase {
	constructor() {
		super(false);
	}
}
if (!customElements.get('i-math'))
	customElements.define('i-math', IMath);

// math display element
/**
 * Math block element.
 * This element can be numbered. If any of the triggering attributes is present, the number will be shown.
 * 
 * Triggering attributes:
 *  - `number`
 *  - `n`
 *  - `id`
 * 
 * @see TexMathBase
 */
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