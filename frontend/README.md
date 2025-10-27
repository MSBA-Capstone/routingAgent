# Environment Variables (.env)

To configure the API endpoint for local development and production, create a `.env` file in the `frontend` folder (next to `package.json`).

Example `.env` for local development:

```
VITE_API_BASE_URL=http://localhost:8000
```

For deployment (e.g., Vercel), set `VITE_API_BASE_URL` in your project settings to your backend URL, such as:

```
VITE_API_BASE_URL=https://your-heroku-app.herokuapp.com
```

This allows the frontend to call the correct backend API depending on the environment.
