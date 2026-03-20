# SpotLog API

## Scripts

- `npm run dev` starts the API in watch mode
- `npm run build` compiles TypeScript
- `npm run start` runs the API through `tsx`

## Runtime Behavior

- Must listen on `process.env.PORT`
- Defaults to port `8080`
- Exposes:
  - `GET /health`
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /api/spots`
  - `POST /api/spots`
  - `GET /api/spots/:id`
  - `PATCH /api/spots/:id`
  - `DELETE /api/spots/:id`
  - `POST /api/uploads`
  - `GET /api/activity`
