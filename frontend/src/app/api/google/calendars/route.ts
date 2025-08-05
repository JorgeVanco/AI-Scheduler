import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { adjustGoogleCalendarColor } from '@/lib/utils';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const res = await calendar.calendarList.list();
        const calendars = { items: res.data.items?.map((calendar) => ({ ...calendar, backgroundColor: adjustGoogleCalendarColor(calendar.backgroundColor as string) })) };
        return NextResponse.json(calendars);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
    }
}
