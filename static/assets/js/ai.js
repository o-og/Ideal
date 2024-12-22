const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector("#delete-btn");

const userId = Date.now().toString();
let userText = null;
let isProcessing = false;

const loadDataFromLocalstorage = () => {
  const defaultText = `<div class="default-text">
                            <h1>ChatGPT</h1>
                            <p>Start a conversation and use AI.<br> Your chat history will be displayed here.</p>
                        </div>`;

  chatContainer.innerHTML = defaultText;
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

const createChatElement = (content, className) => {
  const chatDiv = document.createElement("div");
  chatDiv.classList.add("chat", className);
  chatDiv.innerHTML = content;
  return chatDiv;
};

const getChatResponse = async (incomingChatDiv) => {
  const pElement = document.createElement("p");
  let html;
  try {
    const data = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userText, userId }),
    });
    const response = await data.json();
    html = response.response.replace(
      /<pre><code class="language-(.*?)">([\s\S]*?)<\/code><\/pre>/g,
      (match, lang, code) => {
        const language = Prism.languages[lang] ? lang : "plaintext"; // Default to plaintext if unknown
        const highlightedCode = Prism.highlight(
          code,
          Prism.languages[language],
          language
        );
        return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;
      }
    );
    html = marked.parse(response.response);
    pElement.appendChild(document.createRange().createContextualFragment(html));
  } catch (error) {
    if (data.response.status === 429) {
      pElement.classList.add("error");
      pElement.textContent =
        "Too many requests have been sent in 1 minute, please try again later.";
    } else if (error.response.status === 503) {
      pElement.classList.add("error");
      pElement.textContent = "AI is currently overloaded, please try again.";
    } else {
      pElement.classList.add("error");
      pElement.textContent =
        "Oops! Something went wrong while retrieving the response. Please try again.";
      console.log(error);
    }
  }

  incomingChatDiv.querySelector(".typing-animation").remove();
  incomingChatDiv.querySelector(".chat-details").appendChild(pElement);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  isProcessing = false;
  sendButton.classList.replace("fa-stop", "fa-paper-plane");
};

const copyResponse = (copyBtn) => {
  const responseTextElement = copyBtn.parentElement.querySelector("p");
  navigator.clipboard.writeText(responseTextElement.textContent);
  copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
  setTimeout(
    () => (copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>'),
    1000
  );
};

const showTypingAnimation = () => {
  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="/img/gmsai.jpg" class='avatar' alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                    <span onclick="copyResponse(this)" class="material-symbols-rounded">
                        <i class="fa-regular fa-copy"></i>
                    </span>
                </div>`;
  const incomingChatDiv = createChatElement(html, "incoming");
  chatContainer.appendChild(incomingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  getChatResponse(incomingChatDiv);
};

const handleOutgoingChat = () => {
  if (isProcessing) {
    return;
  }

  userText = chatInput.value.trim();
  if (!userText) return;

  chatInput.value = "";
  chatInput.style.height = `${initialInputHeight}px`;

  const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="img/user.webp" class='avatar' alt="user-img">
                        <p>${userText}</p>
                    </div>
                </div>`;

  const outgoingChatDiv = createChatElement(html, "outgoing");
  chatContainer.querySelector(".default-text")?.remove();
  chatContainer.appendChild(outgoingChatDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  isProcessing = true;
  sendButton.classList.replace("fa-paper-plane", "fa-stop");
  setTimeout(showTypingAnimation, 500);
};

deleteButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    location.reload();
  }
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
  chatInput.style.height = `${initialInputHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleOutgoingChat();
  }
});

sendButton.addEventListener("click", handleOutgoingChat);

document.addEventListener("keydown", (e) => {
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Control",
      "Alt",
    ].includes(e.key) ||
    e.metaKey
  )
    return;

  chatInput.focus();
});
chatContainer.innerHTML = `<div class="default-text">
                            <h1>ChatGPT</h1>
                            <p>Start a conversation and use AI.<br> Start typing or click the prompt box.</p>
                        </div>`;
