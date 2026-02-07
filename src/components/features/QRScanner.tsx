import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export function QRScanner({ onScan, onError, isActive = true }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startScanner = useCallback(async () => {
    if (!isActive || isScanning) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (normal during scanning)
        }
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      setHasCamera(false);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
      onError?.('Camera access denied');
    }
  }, [isActive, isScanning, onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (error) {
        console.error('Failed to stop scanner:', error);
      }
    }
  }, [isScanning]);

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

  const handleRetry = () => {
    setCameraError(null);
    setHasCamera(true);
    startScanner();
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Scanner container */}
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-black aspect-square',
          !hasCamera && 'flex items-center justify-center bg-muted'
        )}
      >
        {hasCamera ? (
          <>
            <div id="qr-reader" className="w-full h-full" />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner markers */}
                <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-primary rounded-br-lg" />
                
                {/* Scanning line */}
                <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8">
            <CameraOff className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 child-friendly">
              {cameraError || 'Kamera tidak tersedia'}
            </p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        )}
      </div>

      {/* Status indicator */}
      {hasCamera && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              isScanning ? 'bg-scan-success animate-pulse' : 'bg-muted'
            )}
          />
          <span className="text-sm text-muted-foreground child-friendly">
            {isScanning ? 'Arahkan QR Code ke kamera 📷' : 'Memuat kamera...'}
          </span>
        </div>
      )}
    </div>
  );
}
