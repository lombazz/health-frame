// Server-side repository with persistent storage
import fs from 'fs';
import path from 'path';
import { Upload, Report, Demographics, LabEntry } from './repo-types';

// File-based persistent storage for development
const DATA_DIR = path.join(process.cwd(), '.data');
const UPLOADS_FILE = path.join(DATA_DIR, 'uploads.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('[repo-server] Created data directory:', DATA_DIR);
  }
}

// Load data from file with error handling
function loadData<T>(filePath: string, defaultValue: T[]): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      console.log(`[repo-server] Loaded ${parsed.length} items from ${path.basename(filePath)}`);
      return parsed;
    }
  } catch (error) {
    console.error(`[repo-server] Error loading ${path.basename(filePath)}:`, error);
  }
  console.log(`[repo-server] Using default empty array for ${path.basename(filePath)}`);
  return defaultValue;
}

// Save data to file with error handling
function saveData<T>(filePath: string, data: T[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[repo-server] Saved ${data.length} items to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`[repo-server] Error saving ${path.basename(filePath)}:`, error);
  }
}

// Initialize persistent storage
let uploads: Upload[] = loadData<Upload>(UPLOADS_FILE, []);
let reports: Report[] = loadData<Report>(REPORTS_FILE, []);

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
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
    saveData(UPLOADS_FILE, uploads);
    console.log(`[uploadRepo-server] Created upload with ID: ${upload.id}`);
    return upload;
  },

  findAll: (): Upload[] => {
    return uploads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findById: (id: string): Upload | null => {
    const upload = uploads.find(u => u.id === id) || null;
    console.log(`[uploadRepo-server] Finding upload ${id}: ${upload ? 'found' : 'not found'}`);
    return upload;
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
    saveData(REPORTS_FILE, reports);
    console.log(`[reportRepo-server] Created report with ID: ${report.id} for upload: ${upload_id}`);
    return report;
  },

  findById: (id: string): Report | null => {
    const report = reports.find(r => r.id === id) || null;
    console.log(`[reportRepo-server] Finding report ${id}: ${report ? 'found' : 'not found'}`);
    if (!report) {
      console.log(`[reportRepo-server] Available report IDs: ${reports.map(r => r.id).join(', ')}`);
    }
    return report;
  },

  findByUploadId: (upload_id: string): Report | null => {
    const report = reports.find(r => r.upload_id === upload_id) || null;
    console.log(`[reportRepo-server] Finding report by upload ${upload_id}: ${report ? 'found' : 'not found'}`);
    return report;
  },

  // Add utility methods for debugging
  getAllReports: (): Report[] => {
    console.log(`[reportRepo-server] Total reports in storage: ${reports.length}`);
    return reports;
  },

  clearAll: (): void => {
    reports.length = 0;
    saveData(REPORTS_FILE, reports);
    console.log('[reportRepo-server] Cleared all reports');
  },
};