import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import User from '../../../models/User';
import { safeMap } from '../../../lib/mongoUtils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get all users sorted by points (descending) and creation date (ascending for tie-breaking)
    const users = await User.find({})
      .sort({ points: -1, createdAt: 1 })
      .select('username points');

    // Create leaderboard with ranks using safe mapping
    const leaderboard = await safeMap(users, (user: any, index: number) => ({
      rank: index + 1,
      username: user.username,
      points: user.points
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { username } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: 'username is required' },
        { status: 400 }
      );
    }

    // Get user's current position
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Count users with higher points or same points but created earlier
    const usersAhead = await User.countDocuments({
      $or: [
        { points: { $gt: user.points } },
        { 
          points: user.points, 
          createdAt: { $lt: user.createdAt } 
        }
      ]
    });

    const rank = usersAhead + 1;

    return NextResponse.json({
      rank,
      username: user.username,
      points: user.points
    });

  } catch (error) {
    console.error('Error getting user rank:', error);
    return NextResponse.json(
      { error: 'Failed to get user rank' },
      { status: 500 }
    );
  }
}