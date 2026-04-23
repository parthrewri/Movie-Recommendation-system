from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import pickle
import os

# ==============================
# INIT
# ==============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# LOAD DATA
# ==============================
movies   = pd.read_csv("movies.csv")
posters  = pd.read_csv("posters.csv")
ratings  = pd.read_csv("ratings.csv")

# Precompute average rating + rating count per movie
avg_ratings = (
    ratings.groupby("movieId")["rating"]
    .agg(avg_rating="mean", rating_count="count")
    .reset_index()
)

# Master lookup: movieId → title, genres, poster_url, avg_rating, rating_count
movie_lookup = (
    movies
    .merge(posters, on="movieId", how="left")
    .merge(avg_ratings, on="movieId", how="left")
)
movie_lookup["avg_rating"]   = movie_lookup["avg_rating"].fillna(0).round(2)
movie_lookup["rating_count"] = movie_lookup["rating_count"].fillna(0).astype(int)
movie_lookup["poster_url"]   = movie_lookup["poster_url"].fillna("")

# Index for fast lookup
movie_index = movie_lookup.set_index("movieId")

# ==============================
# LOAD ML MODEL + ENCODER
# ==============================
MODEL_LOADED = False
model   = None
encoder = None

try:
    import tensorflow as tf
    with open("encoder.pkl", "rb") as f:
        encoder = pickle.load(f)

    model = tf.keras.models.load_model("model.h5")
    MODEL_LOADED = True
    print("✅ ML model loaded successfully")
    print(f"   Encoder knows {len(encoder.classes_)} movies")
    print(f"   Model input shape:  {model.input_shape}")
    print(f"   Model output shape: {model.output_shape}")
except Exception as e:
    print(f"⚠️  ML model not loaded ({e}). Falling back to popularity-based recommendations.")

# Sequence length the model was trained with (adjust if different)
SEQ_LEN = 10

# ==============================
# HELPERS
# ==============================

def format_movie(movie_id: int) -> dict | None:
    """Convert a movieId into the response dict."""
    if movie_id not in movie_index.index:
        return None
    row = movie_index.loc[movie_id]
    return {
        "movieId":     int(movie_id),
        "title":       row["title"],
        "genres":      row["genres"].split("|") if pd.notna(row["genres"]) else [],
        "poster":      row["poster_url"] or f"https://via.placeholder.com/300x450?text={row['title'][:12]}",
        "avg_rating":  float(row["avg_rating"]),
        "rating_count": int(row["rating_count"]),
    }


def ml_recommend(sequence: list[int], top_n: int) -> list[dict]:
    """
    Use the trained model to predict next movies from a watch sequence.
    Steps:
      1. Encode raw movieIds → integer indices (what the model understands)
      2. Pad/truncate to SEQ_LEN
      3. Run model.predict → probability distribution over all movies
      4. Zero out movies already in the sequence
      5. Take top_n highest-probability movies
      6. Decode indices → original movieIds
      7. Join with metadata
    """
    # 1. Encode — filter out any movieIds the encoder doesn't know
    known_mask   = np.isin(sequence, encoder.classes_)
    known_seq    = np.array(sequence)[known_mask].tolist()

    if not known_seq:
        return popularity_recommend(top_n)

    encoded_seq = encoder.transform(known_seq).tolist()

    # 2. Pad / truncate to SEQ_LEN
    if len(encoded_seq) >= SEQ_LEN:
        padded = encoded_seq[-SEQ_LEN:]          # keep most recent
    else:
        padded = [0] * (SEQ_LEN - len(encoded_seq)) + encoded_seq  # left-pad with 0

    input_array = np.array([padded])             # shape (1, SEQ_LEN)

    # 3. Predict
    probs = model.predict(input_array, verbose=0)[0]   # shape (num_movies,)

    # 4. Zero out already-watched movies
    for enc_idx in encoded_seq:
        if 0 <= enc_idx < len(probs):
            probs[enc_idx] = 0.0

    # 5. Top-N indices
    top_indices = np.argsort(probs)[::-1][:top_n * 3]  # grab extra, filter below

    # 6. Decode → original movieIds
    recommended_ids = encoder.inverse_transform(top_indices).tolist()

    # 7. Build response, skip movies with no metadata
    results = []
    for movie_id in recommended_ids:
        entry = format_movie(int(movie_id))
        if entry:
            results.append(entry)
        if len(results) == top_n:
            break

    # Fallback if model returned too few valid movies
    if len(results) < top_n:
        seen = {r["movieId"] for r in results} | set(sequence)
        results += popularity_recommend(top_n - len(results), exclude=seen)

    return results


def popularity_recommend(top_n: int, exclude: set = None) -> list[dict]:
    """
    Fallback: recommend by Bayesian-weighted average rating.
    Rewards movies with both high average rating AND enough votes.
    """
    exclude = exclude or set()

    C = avg_ratings["avg_rating"].mean()   # global mean rating
    m = avg_ratings["rating_count"].quantile(0.60)  # min votes threshold

    df = movie_lookup[~movie_lookup["movieId"].isin(exclude)].copy()
    df = df[df["rating_count"] >= m]

    # Bayesian average: (v/(v+m)) * R + (m/(v+m)) * C
    v = df["rating_count"]
    R = df["avg_rating"]
    df["score"] = (v / (v + m)) * R + (m / (v + m)) * C

    top = df.nlargest(top_n, "score")
    return [format_movie(int(mid)) for mid in top["movieId"] if format_movie(int(mid))]


# ==============================
# REQUEST MODELS
# ==============================
class RecommendRequest(BaseModel):
    sequence: list[int]   # list of recently watched movieIds
    top_n: int = 8


class WatchRequest(BaseModel):
    userId: int
    movieId: int


# ==============================
# ROUTES
# ==============================

@app.get("/")
def home():
    return {
        "status": "running",
        "model_loaded": MODEL_LOADED,
        "movies_in_db": len(movie_lookup),
        "movies_with_posters": int(movie_lookup["poster_url"].ne("").sum()),
    }


@app.post("/recommend")
def recommend(req: RecommendRequest):
    if req.top_n < 1 or req.top_n > 50:
        raise HTTPException(status_code=400, detail="top_n must be between 1 and 50")

    if MODEL_LOADED and req.sequence:
        results = ml_recommend(req.sequence, req.top_n)
        source  = "model"
    else:
        results = popularity_recommend(req.top_n)
        source  = "popularity"

    return {
        "source":          source,
        "model_loaded":    MODEL_LOADED,
        "recommendations": results,
    }


@app.get("/movie/{movie_id}")
def get_movie(movie_id: int):
    entry = format_movie(movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")
    return entry


@app.get("/search")
def search(q: str, limit: int = 10):
    """Search movies by title (case-insensitive substring match)."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")

    matches = movie_lookup[movie_lookup["title"].str.contains(q, case=False, na=False)]
    matches = matches.head(limit)

    results = [format_movie(int(mid)) for mid in matches["movieId"]]
    return {"query": q, "results": [r for r in results if r]}


@app.get("/genres")
def list_genres():
    """Return all unique genres in the dataset."""
    all_genres = set()
    for g in movies["genres"].dropna():
        all_genres.update(g.split("|"))
    return {"genres": sorted(all_genres)}


@app.get("/popular")
def popular(limit: int = 8, genre: str = None):
    """Top movies by Bayesian rating, optionally filtered by genre."""
    exclude = set()
    if genre:
        filtered = movie_lookup[movie_lookup["genres"].str.contains(genre, case=False, na=False)]
        exclude  = set(movie_lookup["movieId"]) - set(filtered["movieId"])

    results = popularity_recommend(limit, exclude=exclude)
    return {"genre": genre, "results": results}


@app.post("/watch")
def watch(req: WatchRequest):
    """Log a watch event (stub — wire to a DB in production)."""
    if req.movieId not in movie_index.index:
        raise HTTPException(status_code=404, detail=f"Movie {req.movieId} not found")
    return {"status": "ok", "userId": req.userId, "movieId": req.movieId}