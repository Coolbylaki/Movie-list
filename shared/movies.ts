export type Movie = {
	folderName: string;
	title: string;
	year: number | null;
	overview?: string;
	rating?: number;
	posterPath?: string | null;
	tmdbId?: number;
	matched: boolean;
	genres?: string[];
};


export type MovieDetails = {
 id: number; title: string; year: number | null; overview: string; rating: number;
 runtime: number | null; genres: string[]; posterPath: string | null;
 backdropPath: string | null; imdbId: string | null;
};
