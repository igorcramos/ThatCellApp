const assert = require("node:assert/strict");
const scanner = require("../barcode-scanner.js");

async function run() {
  let assertions = 0;
  const check = (actual, expected) => {
    assert.deepEqual(actual, expected);
    assertions += 1;
  };

  check(scanner.scannerReadiness({ isSecureContext: false }), "insecure");
  check(scanner.scannerReadiness({ isSecureContext: true, navigator: {} }), "camera-unavailable");
  check(scanner.scannerReadiness({
    isSecureContext: true,
    navigator: { mediaDevices: { getUserMedia() {} } },
  }), "decoder-unavailable");

  const zxingEnvironment = {
    isSecureContext: true,
    navigator: { mediaDevices: { getUserMedia() {} } },
    ZXingBrowser: { BrowserMultiFormatReader: function Reader() {} },
  };
  check(scanner.scannerReadiness(zxingEnvironment), "ready");
  check(scanner.availableDecoderKind(zxingEnvironment), "zxing");

  check(scanner.classifyCameraError({ name: "NotAllowedError" }), "permission-denied");
  check(scanner.classifyCameraError({ name: "NotFoundError" }), "camera-not-found");
  check(scanner.classifyCameraError({ name: "NotReadableError" }), "camera-busy");
  check(scanner.classifyCameraError({ name: "SecurityError" }), "camera-security");
  check(scanner.classifyCameraError({ name: "CameraTimeoutError" }), "camera-timeout");

  const calls = [];
  const fallbackStream = { id: "fallback" };
  const fallbackMediaDevices = {
    async getUserMedia(constraints) {
      calls.push(constraints);
      if (calls.length === 1) {
        const error = new Error("unsupported constraints");
        error.name = "OverconstrainedError";
        throw error;
      }
      return fallbackStream;
    },
  };
  check(await scanner.requestCameraStream(fallbackMediaDevices, 100), fallbackStream);
  check(calls.length, 2);
  check(calls[0].video.facingMode, { ideal: "environment" });
  check(calls[1], { video: true, audio: false });

  let denialCalls = 0;
  const denied = new Error("denied");
  denied.name = "NotAllowedError";
  await assert.rejects(
    scanner.requestCameraStream({
      async getUserMedia() {
        denialCalls += 1;
        throw denied;
      },
    }, 100),
    { name: "NotAllowedError" }
  );
  assertions += 1;
  check(denialCalls, 1);

  let lateTrackStopped = false;
  await assert.rejects(
    scanner.requestCameraStream({
      getUserMedia() {
        return new Promise((resolve) => setTimeout(() => resolve({
          getTracks: () => [{ stop: () => { lateTrackStopped = true; } }],
        }), 15));
      },
    }, 1),
    { name: "CameraTimeoutError" }
  );
  assertions += 1;
  await new Promise((resolve) => setTimeout(resolve, 25));
  check(lateTrackStopped, true);

  class BrokenNativeDetector {
    static async getSupportedFormats() { return ["qr_code"]; }
    async detect() { throw new Error("WebKit detector failure"); }
  }
  class FakeZxingReader {
    decodeFromCanvas() { return { getText: () => "0123456789012" }; }
  }
  const hybrid = await scanner.createDecoder({
    BarcodeDetector: BrokenNativeDetector,
    ZXingBrowser: {
      BarcodeFormat: { QR_CODE: 11 },
      BrowserMultiFormatReader: FakeZxingReader,
    },
  });
  check(hybrid.kind, "hybrid");
  check(await hybrid.detect({ tagName: "CANVAS" }), [{ rawValue: "0123456789012", format: undefined }]);

  console.log(`barcode scanner: ${assertions} assertions passed`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
