'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const OpenLayersMap = dynamic(() => import('@/components/map/OpenLayersMap'), { 
  ssr: false,
  loading: () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#64748b',
      fontSize: 14,
      fontFamily: '"Inter", sans-serif',
      letterSpacing: 1,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontWeight: 700, color: '#a5b4fc' }}>PLN JARKOM MAP ENGINE</div>
        <div style={{ fontSize: 11, marginTop: 6 }}>Memuat OpenLayers v10...</div>
      </div>
    </div>
  )
});

function PetaContent() {
  const searchParams = useSearchParams();
  const initialPenyulang = searchParams.get('penyulang') || '';
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 1100 
    }}>
      <OpenLayersMap initialFilterPenyulang={initialPenyulang} />
    </div>
  );
}

export default function PetaPage() {
  return (
    <Suspense fallback={
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
        color: '#64748b',
        fontSize: 14,
        fontFamily: '"Inter", sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontWeight: 700, color: '#a5b4fc' }}>PLN JARKOM MAP ENGINE</div>
        </div>
      </div>
    }>
      <PetaContent />
    </Suspense>
  );
}
