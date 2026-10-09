import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Movie } from '../shared/movies.js';
import { emptyFilters, filterMovies } from '../src/lib/libraryFilters.js';

const movies: Movie[] = [
  { folderName: 'Alien', title: 'Alien', year: 1979, rating: 8.2, genres: ['Horror', 'Science Fiction'], matched: true },
  { folderName: 'Drama', title: 'Drama', year: 1979, rating: 6.9, genres: ['Drama'], matched: true },
  { folderName: 'Unknown', title: 'Unknown', year: null, matched: false },
];

test('genre, year, rating, and search combine and clearing restores the full collection', () => {
  assert.deepEqual(filterMovies(movies, ' ALI ', { genre: 'Horror', year: '1979', minimumRating: '8' }), [movies[0]]);
  assert.deepEqual(filterMovies(movies, '1979', { ...emptyFilters, minimumRating: '7' }), [movies[0]]);
  assert.deepEqual(filterMovies(movies, '', { ...emptyFilters, genre: 'Drama', minimumRating: '7' }), []);
  assert.deepEqual(filterMovies(movies, '', { ...emptyFilters, minimumRating: '9' }), []);
  assert.deepEqual(filterMovies(movies, '', emptyFilters), movies);
  assert.deepEqual(movies.map(movie => movie.title), ['Alien', 'Drama', 'Unknown'], 'filtering does not alter source movies');
});

test('unknown metadata stays browsable and is excluded from specific genre/year/rating filters', () => {
  assert.deepEqual(filterMovies(movies, '', { ...emptyFilters, genre: '__unknown__' }), [movies[2]]);
  assert.deepEqual(filterMovies(movies, '', { ...emptyFilters, year: '__unknown__' }), [movies[2]]);
  assert.deepEqual(filterMovies(movies, '', { ...emptyFilters, minimumRating: '5' }), movies.slice(0, 2));
});
