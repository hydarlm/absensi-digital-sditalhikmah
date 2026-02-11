import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layout/DashboardLayout';
import { QRScanner } from '@/components/features/QRScanner';
import { attendanceService } from '@/services/attendance';
import type { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, RotateCcw, ScanLine, Info } from 'lucide-react';
import { getInitials } from '@/utils/formatters';
import { cn } from '@/lib/utils';

type ScanStatus = 'idle' | 'success' | 'error';

interface ScanResult {
  status: ScanStatus;
  message: string;
  student?: Student;
}

// Create AudioContext once to avoid memory leaks
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Audio not supported');
    }
  }
  return audioContext;
};

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult>({
    status: 'idle',
    message: 'Arahkan QR Code siswa ke kamera',
  });
  const [isScanning, setIsScanning] = useState(true);
  const [lastScannedTime, setLastScannedTime] = useState<number>(0);

  const handleScan = useCallback(
    async (barcode: string) => {
      // Prevent rapid scanning (minimum 2 seconds between scans)
      const now = Date.now();
      if (now - lastScannedTime < 2000) return;
      setLastScannedTime(now);

      setIsScanning(false);

      try {
        const result = await attendanceService.scan(barcode);

        setScanResult({
          status: result.success ? 'success' : 'error',
          message: result.message,
          student: result.student,  // Types now match, no mapping needed
        });

        // Emit scan event for Dashboard to receive
        if (result.success && result.student) {
          const { scanEventBus } = await import('@/lib/scanEventBus');
          scanEventBus.emit({
            studentId: result.student.id,
            studentNis: result.student.nis,
            studentName: result.student.name,
            scanTime: new Date(),
            token: barcode,
          });
        }

        // Play sound feedback (if available)
        if (result.success) {
          playSound('success');
        } else {
          playSound('error');
        }
      } catch (error) {
        setScanResult({
          status: 'error',
          message: 'Terjadi kesalahan. Silakan coba lagi',
        });
        playSound('error');
      }

      // Auto reset after 3 seconds
      setTimeout(() => {
        resetScanner();
      }, 3000);
    },
    [lastScannedTime],
  );

  const resetScanner = () => {
    setScanResult({
      status: 'idle',
      message: 'Arahkan QR Code siswa ke kamera',
    });
    setIsScanning(true);
  };

  const playSound = (type: 'success' | 'error') => {
    // Use shared AudioContext to prevent memory leaks
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = type === 'success' ? 800 : 300;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio not supported
    }
  };

  return (
    <Container className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-6">
      <div className="w-full max-w-2xl space-y-6 px-4">
        {/* Header Section */}
        <motion.div className="text-center space-y-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <motion.div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            <ScanLine className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Scan Absensi
          </motion.h1>
          <motion.p className="text-base text-muted-foreground max-w-md mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Tempelkan kartu QR Code siswa ke area kamera untuk mencatat kehadiran
          </motion.p>
        </motion.div>

        {/* Scanner or Result Card */}
        <AnimatePresence mode="wait">
          {scanResult.status === 'idle' ? (
            <motion.div key="scanner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
              <Card className="overflow-hidden border-2 shadow-lg">
                <CardContent className="p-0">
                  <QRScanner onScan={handleScan} isActive={isScanning} />
                </CardContent>
                <motion.div className="bg-muted/30 px-6 py-4 border-t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <p className="text-sm text-center text-muted-foreground font-medium">Posisikan QR Code di dalam frame kamera</p>
                </motion.div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
              <Card
                className={cn(
                  'overflow-hidden transition-all duration-500 shadow-xl border-2',
                  scanResult.status === 'success' ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-white' : 'border-red-500/50 bg-gradient-to-br from-red-50 to-white',
                )}>
                <CardContent className="p-8 sm:p-12">
                  <div className={cn('text-center space-y-6', scanResult.status === 'success' ? 'scan-success-animation' : 'scan-error-animation')}>
                    {/* Status Icon */}
                    <div className="flex justify-center">
                      {scanResult.status === 'success' ? (
                        <motion.div className="relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                          <CheckCircle2 className="relative h-24 w-24 text-emerald-600 drop-shadow-lg" strokeWidth={2.5} />
                        </motion.div>
                      ) : (
                        <motion.div className="relative" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.4 }}>
                          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <XCircle className="relative h-24 w-24 text-red-600 drop-shadow-lg" strokeWidth={2.5} />
                          </motion.div>
                        </motion.div>
                      )}
                    </div>

                    {/* Student Info */}
                    {scanResult.student && (
                      <motion.div className="space-y-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}>
                          <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-xl ring-4 ring-primary/10">
                            <AvatarImage src={scanResult.student.photo_path ? `/api/students/${scanResult.student.id}/photo` : undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl font-bold">{getInitials(scanResult.student.name)}</AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                          <p className="text-2xl font-bold text-foreground">{scanResult.student.name}</p>
                          <p className="text-base text-muted-foreground font-medium mt-1">Kelas {scanResult.student.class_name}</p>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Status Message */}
                    <motion.div className="space-y-2 pt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-lg',
                          scanResult.status === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-red-600 text-white shadow-lg shadow-red-600/30',
                        )}>
                        <span>{scanResult.status === 'success' ? '✓' : '✕'}</span>
                        <span>{scanResult.message}</span>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <AnimatePresence>
          {scanResult.status !== 'idle' && (
            <motion.div className="flex justify-center pt-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ delay: 0.3 }}>
              <Button size="lg" onClick={resetScanner} className="h-14 px-8 text-base font-semibold gap-3 shadow-lg hover:shadow-xl transition-all">
                <RotateCcw className="h-5 w-5" />
                Scan Siswa Berikutnya
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
          <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-white">
            <CardContent className="p-6">
              <motion.div className="flex items-start gap-3 mb-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Petunjuk Penggunaan</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ikuti langkah berikut untuk scan absensi</p>
                </div>
              </motion.div>
              <div className="space-y-4 ml-13">
                {[
                  {
                    title: 'Ambil kartu QR Code siswa',
                    desc: 'Pastikan kartu dalam kondisi bersih dan tidak rusak',
                  },
                  {
                    title: 'Posisikan QR Code di depan kamera',
                    desc: 'Arahkan ke area frame yang ditampilkan',
                  },
                  {
                    title: 'Tunggu konfirmasi kehadiran',
                    desc: 'Sistem akan otomatis mencatat dan menampilkan hasilnya',
                  },
                ].map((step, index) => (
                  <motion.div key={index} className="flex items-start gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + index * 0.1 }}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">{index + 1}</div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Container>
  );
}
