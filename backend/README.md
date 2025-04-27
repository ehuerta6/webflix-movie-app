# Webflix Backend

This is the Flask backend for the Webflix movie application.

## Setup

1. Create a virtual environment (recommended):

```bash
python -m venv venv
```

2. Activate the virtual environment:

   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your TMDB API key:

```
TMDB_API_KEY=your_tmdb_api_key_here
```

## Running the Application

Run the Flask application:

```bash
flask run
```

The backend will be available at http://127.0.0.1:5000/

## API Endpoints

- `/api/health` - Health check endpoint
- `/api/trending/<media_type>/<time_window>` - Get trending movies/shows
- `/api/movie/<movie_id>` - Get movie details
- `/api/tv/<tv_id>` - Get TV show details
- `/api/discover/movie` - Discover movies with filters
- `/api/discover/tv` - Discover TV shows with filters
- `/api/genre/movie/list` - Get movie genres
- `/api/genre/tv/list` - Get TV show genres
- `/api/search/<search_type>` - Search for movies/shows
