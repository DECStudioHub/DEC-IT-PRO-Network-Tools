/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, CheckCircle2, Loader2, X } from 'lucide-react';

interface PdfPageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  fileName?: string;
  documentName?: string;
  totalPages?: number;
  numPages?: number;
  onSelectPage: (pageNumber: number) => void;
}

export const PdfPageSelectModal: React.FC<PdfPageSelectModalProps> = ({
  isOpen,
  onClose,
  pdfDoc,
  fileName,
  documentName,
  totalPages,
  numPages,
  onSelectPage,
}) => {
  const actualPages = totalPages ?? numPages ?? 1;
  const actualName = fileName || documentName || 'Floor Plan PDF';
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [thumbnails, setThumbnails] = useState<{ [page: number]: string }>({});
  const [loadingThumbs, setLoadingThumbs] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !pdfDoc) return;

    let isMounted = true;
    setLoadingThumbs(true);

    const renderThumbnails = async () => {
      const thumbs: { [page: number]: string } = {};
      const maxToLoad = Math.min(actualPages, 12);

      for (let p = 1; p <= maxToLoad; p++) {
        if (!isMounted) break;
        try {
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale: 0.28 });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
            thumbs[p] = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch (e) {
          console.warn(`Error generating thumb for page ${p}`, e);
        }
      }

      if (isMounted) {
        setThumbnails(thumbs);
        setLoadingThumbs(false);
      }
    };

    renderThumbnails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfDoc, totalPages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">SELECT FLOOR PLAN PAGE</h2>
              <p className="text-xs text-slate-300">
                {fileName} • {totalPages} {totalPages === 1 ? 'Page' : 'Pages'} detected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Page selector grid */}
        <div className="p-6">
          <p className="text-xs text-slate-600 mb-4">
            Select the PDF page containing the store architectural floor plan layout:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto p-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isSelected = selectedPage === pageNum;
              const thumbUrl = thumbnails[pageNum];

              return (
                <button
                  key={`pdf-page-${pageNum}`}
                  type="button"
                  onClick={() => setSelectedPage(pageNum)}
                  className={`group relative flex flex-col items-center rounded-xl border-2 p-2.5 transition-all text-left ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${pageNum}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        {loadingThumbs ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                        <span className="text-[10px]">Page {pageNum}</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 rounded-full bg-blue-600 text-white p-0.5 shadow-xs">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <span className="mt-2 text-xs font-semibold text-slate-700">
                    Page {pageNum}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Status badge */}
          <div className="mt-5 flex items-center justify-between rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <div>
              <div className="text-xs font-bold text-slate-800">FLOOR PLAN READY</div>
              <div className="text-xs text-slate-500">
                File: {fileName} | Selected: <strong>Page {selectedPage} of {totalPages}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectPage(selectedPage)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              OPEN FLOOR PLAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
