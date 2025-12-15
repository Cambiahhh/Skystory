
import { useState, useEffect } from 'react';
import { NatureDomain } from '../types';

/**
 * useSmartMode
 * Detects if the user is looking UP (Sky) or DOWN (Land) based on device beta (pitch).
 * 
 * Logic:
 * - Portrait mode assumed.
 * - Beta 90 is upright.
 * - Beta > 100 or < -10 usually means tilting back (Sky).
 * - Beta < 80 usually means tilting forward/down (Land).
 */
export const useSmartMode = (initialDomain: NatureDomain = NatureDomain.SKY) => {
    const [domain, setDomain] = useState<NatureDomain>(initialDomain);
    const [debugBeta, setDebugBeta] = useState(0);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            const beta = event.beta; // In degrees: -180 to 180
            if (beta === null) return;

            setDebugBeta(Math.round(beta));

            // Buffer zone to prevent flickering (hysteresis)
            // Looking Up: Phone screen points down slightly or stays upright
            // Looking Down: Phone screen points up
            
            // NOTE: Beta behavior varies by browser/OS, but generally:
            // 0 = Flat on table
            // 90 = Upright
            
            // User holding phone to photograph Flower (Down):
            // Beta drops towards 0 or 45.
            
            // User holding phone to photograph Sky (Up):
            // Beta goes > 90 (if selfie angle) OR < 0 (if overhead).
            
            // Simplified Logic:
            // If beta < 60 -> DEFINITELY Looking Down (Land)
            // If beta > 100 -> DEFINITELY Looking Up (Sky) (Selfie tilt)
            // If beta < -20 -> DEFINITELY Looking Up (Overhead)
            
            if (beta < 60 && beta > -20) {
                setDomain(NatureDomain.LAND);
            } else if (beta > 100 || beta < -20) {
                setDomain(NatureDomain.SKY);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    return { domain, debugBeta };
};
