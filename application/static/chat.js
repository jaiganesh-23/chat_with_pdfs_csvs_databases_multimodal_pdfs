
let menu_icon = document.querySelector(".menu-icon");
menu_icon.addEventListener("click", async function () {
    let sidebar = document.querySelector(".sidebar");
    let content = document.querySelector(".content");
    sidebar.classList.toggle("open");
    content.classList.toggle("open");
    menu_icon.classList.toggle('bx-menu');
    menu_icon.classList.toggle('bx-x');
    await fetch("/toggle_sidebar", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        }
    });
});

async function getMessages(){
    let chat_box = document.querySelector(".chat-box");
    let response = await fetch("/get_messages", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    response = await response.json();
    let messages = response.messages;

    for(message of messages){
        if(message.role == "assistant"){
            let message_string = message.message;
            let message_strings = message_string.split("\n");
            let message_div = document.createElement("div");
            message_div.classList.add("msg", "right");
            for (let i = 0; i < message_strings.length; i++){
                message_div.innerHTML += `<p>${message_strings[i]}</p>`;
            }
            chat_box.appendChild(message_div);
            chat_box.scrollTop = chat_box.scrollHeight;
        }
        else if(message.role == "user"){
            let message_string = message.message;
            let message_strings = message_string.split("\n");
            let message_div = document.createElement("div");
            message_div.classList.add("msg");
            for (let i = 0; i < message_strings.length; i++){
                message_div.innerHTML += `<p>${message_strings[i]}</p>`;
            }
            chat_box.appendChild(message_div);
            chat_box.scrollTop = chat_box.scrollHeight;
        }
    }   
}

getMessages();

let chat_box = document.querySelector(".chat-box");
let send_button = document.querySelector("#send-button");
send_button.addEventListener("click", async function (e) {
    e.preventDefault();
    let user_input = document.querySelector("#user-input");
    let message = user_input.value.trim();
    user_input.value = "";

    if(message){
        let loading_div = document.querySelector(".load");
        loading_div.style.display = "block";

        let message_div = document.createElement("div");
        message_div.classList.add("msg");
        let message_string = message;
        let message_strings = message_string.split("\n");
        for (let i = 0; i < message_strings.length; i++){
            message_div.innerHTML += `<p>${message_strings[i]}</p>`;
        }
        chat_box.appendChild(message_div);
        chat_box.scrollTop = chat_box.scrollHeight; 

        let response = await fetch("/get_response", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "message": message })
        })
        response = await response.json();
        loading_div.style.display = "none";

        let bot_message_div = document.createElement("div");
        bot_message_div.classList.add("msg", "right");
        let response_string = response.message;
        let response_strings = response_string.split("\n");
        for (let i = 0; i < response_strings.length; i++){
            bot_message_div.innerHTML += `<p>${response_strings[i]}</p>`;
        }
        chat_box.appendChild(bot_message_div);
        chat_box.scrollTop = chat_box.scrollHeight;
    }
});