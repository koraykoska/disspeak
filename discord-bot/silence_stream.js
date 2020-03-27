const { Readable } = require("stream");

class SilenceStream extends Readable {
  constructor(opt) {
    super(opt);
    this._sampleRate = opt.sampleRate || 44100;
    if (this.sampleRate < 1) {
        this._sampleRate = 44100;
    }
    this._bitDepth = opt.bitDepth || 16;
    if (this._bitDepth % 8 !== 0) {
        this._bitDepth = 16;
    }
    this._lastTime = new Date();
  }

  _read() {
    const now = new Date();
    const timeSpent = now - this._lastTime;
    if (timeSpent >= 1000) {
      this.push(Buffer.alloc(this._sampleRate * (this._bitDepth / 8)));
      this._lastTime = new Date();
    } else {
      setTimeout(() => {
        this.push(Buffer.alloc(this._sampleRate * (this._bitDepth / 8)));
        this._lastTime = new Date();
      }, 1000 - timeSpent);
    }
  }
}

exports.SilenceStream = SilenceStream;
