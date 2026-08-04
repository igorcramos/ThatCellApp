(function barcodeScannerModule(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BarcodeScanner = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBarcodeScanner() {
  const preferredNativeFormats = [
    "qr_code",
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "code_128",
    "code_39",
    "data_matrix",
  ];

  const preferredZxingFormats = [
    "QR_CODE",
    "EAN_13",
    "EAN_8",
    "UPC_A",
    "UPC_E",
    "CODE_128",
    "CODE_39",
    "DATA_MATRIX",
  ];

  function scannerReadiness(environment) {
    if (!environment?.isSecureContext) return "insecure";
    if (!environment.navigator?.mediaDevices?.getUserMedia) return "camera-unavailable";
    if (!availableDecoderKind(environment)) return "decoder-unavailable";
    return "ready";
  }

  function availableDecoderKind(environment) {
    if (typeof environment?.BarcodeDetector === "function") return "native";
    if (typeof environment?.ZXingBrowser?.BrowserMultiFormatReader === "function") return "zxing";
    return "";
  }

  async function createNativeDecoder(environment) {
    const BarcodeDetectorClass = environment.BarcodeDetector;
    let detector;
    if (typeof BarcodeDetectorClass.getSupportedFormats === "function") {
      const supported = await BarcodeDetectorClass.getSupportedFormats();
      const formats = preferredNativeFormats.filter((format) => supported.includes(format));
      detector = formats.length ? new BarcodeDetectorClass({ formats }) : new BarcodeDetectorClass();
    } else {
      detector = new BarcodeDetectorClass();
    }
    return {
      kind: "native",
      detect: (source) => detector.detect(source),
      dispose() {},
    };
  }

  function sourceDimensions(source) {
    return {
      width: Number(source?.videoWidth || source?.naturalWidth || source?.width || 0),
      height: Number(source?.videoHeight || source?.naturalHeight || source?.height || 0),
    };
  }

  function sourceCanvas(source, environment) {
    if (String(source?.tagName || "").toLowerCase() === "canvas") return source;
    const { width, height } = sourceDimensions(source);
    if (!width || !height) throw new Error("The camera or image is not ready yet.");
    const maximumDimension = 1280;
    const scale = Math.min(1, maximumDimension / Math.max(width, height));
    const canvas = environment.document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
    if (!context) throw new Error("The browser could not prepare the image for scanning.");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function isNoBarcodeError(error) {
    const name = String(error?.name || "");
    const message = String(error?.message || error || "");
    return ["NotFoundException", "ChecksumException", "FormatException"].includes(name)
      || /not found|no multiformat|checksum|could not decode/i.test(message);
  }

  function createZxingDecoder(environment) {
    const zxing = environment.ZXingBrowser;
    const reader = new zxing.BrowserMultiFormatReader();
    const formats = preferredZxingFormats
      .map((format) => zxing.BarcodeFormat?.[format])
      .filter((format) => format !== undefined);
    if (formats.length) reader.possibleFormats = formats;
    return {
      kind: "zxing",
      async detect(source) {
        const canvas = sourceCanvas(source, environment);
        try {
          const result = reader.decodeFromCanvas(canvas);
          const rawValue = result?.getText?.() ?? result?.text ?? "";
          return rawValue ? [{ rawValue: String(rawValue), format: result?.getBarcodeFormat?.() }] : [];
        } catch (error) {
          if (isNoBarcodeError(error)) return [];
          throw error;
        }
      },
      dispose() {
        reader.reset?.();
      },
    };
  }

  function createHybridDecoder(nativeDecoder, zxingDecoder) {
    let nativeMisses = 0;
    return {
      kind: "hybrid",
      async detect(source) {
        try {
          const nativeResults = await nativeDecoder.detect(source);
          if (nativeResults.length) return nativeResults;
          nativeMisses += 1;
          const isLiveVideo = String(source?.tagName || "").toLowerCase() === "video";
          if (isLiveVideo && nativeMisses % 3 !== 0) return [];
        } catch (_error) {
          // Some WebKit versions expose BarcodeDetector but fail when detect() is called.
        }
        return zxingDecoder.detect(source);
      },
      dispose() {
        nativeDecoder.dispose?.();
        zxingDecoder.dispose?.();
      },
    };
  }

  async function createDecoder(environment) {
    const kind = availableDecoderKind(environment);
    if (kind === "native") {
      try {
        const nativeDecoder = await createNativeDecoder(environment);
        if (typeof environment?.ZXingBrowser?.BrowserMultiFormatReader === "function") {
          return createHybridDecoder(nativeDecoder, createZxingDecoder(environment));
        }
        return nativeDecoder;
      } catch (error) {
        if (typeof environment?.ZXingBrowser?.BrowserMultiFormatReader !== "function") throw error;
      }
    }
    if (typeof environment?.ZXingBrowser?.BrowserMultiFormatReader === "function") return createZxingDecoder(environment);
    throw new Error("No barcode decoder is available.");
  }

  async function requestPreferredCameraStream(mediaDevices) {
    const preferredConstraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };
    try {
      return await mediaDevices.getUserMedia(preferredConstraints);
    } catch (error) {
      if (!["OverconstrainedError", "ConstraintNotSatisfiedError", "TypeError"].includes(error?.name)) throw error;
      return mediaDevices.getUserMedia({ video: true, audio: false });
    }
  }

  function requestCameraStream(mediaDevices, timeoutMilliseconds = 30000) {
    const request = requestPreferredCameraStream(mediaDevices);
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        settled = true;
        const error = new Error("The camera permission request timed out.");
        error.name = "CameraTimeoutError";
        reject(error);
      }, timeoutMilliseconds);
      request.then((stream) => {
        if (settled) {
          stream?.getTracks?.().forEach((track) => track.stop());
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(stream);
      }).catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  function classifyCameraError(error) {
    const name = String(error?.name || "");
    if (["NotAllowedError", "PermissionDeniedError"].includes(name)) return "permission-denied";
    if (["NotFoundError", "DevicesNotFoundError"].includes(name)) return "camera-not-found";
    if (["NotReadableError", "TrackStartError"].includes(name)) return "camera-busy";
    if (["OverconstrainedError", "ConstraintNotSatisfiedError"].includes(name)) return "camera-constraints";
    if (["SecurityError"].includes(name)) return "camera-security";
    if (["AbortError"].includes(name)) return "camera-aborted";
    if (["CameraTimeoutError"].includes(name)) return "camera-timeout";
    return "camera-error";
  }

  return {
    availableDecoderKind,
    classifyCameraError,
    createDecoder,
    isNoBarcodeError,
    requestCameraStream,
    scannerReadiness,
  };
});
