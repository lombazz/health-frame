"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Container from '../(ui)/components/Container';
import Button from '../(ui)/components/Button';
import Card from '../(ui)/components/Card';
import PdfUpload from '../(ui)/components/PdfUpload';
import ReviewTable from '../(ui)/components/ReviewTable';

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

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // PDF extraction state
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null);
  const [reviewData, setReviewData] = useState<ExtractedAnalyte[]>([]);
  
  // Manual entry state
  const [demographics, setDemographics] = useState({
    sex: 'M' as 'M' | 'F' | 'X',
    birth_year: new Date().getFullYear() - 30,
    height_cm: 170,
    weight_kg: 70,
  });

  const [labResults, setLabResults] = useState([
    { analyte: 'LDL', value: '', unit: 'mg/dL', ref_low: '', ref_high: '' },
    { analyte: 'HDL', value: '', unit: 'mg/dL', ref_low: '', ref_high: '' },
    { analyte: 'Triglycerides', value: '', unit: 'mg/dL', ref_low: '', ref_high: '' },
    { analyte: 'Glucose', value: '', unit: 'mg/dL', ref_low: '', ref_high: '' },
    { analyte: 'HbA1c', value: '', unit: '%', ref_low: '', ref_high: '' },
    { analyte: 'Hemoglobin', value: '', unit: 'g/dL', ref_low: '', ref_high: '' },
  ]);

  const handleExtractionComplete = (result: ExtractionResult) => {
    setExtractedData(result);
    setReviewData(result.analytes);
    setError('');
  };

  const generateReportFromExtracted = async () => {
    if (reviewData.length === 0) {
      setError('No lab data to analyze');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert review data to the format expected by the API
      const validAnalytes = reviewData
        .filter(item => {
          const value = String(item.value).trim();
          return item.name.trim() !== '' && value !== '' && value !== '0';
        })
        .map(item => ({
          analyte: item.name,
          value: item.value,
          unit: item.unit,
          ref_low: item.ref_low || undefined,
          ref_high: item.ref_high || undefined,
        }));

      if (validAnalytes.length === 0) {
        setError('Please ensure at least one analyte has a valid value');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analytes: validAnalytes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Redirect to report
      router.push(`/report/${data.report_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter out empty lab results
      const validLabResults = labResults
        .filter(lab => lab.value.trim() !== '')
        .map(lab => ({
          analyte: lab.analyte,
          value: parseFloat(lab.value),
          unit: lab.unit,
          ref_low: lab.ref_low ? parseFloat(lab.ref_low) : undefined,
          ref_high: lab.ref_high ? parseFloat(lab.ref_high) : undefined,
        }));

      if (validLabResults.length === 0) {
        setError('Please enter at least one lab value');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demographics,
          lab_results: validLabResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      // Redirect to report
      router.push(`/report/${data.report_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const updateLabResult = (index: number, field: string, value: string) => {
    const updated = [...labResults];
    updated[index] = { ...updated[index], [field]: value };
    setLabResults(updated);
  };

  return (
    <Container className="py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl text-slate-900">Upload Lab Results</h1>
        <p className="text-slate-600">Upload your PDF blood test report or enter data manually</p>
      </div>
      
      {/* PDF Upload Section */}
      <div className="space-y-6">
        <PdfUpload 
          onExtractionComplete={handleExtractionComplete}
          className="max-w-2xl mx-auto"
        />
        
        {/* Review extracted data */}
        {extractedData && (
          <div className="space-y-4">
            {extractedData.document_meta && (
              <Card className="bg-emerald-50 border-emerald-200">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-emerald-900">Document Information</h3>
                  <div className="text-sm text-emerald-700 space-y-1">
                    {extractedData.document_meta.lab_name && (
                      <div>Lab: {extractedData.document_meta.lab_name}</div>
                    )}
                    {extractedData.document_meta.test_date && (
                      <div>Date: {extractedData.document_meta.test_date}</div>
                    )}
                    {extractedData.document_meta.patient_name && (
                      <div>Patient: {extractedData.document_meta.patient_name}</div>
                    )}
                  </div>
                </div>
              </Card>
            )}
            
            <ReviewTable 
              data={reviewData}
              onChange={setReviewData}
            />
            
            <div className="flex justify-center">
              <Button
                onClick={generateReportFromExtracted}
                disabled={loading || reviewData.length === 0}
                className="px-8 py-3 text-base"
              >
                {loading ? 'Generating Report...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry Toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="text-sm">Or enter your data manually</span>
          {showManualEntry ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Manual Entry Section */}
      {showManualEntry && (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Demographics Card */}
            <Card className="space-y-6">
              <h2 className="text-xl text-slate-900">Your Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Sex</label>
                  <select
                    value={demographics.sex}
                    onChange={(e) => setDemographics({...demographics, sex: e.target.value as 'M'|'F'|'X'})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="X">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Birth Year</label>
                  <input
                    type="number"
                    value={demographics.birth_year}
                    onChange={(e) => setDemographics({...demographics, birth_year: parseInt(e.target.value)})}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Height (cm)</label>
                  <input
                    type="number"
                    value={demographics.height_cm}
                    onChange={(e) => setDemographics({...demographics, height_cm: parseInt(e.target.value)})}
                    min="50"
                    max="300"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Weight (kg)</label>
                  <input
                    type="number"
                    value={demographics.weight_kg}
                    onChange={(e) => setDemographics({...demographics, weight_kg: parseInt(e.target.value)})}
                    min="20"
                    max="500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Lab Values Card */}
            <Card className="space-y-6">
              <h2 className="text-xl text-slate-900">Lab Values</h2>
              <div className="space-y-4">
                {labResults.map((lab, index) => (
                  <div key={lab.analyte} className="space-y-3">
                    <h3 className="font-medium text-slate-800">{lab.analyte}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">Value</label>
                        <input
                          type="number"
                          step="0.1"
                          value={lab.value}
                          onChange={(e) => updateLabResult(index, 'value', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="0.0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">Unit</label>
                        <input
                          type="text"
                          value={lab.unit}
                          onChange={(e) => updateLabResult(index, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-600">Range</label>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={lab.ref_low}
                            onChange={(e) => updateLabResult(index, 'ref_low', e.target.value)}
                            className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Low"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={lab.ref_high}
                            onChange={(e) => updateLabResult(index, 'ref_high', e.target.value)}
                            className="w-full px-1 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="High"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 text-base"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Results'}
                  </Button>
                </div>
                <p className="text-sm text-slate-500">
                  AI analysis typically takes 10-30 seconds
                </p>
              </div>
            </div>
          </Card>
        </form>
      )}

      {/* Error Display */}
      {error && (
        <Card className="bg-rose-50 border-rose-200">
          <p className="text-rose-700">{error}</p>
        </Card>
      )}
    </Container>
  );
}