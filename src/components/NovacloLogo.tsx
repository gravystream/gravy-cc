'use client';

import Link from 'next/link';

const NclStar = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M27 0 Q30 19 27 23 Q24 19 27 0 Z" fill="#FFFFFF"/>
    <path d="M27 54 Q30 35 27 31 Q24 35 27 54 Z" fill="#FFFFFF"/>
    <path d="M0 27 Q19 24 23 27 Q19 30 0 27 Z" fill="#FFFFFF"/>
    <path d="M54 27 Q35 24 31 27 Q35 30 54 27 Z" fill="#FFFFFF"/>
    <path d="M27 6 Q29 20 27 23 Q25 20 27 6 Z" fill="#FFFFFF" opacity="0.55" transform="rotate(45 27 27)"/>
    <path d="M27 6 Q29 20 27 23 Q25 20 27 6 Z" fill="#FFFFFF" opacity="0.55" transform="rotate(135 27 27)"/>
    <path d="M27 6 Q29 20 27 23 Q25 20 27 6 Z" fill="#FFFFFF" opacity="0.55" transform="rotate(225 27 27)"/>
    <path d="M27 6 Q29 20 27 23 Q25 20 27 6 Z" fill="#FFFFFF" opacity="0.55" transform="rotate(315 27 27)"/>
    <circle cx="27" cy="27" r="5" fill="#FFFFFF"/>
  </svg>
);

const CSS = `
@keyframes ncl-star-burst {
  0%   { opacity: 0; transform: scale(0) rotate(-180deg); }
  60%  { opacity: 1; transform: scale(1.3) rotate(10deg); }
  80%  { transform: scale(0.95) rotate(-5deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes ncl-letter-in {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes ncl-idle-pulse {
  0%, 100% { filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
  50%       { filter: drop-shadow(0 0 8px rgba(255,255,255,0.3)); }
}
.ncl-wordmark { display: flex; align-items: center; line-height: 1; }
.ncl-letter {
  font-family: 'Quicksand', sans-serif;
  font-weight: 700;
  font-size: 26px;
  color: #ffffff;
  display: inline-block;
  animation-name: ncl-letter-in;
  animation-duration: 0.5s;
  animation-timing-function: cubic-bezier(0.22,1,0.36,1);
  animation-fill-mode: both;
}
.ncl-letter-N  { animation-delay: 0.70s; }
.ncl-letter-v  { animation-delay: 0.80s; }
.ncl-letter-a  { animation-delay: 0.87s; }
.ncl-letter-c  { animation-delay: 0.94s; }
.ncl-letter-l  { animation-delay: 1.01s; }
.ncl-letter-i  { animation-delay: 1.08s; }
.ncl-letter-o2 { animation-delay: 1.15s; }
.ncl-star-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  position: relative;
  top: -1px;
  animation-name: ncl-star-burst, ncl-idle-pulse;
  animation-duration: 0.8s, 3s;
  animation-timing-function: cubic-bezier(0.34,1.56,0.64,1), ease-in-out;
  animation-delay: 0.3s, 2.8s;
  animation-fill-mode: both, none;
  animation-iteration-count: 1, infinite;
}
`;

export function NovacloLogo() {
  return (
    <Link href="/" aria-label="Novaclio home">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ncl-wordmark">
        <span className="ncl-letter ncl-letter-N">N</span>
        <span className="ncl-star-wrap"><NclStar size={24} /></span>
        <span className="ncl-letter ncl-letter-v">v</span>
        <span className="ncl-letter ncl-letter-a">a</span>
        <span className="ncl-letter ncl-letter-c">c</span>
        <span className="ncl-letter ncl-letter-l">l</span>
        <span className="ncl-letter ncl-letter-i">i</span>
        <span className="ncl-letter ncl-letter-o2">o</span>
      </div>
    </Link>
  );
}

const staticStyle: React.CSSProperties = {
  fontFamily: "'Quicksand', sans-serif",
  fontWeight: 700,
  fontSize: 17,
  color: '#ffffff',
  display: 'inline-block',
};

export function NovacloLogoStatic() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={staticStyle}>N</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', top: -1 }}>
        <NclStar size={15} />
      </span>
      <span style={staticStyle}>vaclio</span>
    </div>
  );
}
