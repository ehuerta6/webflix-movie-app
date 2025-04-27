# Webflix Movie App

A Netflix-inspired movie and TV show browsing application built with React and Flask, featuring TMDB API integration for discovering trending content and detailed media information.

![Webflix Screenshot](https://github.com/user-attachments/assets/9dc92ade-723c-4180-9057-803e2a0ffa48)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Using the Combined Dev Script](#using-the-combined-dev-script)
  - [Running Separately](#running-separately)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## About

Webflix is a modern movie browsing application that offers a Netflix-like experience where users can discover trending movies and TV shows, search for content, and view detailed information about their favorite titles. The application leverages the TMDB API to provide up-to-date movie data and features a responsive design for seamless usage across devices.

## Features

- **Content Discovery**: Browse trending movies and TV shows
- **Search Functionality**: Search for specific movies and shows with real-time results
- **Detailed Information**: View comprehensive details about titles including:
  - Cast and crew information
  - Similar content recommendations
  - Trailers and videos
  - Ratings and release information
- **Content Filtering**: Filter content by genres, ratings, and release years
- **Responsive Design**: Optimized for both desktop and mobile devices
- **User Interface**: Intuitive, Netflix-inspired UI with smooth transitions and interactions

## Technologies

### Frontend

- **React 19**: Modern JavaScript library for building user interfaces
- **Tailwind CSS 4**: Utility-first CSS framework for rapid UI development
- **Vite**: Next-generation frontend build tool
- **React Hot Toast**: Notification system for user feedback
- **Firebase**: Authentication services (optional integration)

### Backend

- **Flask**: Lightweight Python web framework
- **Flask-CORS**: Cross-Origin Resource Sharing support
- **Requests**: HTTP library for API calls
- **Python-dotenv**: Environment variable management

### External API

- **TMDB API**: The Movie Database API for movie and TV show data

## Architecture

The application follows a client-server architecture:

- **Frontend**: Single-page React application that handles user interactions and displays data
- **Backend**: Flask API server that acts as a proxy between the frontend and TMDB API
- **External API**: TMDB API provides all the movie and TV show data

This separation allows for:

- Hiding API keys from client-side code
- Simplified requests from the frontend
- Potential for caching to reduce API calls
- Custom endpoints tailored to the application's needs

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- TMDB API key (get it from [themoviedb.org](https://www.themoviedb.org/documentation/api))

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/webflix-movie-webapp.git
   cd webflix-movie-webapp
   ```

2. Set up the backend:

   ```
   cd backend

   # Run the setup script
   python setup.py

   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On Unix/MacOS:
   source venv/bin/activate

   # Create .env file with your TMDB API key
   echo "TMDB_API_KEY=your_api_key_here" > .env
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

## Usage

### Using the Combined Dev Script

For convenience, we've included a script to run both the frontend and backend together:

```
# From the project root
node start-dev.js
```

This will start both servers:

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

### Running Separately

#### 1. Start the backend server:

```
cd backend

# Activate the virtual environment if not already activated
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Run the Flask app
flask run
```

The backend will be available at http://localhost:5000

#### 2. Start the frontend development server:

```
cd frontend
npm run dev
```

The frontend will be available at http://localhost:5173

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/trending/<media_type>/<time_window>`: Get trending movies/TV shows
- `GET /api/movie/<movie_id>`: Get details for a specific movie
- `GET /api/tv/<tv_id>`: Get details for a specific TV show
- `GET /api/discover/movie`: Discover movies with filters
- `GET /api/discover/tv`: Discover TV shows with filters
- `GET /api/genre/movie/list`: Get list of movie genres
- `GET /api/genre/tv/list`: Get list of TV show genres
- `GET /api/search/<search_type>`: Search for movies and TV shows
- `GET /api/health`: Health check endpoint

## Deployment

### Frontend

The frontend is deployed using GitHub Pages:

```
cd frontend
npm run deploy
```

This runs the build process and deploys the static files to GitHub Pages.

### Backend

The backend can be deployed to any Python-compatible hosting service like:

- Heroku
- PythonAnywhere
- AWS Lambda
- Google Cloud Functions

For deployment, make sure to set the `TMDB_API_KEY` environment variable on your hosting service.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

_Note: This project uses the TMDB API but is not endorsed or certified by TMDB._
