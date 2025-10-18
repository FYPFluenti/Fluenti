import React, { useState, useEffect } from 'react';
import { Mic, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MicrophoneSelectorProps {
  onDeviceSelected?: (deviceId: string) => void;
}

export default function MicrophoneSelector({ onDeviceSelected }: MicrophoneSelectorProps) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // Request permission first to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get all devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(d => d.kind === 'audioinput');
      
      setDevices(audioInputs);
      
      // Set default device
      if (audioInputs.length > 0) {
        const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
        setSelectedDeviceId(defaultDevice.deviceId);
      }
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading microphones:', error);
      toast({
        title: "Cannot Load Microphones",
        description: "Please allow microphone access to select a device.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (onDeviceSelected) {
      onDeviceSelected(deviceId);
    }
    
    const device = devices.find(d => d.deviceId === deviceId);
    toast({
      title: "Microphone Selected",
      description: `Using: ${device?.label || 'Unknown Device'}`,
      variant: "default",
      duration: 3000
    });
  };

  const testMicrophone = async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      toast({
        title: "Microphone Test",
        description: "This microphone is working!",
        variant: "default",
        duration: 3000
      });
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast({
        title: "Microphone Test Failed",
        description: "This microphone is not accessible.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading microphones...
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="text-sm text-destructive">
        No microphones found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Mic className="w-4 h-4" />
        Select Microphone
      </label>
      
      <div className="space-y-2">
        {devices.map((device) => (
          <button
            key={device.deviceId}
            onClick={() => handleDeviceChange(device.deviceId)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selectedDeviceId === device.deviceId
                ? 'border-[#F5B82E] bg-[#F5B82E]/10'
                : 'border-border hover:border-[#F5B82E]/50 bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {device.label || `Microphone ${devices.indexOf(device) + 1}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {device.deviceId.substring(0, 20)}...
                </div>
              </div>
              
              {selectedDeviceId === device.deviceId && (
                <Check className="w-5 h-5 text-[#F5B82E]" />
              )}
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">
        💡 Tip: Choose the microphone you're speaking into, not "Stereo Mix" or system audio.
      </p>
    </div>
  );
}
