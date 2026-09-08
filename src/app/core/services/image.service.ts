import { Injectable } from '@angular/core';

/** Motivos por los que una imagen puede ser rechazada. */
export type ImageErrorReason = 'TYPE' | 'SIZE' | 'DECODE' | 'TOO_LARGE';

export class ImageError extends Error {
  constructor(public readonly reason: ImageErrorReason) {
    super(reason);
    this.name = 'ImageError';
  }
}

export interface SquareImageOptions {
  /** Lado del cuadrado de salida en píxeles */
  side?: number;
  /** Calidad JPEG inicial (0-1) */
  quality?: number;
  /** Tamaño máximo aceptado del archivo de entrada */
  maxInputBytes?: number;
  /** Tamaño máximo del data URL resultante */
  maxOutputBytes?: number;
}

const DEFAULTS: Required<SquareImageOptions> = {
  side: 256,
  quality: 0.75,
  maxInputBytes: 10 * 1024 * 1024, // 10 MB de entrada
  maxOutputBytes: 200 * 1024,      // 200 KB de salida (el doc de Firestore admite 1 MiB)
};

/**
 * Procesamiento de imágenes en el cliente.
 *
 * Se usa para las fotos de perfil: recorta al centro, reduce a un cuadrado
 * pequeño y comprime a JPEG. El resultado es un data URL lo bastante liviano
 * para guardarse dentro del documento del usuario en Firestore, evitando
 * añadir Firebase Storage y sus reglas al proyecto.
 */
@Injectable({ providedIn: 'root' })
export class ImageService {
  /**
   * Convierte un archivo de imagen en un data URL JPEG cuadrado y comprimido.
   * @throws ImageError si el archivo no es una imagen, excede el tamaño o no se puede decodificar.
   */
  async toSquareDataUrl(file: File, options: SquareImageOptions = {}): Promise<string> {
    const opts = { ...DEFAULTS, ...options };

    if (!file.type || !file.type.startsWith('image/')) throw new ImageError('TYPE');
    if (file.size > opts.maxInputBytes) throw new ImageError('SIZE');

    const source = await this.decode(file);
    let quality = opts.quality;
    let dataUrl = this.drawSquare(source, opts.side, quality);

    // Si aún resulta pesada (fotos muy ruidosas), baja calidad y luego tamaño.
    let side = opts.side;
    while (this.dataUrlBytes(dataUrl) > opts.maxOutputBytes && (quality > 0.4 || side > 128)) {
      if (quality > 0.4) {
        quality = Math.max(0.4, quality - 0.1);
      } else {
        side = Math.max(128, Math.round(side * 0.75));
      }
      dataUrl = this.drawSquare(source, side, quality);
    }

    this.release(source);

    if (this.dataUrlBytes(dataUrl) > opts.maxOutputBytes) throw new ImageError('TOO_LARGE');
    return dataUrl;
  }

  /** Peso aproximado en bytes de la carga base64 de un data URL. */
  dataUrlBytes(dataUrl: string): number {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    return Math.ceil((base64.length * 3) / 4);
  }

  // ── Internos ──────────────────────────────────────────────

  /**
   * Decodifica el archivo respetando la orientación EXIF.
   * `createImageBitmap` es el camino rápido; el `<img>` es el respaldo
   * para navegadores/WebViews que no lo soportan.
   */
  private async decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch {
        /* cae al respaldo con <img> */
      }
    }
    return this.decodeWithImgElement(file);
  }

  private decodeWithImgElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new ImageError('DECODE'));
      };
      img.src = url;
    });
  }

  private release(source: ImageBitmap | HTMLImageElement): void {
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      source.close();
    } else if (source instanceof HTMLImageElement && source.src.startsWith('blob:')) {
      URL.revokeObjectURL(source.src);
    }
  }

  /** Recorta el centro de la imagen y la dibuja como cuadrado de `side` px. */
  private drawSquare(source: ImageBitmap | HTMLImageElement, side: number, quality: number): string {
    const sw = source.width;
    const sh = source.height;
    if (!sw || !sh) throw new ImageError('DECODE');

    const crop = Math.min(sw, sh);
    const sx = (sw - crop) / 2;
    const sy = (sh - crop) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageError('DECODE');

    // Fondo blanco: los PNG transparentes no deben quedar negros al pasar a JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, crop, crop, 0, 0, side, side);

    return canvas.toDataURL('image/jpeg', quality);
  }
}
