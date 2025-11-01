"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Download, Share2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { type Report } from '@/lib/repo-types';
import Container from '../../(ui)/components/Container';
import Card from '../../(ui)/components/Card';
import StatusChip from '../../(ui)/components/StatusChip';
import Button from '../../(ui)/components/Button';

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      try {
        console.log(`[ReportPage] Loading report with ID: ${params.id}`);
        
        // Fetch report from API instead of client-side repository
        const response = await fetch(`/api/report/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.error(`[ReportPage] Report not found: ${params.id}`);
            setError(`Report not found. ID: ${params.id}`);
          } else {
            console.error(`[ReportPage] API error: ${response.status}`);
            setError('Failed to load report');
          }
          return;
        }

        const foundReport = await response.json();
        console.log(`[ReportPage] Successfully loaded report: ${params.id}`);
        setReport(foundReport);
        
      } catch (err) {
        console.error('[ReportPage] Error loading report:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.id]);

  const handleExport = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Health Analysis Report',
          text: 'Check out my health analysis report',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

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

  // Calculate summary statistics
  const totalAnalytes = result_json.analytes.length;
  const normalCount = result_json.analytes.filter(a => a.status === 'normal').length;
  const highCount = result_json.analytes.filter(a => a.status === 'high').length;
  const lowCount = result_json.analytes.filter(a => a.status === 'low').length;
  const unknownCount = result_json.analytes.filter(a => a.status === 'unknown').length;

  // Prepare data for charts
  const statusDistribution = [
    { name: 'Normal', value: normalCount, color: '#10b981' },
    { name: 'High', value: highCount, color: '#ef4444' },
    { name: 'Low', value: lowCount, color: '#f59e0b' },
    { name: 'Unknown', value: unknownCount, color: '#6b7280' },
  ].filter(item => item.value > 0);

  const benchmarkData = result_json.analytes.map(analyte => ({
    name: analyte.name,
    value: analyte.value,
    refLow: analyte.ref_low || 0,
    refHigh: analyte.ref_high || analyte.value * 1.2,
    status: analyte.status,
  }));

  return (
    <>
      <Container className="py-8 space-y-6 md:space-y-8 pb-24">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl text-slate-900 mb-2">Health Analysis Report</h1>
            <p className="text-slate-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="text-center space-y-2 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{result_json.overall_score}</div>
            <div className="text-sm text-emerald-700">Overall Score</div>
            <div className="flex justify-center">
              {result_json.overall_score >= 80 ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : result_json.overall_score >= 60 ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </Card>
          
          <Card className="text-center space-y-2">
            <div className="text-2xl font-bold text-slate-900">{normalCount}</div>
            <div className="text-sm text-slate-600">Normal Values</div>
            <div className="text-xs text-emerald-600">
              {((normalCount / totalAnalytes) * 100).toFixed(0)}% of total
            </div>
          </Card>
          
          <Card className="text-center space-y-2">
            <div className="text-2xl font-bold text-rose-600">{highCount}</div>
            <div className="text-sm text-slate-600">High Values</div>
            <div className="flex justify-center">
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
          </Card>
          
          <Card className="text-center space-y-2">
            <div className="text-2xl font-bold text-amber-600">{lowCount}</div>
            <div className="text-sm text-slate-600">Low Values</div>
            <div className="flex justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
          </Card>
        </div>

        {/* Overall Summary */}
        <Card className="space-y-4">
          <h2 className="text-xl md:text-2xl text-slate-900">Summary</h2>
          <p className="text-lg text-slate-700 leading-relaxed">{result_json.overall_summary}</p>
          
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

        {/* Status Distribution Chart */}
        <Card className="space-y-6">
          <h2 className="text-xl md:text-2xl text-slate-900">Results Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-4">Values vs Reference Ranges</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benchmarkData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="value" name="Your Value">
                      {benchmarkData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.status === 'normal' ? '#10b981' :
                            entry.status === 'high' ? '#ef4444' :
                            entry.status === 'low' ? '#f59e0b' : '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="refHigh" name="Reference High" fill="#e2e8f0" opacity={0.6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Analytes */}
        <Card className="space-y-6">
          <h2 className="text-xl md:text-2xl text-slate-900">Detailed Results</h2>
          <div className="grid gap-4">
            {result_json.analytes.map((analyte, index) => (
              <div key={index} className="border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-slate-900 text-lg">{analyte.name}</h3>
                    <StatusChip status={getStatusType(analyte.status)}>
                      {analyte.status.toUpperCase()}
                    </StatusChip>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="font-bold text-xl text-slate-900">{analyte.value} {analyte.unit}</div>
                    {analyte.ref_low !== undefined && analyte.ref_high !== undefined && (
                      <div className="text-sm text-slate-500">
                        Normal: {analyte.ref_low} - {analyte.ref_high} {analyte.unit}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Visual indicator bar */}
                {analyte.ref_low !== undefined && analyte.ref_high !== undefined && (
                  <div className="relative">
                    <div className="w-full h-2 bg-slate-200 rounded-full">
                      <div 
                        className="h-2 bg-emerald-200 rounded-full"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to right, #fbbf24 0%, #10b981 20%, #10b981 80%, #ef4444 100%)'
                        }}
                      />
                    </div>
                    <div 
                      className="absolute top-0 w-1 h-2 bg-slate-900 rounded-full"
                      style={{
                        left: `${Math.min(Math.max(((analyte.value - analyte.ref_low) / (analyte.ref_high - analyte.ref_low)) * 100, 0), 100)}%`,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                )}
                
                <p className="text-slate-600 text-sm leading-relaxed">{analyte.note}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Charts */}
        {result_json.chart_series && result_json.chart_series.length > 0 && (
          <Card className="space-y-6">
            <h2 className="text-xl md:text-2xl text-slate-900">Trends Over Time</h2>
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(90vw,48rem)] z-50 print:hidden">
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
