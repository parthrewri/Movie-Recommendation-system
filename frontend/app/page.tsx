'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Movie {
  movieId: number
  title: string
  genres: string[]
  poster: string
  avg_rating: number
  rating_count: number
}

// ─── Constants ────────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Horror', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western',
]

const GENRE_COLORS: Record<string, string> = {
  Action: '#ef4444', Adventure: '#f97316', Animation: '#a855f7',
  Comedy: '#eab308', Crime: '#6b7280', Documentary: '#14b8a6',
  Drama: '#3b82f6', Fantasy: '#8b5cf6', Horror: '#dc2626',
  Musical: '#ec4899', Mystery: '#7c3aed', Romance: '#f43f5e',
  'Sci-Fi': '#06b6d4', Thriller: '#f59e0b', War: '#78716c', Western: '#d97706',
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: '#1a1a2e',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        height: 260,
        background: 'linear-gradient(90deg,#1e1e3a 25%,#2a2a4a 50%,#1e1e3a 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ height: 14, borderRadius: 6, background: '#2a2a4a', width: '80%' }} />
        <div style={{ height: 10, borderRadius: 6, background: '#2a2a4a', width: '50%' }} />
      </div>
    </div>
  )
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
interface MovieCardProps {
  movie: Movie
  index: number
  onClick: (m: Movie) => void
  isWatched: boolean
}

function MovieCard({ movie, index, onClick, isWatched }: MovieCardProps) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)

  const accentColor = GENRE_COLORS[movie.genres?.[0]] ?? '#6366f1'

  return (
    <div
      onClick={() => onClick(movie)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        background: '#12122a',
        border: isWatched ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: hovered
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}33`
          : '0 2px 8px rgba(0,0,0,0.2)',
        animationDelay: `${index * 60}ms`,
        animation: 'fadeUp 0.4s ease both',
        position: 'relative' as const,
      }}
    >
      {/* Watched badge */}
      {isWatched && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          background: '#6366f1', borderRadius: 20, padding: '3px 9px',
          fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 1,
        }}>
          WATCHED
        </div>
      )}

      {/* Poster */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden', background: '#0d0d1f' }}>
        {!imgError ? (
          <img
            src={movie.poster}
            alt={movie.title}
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: 'block', transition: 'transform 0.3s',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#1a1a3a', flexDirection: 'column' as const, gap: 8,
          }}>
            <span style={{ fontSize: 36 }}>🎬</span>
            <span style={{ fontSize: 11, color: '#4a4a7a', textAlign: 'center', padding: '0 12px' }}>
              {movie.title}
            </span>
          </div>
        )}

        {/* Rating pill */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          borderRadius: 20, padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ color: '#facc15', fontSize: 12 }}>★</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
            {movie.avg_rating > 0 ? movie.avg_rating.toFixed(1) : '—'}
          </span>
        </div>

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.25s',
          display: 'flex', alignItems: 'flex-end', padding: 14,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontStyle: 'italic' }}>
            Click for similar movies →
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600, color: '#e8e8ff',
          lineHeight: 1.35, fontFamily: "'Crimson Text', Georgia, serif",
          letterSpacing: 0.2,
        }}>
          {movie.title}
        </p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
          {movie.genres.slice(0, 3).map(g => (
            <span key={g} style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
              background: `${GENRE_COLORS[g] ?? '#6366f1'}22`,
              color: GENRE_COLORS[g] ?? '#818cf8',
              border: `1px solid ${GENRE_COLORS[g] ?? '#6366f1'}44`,
              letterSpacing: 0.3,
            }}>
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Genre Filter Pill ────────────────────────────────────────────────────────
interface GenrePillProps {
  genre: string
  active: boolean
  onClick: () => void
}

function GenrePill({ genre, active, onClick }: GenrePillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', border: 'none', letterSpacing: 0.4,
        background: active ? (GENRE_COLORS[genre] ?? '#6366f1') : '#1e1e3a',
        color: active ? '#fff' : '#6060a0',
        transition: 'all 0.18s', flexShrink: 0,
        boxShadow: active ? `0 0 12px ${GENRE_COLORS[genre] ?? '#6366f1'}66` : 'none',
        fontFamily: 'inherit',
      }}
    >
      {genre}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [recommended, setRecommended]     = useState<Movie[]>([])
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [watchHistory, setWatchHistory]   = useState<number[]>([])
  const [loading, setLoading]             = useState(true)
  const [searching, setSearching]         = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const [activeGenre, setActiveGenre]     = useState<string | null>(null)
  const [source, setSource]               = useState('')
  const [error, setError]                 = useState('')
  const [modelLoaded, setModelLoaded]     = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── API health check ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/`)
      .then(r => r.json())
      .then((d: { model_loaded: boolean }) => setModelLoaded(d.model_loaded))
      .catch(() => {})
  }, [])

  // ── Fetch recommendations ─────────────────────────────────────────────────
  const fetchRecommendations = useCallback(async (
    history: number[],
    genre: string | null,
  ) => {
    try {
      setLoading(true)
      setError('')

      let res: Response

      if (genre) {
        res = await fetch(`${API}/popular?limit=16&genre=${encodeURIComponent(genre)}`)
      } else {
        res = await fetch(`${API}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sequence: history, top_n: 16 }),
        })
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      setRecommended(genre ? (data.results ?? []) : (data.recommendations ?? []))
      setSource(genre ? 'genre' : (data.source ?? ''))
    } catch {
      setError('Could not reach the backend. Make sure your FastAPI server is running on port 8000.')
      setRecommended([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchRecommendations([], null)
  }, [fetchRecommendations])

  // Genre change
  useEffect(() => {
    if (activeGenre !== null) {
      fetchRecommendations(watchHistory, activeGenre)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGenre])

  // ── Live search ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    if (!searchQuery.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/search?q=${encodeURIComponent(searchQuery)}&limit=12`)
        const data = await res.json()
        setSearchResults(data.results ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }, [searchQuery])

  // ── Click movie → update history + re-fetch ───────────────────────────────
  const handleMovieClick = async (movie: Movie) => {
    const newHistory = [
      ...watchHistory.filter(id => id !== movie.movieId),
      movie.movieId,
    ].slice(-20)
    setWatchHistory(newHistory)
    setSearchQuery('')
    setSearchResults([])
    setActiveGenre(null)
    await fetchRecommendations(newHistory, null)
  }

  // ── Genre toggle ──────────────────────────────────────────────────────────
  const handleGenreClick = (genre: string) => {
    const next = activeGenre === genre ? null : genre
    setActiveGenre(next)
    if (next === null) fetchRecommendations(watchHistory, null)
  }

  const displayMovies = searchQuery.trim() ? searchResults : recommended

  const sectionLabel = searchQuery.trim()
    ? `Results for "${searchQuery}"`
    : activeGenre
    ? `Top ${activeGenre} films`
    : 'Recommendations for you'

  // movie lookup for history strip
  const allMovies = [...recommended, ...searchResults]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080818; }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a4a; border-radius: 3px; }
        .genre-scroll { scrollbar-width: none; }
        .genre-scroll::-webkit-scrollbar { display: none; }
        input::placeholder { color: #3a3a60; }
        input:focus { outline: none; }
        button { font-family: inherit; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#080818',
        color: '#e0e0ff', fontFamily: "'DM Mono', monospace",
      }}>

        {/* Ambient glow */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: -200, left: '10%', width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', top: 300, right: '-5%', width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px' }}>

          {/* ── Header ── */}
          <header style={{
            padding: '40px 0 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'wrap' as const, gap: 16,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <h1 style={{
                  fontSize: 28, fontFamily: "'Crimson Text', Georgia, serif",
                  fontWeight: 600, color: '#e8e8ff', letterSpacing: -0.5,
                }}>
                  CineMatch
                </h1>
                <span style={{
                  fontSize: 11, letterSpacing: 2,
                  textTransform: 'uppercase' as const, color: '#404070',
                }}>
                  AI Recommendations
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#404060', marginTop: 4, letterSpacing: 0.5 }}>
                {modelLoaded ? '● ML model active' : '○ popularity mode'} · {watchHistory.length} watched
              </p>
            </div>

            {/* Watch history name pills */}
            {watchHistory.length > 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const, maxWidth: 600 }}>
                <span style={{ fontSize: 10, color: '#404060', letterSpacing: 1, marginRight: 4 }}>
                  HISTORY
                </span>
                {watchHistory.slice(-5).reverse().map((id, i) => {
                  const movie = allMovies.find(m => m.movieId === id)
                  const shortTitle = movie
                    ? movie.title.replace(/\s*\(\d{4}\)$/, '').slice(0, 18)
                    : `#${id}`
                  return (
                    <span key={id} style={{
                      fontSize: 10, padding: '3px 10px', borderRadius: 20,
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: '#818cf8',
                      opacity: 1 - i * 0.15,
                      flexShrink: 0,
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {shortTitle}
                    </span>
                  )
                })}
                <button
                  onClick={() => { setWatchHistory([]); fetchRecommendations([], null) }}
                  style={{
                    fontSize: 10, color: '#404060', background: 'none',
                    border: 'none', cursor: 'pointer', marginLeft: 4, letterSpacing: 1,
                  }}
                >
                  CLEAR
                </button>
              </div>
            )}
          </header>

          {/* ── Search bar ── */}
          <div style={{ margin: '28px 0 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#10102a', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 18px',
            }}>
              <span style={{ fontSize: 16, opacity: 0.4 }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title — e.g. Inception, Toy Story…"
                style={{
                  flex: 1, background: 'none', border: 'none', color: '#c8c8f0',
                  fontSize: 14, fontFamily: 'inherit', letterSpacing: 0.3,
                }}
              />
              {searching && (
                <span style={{ fontSize: 11, color: '#6366f1', letterSpacing: 1 }}>…</span>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none', border: 'none', color: '#404060',
                    cursor: 'pointer', fontSize: 18, lineHeight: '1', padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* ── Genre filter bar ── */}
          {!searchQuery && (
            <div
              className="genre-scroll"
              style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 32 }}
            >
              <GenrePill
                genre="All"
                active={!activeGenre}
                onClick={() => { setActiveGenre(null); fetchRecommendations(watchHistory, null) }}
              />
              {GENRES.map(g => (
                <GenrePill
                  key={g}
                  genre={g}
                  active={activeGenre === g}
                  onClick={() => handleGenreClick(g)}
                />
              ))}
            </div>
          )}

          {/* ── Error banner ── */}
          {error && (
            <div style={{
              padding: '14px 18px', borderRadius: 12, marginBottom: 28,
              background: 'rgba(255,68,68,0.07)', border: '1px solid rgba(255,68,68,0.2)',
              color: '#ff8888', fontSize: 13, lineHeight: 1.6,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── Section heading ── */}
          {!error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <h2 style={{
                fontSize: 15, fontWeight: 500, color: '#8080b0',
                letterSpacing: 0.5, whiteSpace: 'nowrap' as const,
              }}>
                {sectionLabel}
              </h2>
              {source === 'model' && (
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.13)', color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.2)', letterSpacing: 1,
                }}>
                  ML MODEL
                </span>
              )}
              {source === 'popularity' && (
                <span style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 8,
                  background: 'rgba(245,158,11,0.13)', color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.2)', letterSpacing: 1,
                }}>
                  POPULAR
                </span>
              )}
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              <span style={{ fontSize: 11, color: '#303050' }}>{displayMovies.length} titles</span>
            </div>
          )}

          {/* ── Grid ── */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {Array.from({ length: 16 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : displayMovies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#303050' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
              <p style={{ fontSize: 14 }}>
                {searchQuery ? `No results for "${searchQuery}"` : 'No recommendations available.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {displayMovies.map((movie, i) => (
                <MovieCard
                  key={movie.movieId}
                  movie={movie}
                  index={i}
                  onClick={handleMovieClick}
                  isWatched={watchHistory.includes(movie.movieId)}
                />
              ))}
            </div>
          )}

          {/* ── Footer hint ── */}
          {watchHistory.length > 0 && !loading && !searchQuery && (
            <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#303050', letterSpacing: 0.5 }}>
              Recommendations update as you watch more · Click any movie to refine
            </p>
          )}

        </div>
      </div>
    </>
  )
}