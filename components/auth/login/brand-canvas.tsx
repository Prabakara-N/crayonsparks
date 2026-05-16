"use client";

export function BrandCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0f]" aria-hidden>
      <div className="absolute -top-[30%] -left-[20%] h-[140%] w-[80%] origin-top-left rotate-[12deg] bg-linear-to-br from-white/[0.08] via-white/[0.02] to-transparent blur-[60px] animate-[silk-drift-a_28s_ease-in-out_infinite]" />
      <div className="absolute -bottom-[30%] -right-[25%] h-[150%] w-[85%] origin-bottom-right -rotate-[18deg] bg-linear-to-tl from-white/[0.06] via-white/[0.015] to-transparent blur-[60px] animate-[silk-drift-b_36s_ease-in-out_infinite]" />
      <div className="absolute top-[10%] right-[10%] h-[70%] w-[60%] -rotate-[8deg] bg-linear-to-bl from-violet-500/[0.05] via-transparent to-transparent blur-[70px] animate-[silk-drift-c_44s_ease-in-out_infinite]" />
      <div className="absolute bottom-[5%] left-[15%] h-[60%] w-[55%] rotate-[20deg] bg-linear-to-tr from-blue-500/[0.04] via-transparent to-transparent blur-[70px] animate-[silk-drift-d_52s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)]" />
      <style>{`
        @keyframes silk-drift-a {
          0%, 100% { transform: translate(0, 0) rotate(12deg); }
          50% { transform: translate(2%, 1%) rotate(14deg); }
        }
        @keyframes silk-drift-b {
          0%, 100% { transform: translate(0, 0) rotate(-18deg); }
          50% { transform: translate(-2%, -1%) rotate(-20deg); }
        }
        @keyframes silk-drift-c {
          0%, 100% { transform: translate(0, 0) rotate(-8deg); }
          50% { transform: translate(-1.5%, 1.5%) rotate(-6deg); }
        }
        @keyframes silk-drift-d {
          0%, 100% { transform: translate(0, 0) rotate(20deg); }
          50% { transform: translate(1.5%, -1%) rotate(22deg); }
        }
      `}</style>
    </div>
  );
}
