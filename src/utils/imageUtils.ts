/**
 * Utility functions for client-side image processing and conversion.
 */

/**
 * Converts an SVG data URI or SVG XML string to a rasterized PNG data URL (base64)
 * using an off-screen HTML5 Canvas. This ensures multimodal AI models receive
 * standard raster image bytes (image/png) instead of raw SVG text.
 */
export function convertSvgToPngDataUrl(
  svgDataUriOrString: string,
  width = 400,
  height = 650
): Promise<string> {
  return new Promise((resolve) => {
    try {
      let src = svgDataUriOrString;
      if (!src.startsWith('data:')) {
        src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDataUriOrString.trim())}`;
      }

      const img = new Image();
      // Only set crossOrigin for remote http/https URLs; NEVER for data: or blob: URIs (avoids WebKit Load failed)
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const pngDataUrl = canvas.toDataURL('image/png');
            resolve(pngDataUrl);
            return;
          }
        } catch (e) {
          console.warn('Canvas rasterization fallback:', e);
        }
        resolve(svgDataUriOrString);
      };

      img.onerror = (err) => {
        console.warn('Image load error during SVG-to-PNG conversion:', err);
        resolve(svgDataUriOrString);
      };

      img.src = src;
    } catch (e) {
      console.warn('convertSvgToPngDataUrl error:', e);
      resolve(svgDataUriOrString);
    }
  });
}

/**
 * Optimizes an uploaded image file (or data URL) by constraining max dimensions
 * to 1200px and compressing to a lightweight data URL suitable for multimodal AI analysis
 * and storing securely inside user journal entries without exceeding document limits.
 */
export function optimizeImageForUpload(
  fileOrDataUrl: File | string,
  maxDimension = 1200,
  quality = 0.85
): Promise<{ dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const processImg = (src: string, originalMime = 'image/jpeg') => {
      const img = new Image();
      // Only set crossOrigin for remote http/https URLs; NEVER for data: or blob: URIs
      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: src, mimeType: originalMime });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const outMime = originalMime === 'image/png' ? 'image/png' : 'image/jpeg';
          const optimizedDataUrl = canvas.toDataURL(outMime, quality);
          resolve({ dataUrl: optimizedDataUrl, mimeType: outMime });
        } catch (err) {
          console.warn('Image optimization canvas error:', err);
          resolve({ dataUrl: src, mimeType: originalMime });
        }
      };

      img.onerror = (err) => {
        console.warn('Image load error during optimization:', err);
        resolve({ dataUrl: src, mimeType: originalMime });
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.includes('image/svg+xml') || fileOrDataUrl.trim().startsWith('<svg')) {
        let svgData = fileOrDataUrl;
        if (!svgData.startsWith('data:')) {
          svgData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fileOrDataUrl.trim())}`;
        }
        resolve({ dataUrl: svgData, mimeType: 'image/svg+xml' });
        return;
      }
      const isPng = fileOrDataUrl.includes('image/png');
      processImg(fileOrDataUrl, isPng ? 'image/png' : 'image/jpeg');
    } else {
      if (fileOrDataUrl.type === 'image/svg+xml' || fileOrDataUrl.name.toLowerCase().endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve({ dataUrl: reader.result, mimeType: 'image/svg+xml' });
          } else {
            reject(new Error('Failed to read SVG file'));
          }
        };
        reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
        reader.readAsDataURL(fileOrDataUrl);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processImg(reader.result, fileOrDataUrl.type || 'image/jpeg');
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

