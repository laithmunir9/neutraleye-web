import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react';

// ─── Right-panel feed: what every result contains ─────────────────────────
// Intentionally different from the homepage trace (which shows HOW it processes).
// This panel shows WHAT comes back — the anatomy of a result.

const RESULT_STEPS = [
  { title: 'Bias direction',   detail: 'Moderate lean toward Senate leadership',       badge: 'Direction', time: '14:22:14' },
  { title: 'Confidence score', detail: '0.74 — signals appeared consistently',         badge: '0.74',      time: '14:22:14' },
  { title: 'Tone example',     detail: '"decisive step toward long-overdue…"',         badge: 'Language',  time: '14:22:14' },
  { title: 'Framing example',  detail: 'Selective emphasis on committee position',     badge: 'Framing',   time: '14:22:14' },
  { title: 'Source gap',       detail: 'Opposition given one sentence of four',        badge: 'Sourcing',  time: '14:22:14' },
  { title: 'Omission noted',   detail: 'Fiscal counter-arguments absent',              badge: 'Omission',  time: '14:22:14' },
  { title: 'Reading context',  detail: '3 outlets covered this story differently',     badge: 'Sources',   time: '14:22:14' },
] as const;

const TOTAL = RESULT_STEPS.length;
const FIRST_ROW_DELAY = 300;  // before row 1 flows in
const ROW_INTERVAL    = 1700; // gap between each subsequent row
const SIGNAL_DELAY    = 500;  // pause after the last row before signal bars appear
const HOLD_DURATION   = 5000; // how long the completed state stays on screen
const RESET_DURATION  = 500;  // fade-out time before the cycle restarts

type Phase = 'filling' | 'complete' | 'resetting';

function ResultFeed() {
  const [visible, setVisible] = useState(0);
  const [phase, setPhase] = useState<Phase>('filling');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let delay: number;
    let action: () => void;

    if (phase === 'filling') {
      if (visible < TOTAL) {
        delay  = visible === 0 ? FIRST_ROW_DELAY : ROW_INTERVAL;
        action = () => setVisible(v => v + 1);
      } else {
        delay  = SIGNAL_DELAY;
        action = () => { setPhase('complete'); setCycle(c => c + 1); };
      }
    } else if (phase === 'complete') {
      delay  = HOLD_DURATION;
      action = () => setPhase('resetting');
    } else {
      delay  = RESET_DURATION;
      action = () => { setVisible(0); setPhase('filling'); };
    }

    const t = setTimeout(action, delay);
    return () => clearTimeout(t);
  }, [visible, phase]);

  const resetting = phase === 'resetting';
  const complete  = phase === 'complete';

  return (
    <>
    <div className="flex flex-col gap-2 w-full">
      {RESULT_STEPS.map((step, i) => {
        const shown    = !resetting && i < visible;
        const isActive = shown && phase === 'filling' && i === visible - 1;
        const isDone   = shown && !isActive;

        return (
          <div
            key={step.title}
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? 'translateY(0)' : 'translateY(-8px)',
              transition: 'opacity 400ms ease, transform 400ms ease',
            }}
            className={[
              'flex items-center gap-3 px-4 py-3 rounded-xl border',
              isActive
                ? 'border-[rgba(196,151,62,0.35)] bg-[rgba(196,151,62,0.07)]'
                : isDone
                ? 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)]'
                : 'border-transparent',
            ].join(' ')}
          >
            <div className="flex-shrink-0 w-2 h-2">
              {isActive ? (
                <span className="block w-2 h-2 rounded-full bg-[#c4973e] animate-pulse" />
              ) : isDone ? (
                <span className="block w-2 h-2 rounded-full bg-[rgba(139,103,65,0.55)]" />
              ) : (
                <span className="block w-2 h-2 rounded-full border border-[rgba(255,255,255,0.18)]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isActive ? 'text-[rgba(245,232,200,0.92)]' : 'text-[rgba(255,252,247,0.6)]'}`}>
                  {step.title}
                </span>
                <span className={[
                  'text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-full',
                  step.badge === 'Direction' ? 'bg-[rgba(139,103,65,0.3)] text-[#c4973e]' :
                  step.badge === 'Sources'   ? 'bg-[rgba(139,103,65,0.18)] text-[rgba(196,151,62,0.8)]' :
                                               'bg-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.38)]',
                ].join(' ')}>
                  {step.badge}
                </span>
              </div>
              <p className={`text-xs mt-px truncate ${isActive ? 'text-[rgba(255,255,255,0.45)]' : 'text-[rgba(255,255,255,0.25)]'}`}>
                {step.detail}
              </p>
            </div>

            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.2)] flex-shrink-0 tabular-nums">
              {step.time}
            </span>
          </div>
        );
      })}
    </div>
    <SignalBars active={complete} cycleKey={cycle} />
    </>
  );
}

// ─── Signal mix bars: closes out the panel below the live feed ────────────

const SIGNAL_LEVELS = [
  { label: 'Tone',        value: 0.55 },
  { label: 'Framing',     value: 0.85 },
  { label: 'Attribution', value: 0.4 },
  { label: 'Sources',     value: 0.7 },
  { label: 'Omission',    value: 0.95 },
] as const;

function SignalBars({ active, cycleKey }: { active: boolean; cycleKey: number }) {
  return (
    <div style={{ opacity: active ? 1 : 0, transition: 'opacity 500ms ease' }}>
      <p
        className="text-[10px] font-bold uppercase mb-3"
        style={{ color: 'rgba(255,252,247,0.2)', letterSpacing: '0.18em', fontFamily: 'var(--font-sans)' }}
      >
        Signal mix for this result
      </p>
      <div className="flex items-end gap-3" style={{ height: '3.25rem' }} key={cycleKey}>
        {SIGNAL_LEVELS.map((s, i) => (
          <div key={s.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <div
              className="w-full h-full rounded-sm overflow-hidden flex items-end"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${s.value * 100}%`,
                  background: 'linear-gradient(180deg, #c4973e 0%, rgba(196,151,62,0.35) 100%)',
                  borderRadius: '2px 2px 0 0',
                  animation: `barGrow 900ms cubic-bezier(0.22,1,0.36,1) ${300 + i * 90}ms both`,
                }}
              />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,252,247,0.28)' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared right panel ────────────────────────────────────────────────────

function AnalysisPanel({ heading, sub }: { heading: React.ReactNode; sub: string }) {
  return (
    <section
      className="hidden md:flex flex-1 flex-col relative overflow-hidden"
      style={{ background: '#13110e' }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '3.5rem 3.5rem',
        }}
      />
      {/* Warm glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65% 50% at 55% 50%, rgba(139,103,65,0.11) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col h-full p-10">
        {/* Logo — inverted for dark background, matches SiteHeader dark mode treatment */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/neutraleye-logo-48.png"
            alt=""
            width={22}
            height={22}
            style={{ filter: 'invert(1) brightness(1.16)', opacity: 0.55 }}
          />
          <span
            style={{ color: 'rgba(255,252,247,0.5)', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 400, lineHeight: 1, letterSpacing: 0 }}
          >
            NeutralEye
          </span>
        </div>

        {/* Centre */}
        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="mt-3">
            <p
              className="text-[10px] font-bold uppercase mb-3"
              style={{ color: 'rgba(196,151,62,0.5)', letterSpacing: '0.18em', fontFamily: 'var(--font-sans)' }}
            >
              {sub}
            </p>
            <h2
              className="text-2xl font-normal leading-snug"
              style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,252,247,0.85)' }}
            >
              {heading}
            </h2>
          </div>

          <ResultFeed />
        </div>
      </div>
    </section>
  );
}

// ─── Input wrapper ──────────────────────────────────────────────────────────

const InputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    className="rounded-lg border transition-colors focus-within:bg-white/80"
    style={{ borderColor: 'rgba(93,75,53,0.18)', background: 'rgba(255,252,247,0.6)' }}
  >
    {children}
  </div>
);

// ─── Google icon ────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.14-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.14-2.65-.389-3.917z" />
  </svg>
);

// ─── Shared left-panel shell ───────────────────────────────────────────────

function LeftPanel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="flex-1 flex flex-col overflow-y-auto"
      style={{ background: '#f7f4ef' }}
    >
      {/* Back button */}
      <div className="px-8 pt-7 md:px-14 md:pt-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-60"
          style={{ color: '#7b6a58' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      {/* Centred form */}
      <div className="flex-1 flex items-center justify-center px-8 py-8 md:px-14">
        <div className="w-full max-w-[22rem]">
          {/* Logotype */}
          <div className="animate-element animate-delay-100 flex items-center gap-2.5 mb-10">
            <Image src="/neutraleye-logo-48.png" alt="" width={24} height={24} />
            <span style={{ color: '#201b16', fontFamily: 'var(--font-display)', fontSize: '1.08rem', fontWeight: 400, lineHeight: 1, letterSpacing: 0 }}>
              NeutralEye
            </span>
          </div>

          {children}
        </div>
      </div>
    </section>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onSignIn?: () => void;
}

// ─── Sign-in page ───────────────────────────────────────────────────────────

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="h-[100dvh] w-[100dvw] flex flex-col md:flex-row overflow-hidden"
      style={{ fontFamily: 'var(--font-sans)', background: '#f7f4ef', color: '#201b16' }}
    >
      <LeftPanel>
        <div className="flex flex-col gap-6">
          {/* Headline */}
          <div className="animate-element animate-delay-100">
            <h1
              className="text-[2.6rem] leading-[1.05] font-normal mb-2"
              style={{ fontFamily: 'var(--font-display)', color: '#201b16' }}
            >
              {title ?? 'Read the news clearly.'}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#65584b' }}>
              {description ?? 'Sign in to save your analysis history and access your full results.'}
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={onSignIn}>
            <div className="animate-element animate-delay-200 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7b6a58' }}>Email</label>
              <InputWrapper>
                <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required
                  className="w-full bg-transparent text-sm px-4 py-3.5 rounded-lg focus:outline-none"
                  style={{ color: '#201b16' }} />
              </InputWrapper>
            </div>

            <div className="animate-element animate-delay-300 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7b6a58' }}>Password</label>
              <InputWrapper>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    autoComplete="current-password" required
                    className="w-full bg-transparent text-sm px-4 py-3.5 pr-11 rounded-lg focus:outline-none"
                    style={{ color: '#201b16' }} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-3.5 flex items-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword
                      ? <EyeOff className="w-4 h-4" style={{ color: '#7b6a58' }} />
                      : <Eye    className="w-4 h-4" style={{ color: '#7b6a58' }} />}
                  </button>
                </div>
              </InputWrapper>
            </div>

            <div className="animate-element animate-delay-400 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                <span style={{ color: '#65584b' }}>Keep me signed in</span>
              </label>
              <a href="#" onClick={e => { e.preventDefault(); onResetPassword?.(); }}
                className="font-semibold hover:underline" style={{ color: '#8b6741' }}>
                Forgot password?
              </a>
            </div>

            <button type="submit"
              className="animate-element animate-delay-500 w-full rounded-lg py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.99]"
              style={{ background: '#8b6741', color: '#f8f4ee' }}>
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="animate-element animate-delay-600 flex items-center gap-3">
            <span className="flex-1 border-t" style={{ borderColor: 'rgba(93,75,53,0.14)' }} />
            <span className="text-xs" style={{ color: '#7b6a58' }}>or</span>
            <span className="flex-1 border-t" style={{ borderColor: 'rgba(93,75,53,0.14)' }} />
          </div>

          {/* Google */}
          <button type="button" onClick={onGoogleSignIn}
            className="animate-element animate-delay-700 w-full flex items-center justify-center gap-3 rounded-lg py-3.5 text-sm font-medium border transition-colors hover:bg-white/50"
            style={{ borderColor: 'rgba(93,75,53,0.18)', color: '#201b16' }}>
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Sign-up link */}
          <p className="animate-element animate-delay-800 text-center text-xs" style={{ color: '#7b6a58' }}>
            New here?{' '}
            <a href="#" onClick={e => { e.preventDefault(); onCreateAccount?.(); }}
              className="font-semibold hover:underline" style={{ color: '#8b6741' }}>
              Create a free account
            </a>
          </p>
        </div>
      </LeftPanel>

      <AnalysisPanel
        sub="What every result contains"
        heading={<>Here&rsquo;s what<br />comes back.</>}
      />
    </div>
  );
};

// ─── Check-email page ──────────────────────────────────────────────────────

interface CheckEmailPageProps {
  email?: string;
  onBack?: () => void;
}

export const CheckEmailPage: React.FC<CheckEmailPageProps> = ({ email, onBack }) => {
  return (
    <div
      className="h-[100dvh] w-[100dvw] flex flex-col md:flex-row overflow-hidden"
      style={{ fontFamily: 'var(--font-sans)', background: '#f7f4ef', color: '#201b16' }}
    >
      <LeftPanel>
        <div className="flex flex-col gap-7">

          {/* Icon */}
          <div
            className="animate-element animate-delay-100 flex items-center justify-center w-14 h-14 rounded-2xl"
            style={{ background: 'rgba(139,103,65,0.1)', border: '1px solid rgba(139,103,65,0.18)' }}
          >
            <Mail className="w-6 h-6" style={{ color: '#8b6741' }} strokeWidth={1.5} />
          </div>

          {/* Headline + body */}
          <div className="animate-element animate-delay-200">
            <h1
              className="text-[2.6rem] leading-[1.05] font-normal mb-3"
              style={{ fontFamily: 'var(--font-display)', color: '#201b16' }}
            >
              Check your inbox.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#65584b' }}>
              A confirmation link is on its way to{' '}
              {email
                ? <strong style={{ color: '#201b16' }}>{email}</strong>
                : 'your email address'
              }. Click it to activate your account and start reading with clarity.
            </p>
          </div>

          {/* Spam note */}
          <p
            className="animate-element animate-delay-300 text-xs leading-relaxed px-3 py-2.5 rounded-lg"
            style={{ color: '#7b6a58', background: 'rgba(93,75,53,0.07)', border: '1px solid rgba(93,75,53,0.1)' }}
          >
            Didn&apos;t receive it? Check your spam folder, or wait a moment and try again.
          </p>

          {/* Back link */}
          <button
            type="button"
            onClick={onBack}
            className="animate-element animate-delay-400 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70 self-start"
            style={{ color: '#8b6741', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </button>

        </div>
      </LeftPanel>

      <AnalysisPanel
        sub="After you confirm"
        heading={<>Your first analysis<br />is ready to run.</>}
      />
    </div>
  );
};

// ─── Sign-up page ───────────────────────────────────────────────────────────

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title,
  description,
  onSignUp,
  onGoogleSignIn,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="h-[100dvh] w-[100dvw] flex flex-col md:flex-row overflow-hidden"
      style={{ fontFamily: 'var(--font-sans)', background: '#f7f4ef', color: '#201b16' }}
    >
      <LeftPanel>
        <div className="flex flex-col gap-6">
          {/* Headline */}
          <div className="animate-element animate-delay-100">
            <h1
              className="text-[2.6rem] leading-[1.05] font-normal mb-2"
              style={{ fontFamily: 'var(--font-display)', color: '#201b16' }}
            >
              {title ?? 'Start reading clearly.'}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#65584b' }}>
              {description ?? 'Create a free account to save your analysis history and access your results across devices.'}
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={onSignUp}>
            <div className="animate-element animate-delay-200 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7b6a58' }}>Email</label>
              <InputWrapper>
                <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required
                  className="w-full bg-transparent text-sm px-4 py-3.5 rounded-lg focus:outline-none"
                  style={{ color: '#201b16' }} />
              </InputWrapper>
            </div>

            <div className="animate-element animate-delay-300 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#7b6a58' }}>Password</label>
              <InputWrapper>
                <div className="relative">
                  <input name="password" type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    autoComplete="new-password" required minLength={8}
                    className="w-full bg-transparent text-sm px-4 py-3.5 pr-11 rounded-lg focus:outline-none"
                    style={{ color: '#201b16' }} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute inset-y-0 right-3.5 flex items-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword
                      ? <EyeOff className="w-4 h-4" style={{ color: '#7b6a58' }} />
                      : <Eye    className="w-4 h-4" style={{ color: '#7b6a58' }} />}
                  </button>
                </div>
              </InputWrapper>
            </div>

            <button type="submit"
              className="animate-element animate-delay-400 w-full rounded-lg py-3.5 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.99]"
              style={{ background: '#8b6741', color: '#f8f4ee' }}>
              Create account
            </button>
          </form>

          {/* Divider */}
          <div className="animate-element animate-delay-500 flex items-center gap-3">
            <span className="flex-1 border-t" style={{ borderColor: 'rgba(93,75,53,0.14)' }} />
            <span className="text-xs" style={{ color: '#7b6a58' }}>or</span>
            <span className="flex-1 border-t" style={{ borderColor: 'rgba(93,75,53,0.14)' }} />
          </div>

          {/* Google */}
          <button type="button" onClick={onGoogleSignIn}
            className="animate-element animate-delay-600 w-full flex items-center justify-center gap-3 rounded-lg py-3.5 text-sm font-medium border transition-colors hover:bg-white/50"
            style={{ borderColor: 'rgba(93,75,53,0.18)', color: '#201b16' }}>
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Sign-in link */}
          <p className="animate-element animate-delay-700 text-center text-xs" style={{ color: '#7b6a58' }}>
            Already have an account?{' '}
            <a href="#" onClick={e => { e.preventDefault(); onSignIn?.(); }}
              className="font-semibold hover:underline" style={{ color: '#8b6741' }}>
              Sign in
            </a>
          </p>
        </div>
      </LeftPanel>

      <AnalysisPanel
        sub="Your analysis history"
        heading={<>Everything you&rsquo;ve<br />read, saved.</>}
      />
    </div>
  );
};
