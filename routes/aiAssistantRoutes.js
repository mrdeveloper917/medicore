const express = require("express");

const router = express.Router();


const aiAssistantController =
    require("../controllers/aiAssistantController");


// ============================================================
// MEDICORE AI CHAT
// POST /api/ai-assistant/chat
// ============================================================

router.post(
    "/chat",
    aiAssistantController.chat
);


module.exports = router;