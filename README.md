# NeutralEye — Web Frontend

## Overview
The NeutralEye Web Frontend is the user-facing website that allows users to analyze articles for potential bias via URL input or pasted text.

## Role in the System
This repository handles all UI and user interaction for the web product.  
It communicates with the NeutralEye Web Backend for all analysis operations.

## How It Works
- User inputs a URL or text
- The frontend sends a request to the backend API
- The backend processes the request using AI
- The frontend displays structured bias analysis results

## Tech Stack
- Next.js
- React
- CSS Modules

## Setup
Create `.env.local`:
NEXT_PUBLIC_NEUTRALEYE_API_URL=http://localhost:3000

Run locally:
npm install
npm run dev

## Notes
- Must point to `neutraleye-web-backend`
- Does not interact with extension backend
- Backend URL is controlled via environment variable