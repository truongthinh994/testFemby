type Save = (id: string, choice: number) => Promise<{data: unknown; error: string | null}>;
export type SaveState = {pending: number; error: string; closed: boolean};

// Keep the latest unsaved choice for each question, even when requests fail or overlap.
export class AnswerQueue {
  private pending = new Map<string, {choice: number; version: number; error?: string}>();
  private tail: Promise<void> = Promise.resolve();
  private version = 0;
  private closed = false;
  constructor(private save: Save, private changed: (state: SaveState) => void) {}

  private emit() {
    this.changed({
      pending: this.pending.size,
      error: [...this.pending.values()].find(item => item.error)?.error || '',
      closed: this.closed,
    });
  }

  enqueue(id: string, choice: number) {
    if (this.closed) return;
    const version = ++this.version;
    this.pending.set(id, {choice, version});
    this.emit();
    this.tail = this.tail.then(async () => {
      if (this.closed || this.pending.get(id)?.version !== version) return;
      let result;
      try {
        result = await this.save(id, choice);
      } catch {
        result = {data: null, error: 'Mất kết nối. Vui lòng lưu lại đáp án.'};
      }
      if (result.data === false && !result.error) this.closed = true;
      if (this.pending.get(id)?.version === version) {
        if (result.error) this.pending.set(id, {choice, version, error: result.error});
        else this.pending.delete(id);
      }
      this.emit();
    });
  }

  retry() {
    for (const [id, {choice}] of [...this.pending]) this.enqueue(id, choice);
  }

  async flush() {
    await this.tail;
    return this.pending.size === 0;
  }
}
