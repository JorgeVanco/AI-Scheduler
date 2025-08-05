"use client";

import React from 'react';

const EventLegend = () => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Google Events</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Local Events</span>
            </div>
        </div>
    );
};

export default EventLegend;
