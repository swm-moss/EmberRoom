// 모닥방 환경음 엔진 — 오디오 에셋 없이 WebAudio로 빗소리/난로/키보드 분위기를 합성한다.
// 외부 파일이 필요 없고, 사용자 제스처(토글 클릭) 시점에 AudioContext를 지연 생성한다.

export type AmbientLayer = "rain" | "fire" | "keyboard";

type LayerHandle = {
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
  timer?: number;
};

type WindowWithWebkit = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const FADE = 0.45;

function makeNoiseBuffer(ctx: AudioContext, type: "white" | "brown"): AudioBuffer {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterVolume = 0.55;
  private readonly layers: Partial<Record<AmbientLayer, LayerHandle>> = {};

  private ensureContext(): AudioContext {
    if (this.ctx && this.master) {
      return this.ctx;
    }
    const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.masterVolume;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  isActive(layer: AmbientLayer): boolean {
    return Boolean(this.layers[layer]);
  }

  setMasterVolume(value: number): void {
    this.masterVolume = value;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
    }
  }

  toggle(layer: AmbientLayer): boolean {
    if (this.layers[layer]) {
      this.stop(layer);
      return false;
    }
    this.start(layer);
    return true;
  }

  private start(layer: AmbientLayer): void {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master as GainNode);

    const handle: LayerHandle = { gain, nodes: [] };
    this.layers[layer] = handle;

    if (layer === "rain") {
      this.buildRain(ctx, handle);
    } else if (layer === "fire") {
      this.buildFire(ctx, handle);
    } else {
      this.buildKeyboard(ctx, handle);
    }

    const target = layer === "keyboard" ? 0.5 : 0.85;
    gain.gain.setTargetAtTime(target, ctx.currentTime, FADE);
  }

  private stop(layer: AmbientLayer): void {
    const handle = this.layers[layer];
    const ctx = this.ctx;
    if (!handle || !ctx) {
      return;
    }
    delete this.layers[layer];

    if (handle.timer) {
      window.clearTimeout(handle.timer);
    }
    handle.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE * 0.6);
    window.setTimeout(() => {
      handle.nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          // already stopped
        }
      });
      handle.gain.disconnect();
    }, FADE * 1000 + 250);
  }

  private buildRain(ctx: AudioContext, handle: LayerHandle): void {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, "white");
    source.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 600;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 0.5;

    // 빗줄기 사이의 미세한 흔들림
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    source.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(handle.gain);

    source.start();
    lfo.start();
    handle.nodes.push(source, lfo);
  }

  private buildFire(ctx: AudioContext, handle: LayerHandle): void {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, "brown");
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 480;

    source.connect(lowpass);
    lowpass.connect(handle.gain);
    source.start();
    handle.nodes.push(source);

    const crackle = () => {
      if (!this.layers.fire) {
        return;
      }
      this.burst(ctx, handle.gain, {
        type: "lowpass",
        frequency: 1600,
        duration: 0.04 + Math.random() * 0.05,
        peak: 0.5 + Math.random() * 0.5
      });
      handle.timer = window.setTimeout(crackle, 120 + Math.random() * 520);
    };
    crackle();
  }

  private buildKeyboard(ctx: AudioContext, handle: LayerHandle): void {
    const tick = () => {
      if (!this.layers.keyboard) {
        return;
      }
      this.burst(ctx, handle.gain, {
        type: "bandpass",
        frequency: 2400 + Math.random() * 1600,
        duration: 0.012 + Math.random() * 0.014,
        peak: 0.6 + Math.random() * 0.4
      });
      // 타이핑 리듬: 짧은 연타 사이에 가끔 긴 멈춤
      const gap = Math.random() < 0.78 ? 70 + Math.random() * 150 : 420 + Math.random() * 700;
      handle.timer = window.setTimeout(tick, gap);
    };
    tick();
  }

  private burst(
    ctx: AudioContext,
    destination: GainNode,
    options: { type: BiquadFilterType; frequency: number; duration: number; peak: number }
  ): void {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx, "white");

    const filter = ctx.createBiquadFilter();
    filter.type = options.type;
    filter.frequency.value = options.frequency;
    filter.Q.value = 0.9;

    const env = ctx.createGain();
    const now = ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(options.peak, now + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, now + options.duration);

    source.connect(filter);
    filter.connect(env);
    env.connect(destination);

    source.start(now);
    source.stop(now + options.duration + 0.02);
  }

  dispose(): void {
    (Object.keys(this.layers) as AmbientLayer[]).forEach((layer) => this.stop(layer));
    window.setTimeout(() => {
      void this.ctx?.close();
      this.ctx = null;
      this.master = null;
    }, 600);
  }
}
