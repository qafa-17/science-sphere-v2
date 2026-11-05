// The page-flip library doesn't ship its own types, so these describe
// just the parts of it we use.
declare module "page-flip" {
  export type FlipEvent = { data: number };
  export type OrientationEvent = { data: "portrait" | "landscape" };
  export type FlipState = "user_fold" | "fold_corner" | "flipping" | "read";

  export class PageFlip {
    constructor(element: HTMLElement, settings: Record<string, unknown>);
    loadFromImages(images: string[]): void;
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(event: "flip", callback: (e: FlipEvent) => void): this;
    on(event: "changeOrientation", callback: (e: OrientationEvent) => void): this;
    on(event: "changeState", callback: (e: { data: FlipState }) => void): this;
    on(event: "init", callback: (e: { data: { page: number; mode: string } }) => void): this;
    getState(): FlipState;
    /** internal, used to tell whether a dragged page will finish turning */
    getFlipController(): { getCalculation(): { getPosition(): { x: number; y: number } } | null };
    destroy(): void;
  }
}
