import { PlatformError, unsupported } from "./contract.js";
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
/** Browser/Electron recording; tracks are stopped on every completion/error/cancel path. */
export function createWebAudio({ exportClip } = {}) {
  let recorder,
    stream,
    chunks = [],
    blob,
    url,
    started,
    failure,
    stopping,
    starting = false,
    generation = 0,
    cancelling;
  const release = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    if (url) URL.revokeObjectURL(url);
    url = null;
    blob = null;
    chunks = [];
  };
  return {
    async start() {
      if (cancelling) await cancelling;
      if (stopping) await stopping.catch(() => {});
      if (
        !navigator.mediaDevices?.getUserMedia ||
        !globalThis.MediaRecorder ||
        !globalThis.isSecureContext
      )
        unsupported(
          "Microphone recording needs a secure browser or native app.",
        );
      if (starting || recorder?.state === "recording")
        throw new PlatformError("FAILED", "Recording already running.");
      release();
      failure = null;
      starting = true;
      const token = ++generation;
      try {
        const captured = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (token !== generation || document.hidden) {
          captured.getTracks().forEach((t) => t.stop());
          throw new PlatformError(
            "CANCELLED",
            "Recording cancelled while inactive.",
          );
        }
        stream = captured;
        const mimeType = [
          "audio/webm;codecs=opus",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ].find((t) => MediaRecorder.isTypeSupported(t));
        recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          audioBitsPerSecond: 96000,
        });
        let size = 0;
        recorder.ondataavailable = (e) => {
          if (e.data.size) {
            size += e.data.size;
            if (size > MAX_AUDIO_BYTES) {
              failure = new PlatformError(
                "FAILED",
                "Recording exceeded the 8 MiB limit.",
              );
              if (recorder.state !== "inactive") recorder.stop();
              stream?.getTracks().forEach((t) => t.stop());
            } else chunks.push(e.data);
          }
        };
        recorder.onerror = () => {
          failure = new PlatformError(
            "FAILED",
            "The microphone stopped unexpectedly.",
          );
          stream?.getTracks().forEach((t) => t.stop());
        };
        started = performance.now();
        recorder.start(250);
        return { recording: true };
      } catch (e) {
        release();
        throw e;
      } finally {
        starting = false;
      }
    },
    async stop() {
      if (!recorder || (recorder.state === "inactive" && !chunks.length))
        throw failure || new PlatformError("FAILED", "No recording is active.");
      if (stopping) return stopping;
      stopping = new Promise((resolve, reject) => {
        const finish = () => {
          stream?.getTracks().forEach((t) => t.stop());
          stream = null;
          if (failure) {
            release();
            reject(failure);
            return;
          }
          blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          chunks = [];
          if (!blob.size) {
            reject(new PlatformError("FAILED", "No audio was captured."));
            return;
          }
          url = URL.createObjectURL(blob);
          resolve({
            previewUrl: url,
            mimeType: blob.type,
            bytes: blob.size,
            durationMs: Math.round(performance.now() - started),
          });
        };
        if (recorder.state === "inactive") finish();
        else {
          recorder.addEventListener("stop", finish, { once: true });
          recorder.stop();
        }
      }).finally(() => {
        stopping = null;
      });
      return stopping;
    },
    async cancel() {
      if (cancelling) return cancelling;
      ++generation;
      cancelling = (async () => {
        if (recorder && recorder.state !== "inactive")
          await new Promise((resolve) => {
            recorder.addEventListener("stop", resolve, { once: true });
            recorder.stop();
          });
        release();
        recorder = null;
      })();
      try {
        await cancelling;
      } finally {
        cancelling = null;
      }
    },
    async export() {
      if (!blob) throw new PlatformError("FAILED", "Record a clip first.");
      if (exportClip) return exportClip(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recording.${blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm"}`;
      document.body.append(link);
      link.click();
      link.remove();
      return { requested: true };
    },
  };
}
