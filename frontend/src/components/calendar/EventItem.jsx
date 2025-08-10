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

    if (event.isAllDayEvent && event.date.getDate() === selectedDate.getDate()) {
        eventTop = 'auto';
        duration = 30;
    } else if (event.date.getDate() !== selectedDate.getDate()) {
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

    const eventHeight = event.isAllDayEvent
        ? (style.height || '20px')
        : `${(duration / (24 * 60)) * 100}%`;

    const isGoogleEvent = event.isGoogleEvent;

    const defaultStyle = event.isAllDayEvent ? {
        // All-day event styles
        backgroundColor: `${event.backgroundColor}40`,
        border: `1px solid ${event.backgroundColor}`,
        color: event.backgroundColor,
        borderRadius: '4px',
        ...style
    } : {
        // Timed event styles
        top: `${eventTop}%`,
        height: `${eventHeight}`,
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
                ${event.isAllDayEvent
                    ? 'flex items-center px-2 py-1 text-xs font-medium truncate'
                    : 'absolute left-1 right-1 border rounded px-2 py-1 z-10 transition-colors'
                }
                ${isGoogleEvent
                    ? event.isAllDayEvent
                        ? 'bg-opacity-60'
                        : 'bg-green-100'
                    : event.isAllDayEvent
                        ? 'bg-opacity-60 hover:bg-opacity-80 cursor-move'
                        : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-move'
                }
            `}
            draggable={!isGoogleEvent}
            onDragStart={(e) => handleDragStart(e, event)}
        >
            <div className="flex items-center justify-between h-full w-full">
                <div className="flex-1 min-w-0">
                    {event.isAllDayEvent ? (
                        // All-day event layout - simple and compact
                        <div className="flex items-center">
                            <span className="font-medium truncate">{event.title}</span>
                            {event.location && (
                                <span className="ml-2 text-opacity-70 truncate">
                                    {event.location}
                                </span>
                            )}
                        </div>
                    ) : duration >= 60 ? (
                        // Standard layout for events 1 hour or longer
                        <>
                            <div className={`font-medium text-sm truncate`}>
                                {event.title}
                            </div>
                            <div className={`text-xs`}>
                                {formatTime(event.date.getHours(), event.date.getMinutes())}
                                {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                                {event.location && `, ${event.location}`}
                            </div>
                        </>
                    ) : duration > 40 ? (
                        // Smaller text for events between 40-60 minutes
                        <>
                            <div className={`font-medium text-xs truncate`}>
                                {event.title}
                            </div>
                            <div className={`text-xs`} style={{ fontSize: '10px' }}>
                                {formatTime(event.date.getHours(), event.date.getMinutes())}
                                {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                                {event.location && `, ${event.location}`}
                            </div>
                        </>
                    ) : duration > 15 ? (
                        // Single line for very short events (30 minutes to 15 minutes)
                        <div className={`text-xs truncate`}>
                            <span className="font-medium">{event.title}</span>
                            <span className="ml-1">
                                {formatTime(event.date.getHours(), event.date.getMinutes())}
                                {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                            </span>
                        </div>
                    ) : (
                        // Single line for very short events (15 minutes or less)
                        <div className={`text-[8px] truncate`}>
                            <span className="font-small">{event.title}</span>
                            <span className="ml-1">
                                {formatTime(event.date.getHours(), event.date.getMinutes())}
                                {event.endDate && ` - ${formatTime(event.endDate.getHours(), event.endDate.getMinutes())}`}
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 ml-1">
                    {isGoogleEvent && event.htmlLink && (
                        <ExternalLink
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(event.htmlLink, '_blank');
                            }}
                            className={`${duration > 20 ? "h-4 w-4" : "h-2 w-2"} cursor-pointer hover:opacity-50 transition-opacity`}
                        />
                    )}
                    {!isGoogleEvent && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="max-h-4 max-w-4 h-[1em] w-[1em] p-0 hover:bg-red-100"
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
