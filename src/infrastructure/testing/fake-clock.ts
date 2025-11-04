import { ClockPort } from '../../domain/ports/clock.port';

export class FakeClock implements ClockPort {
  private currentTime: Date;

  constructor(initialTime?: Date) {
    this.currentTime = initialTime || new Date();
  }

  now(): Date {
    return this.currentTime;
  }

  // Test helper methods
  setTime(time: Date): void {
    this.currentTime = time;
  }

  tick(milliseconds: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + milliseconds);
  }
}
