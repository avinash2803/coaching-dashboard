import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const faqPath = path.join(
    __dirname,
    "../data/faqs.json"
);

const faqs = JSON.parse(
    fs.readFileSync(faqPath, "utf8")
);

router.post("/", async (req, res) => {

    try {

        const message =
            req.body.message.toLowerCase();

        for (const faq of faqs) {

            for (const keyword of faq.keywords) {

                if (message.includes(keyword)) {

                    return res.json({
                        reply: faq.answer
                    });

                }
            }
        }

        res.json({
            reply:
                "Sorry, I couldn't find the answer. Please contact the coaching office for more information."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            reply:
                "Something went wrong."
        });

    }

});

export default router;