# Tourtastic

## Deployment Guide

### Backend Deployment (Render)

1. Create a new account on [Render](https://render.com) if you haven't already.

2. From your Render dashboard:
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. Configure the following settings:
   - Name: tourtastic-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Choose Free (or paid if needed)

4. Add the following environment variables in Render:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: production
   - Any other environment variables your app uses

### Frontend Deployment (Render)

1. From your Render dashboard:
   - Click "New +"
   - Select "Static Site"
   - Connect your GitHub repository

2. Configure the following:
   - Name: tourtastic-frontend
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

3. Add environment variables:
   - `VITE_API_URL`: URL of your backend service (e.g., https://tourtastic-backend.onrender.com)

### Important Notes

- Make sure to update the CORS settings in your backend to allow requests from your frontend domain
- The free tier may have cold starts, which is normal
- Monitor your application logs in the Render dashboard for any issues
- Make sure all your environment variables are properly set in Render
