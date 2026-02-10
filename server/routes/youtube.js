const express = require("express")
const {
    fetchYoutubeComments,
    checkYoutubeApi,
} = require("../services/youtube.service")

const router = express.Router()

/**
 * GET /api/youtube/comments?videoId=xxxx&limit=200
 */
router.get("/comments", async (req, res) => {
    const { videoId, limit = 200 } = req.query

    if (!videoId) {
        return res.status(400).json({ error: "videoId is required" })
    }

    try {
        const comments = await fetchYoutubeComments(
            videoId,
            Number(limit)
        )

        res.json({
            source: "youtube",
            videoId,
            count: comments.length,
            comments,
        })
    } catch (err) {
        const msg = err.message || "Failed to fetch youtube comments"
        console.error(err.response?.data || msg)
        if (msg.includes("Missing YOUTUBE_API_KEY")) {
            return res.status(500).json({ error: msg })
        }
        res.status(500).json({ error: "Failed to fetch youtube comments" })
    }
})


router.get("/api/youtube/comments", async (req, res) => {
    const { videoId, limit = 200 } = req.query

    if (!videoId) {
        return res.status(400).json({ error: "videoId is required" })
    }

    try {
        const comments = await fetchYoutubeComments(
            videoId,
            Number(limit)
        )

        res.json({
            source: "youtube",
            videoId,
            count: comments.length,
            comments,
        })
    } catch (err) {
        const msg = err.message || "Failed to fetch youtube comments"
        console.error(err.response?.data || msg)
        if (msg.includes("Missing YOUTUBE_API_KEY")) {
            return res.status(500).json({ error: msg })
        }
        res.status(500).json({ error: "Failed to fetch youtube comments" })
    }
})

/**
 * GET /api/youtube/health?videoId=xxxx
 * If no videoId provided, only checks API key presence.
 */
router.get("/api/youtube/health", async (req, res) => {
    const { videoId } = req.query
    try {
        const result = await checkYoutubeApi(videoId)
        res.json({
            source: "youtube",
            videoId: videoId || null,
            ...result,
        })
    } catch (err) {
        const msg = err.message || "YouTube API check failed"
        res.status(500).json({ error: msg })
    }
})

module.exports = router
