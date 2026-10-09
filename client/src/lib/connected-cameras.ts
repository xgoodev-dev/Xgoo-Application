export type VideoInputDevice = {
  deviceId: string;
  label: string;
  score: number;
};

export function scoreCameraLabel(label: string, isDefault: boolean): number {
  const value = label.toLowerCase();
  if (
    /iphone|ipad|continuity|android|pixel|samsung|usb|bluetooth|capture|cam link|elgato|phone|rear|back|environment|external/.test(
      value,
    )
  ) {
    return 100;
  }
  if (/integrated|built-?in|facetime|laptop/.test(value)) return 10;
  if (isDefault) return 20;
  return 40;
}

export async function listVideoInputDevices(): Promise<VideoInputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === "videoinput" && device.deviceId)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label.trim() || `Camera ${index + 1}`,
      score: scoreCameraLabel(device.label, index === 0),
    }))
    .sort((a, b) => b.score - a.score);
}

export function pickPreferredCamera(devices: VideoInputDevice[]): VideoInputDevice | null {
  return devices[0] || null;
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function openVideoStream(deviceId?: string): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera is not available in this browser.");
  }
  const attempts: MediaStreamConstraints[] = deviceId
    ? [
        { audio: false, video: { deviceId: { exact: deviceId } } },
        { audio: false, video: { deviceId: { ideal: deviceId } } },
        { audio: false, video: true },
      ]
    : [
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        { audio: false, video: true },
      ];

  let lastError: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError instanceof Error) throw lastError;
  throw new Error("Could not start video source");
}

export async function releaseThenOpenVideoStream(
  current: MediaStream | null,
  deviceId?: string,
): Promise<MediaStream> {
  const activeId = current?.getVideoTracks()[0]?.getSettings().deviceId;
  if (current && deviceId && activeId === deviceId) return current;
  stopMediaStream(current);
  if (current) await sleep(350);
  return openVideoStream(deviceId);
}
