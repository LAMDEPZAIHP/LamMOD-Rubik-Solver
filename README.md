# LamMOD Rubik Solver

Full-stack 3×3 Rubik solver with an HTML/CSS/JS frontend, Express backend, `cubejs` two-phase solver, camera color sampling, Three.js viewer, and server-side JSON history.

## Requirements
- Node.js 20+
- npm
- GitHub account (for Render deployment)

## Run locally
```bash
npm install
cp .env.example .env
npm start
```
Open `http://localhost:3000`.

## Deploy on Render
1. Create a GitHub repository and upload this project.
2. In Render, choose **New + → Web Service**, then connect the repository.
3. Use:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: Free (or another plan)
4. Deploy. Render supplies the `PORT` environment variable automatically.
5. Open the `onrender.com` URL. Camera access requires HTTPS, which Render provides.

## Input convention (important)
The solver expects 54 facelets in this exact order: **U R F D L B**, nine stickers per face, row-major as viewed directly while looking at each face. The centers must be U/R/F/D/L/B respectively. The UI fixes the center sticker for each selected face.

The camera scanner samples nine points from a fixed overlay. It is only a color-assistance feature: lighting, glare, camera white balance, and how the cube is held can produce incorrect colors. Always inspect and correct all 54 stickers before solving.

## API
- `GET /api/health` — service and solver initialization status
- `POST /api/validate` — body: `{ "facelets": "54-character-facelet-string" }`
- `POST /api/solve` — same body; returns solution and moves
- `GET /api/history` — recent solve history
- `DELETE /api/history` — clears history

## Notes / limitations
- `cubejs` initializes its two-phase lookup tables when the server starts. First startup can take longer.
- The 3D view is an interactive reference cube that can be dragged to change the viewing angle. It does not yet animate each face turn or mirror the entered sticker state.
- Scramble creates a random move sequence for the user to apply physically; it does not update the editable sticker grid.
- Render Free instances may sleep when idle. The local JSON history is not durable across ephemeral instance restarts/redeploys. Use a persistent disk or a database if durable history is required.
- This is a 3×3 solver, not a 2×2/4×4 solver.
