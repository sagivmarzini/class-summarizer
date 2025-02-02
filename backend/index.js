const DEFAULT_PORT = 3001;

const multer = require("multer");
const { transcribe } = require("./api");

const PORT = process.env.PORT || DEFAULT_PORT;

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Allow JSON data in requests

app.get("/api/test", (req, res) => {
  res.json({
    message:
      "Hello from server!\nThis is just a test don't take it too seriously",
  });
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  console.log("Transcribing audio: ", req.file.originalname);

  try {
    if (!req.file) throw new Error("No audio file provided");

    const transcription = await transcribe(req.file);
    if (!transcription) throw new Error("Failed to transcribe audio");

    res.json({
      transcription,
    });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
