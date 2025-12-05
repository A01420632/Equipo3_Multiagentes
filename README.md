# 3D Multi‑Agent Traffic Simulation — Horses at Night

A stylized 3D night‑city where “Car” agents are visualized as animated horses. The Python backend (Flask/Solara) simulates traffic on a grid with A* pathfinding, lights, roads, obstacles, and destinations; the WebGL frontend (Vite) renders smooth movement, eased rotations, a starry skybox, an emissive moon, and point lights from green traffic lights.

## Team
- Mauricio Emilio Monroy González
- Diego de la Vega Saishio

---

## Highlights
- Animated horses (4‑frame walk cycle) with random colors (brown, white, black); idle when stopped.
- Smooth position interpolation (1000 ms) and eased rotations toward nextDir (ease‑in‑out).
- Night skybox, emissive moon, and point lights spawned only by green traffic lights.
- Building height variation, trees, and cobblestone roads placed under scene objects.
- City from a text map: ^ v < > (street direction), S/s (traffic lights), D (destinations), # (buildings), T (trees), R (decorative road).

---

## How to Run (two terminals)

Make sure your Python virtual environment is active in both terminals and you install dependencies via pip inside it.

Terminal 1 (Frontend)
- Activate virtual environment
- cd AgentsVisualization
- npm install
- npx vite

Terminal 2 (Backend, Flask)
- Activate virtual environment
- cd AgentsVisualization/Server/agents Server
- pip install flask flask_cors mesa solara
- python ./agents_server.py

By default:
- Frontend: http://localhost:5173
- Backend (Flask REST): http://localhost:8585

Optional: run the backend UI with Solara instead of plain Flask
- cd AgentsVisualization/Server/agents Server
- solara run app.py

Notes:
- Install Flask, Flask‑CORS, Mesa, and Solara via pip inside your virtual environment.
- Solara provides a Python web UI; Flask provides the REST endpoints consumed by the 3D frontend.

---

## What You’ll See
- Horses turn smoothly toward their upcoming direction (nextDir) and only commit orientation when the turn finishes.
- Interpolated movement with a subtle hop while walking.
- Green traffic lights spawn local point lights; red lights do not emit.
- Buildings and trees vary in scale; roads rendered under all objects for continuous coverage.

---

## System Overview
- Backend (Flask/Solara)
  - agents_server.py: REST endpoints (init, update, getCars/Lights/Obstacles/Destinations/Roads).
  - randomAgents/model.py: CityModel (grid parsing, spawn cycles, A* pathfinding, metrics).
  - randomAgents/agent.py: Car (horse), Traffic_Light, Destination, Obstacle, Road.
  - app.py (optional): Solara app to run with `solara run app.py`.

- Frontend (WebGL + Vite)
  - visualization/random_agents.js: rendering, animation, lighting, eased rotations.
  - libs/api_connection.js: fetch + sync with Flask.
  - Shaders: Phong, color, skybox, moon; assets: OBJ/MTL for horses, buildings, roads, lights, trees, moon.

---

## Car Agent (Horse) Behavior
- A* pathfinding
  - Heuristic: Manhattan distance.
  - Movement costs: straight = 1.0, forward‑diagonal = 1.4 (lane changes/turns).
  - Penalties: occupied cell +80 (avoidCars=True), traffic light wait = timeToChange × 0.2, against street flow +150.
- Finite State Machine
  - calculating → moving → waiting → unjamming → arrived.
  - Straight or forward‑diagonal moves only (no lateral/backward), prioritizing straight to avoid zig‑zag.
- Rotation and movement
  - Rotates toward nextDir with ease‑in‑out; commits currentDirection at end of turn.
  - Positions lerped over 1000 ms with a gentle vertical hop in motion.

---

## Double Buffering (Update Flow)
While a frame renders, a background update fetches new positions from Flask mid‑cycle (~500 ms of 1000 ms). Fresh data is ready just as interpolation ends, producing seamless motion without visual stalls.

---

## Metrics
- Active Cars
- Total Cars Arrived (totCarsArrived)
- Cars Arrived This Step (model‑level delta)
- Traffic Jams This Step (model‑level delta)
- Total Steps Taken (totStepsTaken)
- Total Semaphores Found (totSemaforosFound)
- Traffic Jams (embotellamientos)
- Average Steps Per Car = totStepsTaken / totCarsArrived

Per‑step metrics are computed as model deltas to avoid double counting.

---

## Map Rules
- ^ v < >: street direction per cell
- S/s: traffic lights (S = longer cycle, s = shorter)
- D: destinations (barracks)
- #: buildings (obstacles)
- T: trees
- R: decorative road (visual only)

---

## Tips & Troubleshooting
- No rotations: backend must return dirActual and nextDir; the frontend rotates toward nextDir.
- Agents overlap: consider per‑tick reservation in backend to avoid two agents picking the same target.
- Fewer than 4 spawns at corners: spawn occurs only on corner cells with Road and no Car; adjust map or widen corner search radius.
- Scene too dark: slightly increase ambient/diffuse on the main light or boost moon emissive.

---

