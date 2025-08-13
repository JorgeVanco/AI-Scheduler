"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ScheduleDayButton = () => {
    return (
        <Button size="sm">
            <Image src="/web-app-manifest-192x192.png" alt="Icon" height={24} width={24} />
            Schedule my day
        </Button>
    );
};

export default ScheduleDayButton;
