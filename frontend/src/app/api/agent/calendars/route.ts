import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const accessToken = req.headers.get('x-access-token');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }
    console.log("Access token received:", accessToken);
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth });
    console.log("Fetching calendars with access token:");
    try {
        const res = await calendar.calendarList.list();
        console.log("Calendars fetched successfully:", res.data.items);
        const calendars = { items: res.data.items?.map((calendar) => ({ ...calendar })) };
        return NextResponse.json(calendars);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }
}
