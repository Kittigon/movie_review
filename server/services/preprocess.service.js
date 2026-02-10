function preprocess(reviews) {
    return reviews.map(r =>
        r
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
            .toLowerCase()
    );
}

module.exports = { preprocess };