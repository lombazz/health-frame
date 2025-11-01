// Client-side repository (fallback to in-memory for client-side usage)
// Server-side operations should use repo-server.ts

// Re-export types
export * from './repo-types';

// In-memory storage for client-side fallback
let uploads: any[] = [];
let reports: any[] = [];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const uploadRepo = {
  create: (demographics: any, raw_entries: any[]): any => {
    const upload = {
      id: generateId(),
      created_at: new Date().toISOString(),
      demographics,
      raw_entries,
    };
    uploads.push(upload);
    console.log(`[uploadRepo-client] Created upload with ID: ${upload.id} (in-memory only)`);
    return upload;
  },

  findAll: (): any[] => {
    return uploads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  findById: (id: string): any | null => {
    const upload = uploads.find(u => u.id === id) || null;
    console.log(`[uploadRepo-client] Finding upload ${id}: ${upload ? 'found' : 'not found'} (in-memory only)`);
    return upload;
  },
};

export const reportRepo = {
  create: (upload_id: string, result_json: any): any => {
    const report = {
      id: generateId(),
      upload_id,
      result_json,
    };
    reports.push(report);
    console.log(`[reportRepo-client] Created report with ID: ${report.id} for upload: ${upload_id} (in-memory only)`);
    return report;
  },

  findById: (id: string): any | null => {
    const report = reports.find(r => r.id === id) || null;
    console.log(`[reportRepo-client] Finding report ${id}: ${report ? 'found' : 'not found'} (in-memory only)`);
    if (!report) {
      console.log(`[reportRepo-client] Available report IDs: ${reports.map(r => r.id).join(', ')}`);
    }
    return report;
  },

  findByUploadId: (upload_id: string): any | null => {
    const report = reports.find(r => r.upload_id === upload_id) || null;
    console.log(`[reportRepo-client] Finding report by upload ${upload_id}: ${report ? 'found' : 'not found'} (in-memory only)`);
    return report;
  },

  // Add utility methods for debugging
  getAllReports: (): any[] => {
    console.log(`[reportRepo-client] Total reports in storage: ${reports.length} (in-memory only)`);
    return reports;
  },

  clearAll: (): void => {
    reports.length = 0;
    console.log('[reportRepo-client] Cleared all reports (in-memory only)');
  },
};
