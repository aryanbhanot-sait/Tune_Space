const API_BASE = "https://www.theaudiodb.com/api/v1/json/2";

export interface AudioDBSong {
  idTrack: string;
  strTrack: string;
  strArtist: string;
  strAlbum: string;
  strTrackThumb: string | null;
  strAlbumThumb: string | null;
  intYearReleased: string | null;
}

export async function fetchTrendingSongs(country: string = "us", count: number = 12): Promise<AudioDBSong[]> {
  const url = `${API_BASE}/trending.php?country=${country}&type=itunes&format=singles`;
  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data.trending) ? data.trending.slice(0, count) : [];
}

export async function searchTrack(artist: string, track: string): Promise<AudioDBSong | null> {
  const url = `${API_BASE}/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(track)}`;
  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data.track) && data.track.length > 0 ? data.track[0] : null;
}

export async function fetchTrendingAlbums(country: string = "us", count: number = 12) {
  const url = `${API_BASE}/trending.php?country=${country}&type=itunes&format=albums`;
  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data.trending) ? data.trending.slice(0, count) : [];
}
