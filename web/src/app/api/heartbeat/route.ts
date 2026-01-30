import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { games } = body;

        if (!Array.isArray(games) || games.length === 0) {
            return NextResponse.json({ message: 'No games provided' }, { status: 400 });
        }

        // For a single-user desktop app, we might check for a specific user ID or just use a default one.
        // For now, let's find or create a default user.
        // In a real app, you'd send an API Key or User ID from Electron.
        let user = await prisma.user.findFirst();
        if (!user) {
            user = await prisma.user.create({
                data: { steamId: 'default-user' }
            });
        }

        const now = new Date();
        const TWO_MINUTES_AGO = new Date(now.getTime() - 2 * 60 * 1000);

        for (const gameName of games) {
            // Find the most recent session for this game and user
            const lastSession = await prisma.playSession.findFirst({
                where: {
                    userId: user.id,
                    gameName: gameName,
                    // We look for a session that was created recently OR updated recently?
                    // Actually, we look for a session where startTime + duration is near now.
                    // Or just simply: check the last created session for this game.
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            let shouldCreateNew = true;

            if (lastSession) {
                // Calculate when the session theoretically ended
                const sessionEndTime = new Date(lastSession.startTime.getTime() + lastSession.durationSeconds * 1000);

                // If the session ended within the last 2 minutes, we resume it.
                if (sessionEndTime >= TWO_MINUTES_AGO) {
                    shouldCreateNew = false;

                    // Update duration
                    // New duration = (Now - StartTime) in seconds
                    const newDuration = Math.floor((now.getTime() - lastSession.startTime.getTime()) / 1000);

                    await prisma.playSession.update({
                        where: { id: lastSession.id },
                        data: { durationSeconds: newDuration }
                    });
                }
            }

            if (shouldCreateNew) {
                await prisma.playSession.create({
                    data: {
                        userId: user.id,
                        gameName: gameName,
                        platform: 'PC', // Default to PC for local detection
                        startTime: now,
                        durationSeconds: 0 // Starts at 0
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Heartbeat error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
