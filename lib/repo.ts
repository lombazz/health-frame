// TODO: Replace with Supabase later

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

// In-memory storage (replace with Supabase later)
const uploads: Upload[] = [];
const reports: Report[] = [];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const uploadRepo = {
  create: (demographics: Demographics, raw_entries: LabEntry[]): Upload => {
    const upload: Upload = {
      id: generateId(),
      created_at: new Date().toISOString(),
      demographics,
      raw_entries,
    };
    uploads.push(upload);
    return upload;
  },

  findAll: (): Upload[] => {
    return uploads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findById: (id: string): Upload | null => {
    return uploads.find(u => u.id === id) || null;
  },
};

export const reportRepo = {
  create: (upload_id: string, result_json: Report['result_json']): Report => {
    const report: Report = {
      id: generateId(),
      upload_id,
      result_json,
    };
    reports.push(report);
    return report;
  },

  findById: (id: string): Report | null => {
    return reports.find(r => r.id === id) || null;
  },

  findByUploadId: (upload_id: string): Report | null => {
    return reports.find(r => r.upload_id === upload_id) || null;
  },
};
