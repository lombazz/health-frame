import { NextRequest, NextResponse } from 'next/server';
import { reportRepo } from '@/lib/repo-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = reportRepo.findById(id);
    
    if (!report) {
      console.log(`[API] Report not found: ${id}`);
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully retrieved report: ${id}`);
    return NextResponse.json(report);
  } catch (error) {
    console.error('[API] Error retrieving report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}