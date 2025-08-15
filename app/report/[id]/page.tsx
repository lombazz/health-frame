"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportRepo, type Report } from '@/lib/repo';
import Container from '../../(ui)/components/Container';
import Card from '../../(ui)/components/Card';
import StatusChip from '../../(ui)/components/StatusChip';

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = () => {
      try {
        const foundReport = reportRepo.findById(params.id as string);
        if (!foundReport) {
          setError('Report not found');
        } else {
          setReport(foundReport);
        }
      } catch {
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.id]);

  if (loading) {
    return (
      <Container className="py-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-slate-200 rounded-2xl mb-6"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      </Container>
    );
  }

  if (error || !report) {
    return (
      <Container className="py-8">
        <Card className="bg-rose-50 border-rose-200 text-center py-12">
          <h1 className="text-2xl text-rose-800 mb-2">Report Not Found</h1>
          <p className="text-rose-600">{error}</p>
        </Card>
      </Container>
    );
  }

  const { result_json } = report;

  const getStatusType = (status: string): 'low' | 'normal' | 'high' | 'unknown' => {
    switch (status) {
      case 'low': return 'low';
      case 'high': return 'high';
      case 'normal': return 'normal';
      default: return 'unknown';
    }
  };

  return (
    <>
      <Container className="py-8 space-y-6 md:space-y-8 pb-24">
        {/* Header Card with Overall Score */}
        <Card className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl text-slate-900">Health Analysis Report</h1>
              <p className="text-lg text-slate-700 leading-relaxed">{result_json.overall_summary}</p>
            </div>
            <div className="text-center md:text-right space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-emerald-600">{result_json.overall_score}</div>
              <div className="text-sm text-slate-500">Overall Score</div>
            </div>
          </div>
          
          {result_json.flags && result_json.flags.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="font-medium text-emerald-800 mb-2">Key Observations:</h3>
              <ul className="list-disc list-inside text-emerald-700 space-y-1">
                {result_json.flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Analytes Table */}
        <Card className="space-y-6">
          <h2 className="text-xl md:text-2xl text-slate-900">Lab Results</h2>
          <div className="space-y-4">
            {result_json.analytes.map((analyte, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-slate-900">{analyte.name}</h3>
                    <StatusChip status={getStatusType(analyte.status)}>
                      {analyte.status.toUpperCase()}
                    </StatusChip>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-medium text-slate-900">{analyte.value} {analyte.unit}</div>
                    {analyte.ref_low !== undefined && analyte.ref_high !== undefined && (
                      <div className="text-sm text-slate-500">
                        Range: {analyte.ref_low} - {analyte.ref_high} {analyte.unit}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-sm">{analyte.note}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Charts */}
        {result_json.chart_series && result_json.chart_series.length > 0 && (
          <Card className="space-y-6">
            <h2 className="text-xl md:text-2xl text-slate-900">Trends</h2>
            {result_json.chart_series.map((series, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800">{series.key}</h3>
                {series.points.length === 1 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-2">
                    <p className="text-slate-600">
                      Single data point: {series.points[0].v} on {series.points[0].t}
                    </p>
                    <p className="text-sm text-slate-500">
                      Trends will appear after multiple uploads
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series.points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="t" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="v" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* Disclaimers */}
        {result_json.disclaimers && result_json.disclaimers.length > 0 && (
          <Card className="bg-slate-50 border-slate-300/50">
            <h3 className="font-medium text-slate-800 mb-3">Important Disclaimers:</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {result_json.disclaimers.map((disclaimer, index) => (
                <li key={index}>{disclaimer}</li>
              ))}
            </ul>
          </Card>
        )}
      </Container>

      {/* Sticky Disclaimer Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(90vw,48rem)] z-50">
        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-lg">
          <p className="text-sm text-slate-600 text-center">
            ⚠️ <strong>Medical Disclaimer:</strong> This tool is for educational purposes only and does not provide medical advice. 
            Always consult your healthcare provider for medical decisions.
          </p>
        </div>
      </div>
    </>
  );
}
