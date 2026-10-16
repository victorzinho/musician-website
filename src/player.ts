/** What the player controls drive: a local `<audio>` or a SoundCloud embed, loaded on first play. Times in seconds. */
export interface Source {
  readonly paused: boolean;
  readonly time: number;
  /** NaN until known. */
  readonly duration: number;
  readonly loading: boolean;
  readonly failed: boolean;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  /** Called on every change of the fields above. */
  onChange(listener: () => void): void;
}

const pausers = new Set<() => void>();

/** Registers a player's pause; the returned function pauses every other player on the page. */
export const exclusive = (pause: () => void) => {
  pausers.add(pause);
  return () => pausers.forEach((other) => other !== pause && other());
};

export const audioSource = (audio: HTMLAudioElement): Source => {
  const source: Source = {
    get paused() {
      return audio.paused;
    },
    get time() {
      return audio.currentTime;
    },
    get duration() {
      return audio.duration;
    },
    loading: false,
    /** A missing or unplayable file: `error`. A rejected `play()` is no failure; another player's pause rejects it too. */
    get failed() {
      return audio.error !== null;
    },
    play: () => {
      pauseOthers();
      audio.play().catch(() => {});
    },
    pause: () => audio.pause(),
    seek: (seconds) => {
      audio.currentTime = seconds;
    },
    onChange: (listener) => {
      for (const event of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'error']) audio.addEventListener(event, listener);
      audio.addEventListener('ended', () => {
        audio.currentTime = 0;
        listener();
      });
    },
  };
  const pauseOthers = exclusive(source.pause);
  return source;
};

/** SoundCloud's Widget API, as much of it as the player uses. Times in milliseconds. */
interface Widget {
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  getDuration(callback: (ms: number) => void): void;
  bind(event: string, listener: (e: { currentPosition: number }) => void): void;
}
declare const SC: {
  Widget: ((iframe: HTMLIFrameElement) => Widget) & {
    Events: Record<'READY' | 'PLAY' | 'PAUSE' | 'FINISH' | 'PLAY_PROGRESS', string>;
  };
};

const TIMEOUT_MS = 10_000;
let api: Promise<void> | undefined;
const loadApi = () =>
  (api ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = () => resolve();
    script.onerror = () => {
      api = undefined;
      reject(new Error('SoundCloud API unavailable'));
    };
    document.head.append(script);
  }));

/** Plays `url` through a hidden SoundCloud embed appended to `host`. */
export const soundcloudSource = (url: string, host: HTMLElement): Source => {
  const listeners: (() => void)[] = [];
  const emit = () => listeners.forEach((listener) => listener());
  const state = { paused: true, time: 0, duration: NaN, loading: false, failed: false };
  let pendingSeek: number | undefined;
  let widget: Promise<Widget> | undefined;

  const load = () =>
    (widget ??= loadApi().then(
      () =>
        new Promise<Widget>((resolve, reject) => {
          const iframe = document.createElement('iframe');
          iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=false`;
          iframe.allow = 'autoplay';
          iframe.title = 'SoundCloud';
          iframe.tabIndex = -1;
          iframe.className = 'soundcloud-frame';
          host.append(iframe);
          const timeout = setTimeout(() => reject(new Error('SoundCloud widget not ready')), TIMEOUT_MS);
          const w = SC.Widget(iframe);
          const { READY, PLAY, PAUSE, FINISH, PLAY_PROGRESS } = SC.Widget.Events;
          w.bind(READY, () => {
            clearTimeout(timeout);
            w.getDuration((ms) => {
              state.duration = ms / 1000;
              emit();
            });
            resolve(w);
          });
          w.bind(PLAY, () => {
            Object.assign(state, { paused: false, loading: false });
            emit();
          });
          w.bind(PAUSE, () => {
            state.paused = true;
            emit();
          });
          w.bind(FINISH, () => {
            Object.assign(state, { paused: true, time: 0 });
            w.seekTo(0);
            emit();
          });
          w.bind(PLAY_PROGRESS, (e) => {
            state.time = e.currentPosition / 1000;
            emit();
          });
        }),
    ));

  const source: Source = {
    get paused() {
      return state.paused;
    },
    get time() {
      return state.time;
    },
    get duration() {
      return state.duration;
    },
    get loading() {
      return state.loading;
    },
    get failed() {
      return state.failed;
    },
    play: () => {
      pauseOthers();
      state.loading = true;
      emit();
      load()
        .then((w) => {
          if (pendingSeek !== undefined) w.seekTo(pendingSeek * 1000);
          pendingSeek = undefined;
          w.play();
        })
        .catch(() => {
          Object.assign(state, { loading: false, failed: true });
          emit();
        });
    },
    pause: () => {
      widget?.then((w) => w.pause());
    },
    seek: (seconds) => {
      state.time = seconds;
      if (widget) widget.then((w) => w.seekTo(seconds * 1000));
      else pendingSeek = seconds;
      emit();
    },
    onChange: (listener) => listeners.push(listener),
  };
  const pauseOthers = exclusive(source.pause);
  return source;
};
