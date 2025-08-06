import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ calendarId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const body = await req.json();
        const { calendarId } = await params;

        const res = await calendar.calendarList.patch({
            calendarId: calendarId,
            requestBody: body
        });
        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Calendar API Error:', error);
        return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
    }
}
