'use client';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  researchUrl: string;
}

export function QRCodeModal({ open, onOpenChange, researchUrl }: QRCodeModalProps) {
  const handleDownload = () => {
    // Esta función se implementaría para descargar el código QR como imagen
    console.log('Downloading QR code for URL:', researchUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Research link QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-neutral-600">
              This is your Public QR Code
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Please, download and print in your documents to get responses
            </p>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="w-60 h-60 bg-white border rounded-lg p-3 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Simplified QR code SVG */}
                <rect x="20" y="20" width="15" height="15" fill="black" />
                <rect x="35" y="20" width="15" height="15" fill="black" />
                <rect x="50" y="20" width="15" height="15" fill="black" />
                <rect x="20" y="35" width="15" height="15" fill="black" />
                <rect x="50" y="35" width="15" height="15" fill="black" />
                <rect x="65" y="35" width="15" height="15" fill="black" />
                <rect x="20" y="50" width="15" height="15" fill="black" />
                <rect x="50" y="50" width="15" height="15" fill="black" />
                <rect x="20" y="65" width="15" height="15" fill="black" />
                <rect x="35" y="65" width="15" height="15" fill="black" />
                <rect x="50" y="65" width="15" height="15" fill="black" />
                <rect x="65" y="50" width="15" height="15" fill="black" />
              </svg>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="w-full bg-blue-500 text-white hover:bg-blue-600"
              onClick={handleDownload}
            >
              Download QR Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 