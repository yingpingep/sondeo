import * as tty from 'tty';

export class Bar {
  private readonly stdout: tty.WriteStream;
  private maxValue = 0;
  private dx = 0;

  constructor() {
    this.stdout = process.stdout;
  }

  setMaxValue(value: number): void {
    if (!value || Number.isNaN(value) || this.maxValue) {
      return;
    }

    this.maxValue = value;
  }

  private getCurrentPercent(value: number): number {
    return Math.round((value / this.maxValue) * 100);
  }

  write(value: number): void {
    const cp = this.getCurrentPercent(value);
    if (cp !== 0 && cp % 4 === 0) {
      this.dx += 1;
    }

    this.stdout.cursorTo(0);
    const str = `[${'#'.repeat(this.dx)}${'.'.repeat(
      25 - this.dx
    )}] ${cp}% (${value}/${this.maxValue})`;
    this.stdout.write(str);
  }
}
