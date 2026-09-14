const {
    askMediCoreAI,
} = require("../services/aiAssistantService");


// ============================================================
// SIMPLE RATE LIMITER
// ============================================================

const requestLog = new Map();

const WINDOW_MS = 60 * 1000;

const MAX_REQUESTS_PER_WINDOW = 20;


function getClientKey(req) {
    return (
        req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown"
    );
}


function isRateLimited(key) {
    const now = Date.now();

    const existing = requestLog.get(key);


    if (
        !existing ||
        now - existing.startedAt > WINDOW_MS
    ) {
        requestLog.set(key, {
            startedAt: now,
            count: 1,
        });

        return false;
    }


    existing.count += 1;


    return (
        existing.count >
        MAX_REQUESTS_PER_WINDOW
    );
}


function cleanupRateLog() {
    const now = Date.now();


    for (
        const [key, value]
        of requestLog.entries()
    ) {
        if (
            now - value.startedAt >
            WINDOW_MS
        ) {
            requestLog.delete(key);
        }
    }
}


setInterval(
    cleanupRateLog,
    5 * 60 * 1000
).unref();


// ============================================================
// AI CHAT
// ============================================================

exports.chat = async (
    req,
    res
) => {
    try {

        if (
            isRateLimited(
                getClientKey(req)
            )
        ) {
            return res.status(429).json({
                success: false,

                message:
                    "Too many questions right now. Please try again in a minute.",
            });
        }


        const {
            message,
            history,
        } = req.body || {};


        if (
            !message ||
            !String(message).trim()
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Please enter your question.",
            });
        }


        const answer =
            await askMediCoreAI({
                message,
                history,
            });


        return res.json({
            success: true,
            answer,
        });


    } catch (error) {

        console.error(
            "[MediCore AI] Error:",
            error.message
        );


        if (
            error.code ===
            "OPENAI_NOT_CONFIGURED"
        ) {
            return res.status(503).json({
                success: false,

                message:
                    "AI Assistant is not configured yet. Please add OPENAI_API_KEY to your .env file.",
            });
        }


        if (
            error.code === "EMPTY_MESSAGE" ||
            error.code === "MESSAGE_TOO_LONG"
        ) {
            return res.status(400).json({
                success: false,

                message:
                    error.message,
            });
        }


        if (
            error.status === 401
        ) {
            return res.status(503).json({
                success: false,

                message:
                    "AI Assistant authentication is not configured correctly.",
            });
        }


        if (
            error.status === 429
        ) {
            return res.status(503).json({
                success: false,

                message:
                    "AI Assistant is temporarily busy. Please try again in a moment.",
            });
        }


        return res.status(500).json({
            success: false,

            message:
                "I couldn't process that question right now. Please try again.",
        });
    }
};