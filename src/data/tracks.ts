import type { Track, Playlist } from '../types'

const COVERS = [
  '/assets/cover-1.png',
  '/assets/cover-2.png',
  '/assets/cover-3.png',
  '/assets/cover-4.png',
  '/assets/cover-5.png',
  '/assets/cover-6.png',
]

export const TRACKS: Track[] = [
  { id: 1, title: 'Guilt', artist: 'Nero', album: 'Welcome Reality', duration: '4:44', liked: false, year: 2011, genre: 'Дабстеп', cover: COVERS[0] },
  { id: 2, title: 'Elektro', artist: 'Dynoro, Outwork, Mr. Gee', album: 'Elektro', duration: '2:22', liked: false, year: 2019, genre: 'Электро', cover: COVERS[1] },
  { id: 3, title: "I'm Fire", artist: 'Ali Bakgor', album: "I'm Fire", duration: '2:22', liked: true, year: 2020, genre: 'Поп-музыка', cover: COVERS[2] },
  { id: 4, title: 'Non Stop', subtitle: '(Remix)', artist: 'Стоункат, Psychopath', album: 'Non Stop', duration: '4:12', liked: false, year: 2021, genre: 'Хип-хоп', cover: COVERS[3] },
  { id: 5, title: 'Run Run', subtitle: '(feat. AR/CO)', artist: 'Jaded, Will Clarke, AR/CO', album: 'Run Run', duration: '2:54', liked: false, year: 2022, genre: 'Электро', cover: COVERS[4] },
  { id: 6, title: 'Eyes on Fire', subtitle: '(Zeds Dead Remix)', artist: 'Blue Foundation, Zeds Dead', album: 'Eyes on Fire', duration: '5:20', liked: false, year: 2012, genre: 'Дабстеп', cover: COVERS[5] },
  { id: 7, title: 'Mucho Bien', subtitle: '(Hi Profile Remix)', artist: 'HYBIT, Mr. Black, Offer Nissim, Hi Profile', album: 'Mucho Bien', duration: '3:41', liked: true, year: 2023, genre: 'Техно', cover: COVERS[0] },
  { id: 8, title: 'Knives n Cherries', artist: 'minthaze', album: 'Captivating', duration: '1:48', liked: false, year: 2021, genre: 'Инди', cover: COVERS[1] },
  { id: 9, title: 'How Deep Is Your Love', artist: 'Calvin Harris, Disciples', album: 'How Deep Is Your Love', duration: '3:32', liked: false, year: 2015, genre: 'Поп-музыка', cover: COVERS[2] },
  { id: 10, title: 'Morena', artist: 'Tom Boxer', album: 'Soundz Made in Romania', duration: '3:36', liked: false, year: 2010, genre: 'Рок', cover: COVERS[3] },
]

export const ARTISTS: string[] = ['Michael Jackson', 'Frank Sinatra', 'Calvin Harris', 'Zhu', 'Arctic Monkeys']

export const GENRES: string[] = ['Рок', 'Хип-хоп', 'Поп-музыка', 'Техно', 'Инди', 'Дабстеп', 'Электро']

export const PLAYLISTS: Playlist[] = [
  { id: 1, title: 'Плейлист дня', gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', cover: COVERS[0] },
  { id: 2, title: '100 танцевальных хитов', gradient: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)', cover: COVERS[1] },
  { id: 3, title: 'Инди-заряд', gradient: 'linear-gradient(135deg, #5b21b6 0%, #6d28d9 100%)', cover: COVERS[2] },
]

export const PLAYLIST_DAY_TRACKS: Track[] = TRACKS.slice(0, 5)
