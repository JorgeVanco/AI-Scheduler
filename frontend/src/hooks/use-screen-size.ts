"use client";

import { useState, useEffect } from 'react';

interface ScreenSize {
    width: number;
    height: number;
    isMobile: boolean;
    isSmallMobile: boolean;
    isMediumMobile: boolean;
}

export function useScreenSize(): ScreenSize {
    const [screenSize, setScreenSize] = useState<ScreenSize>({
        width: 0,
        height: 0,
        isMobile: false,
        isSmallMobile: false,
        isMediumMobile: false,
    });

    useEffect(() => {
        function updateScreenSize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isMobile = width < 768;
            const isSmallMobile = height < 600;
            const isMediumMobile = height >= 600 && height < 750;

            setScreenSize({
                width,
                height,
                isMobile,
                isSmallMobile,
                isMediumMobile,
            });
        }

        // Set initial size
        updateScreenSize();

        // Add event listener
        window.addEventListener('resize', updateScreenSize);

        // Cleanup
        return () => window.removeEventListener('resize', updateScreenSize);
    }, []);

    return screenSize;
}
