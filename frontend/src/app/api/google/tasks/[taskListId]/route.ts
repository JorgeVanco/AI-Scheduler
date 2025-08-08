import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ taskListId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: 'v1', auth });

    try {
        const { taskListId } = await params;
        const res = await tasks.tasks.list({
            tasklist: taskListId,
        });
        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Tasks API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }
}
