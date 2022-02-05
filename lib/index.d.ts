export declare abstract class TexMathBase extends HTMLElement {
    private m_tex;
    private block;
    private m_slot?;
    private m_display?;
    get tex(): string;
    constructor(block: boolean);
    render(): void;
}
export declare class TexMath extends TexMathBase {
    constructor();
}
export declare class IMath extends TexMathBase {
    constructor();
}
