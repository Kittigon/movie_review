const express = require("express")
const axios = require("axios")

const router = express.Router()

/**
 * GET /api/health
 * Checks environment config and dependent services.
 */
router.get("/api/health", async (req, res) => {
    const tmdbConfigured = Boolean(process.env.TMDB_API_KEY)
    const youtubeConfigured = Boolean(process.env.YOUTUBE_API_KEY)

    let sentiment = { ok: false, status: "unknown" }
    try {
        const r = await axios.get("http://127.0.0.1:8000/health", {
            timeout: 2_000,
        })
        sentiment = { ok: true, status: r.status }
    } catch (err) {
        sentiment = {
            ok: false,
            status: err.response?.status || err.code || "unreachable",
        }
    }

    res.json({
        service: "movie-review-backend",
        env: {
            tmdbConfigured,
            youtubeConfigured,
        },
        sentiment,
        timestamp: new Date().toISOString(),
    })
})

module.exports = router
