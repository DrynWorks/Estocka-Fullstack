import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onScanFailure, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Stop scanning after success to prevent multiple triggers
                scanner.clear().then(() => {
                    onScanSuccess(decodedText);
                }).catch((err) => {
                    console.error("Failed to clear scanner", err);
                });
            },
            (errorMessage) => {
                // Optional: handle scan errors (e.g., "no QR code found")
                if (onScanFailure) {
                    onScanFailure(errorMessage);
                }
            }
        );

        scannerRef.current = scanner;

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                        if (scannerRef.current) {
                            scannerRef.current.clear().catch(console.error);
                        }
                        onClose();
                    }}
                >
                    <X className="w-4 h-4" />
                </Button>

                <h3 className="text-lg font-semibold mb-4 text-center">Escanear Código</h3>

                <div id="reader" className="w-full"></div>

                <p className="text-sm text-slate-500 text-center mt-4">
                    Aponte a câmera para um código de barras ou QR Code
                </p>
            </div>
        </div>
    );
}
