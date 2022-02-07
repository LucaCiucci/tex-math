
# *tex-math*

Provides `i-math` and `tex-math` elemets to display math equations.

Live [example](https://www.lucaciucci99.com/live_examples/tex-math)

## Usage
Anywere in your html code, for example in the `head` tag:
```html
<!-- load the script as async, this is not necessary but may speed up page rendering, remove 'async' if you need to access the elements instantly -->
<script async src="https://cdn.jsdelivr.net/npm/tex-math/dist/tex-math.js"></script>
```
and then you can use `i-math` and `tex-math` tags to write math:
```html
Inline equation example: <i-math>x^y</i-math>
Equation:
<tex-math>
    i \hbar \frac{\partial}{\partial t} \psi = H \psi
</tex-math>
```

### Updating math
If you change the content of the tag, the math display is automatically updated:
```html
<tex-math id="equation">
    i \hbar \frac{\partial}{\partial t} \psi = H \psi
</tex-math>

<script>
    // get the element, the class is TexMath (derived from HTMLElement)
    eq = document.getElementById("equation");

    // get the current Tex representation
    console.log("old tex: ", eq.tex);

    // change the Tex code
    eq.tex = "\\int_0^1{e^{-x^{2}} \\; dx}";

    // alternatively, you can directly change the element content
    // in different ways, e.g.:
    // eq.textContent = "\\int_0^1{e^{-x^{2}} \\; dx}";
    // eq.innerHTML   = "\\int_0^1{e^{-x^{2}} \\; dx}";
</script>
```

### Importing as module:
```typescript
import { TexMath, IMath, setupStyles } from "tex-math/lib/tex-math"
```