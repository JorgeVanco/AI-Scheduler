import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: 'v1', auth });

    try {
        const res = await tasks.tasklists.list();
        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }
}
