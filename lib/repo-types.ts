// Shared types for repository implementations

export interface Demographics {
  sex: 'M' | 'F' | 'X';
  birth_year: number;
  height_cm: number;
  weight_kg: number;
}

export interface LabEntry {
  analyte: string;
  value: number;
  unit: string;
  ref_low?: number;
  ref_high?: number;
}

export interface Upload {
  id: string;
  created_at: string;
  demographics: Demographics;
  raw_entries: LabEntry[];
}

export interface AnalyteResult {
  name: string;
  value: number;
  unit: string;
  ref_low?: number;
  ref_high?: number;
  status: 'low' | 'normal' | 'high' | 'unknown';
  note: string;
}

export interface ChartPoint {
  t: string;
  v: number;
}

export interface ChartSeries {
  key: string;
  points: ChartPoint[];
}

export interface Report {
  id: string;
  upload_id: string;
  result_json: {
    overall_summary: string;
    overall_score: number;
    flags: string[];
    analytes: AnalyteResult[];
    chart_series: ChartSeries[];
    disclaimers: string[];
  };
}