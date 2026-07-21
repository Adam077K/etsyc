"use client";

/**
 * useMediaRecorder — the REAL capture primitive behind KOL's voice anchor.
 *
 * The Real-Maker voice anchor is the product's core trust claim, so the
 * capture path has to actually touch the microphone. This hook wraps
 * getUserMedia + MediaRecorder + an AnalyserNode, and it never fabricates:
 *   · permission has four distinct, observable states
 *   · elapsed duration is measured off the wall clock, not animated
 *   · waveform levels come from real RMS of the live input
 *   · if permission is denied or the API is missing we say so — the UI
 *     must NOT render a recording that did not happen
 *
 * Live build: the resulting Blob is uploaded to Supabase storage and the
 * returned object id becomes voice_anchor_clip_id. Here the Blob stays in
 * memory for the session and the object URL is revoked on cleanup.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type PermissionState = "idle" | "prompt" | "granted" | "denied" | "unsupported";
export type RecorderStatus = "idle" | "requesting" | "recording" | "paused" | "stopped" | "error";

export interface Recording {
  blob: Blob;
  url: string;
  durationMs: number;
  mimeType: string;
}

export interface UseMediaRecorderOptions {
  audio?: boolean;
  video?: boolean;
  /** number of waveform bars to expose (levels are 0–1) */
  bars?: number;
}

export interface UseMediaRecorderApi {
  permission: PermissionState;
  status: RecorderStatus;
  /** real elapsed recording time in ms, excludes paused spans */
  elapsedMs: number;
  /** 0–1 amplitudes sampled from the live input; all zeros when not recording */
  levels: number[];
  recording: Recording | null;
  /** human-readable failure, e.g. the getUserMedia error name */
  error: string | null;
  /** live stream — attach to a <video muted playsInline> for camera preview */
  stream: MediaStream | null;
  start(): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  /** drop the current take (revokes the object URL) and go back to idle */
  reset(): void;
  /**
   * Hand the finished take to the caller and go back to idle WITHOUT
   * revoking its object URL — ownership transfers, so the caller must
   * revoke it when it drops the recording. Use this when takes are kept
   * in a list (e.g. one per element on /sell/voice).
   */
  takeRecording(): Recording | null;
}

/** Ordered by preference. First supported type wins; empty string = let the UA decide. */
const MIME_CANDIDATES_AUDIO = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

const MIME_CANDIDATES_VIDEO = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

function pickMimeType(wantsVideo: boolean): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = wantsVideo ? MIME_CANDIDATES_VIDEO : MIME_CANDIDATES_AUDIO;
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "";
}

export function isMediaCaptureSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useMediaRecorder(options: UseMediaRecorderOptions = {}): UseMediaRecorderApi {
  const { audio = true, video = false, bars = 16 } = options;

  const [permission, setPermission] = useState<PermissionState>("idle");
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => new Array(bars).fill(0));
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  /** wall-clock accounting so duration is measured, never assumed */
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const urlRef = useRef<string | null>(null);

  const teardownStream = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    analyserRef.current = null;
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    if (ctx && ctx.state !== "closed") void ctx.close().catch(() => undefined);
    const s = streamRef.current;
    streamRef.current = null;
    if (s) for (const track of s.getTracks()) track.stop();
    setStream(null);
    setLevels(new Array(bars).fill(0));
  }, [bars]);

  // unmount: stop every track, kill timers, revoke the object URL — no leaks
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          /* already torn down */
        }
      }
      teardownStream();
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [teardownStream]);

  /** Drive the bars off real RMS of the live signal — an idle mic reads flat. */
  const runAnalyser = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.fftSize);
    const loop = () => {
      const live = analyserRef.current;
      if (!live) return;
      live.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        const sample = ((buffer[i] ?? 128) - 128) / 128;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      // gentle gain so speech reads across the bar range without clipping to 1
      const level = Math.min(1, rms * 3.2);
      setLevels((prev) => {
        const next = prev.slice(1);
        next.push(level);
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    if (!isMediaCaptureSupported()) {
      setPermission("unsupported");
      setStatus("error");
      setError("This browser can't record audio. Try Chrome, Edge, Safari or Firefox.");
      return;
    }

    // clear any previous take before asking again
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setRecording(null);
    setError(null);
    setElapsedMs(0);
    accumulatedRef.current = 0;
    chunksRef.current = [];
    setPermission("prompt");
    setStatus("requesting");

    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { facingMode: "user" } : false,
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "Error";
      setPermission(
        name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported",
      );
      setStatus("error");
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow it in your browser's site settings, then try again."
          : name === "NotFoundError"
            ? "No microphone or camera was found on this device."
            : `Couldn't start recording (${name}).`,
      );
      return;
    }

    streamRef.current = media;
    setStream(media);
    setPermission("granted");

    // real level metering from the live track
    try {
      const AudioCtor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor && media.getAudioTracks().length > 0) {
        const ctx = new AudioCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(media);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        analyserRef.current = analyser;
        runAnalyser();
      }
    } catch {
      /* metering is a nicety — recording still proceeds without bars */
    }

    const mimeType = pickMimeType(video);
    let recorder: MediaRecorder;
    try {
      recorder = mimeType ? new MediaRecorder(media, { mimeType }) : new MediaRecorder(media);
    } catch {
      teardownStream();
      setStatus("error");
      setPermission("unsupported");
      setError("This browser can't encode a recording in any supported format.");
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      const durationMs = accumulatedRef.current;
      // a zero-length take is a failure, not a recording — never pretend
      if (blob.size === 0 || durationMs <= 0) {
        setStatus("error");
        setError("Nothing was captured — no audio reached the recorder.");
        teardownStream();
        return;
      }
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setRecording({ blob, url, durationMs, mimeType: type });
      setStatus("stopped");
      teardownStream();
    };

    recorder.onerror = () => {
      setStatus("error");
      setError("The recorder stopped unexpectedly.");
      teardownStream();
    };

    startedAtRef.current = Date.now();
    recorder.start(250);
    setStatus("recording");
    tickRef.current = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startedAtRef.current));
    }, 200);
  }, [audio, video, runAnalyser, teardownStream]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (recorder.state === "recording") {
      accumulatedRef.current += Date.now() - startedAtRef.current;
    }
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setElapsedMs(accumulatedRef.current);
    recorder.stop();
  }, []);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    accumulatedRef.current += Date.now() - startedAtRef.current;
    recorder.pause();
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setElapsedMs(accumulatedRef.current);
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    startedAtRef.current = Date.now();
    recorder.resume();
    tickRef.current = window.setInterval(() => {
      setElapsedMs(accumulatedRef.current + (Date.now() - startedAtRef.current));
    }, 200);
    setStatus("recording");
  }, []);

  const reset = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    recorderRef.current = null;
    teardownStream();
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    chunksRef.current = [];
    accumulatedRef.current = 0;
    setRecording(null);
    setElapsedMs(0);
    setError(null);
    setStatus("idle");
  }, [teardownStream]);

  const takeRecording = useCallback((): Recording | null => {
    if (!recording) return null;
    urlRef.current = null; // ownership transfers — caller revokes
    setRecording(null);
    setElapsedMs(0);
    accumulatedRef.current = 0;
    setStatus("idle");
    return recording;
  }, [recording]);

  return {
    permission,
    status,
    elapsedMs,
    levels,
    recording,
    error,
    stream,
    start,
    stop,
    pause,
    resume,
    reset,
    takeRecording,
  };
}
