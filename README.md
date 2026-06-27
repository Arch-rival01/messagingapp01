# Real-Time Messaging App

A modern, full-stack 1-on-1 direct messaging application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io. 

Designed with a sleek, minimalistic UI inspired by Telegram and iMessage.

## ✨ Features
* **1-on-1 Direct Messaging:** Private chat rooms automatically generated between two users.
* **Real-Time Communication:** Instant message delivery and broadcasting using WebSockets (Socket.io).
* **Live Online Status:** See exactly who is currently online with a dynamic green status indicator.
* **Last Message Previews:** The sidebar instantly shows the most recent message you exchanged with every contact.
* **Smart Timestamps:** Beautifully formatted message timestamps (e.g., `10:45 AM` for today, `Yesterday` for older messages).
* **Google Authentication:** Secure and seamless login powered by Firebase Auth.
* **Modern UI:** Built from the ground up using Tailwind CSS for a premium, responsive design.

## 🛠️ Tech Stack
* **Frontend:** React, React Router v6, Tailwind CSS, Material UI (Icons), Socket.io-client.
* **Backend:** Node.js, Express, Socket.io.
* **Database:** MongoDB (Mongoose), MongoDB Atlas.
* **Authentication:** Firebase (Google Provider).

## 🚀 Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/messagingapp01.git
cd messagingapp01
```

### 2. Backend Setup
```bash
cd messaging-app-backend
npm install
```
* Create a `.env` file in the backend folder and add your MongoDB connection string:
  `MONGO_URI=mongodb+srv://<user>:<password>@cluster...`
* Start the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../messaging-app-mern/messaging-app-frontend
npm install
```
* Create a `.env` file in the frontend folder and add your Firebase configuration and API URL:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_API_URL=http://localhost:9000
```
* Start the React app:
```bash
npm start
```

## 🌐 Deployment
The app is fully prepared for production deployment:
* **Backend**: Deploy the `messaging-app-backend` folder to [Railway.app](https://railway.app/). Ensure you set the `MONGO_URI` environment variable.
* **Frontend**: Deploy the `messaging-app-frontend` folder to [Vercel](https://vercel.com/). Ensure you set the `REACT_APP_API_URL` environment variable to point to your Railway backend URL.
