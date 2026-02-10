const express = require("express")
const {
    fetchYoutubeComments,
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
        console.error(err.response?.data || err.message)
        res.status(500).json({ error: "Failed to fetch youtube comments" })
    }
})

module.exports = router
