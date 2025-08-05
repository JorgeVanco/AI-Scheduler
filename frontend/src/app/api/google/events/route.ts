import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    const pageToken = searchParams.get('pageToken');

    const midNight = new Date(new Date().setHours(0, 0, 0, 0));
    const startDate = searchParams.get('startDate') || midNight.toISOString();
    const endDate = searchParams.get('endDate') || new Date(midNight.getTime() + 24 * 60 * 60 * 1000).toISOString();

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const requestParams: any = {
            calendarId: calendarId,
            timeMin: startDate,
            timeMax: endDate,
            maxResults: 500,
            singleEvents: true,
            orderBy: 'startTime',
        };

        // Add pageToken if provided for pagination
        if (pageToken) {
            requestParams.pageToken = pageToken;
        }

        const res = await calendar.events.list(requestParams);
        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
