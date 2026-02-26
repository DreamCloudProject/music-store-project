import React, { createContext, useContext, useState, useCallback } from 'react'
import { TRACKS } from '../data/tracks'
import type { Track, PlayerContextValue } from '../types'

const PlayerContext = createContext<PlayerContextValue | null>(null)

interface PlayerProviderProps {
  children: React.ReactNode
}

export function PlayerProvider({ children }: PlayerProviderProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(TRACKS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [volume, setVolume] = useState(70)
  const [tracks, setTracks] = useState<Track[]>(TRACKS)

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => setIsPlaying(p => !p), [])
  const toggleRepeat = useCallback(() => setIsRepeat(p => !p), [])
  const toggleShuffle = useCallback(() => setIsShuffle(p => !p), [])

  const playNext = useCallback(() => {
    const list = isShuffle ? [...tracks].sort(() => Math.random() - 0.5) : tracks
    const idx = list.findIndex(t => t.id === currentTrack?.id)
    const next = list[(idx + 1) % list.length]
    setCurrentTrack(next)
    setIsPlaying(true)
  }, [currentTrack, tracks, isShuffle])

  const playPrev = useCallback(() => {
    const idx = tracks.findIndex(t => t.id === currentTrack?.id)
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length]
    setCurrentTrack(prev)
    setIsPlaying(true)
  }, [currentTrack, tracks])

  const toggleLike = useCallback((trackId: number) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, liked: !t.liked } : t))
  }, [])

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, isRepeat, isShuffle, volume,
      tracks, setTracks,
      playTrack, togglePlay, toggleRepeat, toggleShuffle,
      playNext, playPrev, toggleLike, setVolume,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
