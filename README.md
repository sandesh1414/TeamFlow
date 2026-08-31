# TeamFlow

TeamFlow is a full-stack team collaboration and project management platform. It provides a workspace where teams can manage projects and tasks, communicate in real time, and collaborate from a single application.

**Live Demo:** https://team-flow-dun.vercel.app

## Features

* User authentication and authorization
* Project creation and management
* Task creation, assignment, and status tracking
* Drag-and-drop task management
* Team member management
* Real-time updates using Socket.IO
* File uploads and cloud storage
* AI-assisted functionality
* Responsive web interface

## Tech Stack

### Frontend

* React
* React Router
* Axios
* Socket.IO Client
* @hello-pangea/dnd

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO
* JWT
* bcryptjs
* Multer
* Cloudinary
* Google Gemini
* Groq

## Project Structure

```text
TeamFlow/
│
├── client/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── index.js
│   └── package.json
│
└── README.md
```

## Running Locally

### Prerequisites

* Node.js
* MongoDB
* npm

### Clone the repository

```bash
git clone https://github.com/sandesh1414/TeamFlow.git
cd TeamFlow
```

### Install dependencies

Frontend:

```bash
cd client
npm install
```

Backend:

```bash
cd ../server
npm install
```

### Environment Variables

Create a `.env` file in the `server` directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

Do not commit your `.env` file to the repository.

### Start the backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Start the frontend

In a separate terminal:

```bash
cd client
npm start
```

The frontend runs on:

```text
http://localhost:3000
```

## Deployment

The application is deployed using separate frontend and backend services.

| Component    | Platform   |
| ------------ | ---------- |
| Frontend     | Vercel     |
| Backend      | Render     |
| Database     | MongoDB    |
| File Storage | Cloudinary |

The frontend communicates with the deployed backend through REST APIs, while Socket.IO is used for real-time communication.

## Real-Time Communication

Socket.IO is used for real-time events between users. This allows changes made by one user to be reflected for other connected users without requiring a page refresh.

## Authentication

Authentication is handled using JWT tokens. Passwords are securely hashed using bcryptjs, and protected routes require valid authentication credentials.

## AI Integration

The backend includes integrations with Google Gemini and Groq for AI-related functionality within the application.


**Sandesh Keralikar**

Information Technology, NITK Surathkal

GitHub: https://github.com/sandesh1414
