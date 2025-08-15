"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

const EventForm = ({
    showEventForm,
    setShowEventForm,
    newEventTitle,
    setNewEventTitle,
    isMobile
}) => {
    return (
        <>
            {!isMobile && (
                <Button
                    size="sm"
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="flex items-center gap-1"
                >
                    <Plus className="h-4 w-4" />
                    Local Event
                </Button>
            )}

            {showEventForm && (
                <div className={`${isMobile ? 'mb-2 p-2' : 'mb-4 p-3'} border rounded-lg bg-gray-50`}>
                    <Input
                        placeholder="Event title..."
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className={`mb-2 ${isMobile ? 'text-sm' : ''}`}
                    />
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                        {isMobile ? 'Tap timeline to create event' : 'Click anywhere on the timeline to create the event'}
                    </div>
                    <Button
                        variant="outline"
                        size={isMobile ? "xs" : "sm"}
                        onClick={() => setShowEventForm(false)}
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </>
    );
};

export default EventForm;
