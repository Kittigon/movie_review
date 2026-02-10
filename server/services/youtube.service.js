const axios = require("axios")

const BASE_URL = "https://www.googleapis.com/youtube/v3"
const API_KEY = process.env.YOUTUBE_API_KEY

async function fetchYoutubeComments(videoId, limit = 200) {
    let comments = []
    let nextPageToken = null

    while (comments.length < limit) {
        const res = await axios.get(`${BASE_URL}/commentThreads`, {
            params: {
                part: "snippet",
                videoId,
                maxResults: 100,
                pageToken: nextPageToken,
                key: API_KEY,
            },
        })

        res.data.items.forEach(item => {
            const c = item.snippet.topLevelComment.snippet
            comments.push({
                source: "youtube",
                videoId,
                commentId: item.id,
                text: c.textOriginal,
                author: c.authorDisplayName,
                likeCount: c.likeCount,
                publishedAt: c.publishedAt,
                replyCount: item.snippet.totalReplyCount,
            })
        })

        nextPageToken = res.data.nextPageToken
        if (!nextPageToken) break
    }

    return comments.slice(0, limit)
}

module.exports = {
    fetchYoutubeComments,
}
