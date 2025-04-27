from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
# *** ADD YOUR TMDB API KEY IN THE .env FILE ***
TMDB_API_KEY = os.environ.get('TMDB_API_KEY')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# For demo purposes, set a flag if we're in test mode (no API key)
TEST_MODE = TMDB_API_KEY == 'your_tmdb_api_key_here' or not TMDB_API_KEY

# Create Flask app
app = Flask(__name__)
CORS(app)  # Allows requests from your React frontend

# Helper function to make TMDB API requests
def tmdb_request(endpoint, params=None):
    """Make a request to the TMDB API"""
    # If in test mode, return mock data
    if TEST_MODE:
        return get_mock_data(endpoint)
        
    # Build URL and parameters
    url = f"{TMDB_BASE_URL}{endpoint}"
    
    # Set default params and add any custom ones
    request_params = {'api_key': TMDB_API_KEY}
    if params:
        request_params.update(params)
    
    try:
        # Make the request
        response = requests.get(url, params=request_params)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"TMDB API Error: {str(e)}")
        return {'error': 'Failed to fetch data from TMDB'}

# Mock data function for testing without an API key
def get_mock_data(endpoint):
    """Return mock data based on the endpoint"""
    if '/trending/' in endpoint:
        return {
            "page": 1,
            "results": [
                {
                    "id": 1,
                    "title": "Test Movie 1",
                    "poster_path": "/test-poster-1.jpg",
                    "backdrop_path": "/test-backdrop-1.jpg",
                    "overview": "This is a test movie for demonstration purposes.",
                    "release_date": "2023-01-01",
                    "vote_average": 8.5
                },
                {
                    "id": 2,
                    "title": "Test Movie 2",
                    "poster_path": "/test-poster-2.jpg",
                    "backdrop_path": "/test-backdrop-2.jpg",
                    "overview": "Another test movie for demonstration purposes.",
                    "release_date": "2023-02-01",
                    "vote_average": 7.9
                }
            ],
            "total_pages": 1,
            "total_results": 2
        }
    elif '/movie/' in endpoint:
        return {
            "id": 1,
            "title": "Test Movie Details",
            "poster_path": "/test-poster-1.jpg",
            "backdrop_path": "/test-backdrop-1.jpg",
            "overview": "Detailed information about this test movie.",
            "release_date": "2023-01-01",
            "vote_average": 8.5,
            "genres": [{"id": 28, "name": "Action"}, {"id": 12, "name": "Adventure"}],
            "credits": {
                "cast": [
                    {"id": 101, "name": "Actor One", "profile_path": "/actor1.jpg"},
                    {"id": 102, "name": "Actor Two", "profile_path": "/actor2.jpg"}
                ]
            },
            "similar": {"results": []},
            "videos": {"results": []}
        }
    elif '/tv/' in endpoint:
        return {
            "id": 3,
            "name": "Test TV Show",
            "poster_path": "/test-tv-poster.jpg",
            "backdrop_path": "/test-tv-backdrop.jpg",
            "overview": "This is a test TV show.",
            "first_air_date": "2023-03-01",
            "vote_average": 8.0,
            "genres": [{"id": 18, "name": "Drama"}],
            "credits": {
                "cast": [
                    {"id": 103, "name": "TV Actor", "profile_path": "/tv-actor.jpg"}
                ]
            },
            "similar": {"results": []},
            "videos": {"results": []}
        }
    elif '/discover/' in endpoint:
        return {
            "page": 1,
            "results": [
                {
                    "id": 4,
                    "title": "Discovered Movie",
                    "poster_path": "/discovered-poster.jpg",
                    "backdrop_path": "/discovered-backdrop.jpg",
                    "overview": "A movie found through discover API.",
                    "release_date": "2023-04-01",
                    "vote_average": 7.2
                }
            ],
            "total_pages": 1,
            "total_results": 1
        }
    elif '/genre/' in endpoint:
        return {
            "genres": [
                {"id": 28, "name": "Action"},
                {"id": 12, "name": "Adventure"},
                {"id": 16, "name": "Animation"},
                {"id": 35, "name": "Comedy"},
                {"id": 80, "name": "Crime"},
                {"id": 99, "name": "Documentary"},
                {"id": 18, "name": "Drama"},
                {"id": 10751, "name": "Family"},
                {"id": 14, "name": "Fantasy"},
                {"id": 36, "name": "History"}
            ]
        }
    elif '/search/' in endpoint:
        return {
            "page": 1,
            "results": [
                {
                    "id": 5,
                    "title": "Search Result",
                    "poster_path": "/search-poster.jpg",
                    "backdrop_path": "/search-backdrop.jpg",
                    "overview": "A result from search API.",
                    "release_date": "2023-05-01",
                    "vote_average": 6.8
                }
            ],
            "total_pages": 1,
            "total_results": 1
        }
    else:
        return {"results": []}

# Route for getting trending movies and shows
@app.route("/api/trending/<media_type>/<time_window>")
def get_trending(media_type='all', time_window='week'):
    """Get trending movies, TV shows, or both"""
    # Validate parameters
    if media_type not in ['movie', 'tv', 'all']:
        return jsonify({'error': 'Invalid media type. Use movie, tv, or all'}), 400
        
    if time_window not in ['day', 'week']:
        return jsonify({'error': 'Invalid time window. Use day or week'}), 400
    
    # Make request to TMDB API
    data = tmdb_request(f'/trending/{media_type}/{time_window}')
    
    # Return response
    return jsonify(data)

# Route for movie details
@app.route("/api/movie/<int:movie_id>")
def get_movie_details(movie_id):
    """Get details for a specific movie"""
    # Get additional data to append from query params
    append = request.args.get('append_to_response', 'credits,similar,videos')
    
    # Make request to TMDB API
    data = tmdb_request(f'/movie/{movie_id}', {'append_to_response': append})
    
    # Return response
    return jsonify(data)

# Route for TV show details
@app.route("/api/tv/<int:tv_id>")
def get_tv_details(tv_id):
    """Get details for a specific TV show"""
    # Get additional data to append from query params
    append = request.args.get('append_to_response', 'credits,similar,videos')
    
    # Make request to TMDB API
    data = tmdb_request(f'/tv/{tv_id}', {'append_to_response': append})
    
    # Return response
    return jsonify(data)

# Route for discovering movies with filters
@app.route("/api/discover/movie")
def discover_movies():
    """Discover movies based on filters"""
    # Get filter parameters from query string
    params = request.args.to_dict()
    
    # Make request to TMDB API
    data = tmdb_request('/discover/movie', params)
    
    # Return response
    return jsonify(data)

# Route for discovering TV shows with filters
@app.route("/api/discover/tv")
def discover_tv():
    """Discover TV shows based on filters"""
    # Get filter parameters from query string
    params = request.args.to_dict()
    
    # Make request to TMDB API
    data = tmdb_request('/discover/tv', params)
    
    # Return response
    return jsonify(data)

# Route for getting movie genres
@app.route("/api/genre/movie/list")
def movie_genres():
    """Get list of movie genres"""
    # Make request to TMDB API
    data = tmdb_request('/genre/movie/list')
    
    # Return response
    return jsonify(data)

# Route for getting TV show genres
@app.route("/api/genre/tv/list")
def tv_genres():
    """Get list of TV show genres"""
    # Make request to TMDB API
    data = tmdb_request('/genre/tv/list')
    
    # Return response
    return jsonify(data)

# Route for searching movies and TV shows
@app.route("/api/search/<search_type>")
def search(search_type):
    """Search for movies, TV shows, or both"""
    # Validate parameters
    if search_type not in ['movie', 'tv', 'multi']:
        return jsonify({'error': 'Invalid search type. Use movie, tv, or multi'}), 400
    
    # Get query params
    query = request.args.get('query')
    page = request.args.get('page', 1)
    
    if not query:
        return jsonify({'error': 'Query parameter is required'}), 400
    
    # Make request to TMDB API
    data = tmdb_request(f'/search/{search_type}', {
        'query': query,
        'page': page
    })
    
    # Return response
    return jsonify(data)

# Backward compatibility: Keep the old /api/movies endpoint but use real data
@app.route("/api/movies")
def get_movies():
    """Get popular movies - for backward compatibility"""
    data = tmdb_request('/movie/popular')
    return jsonify(data)

# Health check endpoint
@app.route("/api/health")
def health_check():
    """Check if the API is running and can connect to TMDB"""
    # In test mode, always return healthy
    if TEST_MODE:
        return jsonify({
            "status": "healthy",
            "message": "Webflix API is running in test mode with mock data"
        })
        
    if not TMDB_API_KEY:
        return jsonify({
            "status": "error",
            "message": "TMDB API key is missing. Add it to the .env file."
        }), 500
        
    # Try a simple request to verify API key works
    response = tmdb_request('/configuration')
    if 'error' in response:
        return jsonify({
            "status": "error",
            "message": "Cannot connect to TMDB API. Check your API key."
        }), 500
        
    return jsonify({
        "status": "healthy",
        "message": "Webflix API is running and connected to TMDB"
    })

if __name__ == "__main__":
    app.run(debug=True)
