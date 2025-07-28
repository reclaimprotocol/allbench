import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import User from '../../../../models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, walletAddress } = body;
    
    if (!username || !walletAddress) {
      return NextResponse.json(
        { error: 'username and walletAddress are required' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: username },
        { walletAddress: walletAddress }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      } else {
        // Wallet address already exists, update username
        existingUser.username = username;
        const updatedUser = await existingUser.save();
        
        return NextResponse.json({
          success: true,
          user: {
            id: updatedUser._id.toString(),
            username: updatedUser.username,
            walletAddress: updatedUser.walletAddress,
            points: updatedUser.points
          }
        });
      }
    }

    // Create new user
    const newUser = new User({
      username,
      walletAddress,
      points: 0
    });

    const savedUser = await newUser.save();

    return NextResponse.json({
      success: true,
      user: {
        id: savedUser._id.toString(),
        username: savedUser.username,
        walletAddress: savedUser.walletAddress,
        points: savedUser.points
      }
    });

  } catch (error: any) {
    console.error('Error registering user:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern?.username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      } else if (error.keyPattern?.walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address already registered' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}