import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X } from 'lucide-react';

class DreamPixel {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  angle: number;
  angleSpeed: number;
  speed: number;
  
  flashState: 'idle' | 'flashing' | 'fading';
  flashTimer: number;
  flashDuration: number;
  fadeDuration: number;
  idleDuration: number;
  opacity: number;
  
  color: string;
  baseSize: number;
  focalPlane: number = 0.75;
  
  // Audio-reactive properties
  audioScale: number = 1;
  audioFlash: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.z = Math.random() * 0.9 + 0.1; // 0.1 to 1.0
    
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = (Math.random() - 0.5) * 0.02;
    this.speed = Math.random() * 0.3 + 0.1;
    
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    
    this.flashState = Math.random() > 0.5 ? 'idle' : 'fading';
    this.flashTimer = Math.random() * 100;
    this.flashDuration = Math.random() * 30 + 10;
    this.fadeDuration = Math.random() * 100 + 50;
    this.idleDuration = Math.random() * 300 + 100;
    this.opacity = Math.random();
    
    // 70% yellowish (255, 215, 0), 30% warm orange (255, 140, 0)
    this.color = Math.random() > 0.3 ? '255, 215, 0' : '255, 140, 0';
    
    this.baseSize = Math.random() * 2 + 1.5;
  }

  update(targetX: number, targetY: number, isDreaming: boolean, width: number, height: number, audioData?: { avgFreq: number, bassEnergy: number, isBassDrop: boolean }) {
    if (!isDreaming) return;

    // Audio Influence
    const freqFactor = audioData ? audioData.avgFreq / 255 : 0;
    const bassFactor = audioData ? audioData.bassEnergy / 255 : 0;
    
    this.audioScale = 1 + (bassFactor * 0.5);
    if (audioData?.isBassDrop) {
      this.audioScale *= 2.5;
      this.audioFlash = 1;
    } else {
      this.audioFlash *= 0.9; // Fade out flash
    }

    // Organic Brownian motion - speeded up by music
    const speedMult = 1 + freqFactor * 2;
    this.angle += this.angleSpeed * speedMult;
    this.angleSpeed += (Math.random() - 0.5) * 0.01;
    this.angleSpeed = Math.max(-0.05, Math.min(0.05, this.angleSpeed));
    
    // Base velocity
    let targetVx = Math.cos(this.angle) * this.speed * speedMult;
    let targetVy = Math.sin(this.angle) * this.speed * speedMult;

    // Repel if cursor is extremely close (e.g., < 100px)
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distanceSq = dx * dx + dy * dy;
    
    if (distanceSq < 10000) {
      const distance = Math.sqrt(distanceSq);
      const force = (100 - distance) / 100;
      targetVx -= (dx / distance) * force * 2;
      targetVy -= (dy / distance) * force * 2;
    }

    // Smooth velocity changes
    this.vx += (targetVx - this.vx) * 0.1;
    this.vy += (targetVy - this.vy) * 0.1;

    // Parallax movement based on z
    this.x += this.vx * this.z;
    this.y += this.vy * this.z;

    // Wrap around screen edges
    if (this.x < -50) this.x = width + 50;
    if (this.x > width + 50) this.x = -50;
    if (this.y < -50) this.y = height + 50;
    if (this.y > height + 50) this.y = -50;
    
    // Flash Rhythm - influenced by music
    const pulseSpeed = 1 + freqFactor * 3;
    this.flashTimer += pulseSpeed;

    if (this.flashState === 'idle') {
      this.opacity = 0;
      if (this.flashTimer > this.idleDuration) {
        this.flashState = 'flashing';
        this.flashTimer = 0;
        this.flashDuration = Math.random() * 30 + 10;
      }
    } else if (this.flashState === 'flashing') {
      this.opacity = Math.min(1, this.flashTimer / this.flashDuration);
      if (this.flashTimer > this.flashDuration) {
        this.flashState = 'fading';
        this.flashTimer = 0;
        this.fadeDuration = Math.random() * 100 + 50;
      }
    } else if (this.flashState === 'fading') {
      this.opacity = Math.max(0, 1 - (this.flashTimer / this.fadeDuration));
      if (this.flashTimer > this.fadeDuration) {
        this.flashState = 'idle';
        this.flashTimer = 0;
        this.idleDuration = Math.random() * 300 + 100;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, isDreaming: boolean) {
    if (!isDreaming || (this.opacity <= 0.01 && this.audioFlash <= 0.01)) return;
    
    ctx.save();
    
    // Cinematic Depth of Field (DoF)
    const dofDistance = Math.abs(this.z - this.focalPlane);
    
    // Size increases massively as it gets further from focal plane (extreme bokeh effect)
    const bokehRadius = (this.baseSize + (dofDistance * 100)) * this.audioScale;
    
    const finalOpacity = Math.max(this.opacity, this.audioFlash);
    ctx.globalAlpha = finalOpacity;
    
    // Draw using ctx.createRadialGradient
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, bokehRadius);
    
    if (dofDistance < 0.05 || this.audioFlash > 0.5) {
      // Tack-sharp white core for in-focus fireflies or during bass drop
      const coreColor = this.audioFlash > 0.5 ? '255, 255, 255' : this.color;
      gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
      gradient.addColorStop(0.1, `rgba(255, 255, 255, 0.8)`);
      gradient.addColorStop(0.3, `rgba(${coreColor}, 0.8)`);
      gradient.addColorStop(1, `rgba(${coreColor}, 0)`);
    } else {
      // Soft, out-of-focus bokeh circles
      const alphaMultiplier = Math.max(0.02, 1 - (dofDistance * 2.0));
      gradient.addColorStop(0, `rgba(${this.color}, ${0.5 * alphaMultiplier})`);
      gradient.addColorStop(0.4, `rgba(${this.color}, ${0.2 * alphaMultiplier})`);
      gradient.addColorStop(1, `rgba(${this.color}, 0)`);
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, bokehRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export default function App() {
  const [isDreaming, setIsDreaming] = useState(false);
  const isDreamingRef = useRef(isDreaming);
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [journalText, setJournalText] = useState('');

  useEffect(() => {
    isDreamingRef.current = isDreaming;
    if (!isDreaming) {
      setIsJournalOpen(false);
    }
  }, [isDreaming]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [bassIntensity, setBassIntensity] = useState(0);

  useEffect(() => {
    // Attempt to use the new GitHub file with the updated name
    const primaryUrl = 'https://raw.githubusercontent.com/asoulcalleddrew/Lucid-Dreamer/main/Chill%20Lofi%20Beats%20%5Bchill%20lo-fi%20hip%20hop%20beats%5D.mp3';
    const fallbackUrl = 'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3';
    
    const audio = new Audio(primaryUrl);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;

    // Preload audio
    audio.load();

    audio.onerror = () => {
      console.warn("Primary audio failed to load, switching to fallback...");
      if (audio.src !== fallbackUrl) {
        const wasDreaming = isDreamingRef.current;
        audio.src = fallbackUrl;
        audio.load();
        if (wasDreaming) {
          audio.play().then(() => {
            // Fade in manually if we were already dreaming
            let fadeInterval = setInterval(() => {
              if (audio.volume < 0.4) {
                audio.volume = Math.min(0.4, audio.volume + 0.02);
              } else {
                clearInterval(fadeInterval);
              }
            }, 100);
          }).catch(console.error);
        }
      }
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let fadeInterval: ReturnType<typeof setInterval>;
    const fadeStep = 0.02;
    const fadeTime = 100; // ms per step

    if (isDreaming) {
      // Initialize Audio Context on first interaction
      if (!audioContextRef.current) {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        
        const source = ctx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      console.log("Attempting to play audio...");
      audio.play().then(() => {
        console.log("Audio playing successfully");
      }).catch(e => {
        console.error("Audio play failed:", e);
      });
      
      fadeInterval = setInterval(() => {
        if (audio.volume < 0.4) {
          audio.volume = Math.min(0.4, audio.volume + fadeStep);
        } else {
          clearInterval(fadeInterval);
        }
      }, fadeTime);
    } else {
      console.log("Fading out audio...");
      fadeInterval = setInterval(() => {
        if (audio.volume > 0.01) {
          audio.volume = Math.max(0, audio.volume - fadeStep);
        } else {
          audio.volume = 0;
          audio.pause();
          console.log("Audio paused");
          clearInterval(fadeInterval);
        }
      }, fadeTime);
    }

    return () => clearInterval(fadeInterval);
  }, [isDreaming]);

  const targetRef = useRef({ x: -1000, y: -1000 });
  const smoothedTargetRef = useRef({ x: -1000, y: -1000 });
  const pixelsRef = useRef<DreamPixel[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize pixels on resize
      const newPixels = [];
      // Cap at 1500 fireflies for a denser swarm
      const numPixels = Math.min(1500, Math.floor((canvas.width * canvas.height) / 1500));
      for (let i = 0; i < numPixels; i++) {
        newPixels.push(
          new DreamPixel(
            Math.random() * canvas.width,
            Math.random() * canvas.height
          )
        );
      }
      pixelsRef.current = newPixels;
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(initCanvas, 200);
    };

    initCanvas();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (isDreaming) {
        let avgFreq = 0;
        let bassEnergy = 0;
        let isBassDrop = false;

        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average frequency
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
          }
          avgFreq = sum / dataArrayRef.current.length;

          // Calculate bass energy (first 10 bins)
          let bassSum = 0;
          for (let i = 0; i < 10; i++) {
            bassSum += dataArrayRef.current[i];
          }
          bassEnergy = bassSum / 10;
          
          // Detect bass drop (threshold)
          if (bassEnergy > 200) {
            isBassDrop = true;
          }
          
          setBassIntensity(bassEnergy / 255);
        }

        // Smoothly interpolate the target position for fluid motion
        smoothedTargetRef.current.x += (targetRef.current.x - smoothedTargetRef.current.x) * 0.15;
        smoothedTargetRef.current.y += (targetRef.current.y - smoothedTargetRef.current.y) * 0.15;

        pixelsRef.current.forEach(pixel => {
          pixel.update(
            smoothedTargetRef.current.x, 
            smoothedTargetRef.current.y, 
            isDreaming, 
            canvas.width, 
            canvas.height,
            { avgFreq, bassEnergy, isBassDrop }
          );
          pixel.draw(ctx, isDreaming);
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isDreaming]);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDreaming) return;
    // @ts-ignore
    targetRef.current = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDreaming) return;
    targetRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-amber-50 font-sans shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 animate-breathe"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1920&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: isDreaming 
            ? `brightness(${0.4 + (bassIntensity * 0.4)}) blur(${2 + (bassIntensity * 10)}px)` 
            : 'brightness(1) blur(0px)',
          transition: isDreaming ? 'filter 0.1s ease-out' : 'filter 2s ease-in-out',
        }}
      >
        {/* Dark overlay for moodiness */}
        <div className="absolute inset-0 bg-zinc-950" style={{ opacity: isDreaming ? 0.4 : 0.2, transition: 'opacity 2s ease-in-out' }}></div>
      </div>

      {/* Dream Pixels Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ opacity: isDreaming ? 1 : 0, transition: 'opacity 2s ease-in-out' }}
      />

      {/* Dream Journal Modal */}
      <AnimatePresence>
        {isJournalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl rounded-2xl bg-zinc-950/80 border border-amber-500/30 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold tracking-[0.3em] text-amber-500 uppercase">
                  Dream Log
                </h2>
                <button 
                  onClick={() => setIsJournalOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-amber-500/50 hover:text-amber-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="What are you seeing? Describe the dream..."
                className="w-full h-64 bg-transparent text-amber-50 placeholder-amber-500/30 border-none outline-none resize-none text-lg leading-relaxed font-sans"
                autoFocus
              />
              
              <div className="mt-4 flex justify-end">
                <p className="text-xs text-amber-500/30 uppercase tracking-widest">
                  Recording subconscious thoughts...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex h-full min-h-screen flex-col pointer-events-none">
        {/* Top Section */}
        <header className="p-6 sm:p-12">
          <h1 className={`text-2xl sm:text-3xl font-semibold tracking-widest uppercase transition-all duration-1000 ${isDreaming || isHoveringBtn ? 'text-amber-100 drop-shadow-[0_0_25px_rgba(245,158,11,1)]' : 'text-amber-50 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`}>
            Lucid Dreamer
          </h1>
        </header>
        
        <div className="flex-grow flex flex-col justify-end p-6 sm:p-12">
          {/* Bottom Section */}
          <footer className="flex flex-col items-end justify-end gap-6 pointer-events-auto w-full">
            <div className="flex items-center gap-4">
              {/* Journal Button */}
              {isDreaming && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(245,158,11,0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsJournalOpen(!isJournalOpen)}
                  className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-transparent px-5 py-2.5 border border-amber-400/40 transition-all duration-300 hover:border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <BookOpen className="mr-2 text-amber-400" size={18} />
                  <span className="relative font-medium tracking-widest text-amber-50 uppercase text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                    Dream Log
                  </span>
                </motion.button>
              )}

              {/* Dream Toggle Button */}
              <motion.button
                onClick={() => setIsDreaming(!isDreaming)}
                onMouseEnter={() => setIsHoveringBtn(true)}
                onMouseLeave={() => setIsHoveringBtn(false)}
                whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(245,158,11,0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center justify-center overflow-hidden rounded-xl bg-transparent px-5 py-2.5 border border-amber-400/40 transition-all duration-300 hover:border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                <span className="relative font-medium tracking-widest text-amber-50 uppercase text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                  {isDreaming ? 'Leave Dream...' : 'Enter Dream...'}
                </span>
              </motion.button>
            </div>
          </footer>
        </div>
    </div>
  </div>
);
}
