"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
import { Download, Share2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Printer, Activity, Heart, Zap, ChevronDown, X } from 'lucide-react';
import { type Report } from '@/lib/repo-types';
import Container from '../../(ui)/components/Container';
import Card from '../../(ui)/components/Card';
import StatusChip from '../../(ui)/components/StatusChip';
import Button from '../../(ui)/components/Button';
import HealthScoreGauge from '../../(ui)/components/HealthScoreGauge';
import BiomarkerCard from '../../(ui)/components/BiomarkerCard';
import BiomarkerSearchInterface from '../../(ui)/components/BiomarkerSearchInterface';

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHealthSummaryExpanded, setIsHealthSummaryExpanded] = useState(false);
  
  // New state for popup functionality
  const [popupType, setPopupType] = useState<'high' | 'low' | null>(null);
  const [popupData, setPopupData] = useState<any[]>([]);

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



  // Prepare data for charts (excluding unknown segment)
  const statusDistribution = [
    { name: 'Normal', value: normalCount, color: '#10b981' },
    { name: 'High', value: highCount, color: '#ef4444' },
    { name: 'Low', value: lowCount, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Create optimized benchmark data with smart filtering
  const getOptimizedBenchmarkData = () => {
    // Priority 1: All abnormal values (high/low)
    const abnormalAnalytes = result_json.analytes.filter(analyte => 
      analyte.status === 'high' || analyte.status === 'low'
    );
    
    // Priority 2: Important normal biomarkers
    const importantNormalAnalytes = result_json.analytes.filter(analyte => 
      analyte.status === 'normal' && (
        analyte.name.toLowerCase().includes('cholesterol') ||
        analyte.name.toLowerCase().includes('glucose') ||
        analyte.name.toLowerCase().includes('hemoglobin') ||
        analyte.name.toLowerCase().includes('hba1c') ||
        analyte.name.toLowerCase().includes('crp') ||
        analyte.name.toLowerCase().includes('vitamin') ||
        analyte.name.toLowerCase().includes('ferritin') ||
        analyte.name.toLowerCase().includes('ast') ||
        analyte.name.toLowerCase().includes('alt')
      )
    );
    
    // Combine and limit to 10 most important biomarkers
    const selectedAnalytes = [...abnormalAnalytes, ...importantNormalAnalytes].slice(0, 10);
    
    return selectedAnalytes.map(analyte => ({
      name: analyte.name,
      value: analyte.value,
      refLow: analyte.ref_low || 0,
      refHigh: analyte.ref_high || analyte.value * 1.2,
      status: analyte.status,
    }));
  };

  const benchmarkData = getOptimizedBenchmarkData();

  // Get clinically significant biomarkers (top 6)
  const clinicallySignificantBiomarkers = result_json.analytes
    .filter(analyte => analyte.status !== 'normal' || analyte.name.toLowerCase().includes('cholesterol') || 
             analyte.name.toLowerCase().includes('glucose') || analyte.name.toLowerCase().includes('hemoglobin'))
    .slice(0, 6);

  // Data processing functions for popup
  const getHighestValues = () => {
    return result_json.analytes
      .filter(analyte => analyte.status === 'high')
      .sort((a, b) => {
        // Sort by how far above the reference range
        const aRatio = a.ref_high ? (a.value / a.ref_high) : 1;
        const bRatio = b.ref_high ? (b.value / b.ref_high) : 1;
        return bRatio - aRatio;
      })
      .slice(0, 10); // Limit to top 10
  };

  const getLowestValues = () => {
    return result_json.analytes
      .filter(analyte => analyte.status === 'low')
      .sort((a, b) => {
        // Sort by how far below the reference range
        const aRatio = a.ref_low ? (a.value / a.ref_low) : 1;
        const bRatio = b.ref_low ? (b.value / b.ref_low) : 1;
        return aRatio - bRatio;
      })
      .slice(0, 10); // Limit to top 10
  };

  // Click handlers for popup
  const handleHighValuesClick = () => {
    const highValues = getHighestValues();
    if (highValues.length > 0) {
      setPopupData(highValues);
      setPopupType('high');
    }
  };

  const handleLowValuesClick = () => {
    const lowValues = getLowestValues();
    if (lowValues.length > 0) {
      setPopupData(lowValues);
      setPopupType('low');
    }
  };

  const closePopup = () => {
    setPopupType(null);
    setPopupData([]);
  };

  // Popup component
  const ValuesPopup = () => {
    if (!popupType) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4"
        onClick={closePopup}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${
            popupType === 'high' ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            <h3 className={`text-lg font-semibold ${
              popupType === 'high' ? 'text-red-800' : 'text-amber-800'
            }`}>
              {popupType === 'high' ? 'Highest Values' : 'Lowest Values'}
            </h3>
            <button
              onClick={closePopup}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {popupData.length === 0 ? (
              <p className="text-slate-600 text-center py-4">
                No {popupType} values found
              </p>
            ) : (
              <div className="space-y-4">
                {popupData.map((analyte, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-900">{analyte.name}</h4>
                      <StatusChip status={analyte.status}>
                        {analyte.status.charAt(0).toUpperCase() + analyte.status.slice(1)}
                      </StatusChip>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Value:</span>
                        <span className={`font-medium ${
                          popupType === 'high' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {analyte.value} {analyte.unit || ''}
                        </span>
                      </div>
                      {analyte.ref_low !== undefined && analyte.ref_high !== undefined && (
                        <div className="flex justify-between">
                          <span>Reference Range:</span>
                          <span className="font-medium text-slate-700">
                            {analyte.ref_low} - {analyte.ref_high} {analyte.unit || ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <Container className="py-8 space-y-12 md:space-y-16 pb-24">
          {/* Header with Actions */}
          <motion.div 
            variants={sectionVariants}
            className="flex flex-col md:flex-row md:justify-between md:items-start gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Health Analysis Report</h1>
              <p className="text-slate-600 text-lg">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </motion.div>

          {/* Health Score Gauge - Prominent Display */}
          <motion.div 
            variants={sectionVariants}
            className="flex flex-col items-center text-center space-y-6 py-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Your Health Score</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Based on {totalAnalytes} biomarkers analyzed from your recent lab results
              </p>
            </div>
            
            <HealthScoreGauge 
              score={result_json.overall_score} 
              className="mx-auto"
            />
            
            <div className="grid grid-cols-3 gap-8 mt-8">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mx-auto">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-emerald-600">{normalCount}</div>
                <div className="text-sm text-slate-600">Normal</div>
              </div>
              <div className="text-center space-y-2 cursor-pointer hover:bg-red-50 rounded-lg p-2 transition-colors" onClick={handleHighValuesClick}>
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{highCount}</div>
                <div className="text-sm text-slate-600">High</div>
              </div>
              <div className="text-center space-y-2 cursor-pointer hover:bg-amber-50 rounded-lg p-2 transition-colors" onClick={handleLowValuesClick}>
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto">
                  <TrendingDown className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">{lowCount}</div>
                <div className="text-sm text-slate-600">Low</div>
              </div>
            </div>
          </motion.div>

          {/* Health Summary */}
          <motion.div variants={sectionVariants}>
            <motion.div
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => setIsHealthSummaryExpanded(!isHealthSummaryExpanded)}
              style={{ willChange: 'transform' }}
            >
              <Card className="space-y-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-200 ease-out">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Health Summary</h2>
                  </div>
                  <motion.div
                    animate={{ rotate: isHealthSummaryExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="text-emerald-600"
                    style={{ willChange: 'transform' }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </div>
                
                <p className="text-lg text-slate-700 leading-relaxed">{result_json.overall_summary}</p>
                
                {result_json.flags && result_json.flags.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Key Observations
                    </h3>
                    <ul className="space-y-2">
                      {result_json.flags.map((flag, index) => (
                        <li key={index} className="flex items-start gap-2 text-emerald-800">
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-2 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expanded Content */}
                <motion.div
                  initial={false}
                  animate={{
                    height: isHealthSummaryExpanded ? "auto" : 0,
                    opacity: isHealthSummaryExpanded ? 1 : 0
                  }}
                  transition={{ 
                    duration: 0.2, 
                    ease: [0.4, 0, 0.2, 1],
                    height: { duration: 0.2 },
                    opacity: { duration: 0.15, delay: isHealthSummaryExpanded ? 0.05 : 0 }
                  }}
                  className="overflow-hidden"
                  style={{ willChange: 'height, opacity' }}
                >
                  <div className="pt-4 border-t border-emerald-200 space-y-4">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                      <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Health Recommendations
                      </h4>
                      <div className="space-y-3 text-emerald-800">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">Continue monitoring your biomarker levels regularly</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">Discuss any concerning values with your healthcare provider</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">Maintain a balanced diet and regular exercise routine</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">Track trends over time by uploading future lab results</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-emerald-200 rounded-lg p-4">
                        <h5 className="font-medium text-slate-900 mb-2">Next Steps</h5>
                        <p className="text-sm text-slate-600">Schedule a follow-up appointment to discuss these results with your healthcare provider.</p>
                      </div>
                      <div className="bg-white border border-emerald-200 rounded-lg p-4">
                        <h5 className="font-medium text-slate-900 mb-2">Lifestyle Tips</h5>
                        <p className="text-sm text-slate-600">Focus on stress management, adequate sleep, and staying hydrated for optimal health.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Key Biomarkers Section */}
          <motion.div variants={sectionVariants} className="space-y-8">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Key Biomarkers</h2>
              </div>
              <p className="text-slate-600 max-w-2xl mx-auto">
                The most clinically significant values from your lab results
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinicallySignificantBiomarkers.map((analyte, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <BiomarkerCard
                    name={analyte.name}
                    value={analyte.value}
                    unit={analyte.unit}
                    refLow={analyte.ref_low}
                    refHigh={analyte.ref_high}
                    status={getStatusType(analyte.status)}
                    note={analyte.note}
                    clinicalSignificance={analyte.status !== 'normal' ? 'high' : 'medium'}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Status Distribution Chart - Dedicated Section */}
          <motion.div variants={sectionVariants}>
            <Card className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Status Distribution</h2>
                <p className="text-slate-600 text-lg">
                  Visual breakdown of your {totalAnalytes} biomarker results
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-2xl">
                  <div className="h-96 md:h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={180}
                          paddingAngle={8}
                          cornerRadius={12}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{
                            fontSize: '16px',
                            fontWeight: '500',
                            paddingTop: '20px'
                          }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-emerald-600">{normalCount}</div>
                  <div className="text-slate-600 font-medium">Normal Range</div>
                </div>
                <div className="text-center space-y-2 cursor-pointer hover:bg-red-50 rounded-lg p-3 transition-colors" onClick={handleHighValuesClick}>
                  <div className="text-3xl font-bold text-red-600">{highCount}</div>
                  <div className="text-slate-600 font-medium">Above Range</div>
                </div>
                <div className="text-center space-y-2 cursor-pointer hover:bg-amber-50 rounded-lg p-3 transition-colors" onClick={handleLowValuesClick}>
                  <div className="text-3xl font-bold text-amber-600">{lowCount}</div>
                  <div className="text-slate-600 font-medium">Below Range</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Results Overview - Bar Chart Only */}
          <motion.div variants={sectionVariants}>
            <Card className="space-y-6">
              <h2 className="text-xl md:text-2xl text-slate-900">Values vs Reference Ranges</h2>
              <div>
                <p className="text-slate-600 mb-6">
                  Compare your biomarker values against standard reference ranges
                </p>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={benchmarkData} 
                        margin={{ top: 30, right: 40, left: 60, bottom: 120 }}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b"
                          angle={-45}
                          textAnchor="end"
                          height={120}
                          fontSize={12}
                          fontWeight={500}
                          interval={0}
                        />
                        <YAxis 
                          stroke="#64748b"
                          fontSize={12}
                          fontWeight={700}
                          tick={{ fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          name="Your Value"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        >
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
                        <Bar 
                          dataKey="refHigh" 
                          name="Reference High" 
                          fill="#e2e8f0" 
                          opacity={0.6}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </Card>
          </motion.div>

          {/* Biomarker Search Interface */}
          <motion.div variants={sectionVariants}>
            <Card className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl text-slate-900">Explore Your Biomarkers</h2>
                <p className="text-slate-600">
                  Search through all {totalAnalytes} biomarkers from your lab results. 
                  Select up to 6 for detailed analysis and comparison.
                </p>
              </div>
              <BiomarkerSearchInterface 
                analytes={result_json.analytes.map(analyte => ({
                  name: analyte.name,
                  value: analyte.value,
                  unit: analyte.unit,
                  ref_low: analyte.ref_low,
                  ref_high: analyte.ref_high,
                  status: getStatusType(analyte.status),
                  note: analyte.note
                }))}
              />
            </Card>
          </motion.div>

          {/* Charts */}
          {result_json.chart_series && result_json.chart_series.length > 0 && (
            <motion.div variants={sectionVariants}>
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
            </motion.div>
          )}

          {/* Disclaimers */}
          {result_json.disclaimers && result_json.disclaimers.length > 0 && (
            <motion.div variants={sectionVariants}>
              <Card className="bg-slate-50 border-slate-300/50">
                <h3 className="font-medium text-slate-800 mb-3">Important Disclaimers:</h3>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {result_json.disclaimers.map((disclaimer, index) => (
                    <li key={index}>{disclaimer}</li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}
        </Container>
      </motion.div>

      {/* Sticky Disclaimer Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(90vw,48rem)] z-50 print:hidden">
        <div className="rounded-xl bg-white border border-slate-200 p-3 shadow-lg">
          <p className="text-sm text-slate-600 text-center">
            ⚠️ <strong>Medical Disclaimer:</strong> This tool is for educational purposes only and does not provide medical advice. 
            Always consult your healthcare provider for medical decisions.
          </p>
        </div>
      </div>

      {/* Values Popup */}
      <ValuesPopup />
    </>
  );
}
