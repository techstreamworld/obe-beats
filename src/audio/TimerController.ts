// ─── TimerController ───
// setInterval-based countdown that fires callbacks on every tick
// and when the timer expires. Pure TypeScript — no React.

export class TimerController {
  private intervalId: number | null = null;
  private remaining = 0;
  private onTick: (remaining: number) => void;
  private onExpiry: () => void;

  constructor(
    onTick: (remaining: number) => void,
    onExpiry: () => void,
  ) {
    this.onTick = onTick;
    this.onExpiry = onExpiry;
  }

  /** Start (or restart) the countdown from `durationSeconds`. */
  start(durationSeconds: number): void {
    this.stop();
    this.remaining = durationSeconds;
    this.onTick(this.remaining);

    this.intervalId = window.setInterval(() => {
      this.remaining = Math.max(0, this.remaining - 1);
      this.onTick(this.remaining);

      if (this.remaining <= 0) {
        this.stop();
        this.onExpiry();
      }
    }, 1000);
  }

  /** Stop the countdown and clear the interval. */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get isRunning(): boolean {
    return this.intervalId !== null;
  }

  get secondsRemaining(): number {
    return this.remaining;
  }
}
