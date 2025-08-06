import { supabase } from "./supabase";

const API_BASE = "https://api.deezer.com";

export interface AudioDBSong {
  idTrack: string;
  strTrack: string;
  strArtist: string;
  strAlbum: string;
  strTrackThumb: string | null;
  strAlbumThumb: string | null;
  intYearReleased: string | null;
  preview: string | null;
}


export async function fetchTrendingSongs(count: number = 12): Promise<AudioDBSong[]> {

  const url = `${API_BASE}/chart/0/tracks?limit=${count}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch trending songs: ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data.data)) {
    return [];
  }

  return data.data.map((track: any) => ({
    idTrack: track.id.toString(),
    strTrack: track.title,
    strArtist: track.artist?.name || "",
    strAlbum: track.album?.title || "",
    strTrackThumb: track.album?.cover_medium || null,
    strAlbumThumb: track.album?.cover_medium || null,
    intYearReleased: track.release_date ? new Date(track.release_date).getFullYear().toString() : null,
    preview: track.preview || null,
  }));
}


export async function searchTrack(artist: string, track: string): Promise<AudioDBSong | null> {
  const query = `artist:"${artist}" track:"${track}"`;
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to search track: ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data.data) || data.data.length === 0) {
    return null;
  }

  const trackData = data.data[0];
  return {
    idTrack: trackData.id.toString(),
    strTrack: trackData.title,
    strArtist: trackData.artist?.name || "",
    strAlbum: trackData.album?.title || "",
    strTrackThumb: trackData.album?.cover_medium || null,
    strAlbumThumb: trackData.album?.cover_medium || null,
    intYearReleased: trackData.release_date ? new Date(trackData.release_date).getFullYear().toString() : null,
    preview: trackData.preview || null,
  };
}

export async function fetchSongById(idTrack: string): Promise<AudioDBSong | null> {
  const url = `${API_BASE}/track/${idTrack}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch song by id: ${response.status}`);
  }
  const trackData = await response.json();

  if (!trackData || !trackData.id) {
    return null;
  }

  const song: AudioDBSong = {
    idTrack: trackData.id.toString(),
    strTrack: trackData.title,
    strArtist: trackData.artist?.name || "",
    strAlbum: trackData.album?.title || "",
    strTrackThumb: trackData.album?.cover_medium || null,
    strAlbumThumb: trackData.album?.cover_medium || null,
    intYearReleased: trackData.release_date ? new Date(trackData.release_date).getFullYear().toString() : null,
    preview: trackData.preview || null,
  };

  // Upsert song into the tracks table
  try {
    await supabase
      .from('tracks')
      .upsert([
        {
          id: song.idTrack,
          title: song.strTrack,
          artist: song.strArtist,
          album: song.strAlbum,
          artwork_url: song.strTrackThumb,
          preview_url: song.preview,
          year_released: song.intYearReleased ? parseInt(song.intYearReleased) : null,
        }
      ]);
  } catch (error) {
    console.error('Failed to upsert song into tracks table:', error);
  }

  return song;
}

export async function searchSongsFromApi(query: string): Promise<AudioDBSong[]> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}`; // Adjust for your API
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data.data)) return [];
  return data.data.map((track: any) => ({
    idTrack: track.id.toString(),
    strTrack: track.title,
    strArtist: track.artist?.name || "",
    strAlbum: track.album?.title || "",
    strTrackThumb: track.album?.cover_medium || null,
    strAlbumThumb: track.album?.cover_medium || null,
    intYearReleased: track.release_date ? new Date(track.release_date).getFullYear().toString() : null,
    preview: track.preview || null,
  }));
}

export async function fetchTrendingAlbums(count: number = 12) {
  const url = `${API_BASE}/chart/0/albums?limit=${count}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch trending albums: ${response.status}`);
  }
  const data = await response.json();

  if (!Array.isArray(data.data)) {
    return [];
  }

  return data.data.map((album: any) => ({
    idAlbum: album.id.toString(),
    strAlbum: album.title,
    strArtist: album.artist?.name || "",
    strAlbumThumb: album.cover_medium || null,
    intYearReleased: album.release_date ? new Date(album.release_date).getFullYear().toString() : null,
  }));
}
