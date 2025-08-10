import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const accessToken = req.headers.get('x-access-token');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const body = await req.json();
        const { calendars, timeMin, timeMax } = body;

        if (!calendars || !Array.isArray(calendars) || calendars.length === 0) {
            return NextResponse.json({ error: 'Calendars array is required' }, { status: 400 });
        }

        if (!timeMin || !timeMax) {
            return NextResponse.json({ error: 'timeMin and timeMax are required' }, { status: 400 });
        }

        const items = calendars.map(calendarId => ({ id: calendarId }));

        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin: timeMin,
                timeMax: timeMax,
                items: items,
            },
        });

        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to get free/busy information' }, { status: 500 });
    }
}
