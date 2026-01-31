const puppeteer = require("puppeteer");

async function scrapeReviews(imdbId, limit = 300) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled"
        ]
    });

    const page = await browser.newPage();

    // ปลอม UA กัน bot
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    // เข้า IMDb reviews
    await page.goto(
        `https://www.imdb.com/title/${imdbId}/reviews`,
        { waitUntil: "domcontentloaded", timeout: 0 }
    );

    // ปิด cookie / consent
    try {
        await page.waitForSelector("button", { timeout: 5000 });
        await page.evaluate(() => {
            const btns = [...document.querySelectorAll("button")];
            const accept = btns.find(b =>
                b.innerText.toLowerCase().includes("accept")
            );
            if (accept) accept.click();
        });
    } catch { }

    // รอ content จริง
    await page.waitForFunction(
        () => document.body.innerText.length > 3000,
        { timeout: 20000 }
    );

    // === Load more แบบ dynamic ===
    let lastCount = 0;

    for (let i = 0; i < 60; i++) {
        const currentCount = await page.evaluate(() =>
            document.querySelectorAll("[data-testid='review-text']").length
        );

        if (currentCount >= limit || currentCount === lastCount) break;
        lastCount = currentCount;

        await page.evaluate(() => {
            const btn = document.querySelector(
                "button[data-testid='load-more-trigger']"
            );
            if (btn) btn.click();
        });

        // บังคับ scroll + wait
        await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight)
        );
        await page.waitForTimeout(2500);
    }

    // === ดึง review text ===
    const reviews = await page.evaluate((limit) => {
        let texts = [];

        // selector หลัก
        const els = document.querySelectorAll(
            "[data-testid='review-text']"
        );
        els.forEach(el => {
            const text = el.innerText?.trim();
            if (text && text.length > 100) {
                texts.push(text);
            }
        });

        // fallback (กัน IMDb เปลี่ยน DOM)
        if (texts.length === 0) {
            const fallback = [...document.querySelectorAll("div")]
                .map(el => el.innerText)
                .filter(t => t && t.length > 200);
            texts = fallback;
        }

        // unique + limit
        return [...new Set(texts)].slice(0, limit);
    }, limit);

    await browser.close();
    return reviews;
}

module.exports = { scrapeReviews };
