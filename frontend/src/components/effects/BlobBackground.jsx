import React from 'react';

const BlobBackground = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} style={{ zIndex: 0 }}>
      {/* Blob 1 - Cyan */}
      <div
        className="blob"
        style={{
          width: '420px', height: '420px',
          top: '-10%', left: '-5%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.18) 0%, rgba(6,182,212,0.08) 50%, transparent 70%)',
          animationDuration: '14s',
        }}
      />
      {/* Blob 2 - Violet */}
      <div
        className="blob blob-2"
        style={{
          width: '500px', height: '500px',
          top: '30%', right: '-10%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(109,40,217,0.07) 50%, transparent 70%)',
          animationDuration: '18s',
        }}
      />
      {/* Blob 3 - Pink */}
      <div
        className="blob blob-3"
        style={{
          width: '360px', height: '360px',
          bottom: '-5%', left: '30%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.14) 0%, rgba(219,39,119,0.06) 50%, transparent 70%)',
          animationDuration: '20s',
        }}
      />
      {/* Blob 4 - Blue subtle */}
      <div
        className="blob blob-2"
        style={{
          width: '280px', height: '280px',
          top: '60%', left: '10%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          animationDuration: '22s',
        }}
      />
    </div>
  );
};

export default BlobBackground;
