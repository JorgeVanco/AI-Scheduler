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

    // Ensure event.date exists and is a Date object
    if (!event.date) {
        console.warn('Event missing date property:', event);
        return null;
    }

    // Convert string dates to Date objects if needed
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    const eventEndDate = event.endDate ?
        (event.endDate instanceof Date ? event.endDate : new Date(event.endDate))
        : null;

    if (event.isAllDayEvent && eventDate.getDate() === selectedDate.getDate()) {
        eventTop = 'auto';
        duration = 30;
    } else if (eventDate.getDate() !== selectedDate.getDate()) {
        eventTop = 0;
        duration = eventEndDate ? (eventEndDate.getHours() * 60 + eventEndDate.getMinutes()) : 60;
    } else {
        eventTop = getPositionFromTime(eventDate.getHours(), eventDate.getMinutes());
        if (eventEndDate && eventEndDate.getDate() !== selectedDate.getDate()) {
            duration = (24 * 60 - (eventDate.getHours() * 60 + eventDate.getMinutes()));
        } else {
            duration = event.duration || 60; // Default to 60 minutes if duration is not set
        }
    }

    const eventHeight = event.isAllDayEvent
        ? (style.height || '20px')
        : `${(duration / (24 * 60)) * 100}%`;

    const isGoogleEvent = event.isGoogleEvent;
    const isProposed = event.isProposed;

    const defaultStyle = event.isAllDayEvent ? {
        // All-day event styles
        backgroundColor: isProposed ? '#dbeafe' : `${event.backgroundColor}40`,
        border: isProposed ? '2px dashed #3b82f6' : `1px solid ${event.backgroundColor}`,
        color: isProposed ? '#1d4ed8' : event.backgroundColor,
        borderRadius: '4px',
        ...style
    } : {
        // Timed event styles
        top: `${eventTop}%`,
        height: `${eventHeight}`,
        backgroundColor: isProposed ? '#dbeafe' : `${event.backgroundColor}20`,
        border: isProposed ? '2px dashed #3b82f6' : `1px solid ${event.backgroundColor}`,
        color: isProposed ? '#1d4ed8' : event.backgroundColor,
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
                ${isProposed
                    ? 'bg-blue-50 hover:bg-blue-100 cursor-move border-dashed'
                    : isGoogleEvent
                        ? event.isAllDayEvent
                            ? 'bg-opacity-60'
                            : 'bg-green-100'
                        : event.isAllDayEvent
                            ? 'bg-opacity-60 hover:bg-opacity-80 cursor-move'
                            : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-move'
                }
            `}
            draggable={!isGoogleEvent || isProposed}
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
                                {formatTime(eventDate.getHours(), eventDate.getMinutes())}
                                {eventEndDate && ` - ${formatTime(eventEndDate.getHours(), eventEndDate.getMinutes())}`}
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
                                {formatTime(eventDate.getHours(), eventDate.getMinutes())}
                                {eventEndDate && ` - ${formatTime(eventEndDate.getHours(), eventEndDate.getMinutes())}`}
                                {event.location && `, ${event.location}`}
                            </div>
                        </>
                    ) : duration > 15 ? (
                        // Single line for very short events (30 minutes to 15 minutes)
                        <div className={`text-xs truncate`}>
                            <span className="font-medium">{event.title}</span>
                            <span className="ml-1">
                                {formatTime(eventDate.getHours(), eventDate.getMinutes())}
                                {eventEndDate && ` - ${formatTime(eventEndDate.getHours(), eventEndDate.getMinutes())}`}
                            </span>
                        </div>
                    ) : (
                        // Single line for very short events (15 minutes or less)
                        <div className={`text-[8px] truncate`}>
                            <span className="font-small">{event.title}</span>
                            <span className="ml-1">
                                {formatTime(eventDate.getHours(), eventDate.getMinutes())}
                                {eventEndDate && ` - ${formatTime(eventEndDate.getHours(), eventEndDate.getMinutes())}`}
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
                    {(isProposed || (!isGoogleEvent)) && (
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
