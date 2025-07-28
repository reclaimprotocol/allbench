import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const earnings = {
      totalEarnings: Math.floor(Math.random() * 10000),
      pendingEarnings: Math.floor(Math.random() * 1000)
    };
    
    return NextResponse.json(earnings);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user earnings' },
      { status: 500 }
    );
  }
}