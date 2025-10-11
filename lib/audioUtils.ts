/**
 * Audio utilities for notification sounds
 */

export function playBeep(): void {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    oscillator.start();
    
    // Stop after 160ms
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    oscillator.stop(ctx.currentTime + 0.18);
  } catch (error) {
    // Silently ignore audio errors
    console.debug('Audio playback failed:', error);
  }
}

export function playNotificationSound(): void {
  // Play beep only if document is not visible (user is in another tab)
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    playBeep();
  }
}
