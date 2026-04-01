// CanvasRenderingContext2D.roundRect — TypeScript DOM lib'de eksik, manuel tanım
interface CanvasRenderingContext2D {
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void;
}

interface Path2D {
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void;
}
