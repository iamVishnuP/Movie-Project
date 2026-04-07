import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import MovieCard from '../components/MovieCard';
import { Loader2, Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const response = await api.get(`/movies/search?query=${encodeURIComponent(query)}`);
        setMovies(response.data || []);
      } catch (error) {
        console.error('Failed to search movies', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSearchResults();
  }, [query]);

  return (
    <main className="pt-24 min-h-screen bg-black overflow-x-hidden text-white px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <SearchIcon className="w-8 h-8 text-[#ffd700]" />
          <h1 className="text-3xl font-bold uppercase">
            Search Results for <span className="text-[#ffd700]">"{query}"</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-[#ffd700] animate-spin" />
          </div>
        ) : movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No movies found matching your search.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Search;
