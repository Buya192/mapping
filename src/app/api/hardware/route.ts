import { NextRequest, NextResponse } from 'next/server';
import { hardwareItems } from '@/lib/hardware-data';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');
    
    const filtered = type 
      ? hardwareItems.filter(h => h.type === type)
      : hardwareItems;
    
    // Sort by name
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Hardware API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
