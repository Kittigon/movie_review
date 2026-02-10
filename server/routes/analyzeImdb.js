const express = require("express");
const router = express.Router();
const axios = require("axios");

const { getImdbId } = require("../services/tmdb.service");
const { scrapeReviews } = require("../services/imdb.service");
const { preprocess } = require("../services/preprocess.service");

router.get("/api/analyze", async (req, res) => {
    try {
        const { movieId } = req.query;
        if (!movieId) {
            return res.status(400).json({ error: "missing movieId" });
        }

        // TMDB → IMDb
        const imdbId = await getImdbId(movieId);
        if (!imdbId) {
            return res.status(404).json({ error: "IMDb ID not found" });
        }

        // Scrape + clean
        const rawReviews = await scrapeReviews(imdbId, 300);
        const cleanReviews = preprocess(rawReviews);

        if (cleanReviews.length === 0) {
            return res.json({
                imdbId,
                totalReviews: 0,
                summary: "no data",
                stats: {},
                reviews: []
            });
        }

        // Sentiment
        const sentimentRes = await axios.post(
            "http://127.0.0.1:8000/predict_batch",
            { texts: cleanReviews },
            { timeout: 60_000 }
        );

        const sentiments = sentimentRes.data;

        // นับผล
        let positive = 0;
        let negative = 0;
        let neutral = 0;

        sentiments.forEach(s => {
            const label = s.label.toLowerCase();
            if (label === "positive") positive++;
            else if (label === "negative") negative++;
            else neutral++;
        });

        const total = sentiments.length;

        const stats = {
            positive: positive,
            negative: negative,
            neutral: neutral,
            positivePercent: +(positive / total * 100).toFixed(2),
            negativePercent: +(negative / total * 100).toFixed(2),
            neutralPercent: +(neutral / total * 100).toFixed(2),
        };

        let summary = "mixed";

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

        //  response
        res.json({
            imdbId,
            totalReviews: total,
            summary,
            stats,
            reviews: cleanReviews.slice(0, 5)
        });

    } catch (err) {
        console.error("ANALYZE ERROR ");
        console.error(err);
        res.status(500).json({
            error: err.message || "analyze failed"
        });
    }
});

module.exports = router;
