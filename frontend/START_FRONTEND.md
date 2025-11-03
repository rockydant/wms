# 🚀 How to Start Frontend

## Quick Start

```bash
cd frontend
npm start
```

Wait for the message:
```
➜  Local:   http://localhost:4200/
```

Then open your browser and navigate to: **http://localhost:4200**

## If Port 4200 is Already in Use

```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9

# Or use a different port
ng serve --port 4201
```

## Current Status

✅ Frontend server is starting...
✅ Backend is running on port 3000
✅ Database is running
✅ Redis is running

## Troubleshooting

If you see "ERR_CONNECTION_REFUSED":

1. **Check if server is running:**
   ```bash
   lsof -ti:4200
   ```

2. **Start the server:**
   ```bash
   cd frontend
   npm start
   ```

3. **Check for errors:**
   - Look at the terminal output
   - Check browser console (F12)
   - Verify dependencies are installed: `npm install`

4. **Check backend is running:**
   ```bash
   docker ps
   curl http://localhost:3000/api/v1/auth/login
   ```

## Development Server

The Angular dev server includes:
- ✅ Hot reload (automatic refresh on file changes)
- ✅ Source maps for debugging
- ✅ Live reload on port 4200
- ✅ Automatic compilation

**Server is currently starting. Please wait 30-60 seconds for initial compilation.**

Once you see "Application bundle generation complete", the app is ready!
