# Webflix Movie App

A Netflix-inspired movie and TV show browsing application built with React, featuring TMDB API integration for discovering trending content and detailed media information.

![Webflix Screenshot](https://github.com/user-attachments/assets/9dc92ade-723c-4180-9057-803e2a0ffa48)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Recent Optimizations](#recent-optimizations)

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

### External API

- **TMDB API**: The Movie Database API for movie and TV show data

## Getting Started

### Prerequisites

- Node.js (v16+)
- TMDB API key (get it from [themoviedb.org](https://www.themoviedb.org/documentation/api))

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/webflix-movie-webapp.git
   cd webflix-movie-webapp
   ```

2. Set up the frontend:

   ```
   cd frontend
   npm install
   ```

3. Create a `.env` file in the frontend directory with your TMDB API key:
   ```
   VITE_TMDB_API_KEY=your_api_key_here
   VITE_API_BASE_URL=https://api.themoviedb.org/3
   ```

## Usage

Start the development server:

```
# From the project root
node start-dev.js
```

The frontend will be available at http://localhost:5173

## Deployment

The frontend is deployed using GitHub Pages:

```
cd frontend
npm run deploy
```

This runs the build process and deploys the static files to GitHub Pages.

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

## Recent Optimizations

The codebase has been optimized for better performance and maintainability:

### New Reusable Components

- Added common UI components (`Button`, `Card`, `IconButton`, `Spinner`)
- Extracted reusable hooks (`useDebounce`, `useOutsideClick`)
- Created utility functions for colors and images

### Performance Improvements

- Implemented `React.memo` for components that rarely change
- Added proper dependency arrays to `useEffect` and `useCallback` hooks
- Implemented debouncing for search inputs
- Added lazy loading for images

### Code Organization

- Created proper directory structure for utilities, hooks, and common components
- Improved imports with index files
- Removed duplicate code and consolidated styles

### Other Improvements

- Added JSDoc comments for better code documentation
- Implemented consistent error handling
- Simplified component props with default values
