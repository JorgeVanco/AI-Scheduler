import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ taskListId: string }> }
) {
    const accessToken = req.headers.get('x-access-token');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

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

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ taskListId: string }> }
) {
    const accessToken = req.headers.get('x-access-token');

    if (!accessToken) {
        return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const tasks = google.tasks({ version: 'v1', auth });

    try {
        const { taskListId } = await params;
        const body = await req.json();
        const { task } = body;

        const res = await tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: task,
        });

        return NextResponse.json(res.data);
    } catch (error) {
        console.error('Google Tasks API Error:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}
