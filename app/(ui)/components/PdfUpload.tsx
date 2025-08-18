"use client";

import React, { useCallback, useState } from 'react';
import { CloudUpload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface ExtractedAnalyte {
  name: string;
  value: number;
  unit: string | null;
  ref_low?: number | null;
  ref_high?: number | null;
}

interface ExtractionResult {
  document_meta: {
    lab_name?: string;
    test_date?: string;
    patient_name?: string;
  };
  analytes: ExtractedAnalyte[];
}

interface PdfUploadProps {
  onExtractionComplete: (result: ExtractionResult) => void;
  className?: string;
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'success' | 'error';

export default function PdfUpload({ onExtractionComplete, className = '' }: PdfUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file only';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploadState('error');
      return;
    }

    setUploadedFile(file);
    setError('');
    setUploadState('uploading');

    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUploadState('extracting');
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      setUploadState('success');
      onExtractionComplete(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setUploadState('error');
    }
  }, [onExtractionComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);



  const handleClick = () => {
    if (uploadState === 'idle' || uploadState === 'error') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0) {
          processFile(files[0]);
        }
      };
      input.click();
    }
  };

  const resetUpload = () => {
    setUploadState('idle');
    setUploadedFile(null);
    setError('');
  };

  const getStateContent = () => {
    switch (uploadState) {
      case 'uploading':
        return (
          <>
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="text-lg font-medium text-slate-900">Uploading PDF...</div>
            <div className="text-sm text-slate-600">Please wait while we process your file</div>
          </>
        );
      
      case 'extracting':
        return (
          <>
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="text-lg font-medium text-slate-900">Extracting Lab Data...</div>
            <div className="text-sm text-slate-600">AI is analyzing your blood test results</div>
          </>
        );
      
      case 'success':
        return (
          <>
            <FileText className="w-12 h-12 text-emerald-500" />
            <div className="text-lg font-medium text-slate-900">Extraction Complete!</div>
            <div className="text-sm text-slate-600">
              {uploadedFile?.name} processed successfully
            </div>
            <button
              onClick={resetUpload}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Upload a different PDF
            </button>
          </>
        );
      
      case 'error':
        return (
          <>
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <div className="text-lg font-medium text-slate-900">Upload Failed</div>
            <div className="text-sm text-rose-600">{error}</div>
            <button
              onClick={resetUpload}
              className="mt-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
            >
              Try Again
            </button>
          </>
        );
      
      default:
        return (
          <>
            <CloudUpload className="w-12 h-12 text-emerald-500" />
            <div className="text-lg font-medium text-slate-900">
              Drag and drop your blood test PDF
            </div>
            <div className="text-sm text-slate-600">
              or click to upload
            </div>
            <div className="text-xs text-slate-500 mt-2">
              PDF only, max 10MB
            </div>
          </>
        );
    }
  };

  const isInteractive = uploadState === 'idle' || uploadState === 'error';
  
  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isInteractive ? 'cursor-pointer' : 'cursor-default'}
        ${dragOver && isInteractive 
          ? 'border-emerald-400 bg-emerald-50 scale-105 shadow-lg' 
          : uploadState === 'success'
          ? 'border-emerald-300 bg-emerald-50'
          : uploadState === 'error'
          ? 'border-rose-300 bg-rose-50'
          : 'border-slate-300 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50'
        }
        ${isInteractive ? 'hover:scale-102' : ''}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* Gradient shimmer effect on drag over */}
      {dragOver && isInteractive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/20 via-blue-400/20 to-emerald-400/20 animate-pulse" />
      )}
      
      <div className="relative z-10 space-y-3 flex flex-col items-center">
        {getStateContent()}
      </div>
    </div>
  );
}
