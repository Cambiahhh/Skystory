
import React, { useEffect, useRef, useState } from 'react';
import { Compass, Sparkles, MapPin } from 'lucide-react';

// --- ASTRONOMY MATH & DATA ---

interface StarData {
  name: string;
  ra: number; 
  dec: number; 
  mag: number;
  constellation?: string;
}

const STARS: StarData[] = [
  { name: "Sirius", ra: 6.75, dec: -16.7, mag: -1.46, constellation: "CMa" },
  { name: "Canopus", ra: 6.40, dec: -52.7, mag: -0.74, constellation: "Car" },
  { name: "Rigil Kent", ra: 14.66, dec: -60.8, mag: -0.27, constellation: "Cen" },
  { name: "Arcturus", ra: 14.26, dec: 19.1, mag: -0.05, constellation: "Boo" },
  { name: "Vega", ra: 18.62, dec: 38.8, mag: 0.03, constellation: "Lyr" },
  { name: "Capella", ra: 5.27, dec: 46.0, mag: 0.08, constellation: "Aur" },
  { name: "Rigel", ra: 5.24, dec: -8.2, mag: 0.13, constellation: "Ori" },
  { name: "Procyon", ra: 7.65, dec: 5.2, mag: 0.34, constellation: "CMi" },
  { name: "Betelgeuse", ra: 5.92, dec: 7.4, mag: 0.42, constellation: "Ori" },
  { name: "Bellatrix", ra: 5.42, dec: 6.3, mag: 1.64, constellation: "Ori" },
  { name: "Mintaka", ra: 5.53, dec: -0.3, mag: 2.25, constellation: "Ori" },
  { name: "Alnilam", ra: 5.60, dec: -1.2, mag: 1.69, constellation: "Ori" },
  { name: "Alnitak", ra: 5.68, dec: -1.9, mag: 1.74, constellation: "Ori" },
  { name: "Saiph", ra: 5.79, dec: -9.7, mag: 2.07, constellation: "Ori" },
  { name: "Dubhe", ra: 11.06, dec: 61.75, mag: 1.8, constellation: "UMa" },
  { name: "Merak", ra: 11.03, dec: 56.38, mag: 2.3, constellation: "UMa" },
  { name: "Phecda", ra: 11.89, dec: 53.69, mag: 2.4, constellation: "UMa" },
  { name: "Megrez", ra: 12.25, dec: 57.03, mag: 3.3, constellation: "UMa" },
  { name: "Alioth", ra: 12.90, dec: 55.96, mag: 1.7, constellation: "UMa" },
  { name: "Mizar", ra: 13.40, dec: 54.92, mag: 2.2, constellation: "UMa" },
  { name: "Alkaid", ra: 13.79, dec: 49.31, mag: 1.8, constellation: "UMa" },
  { name: "Polaris", ra: 2.53, dec: 89.26, mag: 1.97, constellation: "UMi" },
  { name: "Antares", ra: 16.49, dec: -26.43, mag: 1.06, constellation: "Sco" },
  { name: "Altair", ra: 19.85, dec: 8.87, mag: 0.77, constellation: "Aql" },
  { name: "Deneb", ra: 20.69, dec: 45.28, mag: 1.25, constellation: "Cyg" },
];

const CONSTELLATION_LINKS = [
  ["Betelgeuse", "Bellatrix"], ["Betelgeuse", "Alnitak"], ["Bellatrix", "Mintaka"],
  ["Mintaka", "Alnilam"], ["Alnilam", "Alnitak"], 
  ["Alnitak", "Saiph"], ["Mintaka", "Rigel"], 
  ["Dubhe", "Merak"], ["Merak", "Phecda"], ["Phecda", "Megrez"], ["Megrez", "Dubhe"], 
  ["Megrez", "Alioth"], ["Alioth", "Mizar"], ["Mizar", "Alkaid"], 
  ["Vega", "Deneb"], ["Deneb", "Altair"], ["Altair", "Vega"]
];

const toRad = (deg: number) => deg * (Math.PI / 180);
const toDeg = (rad: number) => rad * (180 / Math.PI);

const getLST = (longitude: number) => {
  const now = new Date();
  const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const days = (now.getTime() - J2000.getTime()) / 86400000;
  const GMST = 18.697374558 + 24.06570982441908 * days;
  const LST = (GMST + longitude / 15) % 24;
  return LST < 0 ? LST + 24 : LST;
};

const getHorizontalCoords = (raHours: number, decDeg: number, latDeg: number, lstHours: number) => {
  const lat = toRad(latDeg);
  const dec = toRad(decDeg);
  const ha = toRad((lstHours - raHours) * 15); 

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const alt = Math.asin(sinAlt);

  const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))); 
  
  if (Math.sin(ha) > 0) {
    az = 2 * Math.PI - az;
  }
  
  return { az: toDeg(az), alt: toDeg(alt) };
};

const StarOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State: Intentionally NULL to block rendering until real data exists
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [orientation, setOrientation] = useState<{alpha: number, beta: number, gamma: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 1. Get Location (Strict - No defaults)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
            setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            setLocationError(null);
        },
        (err) => {
            console.warn("Location error", err);
            setLocationError("Unable to find you on Earth.");
        },
        { timeout: 15000, enableHighAccuracy: true } 
      );
    } else {
        setLocationError("Geolocation not supported.");
    }
  }, []);

  // 2. Request Gyro
  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          setupOrientationListener();
        } else {
          alert("We need gyroscope access to show the stars.");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setPermissionGranted(true);
      setupOrientationListener();
    }
  };

  const setupOrientationListener = () => {
      // Chrome/Android needs 'deviceorientationabsolute' for True North
      // iOS uses standard 'deviceorientation' but with 'webkitCompassHeading'
      // Cast window to any to avoid TS narrowing window to never if it thinks the property doesn't exist on Window
      if ('ondeviceorientationabsolute' in (window as any)) {
          (window as any).addEventListener('deviceorientationabsolute', handleOrientation as any);
      } else {
          window.addEventListener('deviceorientation', handleOrientation);
      }
  };

  const handleOrientation = (e: DeviceOrientationEvent & { webkitCompassHeading?: number, absolute?: boolean }) => {
    let heading = 0;

    // --- HEADING LOGIC (Azimuth) ---
    // 0 = North, 90 = East, 180 = South, 270 = West
    
    if (e.webkitCompassHeading !== undefined) {
        // iOS: webkitCompassHeading is clockwise from North (0). 
        // 0=N, 90=E. This matches standard Azimuth.
        heading = e.webkitCompassHeading;
    } else if (e.absolute && e.alpha !== null) {
        // Android Absolute: Alpha is usually North=0, increasing Counter-Clockwise (CCW).
        // To match map azimuth (Clockwise), we do 360 - alpha.
        heading = 360 - e.alpha;
    } else if (e.alpha !== null) {
        // Fallback for relative orientation (non-absolute)
        // Usually CCW, so we invert.
        heading = 360 - e.alpha;
    }

    // Normalize
    heading = (heading + 360) % 360;

    // --- TILT LOGIC (Altitude) ---
    // Beta: 0 = Flat table. 90 = Upright. 
    // Horizon is roughly at 90 deg beta in portrait mode.
    const beta = e.beta || 90; 

    setOrientation({
        alpha: heading, // View Azimuth (Center of screen)
        beta: beta,     // View Tilt
        gamma: e.gamma || 0
    });
  };

  useEffect(() => {
    return () => {
        window.removeEventListener('deviceorientation', handleOrientation);
        if ('ondeviceorientationabsolute' in (window as any)) {
             (window as any).removeEventListener('deviceorientationabsolute', handleOrientation as any);
        }
    };
  }, []);

  // 3. Render Loop
  useEffect(() => {
    if (!canvasRef.current || !location || !orientation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const w = canvas.width;
    const h = canvas.height;
    
    // FOV estimate 
    const FOV_V = 60;
    const FOV_H = FOV_V * (w / h);
    const pxPerDegH = w / FOV_H;
    const pxPerDegV = h / FOV_V;

    // Current View Center
    const viewAz = orientation.alpha; 
    
    // Beta=90 is Horizon (Alt=0). Beta=180 is Zenith? 
    // Adjust based on typical holding:
    // Holding upright (90) -> Alt 0.
    // Tilted back (screen to sky, >90) -> Alt increases.
    const viewAlt = orientation.beta - 90; 
    
    // Clear
    ctx.clearRect(0, 0, w, h);

    // Style
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    // 1. Draw Horizon Line
    const horizonY = h/2 + (0 - viewAlt) * pxPerDegV; 
    if (horizonY > -100 && horizonY < h + 100) {
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(w, horizonY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
        
        // Compass Markers
        ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].forEach((dir, i) => {
            const dirAz = i * 45;
            let diffAz = dirAz - viewAz;
            
            // Shortest path angle
            if (diffAz < -180) diffAz += 360;
            if (diffAz > 180) diffAz -= 360;
            
            const x = w/2 + diffAz * pxPerDegH;
            
            // Only draw if within screen X bounds (plus margin)
            if (x > -50 && x < w + 50) {
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.font = '12px "Cinzel"';
                ctx.fillText(dir, x - (dir.length*4), horizonY + 20);
                
                // Tick
                ctx.beginPath();
                ctx.moveTo(x, horizonY);
                ctx.lineTo(x, horizonY + 8);
                ctx.stroke();
            }
        });
    }

    // 2. Stars
    const lst = getLST(location.lon);
    
    const visibleStars: {x: number, y: number, star: StarData}[] = [];
    const starPosMap = new Map<string, {x: number, y: number}>();
    
    STARS.forEach(star => {
        const { az, alt } = getHorizontalCoords(star.ra, star.dec, location.lat, lst);
        
        let diffAz = az - viewAz;
        if (diffAz < -180) diffAz += 360;
        if (diffAz > 180) diffAz -= 360;
        
        const diffAlt = alt - viewAlt;

        const x = w/2 + diffAz * pxPerDegH;
        const y = h/2 - diffAlt * pxPerDegV;

        starPosMap.set(star.name, {x, y});

        if (x > -100 && x < w + 100 && y > -100 && y < h + 100) {
            visibleStars.push({x, y, star});
        }
    });

    // 3. Constellations
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    
    CONSTELLATION_LINKS.forEach(([n1, n2]) => {
        const p1 = starPosMap.get(n1);
        const p2 = starPosMap.get(n2);
        if (p1 && p2) {
            const onScreen = (p: {x:number, y:number}) => p.x > -50 && p.x < w+50 && p.y > -50 && p.y < h+50;
            if (onScreen(p1) || onScreen(p2)) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
        }
    });
    ctx.stroke();

    // 4. Draw Stars
    visibleStars.forEach(s => {
        if (s.x > -20 && s.x < w + 20 && s.y > -20 && s.y < h + 20) {
            const alpha = Math.max(0.3, 1 - (s.star.mag + 1.5) / 5);
            const radius = Math.max(1, 2.5 - s.star.mag * 0.5);
            
            const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius * 3);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            if (s.star.mag < 1.5) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.font = '9px "Inter"';
                ctx.fillText(s.star.name, s.x + 6, s.y + 2);
            }
        }
    });

  }, [location, orientation]);

  // --- WAITING STATES ---

  if (!permissionGranted) {
      return (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black animate-in zoom-in-95 duration-500">
              <Compass size={48} className="text-white/80 mx-auto mb-6 animate-float" strokeWidth={1} />
              <h3 className="text-white font-serif-display tracking-widest text-lg mb-2">Align with the Stars</h3>
              <p className="text-white/50 text-xs max-w-[250px] text-center mx-auto mb-8 leading-relaxed">
                  We need to know which way you are looking to draw the constellations.
              </p>
              <button 
                onClick={requestAccess}
                className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-full text-xs font-bold tracking-[0.2em] uppercase hover:bg-white/20 transition"
              >
                  Enable Compass
              </button>
          </div>
      );
  }

  if (locationError) {
      return (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black text-center p-6">
              <MapPin size={32} className="text-red-400 mb-4 opacity-80" />
              <p className="text-white/80 font-serif-display tracking-widest uppercase mb-2">Location Required</p>
              <p className="text-white/40 text-xs">{locationError}</p>
          </div>
      );
  }

  // Waiting for GPS
  if (!location) {
      return (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
              <div className="relative">
                  <div className="w-16 h-16 border border-white/20 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-16 h-16 border border-white/40 rounded-full flex items-center justify-center">
                     <MapPin size={16} className="text-white/80" />
                  </div>
              </div>
              <p className="mt-8 text-white/50 text-[10px] font-mono tracking-widest uppercase animate-pulse">
                  Acquiring Position...
              </p>
          </div>
      );
  }

  // Waiting for Compass (Orientation)
  if (!orientation) {
      return (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
              <Sparkles size={24} className="text-blue-300 animate-spin mb-4 opacity-50" />
              <p className="text-white/50 text-[10px] font-mono tracking-widest uppercase animate-pulse">
                  Calibrating Sensors...
              </p>
          </div>
      );
  }

  return (
    <>
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 z-20 pointer-events-none"
        />
        {/* Helper Badge to know it's working */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 opacity-30 pointer-events-none">
             <div className="w-[1px] h-4 bg-white mx-auto mb-1"></div>
             <span className="text-[9px] text-white font-mono">{Math.round(orientation.alpha)}°</span>
        </div>
    </>
  );
};

export default StarOverlay;
