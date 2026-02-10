import React, { useState, useEffect } from "react";

const MovieDetailModal = ({ movie, onClose }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!movie) return;
            setLoading(true);
            try {
                const res = await fetch(
                    `http://localhost:8080/analyze/${movie.id}`
                );
                if (!res.ok) throw new Error("Failed to analyze");
                const data = await res.json();
                setAnalysis(data);
            } catch (err) {
                console.error("Analysis Error:", err);
                setAnalysis(null);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [movie]);

    if (!movie) return null;

    /* ---------- helpers ---------- */

    const getSentimentColor = (summary) => {
        if (summary === "positive")
            return "text-green-700 bg-green-100 border-green-200";
        if (summary === "negative")
            return "text-red-700 bg-red-100 border-red-200";
        return "text-yellow-700 bg-yellow-100 border-yellow-200";
    };

    const sentimentBadge = (sentiment) => {
        if (sentiment === "positive")
            return "text-green-600 bg-green-100";
        if (sentiment === "negative")
            return "text-red-600 bg-red-100";
        return "text-yellow-600 bg-yellow-100";
    };

    const sentimentBorder = (sentiment) => {
        if (sentiment === "positive") return "border-green-400";
        if (sentiment === "negative") return "border-red-400";
        return "border-yellow-400";
    };

    /* ---------- UI ---------- */

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* close */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-black/50 text-white p-2 rounded-full"
                >
                    ✕
                </button>

                {/* poster */}
                <div className="w-full md:w-2/5 h-64 md:h-auto bg-gray-100">
                    <img
                        src={
                            movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : "https://via.placeholder.com/500x750"
                        }
                        alt={movie.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* content */}
                <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto">
                    <h2 className="text-3xl font-bold text-gray-900">
                        {movie.title}
                    </h2>

                    <p className="text-gray-500 text-sm mt-1 mb-4">
                        📅 {movie.release_date} • ⭐ {movie.rating || "-"}
                    </p>

                    <p className="text-gray-700 leading-relaxed mb-6 border-l-4 border-indigo-500 pl-4 bg-gray-50 py-3 rounded-r-lg">
                        {movie.overview || "ไม่มีข้อมูลเรื่องย่อ"}
                    </p>

                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        📊 AI Sentiment Analysis
                    </h3>

                    {loading ? (
                        <div className="py-8 text-center text-gray-500">
                            กำลังวิเคราะห์รีวิวจากผู้ชม...
                        </div>
                    ) : analysis ? (
                        <div className="space-y-6">
                            {/* summary */}
                            <div
                                className={`flex justify-between items-center p-4 rounded-xl border ${getSentimentColor(
                                    analysis.summary
                                )}`}
                            >
                                <span className="font-semibold">
                                    ผลตอบรับโดยรวม
                                </span>
                                <span className="font-bold uppercase">
                                    {analysis.summary}
                                </span>
                            </div>

                            {/* progress */}
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-green-600">
                                            Positive
                                        </span>
                                        <span>
                                            {analysis.stats?.positivePercent}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full transition-all"
                                            style={{
                                                width: `${analysis.stats?.positivePercent}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-red-600">
                                            Negative
                                        </span>
                                        <span>
                                            {analysis.stats?.negativePercent}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="bg-red-500 h-2.5 rounded-full transition-all"
                                            style={{
                                                width: `${analysis.stats?.negativePercent}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* reviews */}
                            {analysis.reviews &&
                                analysis.reviews.length > 0 && (
                                    <div className="pt-4 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-2">
                                            💬 ตัวอย่างความคิดเห็นจากผู้ชม
                                        </h4>

                                        <ul className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                            {analysis.reviews
                                                .slice(0, 3)
                                                .map((r, i) => (
                                                    <li
                                                        key={i}
                                                        className={`bg-gray-50 p-4 rounded-xl border-l-4 ${sentimentBorder(
                                                            r.sentiment
                                                        )}`}
                                                    >
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="font-semibold text-gray-700 text-sm">
                                                                {r.author ||
                                                                    "Anonymous"}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${sentimentBadge(
                                                                    r.sentiment
                                                                )}`}
                                                            >
                                                                {r.sentiment}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {r.content}
                                                        </p>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            ไม่สามารถดึงข้อมูลวิเคราะห์ได้
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailModal;
