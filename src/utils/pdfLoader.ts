/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is configured for browser execution
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
} catch (e) {
  console.warn('PDF.js worker initialization notice:', e);
}

export interface PdfDocumentSummary {
  numPages: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
}

export interface RenderedPageResult {
  dataUrl: string;
  width: number;
  height: number;
  pageNumber: number;
}

/**
 * Loads a PDF file and returns the document proxy and page count
 */
export async function loadPdfDocument(file: File): Promise<PdfDocumentSummary> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    return {
      numPages: pdfDoc.numPages,
      pdfDoc,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('password') || message.includes('Password')) {
      throw new Error('This PDF is password-protected. Please provide an unprotected floor plan PDF.');
    }
    if (message.includes('Invalid PDF structure') || message.includes('corrupt')) {
      throw new Error('Unable to render this PDF. The file appears to be corrupted or has an unsupported structure.');
    }
    throw new Error(`Unable to load PDF: ${message || 'Unsupported format'}. Please try converting to PNG/JPG.`);
  }
}

/**
 * Renders a specific page of a PDF at the specified scale (default 2.0 for crisp architectural plans)
 */
export async function renderPdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 2.0,
): Promise<RenderedPageResult> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Failed to create 2D canvas rendering context.');
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Fill white background so transparent PDFs don't appear black
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render page
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    };

    await page.render(renderContext).promise;

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
      pageNumber,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to render PDF page ${pageNumber}: ${message}`);
  }
}
