const axios = require("axios");

async function getImdbId(tmdbId) {
    const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids`,
        {
            params: { api_key: process.env.TMDB_API_KEY }
        }
    );
    return data.imdb_id;
}


module.exports = { getImdbId };