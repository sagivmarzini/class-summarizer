"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressAudioBuffer = compressAudioBuffer;
exports.splitAudioFile = splitAudioFile;
exports.transcribe = transcribe;
exports.summarizeTranscriptionGPT = summarizeTranscriptionGPT;
exports.summarizeTranscriptionClaude = summarizeTranscriptionClaude;
var openai_1 = require("openai");
var sdk_1 = require("@anthropic-ai/sdk");
var wav_worker_1 = require("./wav-worker");
var dotenv = require("dotenv");
dotenv.config();
var AUDIO_SLICE_AMOUNT = 5;
var openaiApiKey = process.env.OPENAI_API_KEY;
var anthropicApiKey = process.env.ANTHROPIC_API_KEY;
var openai = new openai_1.default({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true,
});
var anthropic = new sdk_1.default({
    apiKey: anthropicApiKey,
});
function compressAudioBuffer(buffer_1) {
    return __awaiter(this, arguments, void 0, function (buffer, targetSampleRate) {
        var offlineContext, source;
        if (targetSampleRate === void 0) { targetSampleRate = 16000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    offlineContext = new OfflineAudioContext(1, // mono
                    Math.ceil(buffer.duration * targetSampleRate), targetSampleRate);
                    source = offlineContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(offlineContext.destination);
                    source.start(0);
                    return [4 /*yield*/, offlineContext.startRendering()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function splitAudioFile(file) {
    return __awaiter(this, void 0, void 0, function () {
        var audioContext, arrayBuffer, audioBuffer, compressedBuffer, durationInSeconds, chunkDuration, chunks, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    audioContext = new AudioContext();
                    return [4 /*yield*/, file.arrayBuffer()];
                case 1:
                    arrayBuffer = _a.sent();
                    return [4 /*yield*/, audioContext.decodeAudioData(arrayBuffer)];
                case 2:
                    audioBuffer = _a.sent();
                    return [4 /*yield*/, compressAudioBuffer(audioBuffer)];
                case 3:
                    compressedBuffer = _a.sent();
                    durationInSeconds = compressedBuffer.duration;
                    chunkDuration = durationInSeconds / AUDIO_SLICE_AMOUNT;
                    console.log("Compressed audio - Duration:", durationInSeconds / 60, "Sample rate:", compressedBuffer.sampleRate);
                    chunks = [];
                    _loop_1 = function (i) {
                        var startTime, endTime, currentChunkDuration, offlineContext, source, renderedBuffer, audioData, wavBlob;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    startTime = i * chunkDuration;
                                    endTime = Math.min((i + 1) * chunkDuration, durationInSeconds);
                                    currentChunkDuration = endTime - startTime;
                                    offlineContext = new OfflineAudioContext(1, // mono
                                    Math.floor(currentChunkDuration * compressedBuffer.sampleRate), compressedBuffer.sampleRate);
                                    source = offlineContext.createBufferSource();
                                    source.buffer = compressedBuffer;
                                    source.connect(offlineContext.destination);
                                    source.start(0, startTime, currentChunkDuration);
                                    return [4 /*yield*/, offlineContext.startRendering()];
                                case 1:
                                    renderedBuffer = _b.sent();
                                    audioData = {
                                        numberOfChannels: renderedBuffer.numberOfChannels,
                                        sampleRate: renderedBuffer.sampleRate,
                                        length: renderedBuffer.length,
                                        channelData: Array.from({ length: renderedBuffer.numberOfChannels }, function (_, channel) { return renderedBuffer.getChannelData(channel).slice(); }),
                                    };
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            var worker = new Worker(URL.createObjectURL(new Blob(["(".concat(wav_worker_1.wavWorker.toString(), ")()")], {
                                                type: "application/javascript",
                                            })));
                                            worker.onmessage = function (e) { return resolve(e.data); };
                                            worker.postMessage({ buffer: audioData });
                                        })];
                                case 2:
                                    wavBlob = _b.sent();
                                    chunks.push(wavBlob);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < AUDIO_SLICE_AMOUNT)) return [3 /*break*/, 7];
                    return [5 /*yield**/, _loop_1(i)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, chunks];
            }
        });
    });
}
function transcribe(audioFile) {
    return __awaiter(this, void 0, void 0, function () {
        var transcription, _a, _b, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("Transcribing audio: ", audioFile.name);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 4, , 5]);
                    _b = (_a = openai.audio.transcriptions).create;
                    _c = {};
                    return [4 /*yield*/, (0, openai_1.toFile)(audioFile, "audio.wav", {
                            type: "audio/wav",
                        })];
                case 2: return [4 /*yield*/, _b.apply(_a, [(_c.file = _d.sent(),
                            _c.model = "whisper-1",
                            _c.language = "he",
                            _c.prompt = "This transcript is of a teacher from a class, in Israel, in Hebrew.\n        There will be Hebrew names, verses from bible and Gemarah, etc.",
                            _c)])];
                case 3:
                    transcription = _d.sent();
                    return [2 /*return*/, transcription.text];
                case 4:
                    error_1 = _d.sent();
                    console.error("Error during transcription:", error_1);
                    throw error_1;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function summarizeTranscriptionGPT(transcription) {
    return __awaiter(this, void 0, void 0, function () {
        var response, text, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Summarizing transcription...");
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "system",
                                    content: "\u05DE\u05E6\u05D5\u05E8\u05E3 \u05EA\u05DE\u05DC\u05D9\u05DC \u05E9\u05DC \u05E9\u05D9\u05E2\u05D5\u05E8. \u05E8\u05D5\u05D1 \u05D4\u05EA\u05DE\u05DC\u05D9\u05DC \u05D9\u05D4\u05D9\u05D4 \u05DE\u05D9\u05DC\u05D5\u05EA\u05D9\u05D5 \u05E9\u05DC \u05D4\u05DE\u05D5\u05E8\u05D4 \u05DE\u05D3\u05D1\u05E8.\n            \u05D4\u05EA\u05DE\u05DC\u05D9\u05DC \u05E2\u05DC\u05D5\u05DC \u05DC\u05D4\u05D9\u05D5\u05EA \u05E2\u05DD \u05D8\u05E2\u05D5\u05D9\u05D5\u05EA \u05D0\u05D1\u05DC \u05D0\u05EA\u05D4 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05D1\u05D9\u05DF \u05DE\u05D4 \u05D4\u05DE\u05D5\u05E8\u05D4 \u05D0\u05DE\u05E8 \u05D1\u05DE\u05E7\u05D5\u05E8.\n            \u05D0\u05EA\u05D4 \u05EA\u05DC\u05DE\u05D9\u05D3 \u05D7\u05E8\u05D5\u05E5 \u05D5\u05D2\u05D0\u05D5\u05DF \u05E9\u05EA\u05DE\u05D9\u05D3 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E9\u05D9\u05D8\u05EA \u05E7\u05D5\u05E8\u05E0\u05DC (Cornell's Method) \u05DC\u05E1\u05D9\u05DB\u05D5\u05DD \u05E9\u05D9\u05E2\u05D5\u05E8 \u05D1\u05DE\u05D7\u05D1\u05E8\u05EA.\n            \u05D0\u05EA\u05D4 \u05E6\u05E8\u05D9\u05DA \u05DC\u05E7\u05D7\u05EA \u05D0\u05EA \u05DB\u05DC \u05D4\u05EA\u05D5\u05DB\u05DF \u05E9\u05DC \u05D4\u05E9\u05D9\u05E2\u05D5\u05E8 \u05D5\u05D4\u05D7\u05D5\u05DE\u05E8 \u05D4\u05E0\u05DC\u05DE\u05D3 \u05D5\u05DC\u05DB\u05EA\u05D5\u05D1 \u05D0\u05D5\u05EA\u05D5 \u05D1\u05D0\u05D5\u05E8\u05DA \u05E9\u05D9\u05DE\u05DC\u05D0 \u05D3\u05E3 \u05E9\u05DC\u05DD \u05E9\u05DC \u05DE\u05D7\u05D1\u05E8\u05EA (A4).\n            \u05EA\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E9\u05D9\u05D8\u05EA \u05E7\u05D5\u05E8\u05E0\u05DC \u05DB\u05D3\u05D9 \u05DC\u05E1\u05DB\u05DD \u05D0\u05EA \u05D4\u05D7\u05D5\u05DE\u05E8 \u05DC:\n            - \u05DB\u05D5\u05EA\u05E8\u05EA\n            - \u05EA\u05D5\u05DB\u05DF\n            - \u05E0\u05E7\u05D5\u05D3\u05D5\u05EA, \u05E8\u05DE\u05D6\u05D9\u05DD, \u05E9\u05D0\u05DC\u05D5\u05EA, \u05DE\u05D5\u05E9\u05D2\u05D9 \u05DE\u05E4\u05EA\u05D7\n            - \u05E1\u05D9\u05DB\u05D5\u05DD\n            \u05D3\u05DE\u05D9\u05D9\u05DF \u05E9\u05D4\u05D3\u05E3 \u05DE\u05D7\u05D5\u05DC\u05E7 \u05DC2 \u05E9\u05DC\u05D9\u05E9 \u05D4\u05EA\u05D5\u05DB\u05DF, \u05D1\u05E6\u05D3 \u05D4\u05E0\u05E7\u05D5\u05D3\u05D5\u05EA \u05D4\u05E6\u05D3\u05D3\u05D9\u05D5\u05EA, \u05D5\u05D1\u05E9\u05DC\u05D9\u05E9 \u05D4\u05EA\u05D7\u05EA\u05D5\u05DF \u05D4\u05E1\u05D9\u05DB\u05D5\u05DD \u05E9\u05DC \u05DB\u05DC \u05D4\u05D3\u05E3.\n            \u05EA\u05D7\u05D6\u05D9\u05E8 \u05EA\u05D5\u05DB\u05DF \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA \u05D1\u05DC\u05D1\u05D3. \u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05EA\u05D1\u05E0\u05D9\u05EA \u05D4\u05D1\u05D0\u05D4 \u05D5\u05EA\u05D7\u05D6\u05D9\u05E8 \u05D0\u05EA \u05D4\u05EA\u05E9\u05D5\u05D1\u05D4 \u05E9\u05DC\u05DA \u05E2\u05DD \u05E7\u05D5\u05D3 JSON \u05D1\u05DC\u05D1\u05D3 \u05D1\u05DC\u05D9 \u05E9\u05D5\u05DD \u05D4\u05E7\u05D3\u05DE\u05D4 \u05D0\u05D5 \u05EA\u05D5\u05D5\u05D9\u05DD \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD.\n            \u05E4\u05D5\u05E8\u05DE\u05D8 \u05D4\u05D8\u05E7\u05E1\u05D8: HTML\n            \u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05EA\u05D2\u05D9\u05DD \u05D4\u05D1\u05E1\u05D9\u05E1\u05D9\u05D9\u05DD \u05E9\u05DC HTML \u05DB\u05D3\u05D9 \u05DC\u05D9\u05E6\u05D5\u05E8 \u05E8\u05E9\u05D9\u05DE\u05D5\u05EA \u05E0\u05E7\u05D5\u05D3\u05D5\u05EA, \u05E8\u05E9\u05D9\u05DE\u05D5\u05EA \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8\u05D5\u05EA, \u05E7\u05D5 \u05EA\u05D7\u05EA\u05D5\u05DF, \u05D9\u05E8\u05D9\u05D3\u05D5\u05EA \u05E9\u05D5\u05E8\u05D4, \u05E4\u05E1\u05E7\u05D0\u05D5\u05EA, \u05D4\u05D3\u05D2\u05E9\u05D5\u05EA, \u05D0\u05D9\u05D8\u05DC\u05D9\u05D6\u05E6\u05D9\u05D4, \u05D5\u05DB\u05D5\u05F3.\n            {\n              \"title\": \"\"\n              \"notes\": \"\"\n              \"cues\": \"\"\n              \"summary\": \"\"  \n            }\n            ",
                                },
                                {
                                    role: "user",
                                    content: transcription,
                                },
                            ],
                            stream: false,
                        })];
                case 1:
                    response = _a.sent();
                    text = response.choices[0].message.content;
                    if (text === null) {
                        throw new Error("Failed to get response content");
                    }
                    console.log(text);
                    parsed = JSON.parse(text);
                    console.log(parsed);
                    return [2 /*return*/, text];
            }
        });
    });
}
function summarizeTranscriptionClaude(transcription) {
    return __awaiter(this, void 0, void 0, function () {
        var anthropic, response, text, sanitizedJson, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    anthropic = new sdk_1.default({
                        apiKey: process.env.ANTHROPIC_API_KEY,
                        dangerouslyAllowBrowser: true,
                    });
                    console.log("Summarizing transcription with Claude...");
                    return [4 /*yield*/, anthropic.messages.create({
                            model: "claude-3-sonnet-20240229",
                            max_tokens: 4096,
                            messages: [
                                {
                                    role: "user",
                                    content: "\n        You are a precise JSON generator and expert note-taker using the Cornell Method. Your task is to create a structured summary of a lecture transcript in Hebrew, formatted as a valid, parseable JSON object.\n\n        OUTPUT CONSTRAINTS:\n        1. Return ONLY a single-line JSON object\n        2. NO text before or after the JSON object\n        3. ALL strings must be properly escaped\n        4. NO line breaks, tabs, or control characters in strings\n        5. ALL HTML tags must be properly closed\n        6. Use ONLY double quotes for JSON properties and values\n\n        JSON STRUCTURE:\n        {\n          \"title\": \"Brief descriptive title\",\n          \"notes\": \"Main content with HTML formatting\",\n          \"cues\": \"Key points with HTML formatting\",\n          \"summary\": \"Concise summary with HTML formatting\"\n        }\n\n        CONTENT GUIDELINES:\n        - Title: Concise, informative (plain text, no HTML)\n        - Notes (Main Section):\n          * Comprehensive lecture content\n          * Use <p>, <ul>, <li>, <strong>, <em> tags\n          * Convert bullet points to <ul><li> format\n          * Preserve Hebrew text direction\n        - Cues (Side Section):\n          * Key terms with definitions\n          * Study questions\n          * Important concepts\n          * Use HTML lists for organization\n        - Summary (Bottom Section):\n          * Concise overview\n          * Key takeaways\n          * Single paragraph with <p> tags\n\n        HEBREW LANGUAGE RULES:\n        - All content must be in Hebrew\n        - Correct any obvious transcription errors in quotes/verses\n        - Maintain proper Hebrew text direction\n        - Use correct Hebrew punctuation\n\n        HTML FORMATTING:\n        - Valid tags: <p>, <ul>, <li>, <ol>, <strong>, <em>, <br>\n        - All tags must be properly closed\n        - No attributes in HTML tags\n        - No nested lists\n        - No custom CSS or classes\n\n        Example structure (but in Hebrew):\n        {\"title\": \"Topic Name\", \"notes\": \"<p>Main point</p><ul><li>Detail 1</li></ul>\", \"cues\": \"<ul><li>Key term: definition</li></ul>\", \"summary\": \"<p>Overview</p>\"}\n\n        Process the following transcript according to these specifications, ensuring the output is a valid, parseable JSON string:\n        ".concat(transcription, "\n            "),
                                },
                                {
                                    role: "user",
                                    content: transcription,
                                },
                            ],
                        })];
                case 1:
                    response = _a.sent();
                    text = response.content[0].text;
                    if (!text) {
                        throw new Error("Failed to get response content");
                    }
                    console.log(text);
                    sanitizedJson = sanitizeJsonResponse(text);
                    parsed = JSON.parse(sanitizedJson);
                    console.log(parsed);
                    return [2 /*return*/, sanitizedJson];
            }
        });
    });
}
function sanitizeJsonResponse(text) {
    // First extract just the JSON object
    var jsonStart = text.indexOf("{");
    var jsonEnd = text.lastIndexOf("}") + 1;
    var jsonText = text.slice(jsonStart, jsonEnd);
    // Remove any newlines and escape special characters
    jsonText = jsonText
        .replace(/\n/g, " ")
        .replace(/\r/g, " ")
        .replace(/\t/g, " ");
    // Ensure properties are properly quoted
    jsonText = jsonText.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    return jsonText;
}
