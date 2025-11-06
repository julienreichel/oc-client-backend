import { Clock } from '../../domain/services/clock';

export class FakeClock implements Clock {
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
