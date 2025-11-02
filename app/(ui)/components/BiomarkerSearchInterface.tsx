"use client";

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { Search, X, ChevronDown, Filter, RotateCcw } from 'lucide-react';
import BiomarkerCard from './BiomarkerCard';
import Card from './Card';

interface Analyte {
  name: string;
  value: number;
  unit: string;
  ref_low?: number;
  ref_high?: number;
  status: 'normal' | 'high' | 'low' | 'unknown';
  note?: string;
}

interface BiomarkerSearchInterfaceProps {
  analytes: Analyte[];
  className?: string;
}

interface SearchFilters {
  status: 'all' | 'normal' | 'high' | 'low' | 'unknown';
  category: 'all' | 'lipids' | 'glucose' | 'liver' | 'kidney' | 'thyroid' | 'blood' | 'other';
}

const BIOMARKER_CATEGORIES = {
  lipids: ['cholesterol', 'ldl', 'hdl', 'triglycerides', 'apolipoprotein'],
  glucose: ['glucose', 'hemoglobin a1c', 'hba1c', 'insulin', 'c-peptide'],
  liver: ['alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'ggt', 'albumin'],
  kidney: ['creatinine', 'bun', 'urea', 'egfr', 'microalbumin'],
  thyroid: ['tsh', 'ft4', 'ft3', 'free t4', 'free t3', 'thyroglobulin'],
  blood: ['hemoglobin', 'hematocrit', 'rbc', 'wbc', 'platelets', 'mcv', 'mch', 'mchc'],
};

export default function BiomarkerSearchInterface({ 
  analytes, 
  className = '' 
}: BiomarkerSearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnalytes, setSelectedAnalytes] = useState<Analyte[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    status: 'all',
    category: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(analytes, {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 1,
    });
  }, [analytes]);

  // Get category for an analyte
  const getAnalyteCategory = useCallback((analyteName: string): string => {
    const name = analyteName.toLowerCase();
    for (const [category, keywords] of Object.entries(BIOMARKER_CATEGORIES)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }
    return 'other';
  }, []);

  // Filter and search analytes
  const filteredAnalytes = useMemo(() => {
    let results = analytes;

    // Apply status filter
    if (filters.status !== 'all') {
      results = results.filter(analyte => analyte.status === filters.status);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      results = results.filter(analyte => getAnalyteCategory(analyte.name) === filters.category);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const fuseResults = fuse.search(searchQuery);
      const searchedAnalytes = fuseResults.map(result => result.item);
      results = results.filter(analyte => 
        searchedAnalytes.some(searched => searched.name === analyte.name)
      );
    }

    return results;
  }, [analytes, filters, searchQuery, fuse, getAnalyteCategory]);

  // Handle analyte selection
  const handleAnalyteSelect = useCallback((analyte: Analyte) => {
    setSelectedAnalytes(prev => {
      const isAlreadySelected = prev.some(selected => selected.name === analyte.name);
      
      if (isAlreadySelected) {
        return prev.filter(selected => selected.name !== analyte.name);
      } else if (prev.length < 6) {
        return [...prev, analyte];
      }
      
      return prev; // Don't add if already at max (6)
    });
  }, []);

  // Remove selected analyte
  const handleRemoveSelected = useCallback((analyteName: string) => {
    setSelectedAnalytes(prev => prev.filter(analyte => analyte.name !== analyteName));
  }, []);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    setSelectedAnalytes([]);
    setSearchQuery('');
    setFilters({ status: 'all', category: 'all' });
  }, []);

  // Check if analyte is selected
  const isAnalyteSelected = useCallback((analyteName: string) => {
    return selectedAnalytes.some(selected => selected.name === analyteName);
  }, [selectedAnalytes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Search Biomarkers</h3>
            <p className="text-slate-600 text-sm">
              Find and select up to 6 biomarkers for detailed analysis
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {(selectedAnalytes.length > 0 || searchQuery || filters.status !== 'all' || filters.category !== 'all') && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className={`relative transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search biomarkers (e.g., cholesterol, glucose, hemoglobin)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="low">Low</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="lipids">Lipids</option>
                    <option value="glucose">Glucose & Diabetes</option>
                    <option value="liver">Liver Function</option>
                    <option value="kidney">Kidney Function</option>
                    <option value="thyroid">Thyroid</option>
                    <option value="blood">Blood Count</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Biomarkers Panel */}
      {selectedAnalytes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-900">
                Selected for Analysis ({selectedAnalytes.length}/6)
              </h4>
              <button
                onClick={() => setSelectedAnalytes([])}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAnalytes.map((analyte, index) => (
                <motion.div
                  key={`selected-${analyte.name}-${analyte.value}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm ${getStatusColor(analyte.status)}`}
                >
                  <span className="font-medium">{analyte.name}</span>
                  <span className="text-xs opacity-75">
                    {analyte.value} {analyte.unit}
                  </span>
                  <button
                    onClick={() => handleRemoveSelected(analyte.name)}
                    className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-slate-900">
            Available Biomarkers ({filteredAnalytes.length})
          </h4>
          {selectedAnalytes.length >= 6 && (
            <p className="text-sm text-amber-600">
              Maximum 6 biomarkers selected
            </p>
          )}
        </div>

        {filteredAnalytes.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No biomarkers found</p>
              <p className="text-sm">
                Try adjusting your search terms or filters
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnalytes.map((analyte, index) => {
              const isSelected = isAnalyteSelected(analyte.name);
              const canSelect = selectedAnalytes.length < 6 || isSelected;
              
              return (
                <motion.div
                  key={`filtered-${analyte.name}-${analyte.value}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="relative"
                >
                  <div
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 ring-opacity-50' 
                        : canSelect 
                          ? 'hover:ring-2 hover:ring-slate-300' 
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => canSelect && handleAnalyteSelect(analyte)}
                  >
                    <BiomarkerCard
                      name={analyte.name}
                      value={analyte.value}
                      unit={analyte.unit}
                      refLow={analyte.ref_low}
                      refHigh={analyte.ref_high}
                      status={analyte.status}
                      note={analyte.note}
                      clinicalSignificance="medium"
                      className={isSelected ? 'bg-blue-50 border-blue-200' : ''}
                    />
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                    >
                      ✓
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Analysis Panel */}
      {selectedAnalytes.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-900">Detailed Analysis</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {selectedAnalytes.map((analyte, index) => (
                <BiomarkerCard
                  key={`analysis-${analyte.name}-${analyte.value}-${index}`}
                  name={analyte.name}
                  value={analyte.value}
                  unit={analyte.unit}
                  refLow={analyte.ref_low}
                  refHigh={analyte.ref_high}
                  status={analyte.status}
                  note={analyte.note}
                  clinicalSignificance="high"
                  className="bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}