import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const accessToken = req.headers.get('x-access-token');
    const query = searchParams.get('q');
    const calendarId = searchParams.get('calendarId') || 'primary';
    const maxResults = parseInt(searchParams.get('maxResults') || '50');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    if (!query) {
        return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const res = await calendar.events.list({
            calendarId: calendarId,
            q: query,
            maxResults: maxResults,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to search events' }, { status: 500 });
    }
}
