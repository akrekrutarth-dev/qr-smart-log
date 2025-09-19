import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from './button';
import { Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const QRScanner = ({ onScan, onError, className = "" }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          onScan(result.data);
          stopScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      setScanner(qrScanner);

      return () => {
        qrScanner.stop();
        qrScanner.destroy();
      };
    }
  }, [onScan]);

  const startScanning = async () => {
    if (!scanner) return;

    try {
      await scanner.start();
      setIsScanning(true);
      setHasPermission(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
      setHasPermission(false);
      onError?.('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <video
        ref={videoRef}
        className="w-full max-w-md rounded-lg border shadow-md"
        style={{ display: isScanning ? 'block' : 'none' }}
      />
      
      {!isScanning && (
        <div className="text-center space-y-2">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Ready to scan QR code</p>
        </div>
      )}

      {hasPermission === false && (
        <div className="text-center space-y-2 text-destructive">
          <CameraOff className="h-8 w-8 mx-auto" />
          <p className="text-sm">Camera access denied. Please enable camera permissions and try again.</p>
        </div>
      )}

      <Button
        onClick={isScanning ? stopScanning : startScanning}
        variant={isScanning ? "secondary" : "default"}
      >
        {isScanning ? (
          <>
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Scanning
          </>
        ) : (
          <>
            <Camera className="h-4 w-4 mr-2" />
            Start Scanning
          </>
        )}
      </Button>
    </div>
  );
};