import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const accessToken = req.headers.get('x-access-token');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const tasks = google.tasks({ version: 'v1', auth });

    try {
        const res = await tasks.tasklists.list();
        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Tasks API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch task lists' }, { status: 500 });
    }
}
