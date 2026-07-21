# 🧟 Zombie: Tokyo Subway Outbreak

A 3D first-person zombie survival shooter set in a Tokyo subway station.
Built with **Next.js 15**, **React Three Fiber**, and **Three.js**.

![screenshot](https://img.shields.io/badge/status-playable-brightgreen)

---

## 🎮 One-Click to Play

### Prerequisites

- **Node.js 18+** → [nodejs.org](https://nodejs.org)
- **Your zombie 3D model** → `public/models/zombie.glb`

### Quick Start

```bash
# 1. Copy your zombie model into the project
cp ~/zombie.glb public/models/zombie.glb

# 2. Run the game (installs deps + starts server)
./start.sh          # Linux / macOS
start.bat           # Windows (double-click)
```

Then open **http://localhost:3000** in your browser.

### Manual Start

```bash
cp ~/zombie.glb public/models/zombie.glb
npm install
npm run dev
```

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look / Aim |
| Left Click | Shoot |
| R | Reload |
| Q / Scroll | Switch Weapon |
| Shift | Sprint |
| ESC | Pause |

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/scores/         # Leaderboard API (optional DB)
│   ├── api/settings/       # Settings persistence (optional DB)
│   ├── layout.tsx
│   └── page.tsx
├── components/game/        # Game logic & 3D components
│   ├── enemies/            # Zombie AI + GLB model loader
│   ├── level/              # Subway environment
│   ├── player/             # FPS controller
│   ├── weapons/            # Weapon models & viewmodel
│   ├── effects/            # Blood particles
│   └── ui/                 # HUD, menus, debug console
├── lib/game/               # State (Zustand), audio, weapons config
├── public/models/          # ← Place zombie.glb here
├── start.sh / start.bat    # One-click launchers
└── package.json
```

---

## 🧟 Zombie Model (`zombie.glb`)

The game loads your custom zombie model from `public/models/zombie.glb`.
Expected animation clips:

- **Arise** — rises from the ground (spawn)
- **Walking** / **Running** — movement
- **Attack** — melee swing
- **Dead**, **Alert**, **Unsteady_Walk** — optional extras

Scale: ~1.6–1.8m tall. Blender cm→m (Armature scale 0.01) is handled automatically.

---

## 🗄️ Database (Optional)

The game works fully **without a database**. Scores and settings use
in-memory defaults. If you want persistent leaderboards:

1. Set up a PostgreSQL/SQLite database
2. Add Prisma: `npm i @prisma/client && npm i -D prisma`
3. Create `prisma/schema.prisma` with `Score` and `Settings` models
4. Run `npx prisma generate && npx prisma db push`

---

## 🛠️ Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19** + **React Three Fiber 9**
- **Three.js** (r176)
- **Zustand** (game state)
- **Tailwind CSS 4** (UI styling)
- **Web Audio API** (procedural SFX — no audio files needed)

---

## License

MIT
