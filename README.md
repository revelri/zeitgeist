# Emotion Hero

> *Motion as emotion, not as data.*

A real-time emotional visualization system that transforms collective human expression into visual poetry. Emotion Hero processes live emotional data streams and renders them through a WebGL2-powered ASCII art display, creating an ever-shifting field of feeling that breathes with the pulse of human experience.

---

## System Philosophy

### The Artistic Vision

Emotion Hero is not a data dashboard—it is a living canvas. Where traditional visualization systems treat emotion as numbers to be graphed, Emotion Hero treats emotion as motion to be felt. The system transforms raw emotional signals into fluid, organic visual experiences that mirror the subtle dance of human feeling.

The heart of this philosophy is the belief that emotion is not a static state but a continuous flow. Joy does not simply exist; it rises, peaks, and fades. Sadness is not a value; it deepens, lingers, and transforms. Emotion Hero captures this dynamism through careful design choices that prioritize feeling over precision.

### Motion as Emotion

The system treats every emotional change as a gesture—a movement with direction, intensity, and meaning. When the collective emotional state shifts toward **vibrant**, the field doesn't simply turn orange; it ripples with energy, the ASCII characters dance with increased velocity, and the temporal feedback creates lingering trails of excitement. When the mood drifts toward **melancholy**, the field slows, colors soften into muted slate blue, and the noise distortion subsides like a calm sea.

This approach transforms data into something visceral. You don't just *see* the emotions—you *feel* them through the rhythm of their movement.

### Collective Expression

Emotion Hero is designed for collective emotional visualization. Multiple data streams converge into a single unified field, where individual expressions blend into a shared emotional landscape. The system detects emotional keywords from various sources, aggregates them over time windows, and smooths the results into continuous signals that represent the emotional pulse of a community.

The visualization is not about any single person's feelings—it's about the emergent emotional state that arises when many voices speak together.

---

## Architecture Overview

Emotion Hero follows a clean separation of concerns with three main components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCES                                │
│  (Social media, chat logs, sentiment APIs, custom feeds, etc.)      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js)                             │
│  ┌──────────┐    ┌─────────────────┐    ┌──────────────────┐         │
│  │ Firehose │───▶│ EmotionDetector │───▶│ SignalProcessor │         │
│  └──────────┘    └─────────────────┘    └────────┬─────────┘         │
│                                                  │                    │
│                                                  ▼                    │
│                                          ┌───────────────┐           │
│                                          │   WsServer    │           │
│                                          └───────┬───────┘           │
└──────────────────────────────────────────┬───────────────────────────┘
                                           │ WebSocket
                                           │ (real-time)
                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (WebGL2)                             │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │ WebSocket    │───▶│ EmotionState    │───▶│ WebGL2 Renderer    │  │
│  │ Client       │    │ Manager          │    │ (ASCII Mask +      │  │
│  └──────────────┘    └──────────────────┘    │  Ping-Pong FBOs)    │  │
│                                             └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   DISPLAY   │
                                    │  (Browser)  │
                                    └─────────────┘
```

### Backend Components

- **[`Firehose`](backend/firehose.ts:1)** – Ingests raw data from multiple sources with automatic retry logic
- **[`EmotionDetector`](backend/emotionDetector.ts:1)** – Matches keywords to emotions using sliding time windows
- **[`SignalProcessor`](backend/signalProcessor.ts:1)** – Applies rolling median and EMA smoothing for fluid transitions
- **[`WsServer`](backend/wsServer.ts:1)** – Broadcasts processed emotional states via WebSocket

### Frontend Components

- **[`WebSocket Client`](frontend/main.ts:105)** – Receives real-time emotional data with automatic reconnection
- **[`EmotionStateManager`](frontend/emotionStateManager.ts:1)** – Handles client-side interpolation and degradation mode
- **[`Renderer`](frontend/gl/renderer.ts:1)** – WebGL2 rendering pipeline with ping-pong framebuffers
- **[`ASCIIMask`](frontend/gl/asciiMask.ts:1)** – Generates ASCII art textures from character grids

### Shared Code

- **[`emotions.ts`](shared/emotions.ts:1)** – Emotion definitions, colors, and keywords
- **[`types.ts`](shared/types.ts:1)** – TypeScript interfaces for communication protocols

---

## Emotions

Emotion Hero tracks five fundamental emotional states, each with its own color palette and keyword associations:

| Emotion | Color (sRGB) | Keywords | Visual Character |
|---------|--------------|----------|------------------|
| **Serene** | `[135, 169, 158]` (Muted teal-green) | calm, peaceful, tranquil, relaxed, quiet, still, gentle | Slow, steady motion with gentle undulation |
| **Vibrant** | `[173, 147, 135]` (Soft terracotta) | energetic, lively, dynamic, active, awake, alert, spirited | Fast, energetic ripples with strong trails |
| **Melancholy** | `[145, 155, 175]` (Muted slate blue) | sad, somber, pensive, wistful, reflective, blue, down | Subtle, slow movement with minimal distortion |
| **Curious** | `[165, 160, 145]` (Soft warm gray) | interested, inquisitive, wondering, exploring, attentive, eager | Moderate motion with inquisitive wavering |
| **Content** | `[155, 165, 145]` (Muted olive green) | satisfied, happy, pleased, fulfilled, grateful, comfortable | Balanced, gentle flow with soft persistence |

### Emotion Detection

Each emotion is detected by scanning incoming data streams for associated keywords. The [`EmotionDetector`](backend/emotionDetector.ts:1) maintains a sliding time window (default: 1000ms) and counts keyword matches for each emotion. These raw counts are converted to ratios (proportions of total emotional content) and passed to the signal processor.

For example, if within one second the system detects:
- 5 "calm" matches → **serene**
- 3 "energetic" matches → **vibrant**
- 2 "sad" matches → **melancholy**

The ratios would be: serene = 0.5, vibrant = 0.3, melancholy = 0.2

### Emotion Visualization

Each emotion is visualized through multiple channels:

1. **Color** – Blended in OKLab perceptual color space for natural mixing
2. **Velocity** – Rate of change affects noise distortion and temporal feedback
3. **Intensity** – Determines contribution to the blended color field

The visualization is not binary—emotions coexist and blend. A moment might be 60% serene, 30% content, and 10% curious, creating a unique visual signature for that instant.

---

## Technical Details

### WebSocket Communication

The backend and frontend communicate via WebSocket for real-time data streaming:

```typescript
// Backend: WsServer broadcasts emotional state
wsServer.updateState({
  serene: { value: 0.6, velocity: 0.02 },
  vibrant: { value: 0.3, velocity: 0.05 },
  melancholy: { value: 0.1, velocity: -0.01 },
  curious: { value: 0.0, velocity: 0.0 },
  content: { value: 0.0, velocity: 0.0 }
});

// Frontend: WebSocket client receives and processes
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  emotionStateManager.updateFromBackend(data.emotions, data.timestamp);
};
```

Messages include:
- `emotions` – Record of emotion IDs to `{ value, velocity }` states
- `timestamp` – Millisecond timestamp for staleness detection

The frontend implements exponential backoff reconnection (1000ms → 30000ms max) and degradation mode for graceful handling of disconnections.

### Signal Smoothing

Raw emotional ratios are smoothed using a two-stage algorithm:

1. **Rolling Median** – Removes sudden spikes from raw data
   - Window size: 5 samples
   - Captures emotional rhythm without losing responsiveness

2. **Exponential Moving Average (EMA)** – Adds viscosity for fluid transitions
   - Alpha factor: 0.3
   - Formula: `value += (median - value) * alpha`

```typescript
// From SignalProcessor.process()
state.history.push(rawValue);
if (state.history.length > config.windowSize) {
  state.history.shift();
}
const median = calculateMedian(state.history);
state.value += (median - state.value) * config.alpha;
const velocity = state.value - state.prevValue;
```

This combination creates smooth, organic emotional transitions that feel intentional and meaningful—like water flowing rather than a light flickering.

### Client-Side Interpolation

The frontend applies additional smoothing using linear interpolation (lerp):

```typescript
// From EmotionStateManager.interpolate()
const diff = state.targetValue - state.currentValue;
const change = diff * config.lerpFactor;  // lerpFactor: 0.05
state.currentValue += change;
state.currentVelocity = (state.currentValue - state.prevValue) / deltaTime;
```

Recommended `lerpFactor`: 0.03–0.08
- Higher values: more responsive, but may feel jittery
- Lower values: smoother, but may feel sluggish

### Degradation Mode

When the WebSocket connection is lost, the system enters degradation mode instead of freezing abruptly:

```typescript
// Exponential decay rates
velocityDecayRate: 0.95,  // 5% decay per frame
valueDecayRate: 0.98,    // 2% decay per frame
degradationTimeout: 2000 // 2 seconds before activation
```

This creates a poetic fade effect:
1. Movement stops first (velocity decays faster)
2. Color slowly returns to neutral gray
3. The field breathes its last breath before falling silent

### WebGL2 Rendering

The visualization uses WebGL2 with a two-pass rendering pipeline:

#### Pass 1: Render to Framebuffer
- Bind ping-pong framebuffer (alternating between two FBOs)
- Sample ASCII mask texture
- Apply simplex noise distortion based on emotion velocities
- Blend emotion colors in OKLab space
- Apply temporal feedback from previous frame
- Render fullscreen quad

#### Pass 2: Display to Screen
- Bind default framebuffer
- Disable temporal feedback
- Sample the framebuffer texture from Pass 1
- Render fullscreen quad to display

```typescript
// Ping-pong framebuffer swapping
const prevFboIndex = (this.currentFboIndex + 1) % 2;
gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[this.currentFboIndex]);
// ... render ...
this.currentFboIndex = prevFboIndex;
```

### Ping-Pong Framebuffers

Temporal feedback is implemented using two framebuffers that swap each frame:

- **Framebuffer A** – Holds the current frame being rendered
- **Framebuffer B** – Holds the previous frame for feedback blending

When rendering Frame N:
1. Read from Framebuffer N-1 (previous frame)
2. Blend with current emotion data
3. Write to Framebuffer N
4. Swap: Framebuffer N becomes the "previous" for next frame

This creates trailing/ghosting effects where strong emotions leave longer echoes.

### Simplex Noise Distortion

The field is distorted using 2D simplex noise with two octaves:

```glsl
// From emotionFieldFragmentShaderSource
float noiseScale = 0.5 + totalVelocity * 1.5;  // 0.5 to 2.0
float distortionStrength = totalVelocity * 0.03;  // Max 3%

vec2 noiseOffset1 = vec2(
  snoise(v_uv * noiseScale + u_time * 0.2),
  snoise(v_uv * noiseScale + u_time * 0.2 + 100.0)
);
vec2 noiseOffset2 = vec2(
  snoise(v_uv * noiseScale * 2.0 + u_time * 0.3 + 50.0),
  snoise(v_uv * noiseScale * 2.0 + u_time * 0.3 + 150.0)
) * 0.5;
vec2 warpedUV = v_uv + (noiseOffset1 + noiseOffset2) * distortionStrength;
```

- **Noise scale**: 0.5–2.0 (controlled by total velocity)
- **Distortion strength**: Up to 3% (controlled by total velocity)
- **Time offset**: Creates continuous flowing motion

This adds organic movement—like wind through leaves or waves on water.

### OKLab Color Space

Emotion colors are blended in OKLab perceptual color space rather than RGB:

```glsl
// Pipeline: sRGB → linear → OKLab → blend → linear → sRGB
vec3 lab = srgbToOkLab(u_emotionColors[i]);
blendedLab += lab * u_emotionValues[i];
vec3 blendedColor = okLabToSrgb(blendedLab / totalWeight);
```

**Why OKLab?**
- Perceptually uniform: equal numeric changes produce equal perceived changes
- Natural blending: joy (yellow) + sadness (blue) → serene teal (not muddy gray)
- Luminance preservation: brightness is handled separately from hue/saturation

This ensures that mixed emotions feel natural and organic, mirroring how colors blend in nature.

### ASCII Mask Texture

The visualization is rendered through an ASCII art mask:

```typescript
// Heart ASCII art from main.ts
const heartAsciiArt = `****** ******
 ********** **********
 ************ ************
 ***************************
  *************************
 *********************
 *****************
 *************
 *********
 *****
 *`;

const asciiMask = new ASCIIMask();
const maskTexture = asciiMask.generateMask(heartAsciiArt, 512, 512);
renderer.setASCIIMask(maskTexture);
```

The mask is generated by:
1. Rendering ASCII glyphs to an offscreen Canvas2D
2. Uploading the canvas as an RGBA texture to WebGL
3. Sampling the texture's alpha channel in the fragment shader

**Why ASCII art?**
- Symbolic language of emotion: characters represent human expression
- Nostalgic aesthetic: evokes terminal art and early computing
- Universal symbol: the heart shape is immediately recognizable
- Bridge between digital and human: makes invisible signals visible

---

## Installation & Running

### Prerequisites

- **Node.js** ≥ 18.0.0
- **npm** (comes with Node.js)
- A modern web browser with WebGL2 support

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd emotion-hero
   ```

2. Install dependencies (using npm workspaces):
   ```bash
   npm install
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

### Running the Backend

The backend server listens on port 8080 by default.

```bash
# From the root directory
cd backend
npm run build  # Compile TypeScript to dist/
npm start      # Run: node dist/index.js
```

The backend will:
- Initialize all components (Firehose, EmotionDetector, SignalProcessor, WsServer)
- Start the WebSocket server on `ws://localhost:8080`
- Begin processing data from configured sources
- Broadcast emotional states every 100ms

### Running the Frontend

The frontend is served as a static HTML file.

```bash
# From the root directory
cd frontend
npm run build  # Compile TypeScript to dist/
npm run serve  # Start HTTP server on port 8080
```

Then open your browser to:
```
http://localhost:8080
```

The frontend will:
- Connect to `ws://localhost:8080` for real-time data
- Initialize WebGL2 renderer with ASCII mask
- Start the render loop (~60 FPS)
- Handle automatic reconnection with exponential backoff

### Development Mode

For development with hot-reloading:

```bash
# Terminal 1: Backend with watch mode
cd backend
npm run dev  # tsc --watch

# Terminal 2: Frontend with watch mode
cd frontend
npm run dev  # tsc --watch
npm run serve
```

### Building for Production

```bash
# From root directory
npm run build  # Builds all packages
```

The compiled JavaScript will be in:
- `backend/dist/` – Backend entry point
- `frontend/dist/` – Frontend client code

---

## Project Structure

```
emotion-hero/
├── package.json              # Root workspace configuration
├── tsconfig.json             # Root TypeScript configuration
├── README.md                 # This file
│
├── backend/                  # Node.js backend server
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.ts              # Entry point & orchestration
│   ├── firehose.ts           # Data ingestion
│   ├── emotionDetector.ts    # Keyword matching & ratio calculation
│   ├── signalProcessor.ts    # Signal smoothing (median + EMA)
│   └── wsServer.ts           # WebSocket server
│
├── frontend/                 # WebGL2 frontend client
│   ├── package.json
│   ├── tsconfig.json
│   ├── index.html            # HTML entry point
│   ├── main.ts               # Client entry point & render loop
│   ├── emotionStateManager.ts # Client-side interpolation
│   └── gl/                   # WebGL2 rendering
│       ├── renderer.ts       # WebGL2 renderer class
│       ├── shaders.ts        # GLSL vertex/fragment shaders
│       └── asciiMask.ts      # ASCII mask texture generation
│
└── shared/                   # Shared TypeScript code
    ├── package.json
    ├── tsconfig.json
    ├── emotions.ts           # Emotion definitions & colors
    └── types.ts              # Shared types & interfaces
```

### Entrypoints

- **Backend**: [`backend/index.ts`](backend/index.ts:1) – Starts the backend system
- **Frontend**: [`frontend/main.ts`](frontend/main.ts:1) – Initializes WebGL2 and connects to backend

---

## Artistic Design Decisions

### Why OKLab Color Space?

RGB is a mechanical construct designed for display hardware, not human perception. Blending colors in RGB produces muddy, unnatural results—mixing yellow joy and blue sadness creates an unappealing gray-brown.

OKLab is a perceptually uniform color space that mirrors how humans actually see color. In OKLab:
- Equal numeric changes produce equal perceived changes
- Luminance (brightness) is separate from hue and saturation
- Mixed colors feel natural and organic

When joy (yellow) blends with sadness (blue) in OKLab, the result is a serene teal—a color that genuinely feels like the emotional midpoint between the two. This creates an emotional palette that feels alive, breathing, and authentic.

### Why Temporal Feedback?

Emotions don't exist in isolated instants—they persist, echo, and transform. Temporal feedback (the ghosting/trailing effect) creates visual memory within the field.

Strong emotions leave longer trails, subtle ones fade quickly. This mirrors how intense feelings linger in our minds while gentle moods pass like whispers. The feedback strength is velocity-based:
- High velocity (sudden emotion surge) → Strong feedback (long trails)
- Low velocity (steady emotion) → Weak feedback (short trails)

The maximum feedback strength is capped at 0.95 to prevent the field from becoming completely frozen. This ensures the visualization remains responsive while still creating emotional resonance through persistence.

### Why ASCII Art?

ASCII art transforms raw pixels into a symbolic language of emotion. Each character is a glyph—a mark with meaning, not just a colored rectangle.

The heart shape is a universal symbol of emotion and human connection. By rendering emotions through this mask, we create a bridge between digital signals and human emotional expression. The monospace characters evoke nostalgia for early computing, while the heart provides an immediately recognizable emotional anchor.

ASCII art also creates a unique visual texture—the grid of characters adds structure and rhythm to the field, making the emotional movements more perceptible. The characters themselves become the medium through which emotion flows.

### Why Specific Parameter Values?

Every parameter in Emotion Hero was chosen through careful consideration of its emotional effect:

#### Signal Processing
- **Window size: 5 samples** – Captures the immediate emotional rhythm without losing responsiveness. Five samples represent a heartbeat of feeling.
- **Alpha: 0.3** – Gives emotions a gentle viscosity, like flowing water. Higher values make emotions snap and jitter; lower values make them lethargic.

#### Interpolation
- **Lerp factor: 0.05** – Creates smooth, deliberate transitions where feelings rise and fall with the grace of a tide.
- **Degradation timeout: 2000ms** – Allows the viewer to notice disconnection without panic. The field breathes its last breath before falling silent.
- **Velocity decay: 0.95** – Movement stops before color, creating a poetic effect like a dancer freezing mid-step.
- **Value decay: 0.98** – Emotions fade slowly, like colors at sunset. The field doesn't go black; it gently returns to neutral gray.

#### Noise Distortion
- **Scale: 0.5–2.0** – Creates gentle undulation, not chaotic turbulence. Too much noise feels like static; too little feels dead.
- **Distortion: 3% max** – Preserves character while adding life. ASCII characters remain recognizable but dance with emotional energy.

#### Temporal Feedback
- **Max strength: 0.95** – Ensures the field never becomes completely frozen. Strong emotions persist, but the visualization remains responsive.

These values are not arbitrary—they are the result of balancing competing emotional needs: responsiveness vs. smoothness, persistence vs. change, intensity vs. subtlety.

---

## Development Philosophy

Emotion Hero embraces a minimal, framework-free approach to maintain maximum control over performance and visualization quality:

- **No frontend frameworks** – Pure WebGL2 for maximum rendering control
- **No build tools beyond TypeScript** – Simple compilation, no bundling overhead
- **No external dependencies** – Only `ws` for WebSocket (backend)
- **Clear separation of concerns** – Each module has a single, well-defined responsibility
- **TypeScript end-to-end** – Shared types ensure consistency across backend and frontend

This philosophy keeps the codebase small, understandable, and performant. Every line of code serves the artistic vision of transforming motion into emotion.

---

## License

[Specify your license here]

---

## Contributing

Contributions are welcome! Please ensure that:
- Code follows the existing style and structure
- Artistic intent is preserved in design decisions
- Documentation is updated for any new features
- Tests are added for new functionality (if applicable)

---

## Acknowledgments

Emotion Hero is inspired by the belief that technology can be a medium for emotional expression, not just a tool for data processing. It seeks to create visual experiences that feel human, not mechanical.

The system draws from techniques in:
- Perceptual color theory (OKLab)
- Signal processing (median filtering, EMA)
- Computer graphics (ping-pong framebuffers, noise-based distortion)
- ASCII art aesthetics

May your emotions flow like water, and may your visualizations breathe with life.
