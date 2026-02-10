const express = require("express")
const router = express.Router()
const axios = require("axios")

async function fetchTmdbReviews(movieId) {
    let page = 1
    let totalPages = 1
    let reviews = []

    do {
        const r = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/reviews`,
            {
                params: {
                    api_key: process.env.TMDB_API_KEY,
                    language: "en-US",
                    page
                }
            }
        )

        reviews.push(...r.data.results)
        totalPages = r.data.total_pages
        page++
    } while (page <= totalPages)

    return reviews.filter(r => r.content && r.content.length > 20)
}

router.get("/analyze/:movieId", async (req, res) => {
    try {
        const { movieId } = req.params

        // 1️⃣ ดึงรีวิวจาก TMDB
        const reviews = await fetchTmdbReviews(movieId)
        const source = "TMDB"

        // ไม่มีรีวิวเลย
        if (reviews.length === 0) {
            return res.json({
                source,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            })
        }

        // 2️⃣ ส่งเข้า sentiment model
        const sentimentRes = await axios.post(
            "http://127.0.0.1:8000/predict_batch",
            {
                texts: reviews.map(r => r.content)
            },
            { timeout: 60_000 }
        )

        const sentiments = sentimentRes.data

        // 3️⃣ merge + นับผล
        let positive = 0
        let negative = 0
        let neutral = 0

        const merged = reviews.map((r, i) => {
            const label = sentiments[i].label.toLowerCase()

            if (label === "positive") positive++
            else if (label === "negative") negative++
            else neutral++

            return {
                author: r.author,
                content: r.content,
                sentiment: label,
                confidence: sentiments[i].max_prob
            }
        })

        const total = merged.length

        const stats = {
            positive,
            negative,
            neutral,
            positivePercent: +(positive / total * 100).toFixed(2),
            negativePercent: +(negative / total * 100).toFixed(2),
            neutralPercent: +(neutral / total * 100).toFixed(2)
        }

        // 4️⃣ สรุป verdict
        
        if (
            stats.positive > stats.negative &&
            stats.positive > stats.neutral
        ) {
            summary = "positive";
        }

        if (
            stats.negative > stats.positive &&
            stats.negative > stats.neutral
        ) {
            summary = "negative";
        }

        // กรณี neutral เด่น
        if (
            stats.neutral > stats.positive &&
            stats.neutral > stats.negative
        ) {
            summary = "neutral";
        }

        // override กรณีชนะขาด
        if (stats.positivePercent >= 60) summary = "positive";
        else if (stats.negativePercent >= 60) summary = "negative";

        // 5️⃣ response
        res.json({
            source,
            totalReviews: total,
            summary,
            stats,
            reviews: merged
        })

    } catch (err) {
        console.error("ANALYZE ERROR:", err.message)
        if (err.response) {
            console.error("Response data:", err.response.data)
        }
        res.status(500).json({ error: "Analyze failed" })
    }
})

module.exports = router
