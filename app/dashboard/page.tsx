"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { uploadRepo, reportRepo, type Upload, type Report } from '@/lib/repo';
import Container from '../(ui)/components/Container';
import Button from '../(ui)/components/Button';
import Card from '../(ui)/components/Card';
import StatusChip from '../(ui)/components/StatusChip';

interface UploadWithReport extends Upload {
  report?: Report;
}

export default function DashboardPage() {
  const [uploads, setUploads] = useState<UploadWithReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const allUploads = uploadRepo.findAll();
        const uploadsWithReports = allUploads.map(upload => {
          const report = reportRepo.findByUploadId(upload.id);
          return { ...upload, report };
        });
        setUploads(uploadsWithReports);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getQuickFlags = (upload: UploadWithReport) => {
    if (!upload.report) return [];
    
    const flags = [];
    const analytes = upload.report.result_json.analytes;
    
    const highValues = analytes.filter(a => a.status === 'high').length;
    const lowValues = analytes.filter(a => a.status === 'low').length;
    
    if (highValues > 0) flags.push(`${highValues} high`);
    if (lowValues > 0) flags.push(`${lowValues} low`);
    
    return flags;
  };

  const getSparklineData = (analyte: string) => {
    // Get data for this analyte across all uploads
    const data = uploads
      .filter(u => u.report)
      .map(u => {
        const analyteData = u.report!.result_json.analytes.find(a => a.name === analyte);
        return analyteData ? {
          date: u.created_at.split('T')[0],
          value: analyteData.value
        } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.date.localeCompare(b!.date));
    
    return data;
  };

  if (loading) {
    return (
      <Container className="py-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="grid gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl text-slate-900">Health Dashboard</h1>
        <Button href="/upload">New Upload</Button>
      </div>

      {uploads.length === 0 ? (
        <Card className="text-center py-12 space-y-4">
          <h2 className="text-xl text-slate-900">No uploads yet</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            Start tracking your health by uploading your first lab results.
          </p>
          <Button href="/upload" className="mt-6">Upload Lab Results</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {uploads.map((upload) => (
            <Card key={upload.id}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-lg text-slate-900">
                      {new Date(upload.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    
                    {upload.report && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Score:</span>
                        <span className="font-medium text-emerald-600">
                          {upload.report.result_json.overall_score}/100
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    {upload.raw_entries.length} analytes • 
                    {upload.demographics.sex}, {new Date().getFullYear() - upload.demographics.birth_year} years old
                  </div>
                  
                  {getQuickFlags(upload).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getQuickFlags(upload).map((flag, index) => {
                        const status = flag.includes('high') ? 'high' : flag.includes('low') ? 'low' : 'unknown';
                        return (
                          <StatusChip key={index} status={status}>
                            {flag}
                          </StatusChip>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Mini sparklines and actions */}
                <div className="flex flex-row lg:flex-col xl:flex-row items-start gap-4">
                  <div className="flex gap-4">
                    {['LDL', 'Glucose'].map(analyte => {
                      const data = getSparklineData(analyte);
                      if (data.length === 0) return null;
                      
                      return (
                        <div key={analyte} className="text-center">
                          <div className="text-xs text-slate-500 mb-1">{analyte}</div>
                          <div className="w-16 h-8">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data}>
                                <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {upload.report && (
                    <Button 
                      href={`/report/${upload.report.id}`}
                      variant="secondary"
                      className="whitespace-nowrap"
                    >
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Summary stats */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center space-y-2">
            <div className="text-3xl font-bold text-slate-900">{uploads.length}</div>
            <div className="text-slate-600">Total Uploads</div>
          </Card>
          
          <Card className="text-center space-y-2">
            <div className="text-3xl font-bold text-emerald-600">
              {uploads.filter(u => u.report && u.report.result_json.overall_score >= 80).length}
            </div>
            <div className="text-slate-600">Good Scores (80+)</div>
          </Card>
          
          <Card className="text-center space-y-2">
            <div className="text-3xl font-bold text-rose-600">
              {uploads.reduce((acc, u) => {
                if (!u.report) return acc;
                return acc + u.report.result_json.analytes.filter(a => a.status === 'high' || a.status === 'low').length;
              }, 0)}
            </div>
            <div className="text-slate-600">Flagged Values</div>
          </Card>
        </div>
      )}
    </Container>
  );
}
