'use client';

import { useEffect, useRef } from 'react';
import { useAssetStore } from '@/store/assetStore';

export function StoreInitializer() {
  const fetchAssets = useAssetStore((state) => state.fetchAssets);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      fetchAssets();
      initialized.current = true;
    }
  }, [fetchAssets]);

  return null;
}
