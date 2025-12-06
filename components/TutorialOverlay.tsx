
import React, { useState } from 'react';
import { ChevronRight, Camera, Smartphone, Palette, BookOpen, X, Hand } from 'lucide-react';
import { AppLanguage } from '../types';
import { UI_TEXT } from '../constants';

interface TutorialOverlayProps {
    onClose: () => void;
    lang: AppLanguage;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose, lang }) => {
    const t = UI_TEXT[lang].tutorial;
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: <Camera size={48} className="text-white/90" strokeWidth={1} />,
            title: t.step1Title,
            desc: t.step1Desc,
            visual: (
                <div className="relative w-32 h-40 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-orange-500/20"></div>
                    <Camera size={24} className="text-white/50" />
                </div>
            )
        },
        {
            icon: <Smartphone size={48} className="text-white/90" strokeWidth={1} />,
            title: t.step2Title,
            desc: t.step2Desc,
            visual: (
                <div className="relative w-32 h-40 bg-[#fdfbf7] rounded-lg p-2 flex flex-col items-center justify-start shadow-xl">
                    <div className="w-full aspect-square bg-blue-200 relative overflow-hidden mb-2">
                        {/* Hand Gesture Animation for Photo Swipe */}
                        <div className="absolute inset-0 flex items-center justify-center animate-[swipeX_2s_infinite]">
                            <Hand size={24} className="text-black/50 drop-shadow-lg" />
                        </div>
                    </div>
                    <div className="w-full h-1 bg-black/10 rounded"></div>
                    <div className="w-2/3 h-1 bg-black/10 rounded mt-1"></div>
                    <p className="absolute bottom-2 text-[8px] text-black/40 font-mono">PHOTO AREA</p>
                </div>
            )
        },
        {
            icon: <Palette size={48} className="text-white/90" strokeWidth={1} />,
            title: t.step3Title,
            desc: t.step3Desc,
            visual: (
                <div className="relative w-32 h-40 bg-[#fdfbf7] rounded-lg p-2 flex flex-col items-center justify-start shadow-xl">
                     {/* Hand Gesture for Frame Swipe */}
                     <div className="absolute bottom-4 right-4 z-20 animate-[swipeLeft_2s_infinite]">
                        <Hand size={24} className="text-black/80 drop-shadow-xl" />
                     </div>
                     <div className="w-full aspect-square bg-gray-100 opacity-50 mb-2"></div>
                     <div className="w-full h-1 bg-black/5 rounded"></div>
                     <p className="absolute bottom-2 left-2 text-[8px] text-black/40 font-mono">FRAME AREA</p>
                </div>
            )
        },
        {
            icon: <BookOpen size={48} className="text-white/90" strokeWidth={1} />,
            title: t.step4Title,
            desc: t.step4Desc,
            visual: (
                <div className="grid grid-cols-2 gap-2 w-32">
                    <div className="aspect-[3/4] bg-white/10 rounded border border-white/20"></div>
                    <div className="aspect-[3/4] bg-white/10 rounded border border-white/20"></div>
                    <div className="aspect-[3/4] bg-white/10 rounded border border-white/20"></div>
                    <div className="aspect-[3/4] bg-white/20 rounded border border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <style>{`
                @keyframes swipeX {
                    0% { transform: translateX(-10px); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(10px); opacity: 0; }
                }
                @keyframes swipeLeft {
                    0% { transform: translateX(15px); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(-15px); opacity: 0; }
                }
            `}</style>
            
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>

            {/* Content Container */}
            <div className="w-full max-w-sm flex flex-col items-center text-center">
                
                {/* Visual Area */}
                <div className="h-64 w-full flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
                    <div key={step} className="animate-in zoom-in-95 duration-500 flex flex-col items-center gap-6">
                        {steps[step].visual}
                        <div className="text-white/80">{steps[step].icon}</div>
                    </div>
                </div>

                {/* Text Area */}
                <div key={step + 'text'} className="min-h-[140px] animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                    <h2 className="text-2xl font-serif-display text-white mb-4 tracking-widest uppercase">
                        {steps[step].title}
                    </h2>
                    <p className="text-sm font-serif-text text-white/60 leading-relaxed max-w-[280px]">
                        {steps[step].desc}
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 mb-10">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                        ></div>
                    ))}
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleNext}
                    className="group relative px-8 py-3 bg-white text-black rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <span>{step === steps.length - 1 ? t.done : 'Next'}</span>
                    {step < steps.length - 1 && <ChevronRight size={14} />}
                </button>

            </div>
        </div>
    );
};

export default TutorialOverlay;
