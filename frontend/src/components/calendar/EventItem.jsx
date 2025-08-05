"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

const EventItem = ({
    event,
    eventIndex,
    selectedDate,
    getPositionFromTime,
    handleDragStart,
    deleteEvent,
    formatTime,
    style = {}
}) => {
    let eventTop;
    let duration;

    if (event.date.getDate() !== selectedDate.getDate()) {
        eventTop = 0;
        duration = event.endDate.getHours() * 60 + event.endDate.getMinutes();
    } else {
        eventTop = getPositionFromTime(event.date.getHours(), event.date.getMinutes());
        if (event.endDate.getDate() !== selectedDate.getDate()) {
            duration = (24 * 60 - (event.date.getHours() * 60 + event.date.getMinutes()));
        } else {
            duration = event.duration;
        }
    }

    const eventHeight = (duration / (24 * 60)) * 100;
    const isGoogleEvent = event.isGoogleEvent;

    const defaultStyle = {
        top: `${eventTop}%`,
        height: `${Math.max(eventHeight, 2)}%`,
        minHeight: '24px',
        backgroundColor: `${event.backgroundColor}20`,
        border: `1px solid ${event.backgroundColor}`,
        color: event.backgroundColor,
        ...style
    };

    return (
        <div
            key={`${event.id}-${eventIndex}`}
            style={defaultStyle}
            className={`
                absolute left-1 right-1 border rounded px-2 py-1 z-10 transition-colors
                ${isGoogleEvent
                    ? 'bg-green-100'
                    : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-move'
                }
            `}
            draggable={!isGoogleEvent}
            onDragStart={(e) => handleDragStart(e, event)}
        >
            <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate`}>
                        {event.title}
                    </div>
                    <div className={`text-xs`}>
                        {formatTime(event.date.getHours(), event.date.getMinutes())}
                        {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                    </div>
                    {event.location && (
                        <div className="text-xs text-gray-500 truncate">
                            📍 {event.location}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 ml-1">
                    {isGoogleEvent && event.htmlLink && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-green-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(event.htmlLink, '_blank');
                            }}
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    )}
                    {!isGoogleEvent && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-red-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(event.id);
                            }}
                        >
                            <X className="h-3 w-3 text-red-600" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventItem;
