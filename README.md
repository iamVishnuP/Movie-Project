# Movie Application

A full-stack web application built with the MERN stack (MongoDB, Express, React, Node.js). This platform provides a comprehensive movie browsing, management, and interaction experience.

## 🚀 Features

- **User Authentication**: Secure user login and registration using JSON Web Tokens (JWT) and bcryptjs.
- **Media Uploads**: Seamless image and media handling with Cloudinary and Multer.
- **Responsive UI**: A modern, responsive user interface built with React, TailwindCSS, and animated with Framer Motion.
- **State & Routing**: Efficient client-side routing with React Router DOM.
- **API Integration**: Fast and reliable API requests using Axios.
- **Email Notifications**: Integrated email services using Nodemailer and Brevo.
- **Performance**: Server-side caching implemented with Node-cache.

## 🛠️ Tech Stack

### Client-Side
- **Framework**: React 19, Vite
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Toast Notifications**: React Hot Toast
- **Image Cropping**: React Easy Crop

### Server-Side
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: JSON Web Token (JWT)
- **Media Storage**: Cloudinary
- **File Uploads**: Multer
- **Email Service**: Nodemailer / Brevo API
- **Caching**: Node-cache

## 🏁 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas database URI)
- Cloudinary account for media storage
- Brevo/Nodemailer credentials for email services

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Movie
   ```

2. **Install dependencies for both client and server:**
   
   Client:
   ```bash
   cd client
   npm install
   ```

   Server:
   ```bash
   cd ../server
   npm install
   ```

3. **Environment Variables:**
   
   Create a `.env` file in the `server` directory and configure your environment variables. 
   *(Note: The actual `.env` file must never be committed to version control. Keep your keys secure!)*

   Example `.env` structure:
   ```env
   # Server Configuration
   PORT=5000
   MONGO_URI=your_mongodb_connection_string

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email Configuration (Brevo/Nodemailer)
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   ```

### Running the Application

To run the application locally, you need to start both the backend server and the frontend development server.

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend client:**
   Open a new terminal window:
   ```bash
   cd client
   npm run dev
   ```

The client will typically run on `http://localhost:5173` and the server on `http://localhost:5000`.

## 📜 License
This project is licensed under the ISC License.
