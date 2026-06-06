import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setGoProModalOpen } from "../../features/main/store/chat.slice";
import { setUserTier } from "../../features/auth/slice/auth.slice";
import { API } from "../../api/axios.api";
import { X, Sparkles, CreditCard, Calendar, Lock, CheckCircle2, AlertCircle, Check } from "lucide-react";

// Stark Canvas Confetti Animation Engine (Gold, Silver, White, Amber)
const runConfetti = (canvas) => {
  const ctx = canvas.getContext("2d");
  const particles = [];
  const colors = ["#ffffff", "#f59e0b", "#fbbf24", "#e5e5e5", "#737373", "#fef08a"];

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2 - 50,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 16 - 6,
      size: Math.random() * 7 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1
    });
  }

  let animationFrameId;

  const update = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;
      
      if (p.y > canvas.height - 10) {
        p.opacity -= 0.02;
      }

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (active) {
      animationFrameId = requestAnimationFrame(update);
    }
  };

  update();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
};

const GoProModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.chat.goProModalOpen);
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState("pricing"); // pricing | payment | processing | success
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState(null);
  const [processMsg, setProcessMsg] = useState("");
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("pricing");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === "success" && canvasRef.current) {
      const cleanup = runConfetti(canvasRef.current);
      return cleanup;
    }
  }, [step]);

  if (!isOpen) return null;

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join("-") || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length >= 2) {
      setExpiry(val.substring(0, 2) + "/" + val.substring(2));
    } else {
      setExpiry(val);
    }
  };

  const handleCvvChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 3) val = val.substring(0, 3);
    setCvv(val);
  };

  const startPaymentSimulation = () => {
    if (cardNumber.replace(/-/g, "").length !== 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (expiry.length !== 5) {
      setError("Please enter a valid expiration date (MM/YY).");
      return;
    }
    if (cvv.length !== 3) {
      setError("Please enter a valid 3-digit CVV code.");
      return;
    }

    setError(null);
    setStep("processing");
    
    const messages = [
      "Connecting to simulated secure payment vault...",
      "Authorizing dummy transaction amount ($20.00/mo)...",
      "Syncing licenses and unlocking advanced reasoning models..."
    ];

    let msgIdx = 0;
    setProcessMsg(messages[0]);
    
    const interval = setInterval(() => {
      msgIdx++;
      if (msgIdx < messages.length) {
        setProcessMsg(messages[msgIdx]);
      } else {
        clearInterval(interval);
        completeUpgrade();
      }
    }, 800);
  };

  const completeUpgrade = async () => {
    try {
      const response = await API.post("/auth/subscribe");
      if (response.data.success) {
        dispatch(setUserTier("pro"));
        setStep("success");
      } else {
        setError(response.data.message || "Failed to upgrade subscription. Please try again.");
        setStep("payment");
      }
    } catch (err) {
      console.error("Subscription failed:", err);
      setError(err.response?.data?.message || "Payment simulation failed. Please try again.");
      setStep("payment");
    }
  };

  const handleClose = () => {
    dispatch(setGoProModalOpen(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-8 flex flex-col gap-6 text-[#e5e5e5] max-h-[90vh]">
        
        {/* Confetti Canvas */}
        {step === "success" && (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
        )}

        {/* Close button */}
        {step !== "processing" && (
          <button 
            onClick={handleClose}
            className="absolute top-6 right-6 p-1.5 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        )}

        {step === "pricing" && (
          <>
            <div className="flex flex-col items-center gap-2 mt-4 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-md">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white tracking-tight mt-2 uppercase font-mono">
                Pro AI Copilot
              </h2>
              <p className="text-xs text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Supercharge your search with deep answers, priority computing, and visual product comparison models.
              </p>
            </div>

            <div className="bg-[#1c1c1c] border border-[#262626] rounded-xl p-5 flex flex-col gap-3.5">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                Features list
              </h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center gap-3 text-neutral-300">
                  <Check size={14} className="text-white shrink-0" />
                  <span><strong>Priority Responses</strong>: 3x faster response speeds</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <Check size={14} className="text-white shrink-0" />
                  <span><strong>Deep Research Mode</strong>: Multi-query web analysis & charts</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <Check size={14} className="text-white shrink-0" />
                  <span><strong>Advanced Reasoning</strong>: Expert engineering & code synthesis</span>
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <Check size={14} className="text-white shrink-0" />
                  <span><strong>Image-rich Answers</strong>: Product specifications and image carousels</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-baseline justify-between border-t border-[#262626] pt-4">
                <span className="text-xs text-neutral-400 font-mono">Monthly Subscription</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white font-mono">$20.00</span>
                  <span className="text-[10px] text-neutral-500 font-mono">/ mo</span>
                </div>
              </div>

              <button
                onClick={() => setStep("payment")}
                className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-all shadow-md cursor-pointer font-mono text-sm uppercase tracking-wider"
              >
                Upgrade Now
              </button>
              <p className="text-[9px] text-center text-neutral-500 uppercase tracking-wide">
                Simulated Sandbox Checkout Flow. No Charges will apply.
              </p>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <div className="flex flex-col gap-1 mt-4">
              <h2 className="text-xl text-white font-semibold font-mono uppercase tracking-wider">
                Simulated Checkout
              </h2>
              <p className="text-xs text-neutral-400">
                Enter details to simulate credit card validation & confetti unlock.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="4111 - 2222 - 3333 - 4444"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-[#1c1c1c] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 outline-hidden transition-colors font-mono"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 text-neutral-500" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    Expiry Date
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      className="w-full bg-[#1c1c1c] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 outline-hidden transition-colors font-mono"
                    />
                    <Calendar className="absolute left-3.5 top-3.5 text-neutral-500" size={16} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    CVV
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                      className="w-full bg-[#1c1c1c] border border-[#262626] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 outline-hidden transition-colors font-mono"
                    />
                    <Lock className="absolute left-3.5 top-3.5 text-neutral-500" size={16} />
                  </div>
                </div>
              </div>

              <button
                onClick={startPaymentSimulation}
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-all shadow-lg mt-4 cursor-pointer font-mono text-xs uppercase tracking-wider"
              >
                Complete Subscription ($20.00)
              </button>

              <button
                onClick={() => setStep("pricing")}
                className="text-xs text-center text-neutral-500 hover:text-white transition-colors py-1 cursor-pointer font-mono"
              >
                Go back to pricing details
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-white">
                Processing payment...
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs transition-all duration-300">
                {processMsg}
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 gap-6 text-center z-20">
            <div className="p-3 bg-white/5 rounded-full border border-white/10 text-white shadow-lg animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold font-mono tracking-wider text-white uppercase">
                Upgrade Successful!
              </h2>
              <p className="text-xs text-neutral-400 max-w-sm mt-1 leading-relaxed">
                Congratulations! You are now subscribed to <strong>Pro AI Copilot</strong>. Advanced search models are now unlocked.
              </p>
            </div>

            <div className="bg-[#1c1c1c] border border-[#262626] rounded-xl p-4 w-full flex flex-col gap-2.5 text-left text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subscriber Account</span>
                <span className="text-white font-medium">{user?.email || "User"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Plan Status</span>
                <span className="text-amber-400 font-bold uppercase tracking-wider">Active Pro Mode</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-bold rounded-xl transition-all shadow-md cursor-pointer font-mono text-xs uppercase tracking-wider"
            >
              Start Pro Searching
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default GoProModal;
