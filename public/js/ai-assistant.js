(() => {

    "use strict";


    const chat =
        document.getElementById(
            "mcAiChat"
        );

    const form =
        document.getElementById(
            "mcAiForm"
        );

    const input =
        document.getElementById(
            "mcAiInput"
        );

    const sendButton =
        document.getElementById(
            "mcAiSend"
        );

    const suggestions =
        document.querySelectorAll(
            "[data-ai-question]"
        );


    if (
        !chat ||
        !form ||
        !input ||
        !sendButton
    ) {
        return;
    }


    // ========================================================
    // CHAT HISTORY
    // ========================================================

    const history = [];


    // ========================================================
    // SCROLL
    // ========================================================

    function scrollToBottom() {

        chat.scrollTo({
            top: chat.scrollHeight,

            behavior: "smooth",
        });

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHtml(value) {

        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );
    }


    // ========================================================
    // FORMAT AI ANSWER
    // ========================================================

    function formatAnswer(value) {

        return escapeHtml(value)

            .replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
            )

            .replace(
                /\n/g,
                "<br>"
            );
    }


    // ========================================================
    // ADD MESSAGE
    // ========================================================

    function addMessage(
        role,
        content
    ) {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.className =
            role === "user"
                ? "mc-ai-message mc-ai-message-user"
                : "mc-ai-message mc-ai-message-assistant";


        const avatar =
            role === "user"

                ? `
                    <div class="mc-ai-avatar mc-ai-avatar-user">
                        <i class="fa-solid fa-user"></i>
                    </div>
                  `

                : `
                    <div class="mc-ai-avatar">
                        <i class="fa-solid fa-robot"></i>
                    </div>
                  `;


        const safeContent =
            role === "user"

                ? escapeHtml(content)
                    .replace(
                        /\n/g,
                        "<br>"
                    )

                : formatAnswer(content);


        wrapper.innerHTML = `
            ${avatar}

            <div class="mc-ai-bubble">
                ${safeContent}
            </div>
        `;


        chat.appendChild(wrapper);

        scrollToBottom();
    }


    // ========================================================
    // TYPING INDICATOR
    // ========================================================

    function addTyping() {

        const wrapper =
            document.createElement(
                "div"
            );


        wrapper.id =
            "mcAiTyping";


        wrapper.className =
            "mc-ai-message mc-ai-message-assistant";


        wrapper.innerHTML = `

            <div class="mc-ai-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>


            <div class="mc-ai-bubble mc-ai-typing">

                <span></span>
                <span></span>
                <span></span>

            </div>

        `;


        chat.appendChild(wrapper);

        scrollToBottom();
    }


    function removeTyping() {

        document
            .getElementById(
                "mcAiTyping"
            )
            ?.remove();

    }


    // ========================================================
    // LOADING STATE
    // ========================================================

    function setLoading(
        loading
    ) {

        input.disabled =
            loading;

        sendButton.disabled =
            loading;


        if (loading) {

            sendButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i>';

        } else {

            sendButton.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i>';

        }

    }


    // ========================================================
    // ASK AI
    // ========================================================

    async function askAI(
        message
    ) {

        const cleanMessage =
            String(
                message || ""
            ).trim();


        if (!cleanMessage) {
            return;
        }


        addMessage(
            "user",
            cleanMessage
        );


        history.push({
            role: "user",
            content: cleanMessage,
        });


        input.value = "";

        setLoading(true);

        addTyping();


        try {

            const response =
                await fetch(
                    "/api/ai-assistant/chat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        credentials:
                            "same-origin",

                        body: JSON.stringify({
                            message:
                                cleanMessage,

                            history:
                                history.slice(
                                    -8
                                ),
                        }),
                    }
                );


            const data =
                await response.json();


            removeTyping();


            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to get an AI response."
                );
            }


            addMessage(
                "assistant",
                data.answer
            );


            history.push({
                role: "assistant",
                content:
                    data.answer,
            });


            if (
                history.length > 10
            ) {
                history.splice(
                    0,
                    history.length - 10
                );
            }


        } catch (error) {

            removeTyping();


            addMessage(
                "assistant",

                error.message ||
                    "Sorry, I couldn't answer right now. Please try again."
            );


        } finally {

            setLoading(false);

            input.focus();

        }

    }


    // ========================================================
    // FORM SUBMIT
    // ========================================================

    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            if (
                sendButton.disabled
            ) {
                return;
            }


            askAI(
                input.value
            );

        }
    );


    // ========================================================
    // ENTER KEY
    // ========================================================

    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                form.requestSubmit();

            }

        }
    );


    // ========================================================
    // QUICK QUESTIONS
    // ========================================================

    suggestions.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const question =
                        button.getAttribute(
                            "data-ai-question"
                        );


                    if (
                        !question ||
                        sendButton.disabled
                    ) {
                        return;
                    }


                    input.value =
                        question;

                    input.focus();

                    form.requestSubmit();

                }
            );

        }
    );

})();