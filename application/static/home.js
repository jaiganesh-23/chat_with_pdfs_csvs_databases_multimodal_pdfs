
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

function makeRequest(method, url, data, loading_div, loading_text) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.upload.onprogress = function(event){
            let percentComplete = (event.loaded / event.total) * 100;
            loading_div.style.setProperty('--progress', percentComplete + '%');
            loading_text.textContent = `${Math.round(percentComplete)}%`;
        }
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    message: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                message: xhr.statusText
            });
        };
        xhr.send(data);
    });
}

let uploading = false;
uploaded_pdfs = [];
uploaded_csvs = [];
uploaded_dbs = [];

async function getfiles(){
    let response = await fetch("/get_files", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    });
    let data = await response.json();
    files = data.files;
    for (file of files) {  
        if (file.fileType == "pdf") {
            let new_div = document.createElement("div");
            let new_div_wrapper = document.createElement("div");
            new_div.classList.add("pdf");
            new_div_wrapper.classList.add("pdf-wrapper");
            let icon = document.createElement("i");
            icon.classList.add("bx", "bxs-file-blank", "pdf-icon");
            let p1 = document.createElement("p");
            p1.textContent = "File: " + file.oldFileName;
            let p2 = document.createElement("p");   
            p2.textContent = "File Description: " + file.fileDescription;
            new_div.appendChild(icon);
            new_div.appendChild(p1);
            new_div.appendChild(p2);
            let pdfs_list = document.querySelector(".pdfs-list");
            let loaded_icon_div = document.createElement("div");
            let loaded_icon = document.createElement("i");
            loaded_icon_div.classList.add("loaded-icon");
            loaded_icon.classList.add("bx", "bxs-check-square");
            loaded_icon_div.appendChild(loaded_icon);
            new_div_wrapper.appendChild(loaded_icon_div);
            new_div_wrapper.appendChild(new_div);
            pdfs_list.appendChild(new_div_wrapper);
            uploaded_pdfs.push(file);
        }
        else if (file.fileType == "csv/xlsx") {
            let new_div = document.createElement("div");
            let new_div_wrapper = document.createElement("div");
            new_div.classList.add("csv");
            new_div_wrapper.classList.add("csv-wrapper");
            let icon = document.createElement("i");
            icon.classList.add("bx", "bxs-file-blank", "csv-icon");
            let p1 = document.createElement("p");
            p1.textContent = "File: " + file.oldFileName;
            let p2 = document.createElement("p");   
            p2.textContent = "File Description: " + file.fileDescription;
            new_div.appendChild(icon);
            new_div.appendChild(p1);
            new_div.appendChild(p2);
            let csvs_list = document.querySelector(".csvs-list");
            let loaded_icon_div = document.createElement("div");
            let loaded_icon = document.createElement("i");
            loaded_icon_div.classList.add("loaded-icon");
            loaded_icon.classList.add("bx", "bxs-check-square");
            loaded_icon_div.appendChild(loaded_icon);
            new_div_wrapper.appendChild(loaded_icon_div);
            new_div_wrapper.appendChild(new_div);
            csvs_list.appendChild(new_div_wrapper);
            uploaded_csvs.push(file);
        }
        else if (file.fileType == "db") {
            let new_div = document.createElement("div");
            let new_div_wrapper = document.createElement("div");
            new_div.classList.add("db");
            new_div_wrapper.classList.add("db-wrapper");
            let icon = document.createElement("i");
            icon.classList.add("bx", "bxs-file-blank", "db-icon");
            let p1 = document.createElement("p");
            p1.textContent = "File: " + file.oldFileName;
            let p2 = document.createElement("p");   
            p2.textContent = "File Description: " + file.fileDescription;
            new_div.appendChild(icon);
            new_div.appendChild(p1);
            new_div.appendChild(p2);
            let dbs_list = document.querySelector(".dbs-list");
            let loaded_icon_div = document.createElement("div");
            let loaded_icon = document.createElement("i");
            loaded_icon_div.classList.add("loaded-icon");
            loaded_icon.classList.add("bx", "bxs-check-square");
            loaded_icon_div.appendChild(loaded_icon);
            new_div_wrapper.appendChild(loaded_icon_div);
            new_div_wrapper.appendChild(new_div);
            dbs_list.appendChild(new_div_wrapper);
            uploaded_dbs.push(file);
        }
    }
    if(uploaded_pdfs.length == 0){
        let new_div = document.createElement("div");
        new_div.classList.add("no-pdf-files");
        let p1 = document.createElement("p");
        p1.textContent = "No PDF files uploaded yet.";
        new_div.appendChild(p1);
        let pdfs_list = document.querySelector(".pdfs-list");
        pdfs_list.appendChild(new_div);
    }
    if(uploaded_csvs.length == 0){
        let new_div = document.createElement("div");
        new_div.classList.add("no-csv-files");
        let p1 = document.createElement("p");
        p1.textContent = "No CSV files uploaded yet.";
        new_div.appendChild(p1);
        let csvs_list = document.querySelector(".csvs-list");
        csvs_list.appendChild(new_div);
    }
    if(uploaded_dbs.length == 0){
        let new_div = document.createElement("div");
        new_div.classList.add("no-db-files");
        let p1 = document.createElement("p");
        p1.textContent = "No DB files uploaded yet.";
        new_div.appendChild(p1);
        let dbs_list = document.querySelector(".dbs-list");
        dbs_list.appendChild(new_div);
    }
}
getfiles();

let pdfs_list = document.querySelector(".pdfs-list");
let pdf_file_upload = document.querySelector(".pdf-upload-icon");
let pdf_input = document.querySelector("#pdf-file");
let pdf_upload = document.querySelector(".pdf-upload");
let pdf_description = document.querySelector("#pdf-description");
let pdf_button = document.querySelector("#upload-pdf");
pdf_file_upload.addEventListener("click", function (e) {
    e.preventDefault();
    pdf_input.click();
});
pdf_input.addEventListener("change", function(e) {
    e.preventDefault();
    let old_div = document.querySelector(".pdf-selected-files");
    if(old_div != null){
        old_div.remove();   
    }
    let new_div = document.createElement("div");
    let p1 = document.createElement("p");
    p1.textContent = "Selected File: ";
    let ins = pdf_input.files.length;
    new_div.appendChild(p1);
    new_div.classList.add("pdf-selected-files");
    
    for(let x=0;x<ins;x++){
        let new_p = document.createElement("p");
        new_p.textContent = pdf_input.files[x].name;
        new_div.appendChild(new_p);
    }
    pdf_upload.appendChild(new_div);
});
pdf_button.addEventListener("click", async function (e) {
    e.preventDefault();
    uploading = true;
    let file = {"fileName": pdf_input.files[0].name, "fileDescription": pdf_description.value, "fileType": "pdf", "oldFileName": pdf_input.files[0].name};
    console.log(file);

    if(uploaded_pdfs.length == 0){
        let new_div = document.querySelector(".no-pdf-files");
        new_div.remove();
    }

    uploaded_pdfs.push(file);

    let new_div = document.createElement("div");
    let new_div_wrapper = document.createElement("div");
    let loading_div = document.createElement("div");
    let loading_text = document.createElement("p");
    new_div.classList.add("pdf");
    new_div_wrapper.classList.add("pdf-wrapper");
    loading_div.classList.add("loading-div");
    loading_text.classList.add("loading-text");
    loading_text.textContent = "0%";
    loading_div.appendChild(loading_text);
    let icon = document.createElement("i");
    icon.classList.add("bx", "bxs-file-blank", "pdf-icon");
    let p1 = document.createElement("p");
    p1.textContent = "File: " + pdf_input.files[0].name;
    let p2 = document.createElement("p");   
    p2.textContent = "File Description: " + pdf_description.value;
    new_div.appendChild(icon);
    new_div.appendChild(p1);
    new_div.appendChild(p2);
    new_div_wrapper.appendChild(loading_div);
    new_div_wrapper.appendChild(new_div);
    pdfs_list.appendChild(new_div_wrapper);

    let form_data = new FormData();
    form_data.append("files[]", pdf_input.files[0]);
    form_data.append("file", JSON.stringify(file));
    let response = await makeRequest("POST", "/upload_pdf", form_data, loading_div, loading_text);

    loading_div.remove();
    let loaded_icon_div = document.createElement("div");
    let loaded_icon = document.createElement("i");
    loaded_icon_div.classList.add("loaded-icon");
    loaded_icon.classList.add("bx", "bxs-check-square");
    loaded_icon_div.appendChild(loaded_icon);
    new_div_wrapper.prepend(loaded_icon_div);

    pdf_description.value = null;
    let pdf_selected_files = document.querySelectorAll(".pdf-selected-files");
    pdf_selected_files.forEach(function (item) {
        item.remove();
    });
    pdf_input.value = null;
    uploading = false;
})

let csvs_list = document.querySelector(".csvs-list");   
let csv_file_upload = document.querySelector(".csv-upload-icon");
let csv_input = document.querySelector("#csv-file");
let csv_upload = document.querySelector(".csv-upload");
let csv_description = document.querySelector("#csv-description");
let csv_button = document.querySelector("#upload-csv");
csv_file_upload.addEventListener("click", function (e) {
    e.preventDefault();
    csv_input.click();
});
csv_input.addEventListener("change", function(e) {
    e.preventDefault();
    let old_div = document.querySelector(".csv-selected-files");
    if(old_div != null){
        old_div.remove();
    }
    let new_div = document.createElement("div");
    let p1 = document.createElement("p");
    p1.textContent = "Selected File: ";
    let ins = csv_input.files.length;
    new_div.appendChild(p1);
    new_div.classList.add("csv-selected-files");
    
    for(let x=0;x<ins;x++){
        let new_p = document.createElement("p");
        new_p.textContent = csv_input.files[x].name;
        new_div.appendChild(new_p);
    }
    csv_upload.appendChild(new_div);
});
csv_button.addEventListener("click", async function (e) {
    e.preventDefault();
    uploading = true;
    let file = {"fileName": csv_input.files[0].name, "fileDescription": csv_description.value, "fileType": "csv/xlsx", "oldFileName": csv_input.files[0].name};
    console.log(file);

    if(uploaded_csvs.length == 0){
        let new_div = document.querySelector(".no-csv-files");
        new_div.remove();
    }

    uploaded_csvs.push(file);

    let new_div = document.createElement("div");
    let new_div_wrapper = document.createElement("div");
    let loading_div = document.createElement("div");
    let loading_text = document.createElement("p");
    new_div.classList.add("csv");
    new_div_wrapper.classList.add("csv-wrapper");
    loading_div.classList.add("loading-div");
    loading_text.classList.add("loading-text");
    loading_text.textContent = "0%";
    loading_div.appendChild(loading_text);
    let icon = document.createElement("i");
    icon.classList.add("bx", "bxs-file-blank", "csv-icon");
    let p1 = document.createElement("p");
    p1.textContent = "File: " + csv_input.files[0].name;
    let p2 = document.createElement("p");   
    p2.textContent = "File Description: " + csv_description.value;
    new_div.appendChild(icon);
    new_div.appendChild(p1);
    new_div.appendChild(p2);
    new_div_wrapper.appendChild(loading_div);
    new_div_wrapper.appendChild(new_div);
    csvs_list.appendChild(new_div_wrapper);

    let form_data = new FormData();
    form_data.append("files[]", csv_input.files[0]);
    form_data.append("file", JSON.stringify(file));
    let response = await makeRequest("POST", "/upload_csv", form_data, loading_div, loading_text);

    loading_div.remove();
    let loaded_icon_div = document.createElement("div");
    let loaded_icon = document.createElement("i");
    loaded_icon_div.classList.add("loaded-icon");
    loaded_icon.classList.add("bx", "bxs-check-square");
    loaded_icon_div.appendChild(loaded_icon);
    new_div_wrapper.prepend(loaded_icon_div);

    csv_description.value = null;
    let csv_selected_files = document.querySelectorAll(".csv-selected-files");
    csv_selected_files.forEach(function (item) {
        item.remove();
    });
    csv_input.value = null;
    uploading = false;
});

let dbs_list = document.querySelector(".dbs-list");
let db_file_upload = document.querySelector(".db-upload-icon");
let db_input = document.querySelector("#db-file");
let db_upload = document.querySelector(".db-upload");
let db_description = document.querySelector("#db-description");
let db_button = document.querySelector("#upload-db");
db_file_upload.addEventListener("click", function (e) {
    e.preventDefault();
    db_input.click();
});
db_input.addEventListener("change", function(e) {
    e.preventDefault();
    let old_div = document.querySelector(".db-selected-files");
    if(old_div != null){
        old_div.remove();
    }
    let new_div = document.createElement("div");
    let p1 = document.createElement("p");
    p1.textContent = "Selected File: ";
    let ins = db_input.files.length;
    new_div.appendChild(p1);
    new_div.classList.add("db-selected-files");
    
    for(let x=0;x<ins;x++){
        let new_p = document.createElement("p");
        new_p.textContent = db_input.files[x].name;
        new_div.appendChild(new_p);
    }
    db_upload.appendChild(new_div);
});
db_button.addEventListener("click", async function (e) {
    e.preventDefault();
    uploading = true;
    let file = {"fileName": db_input.files[0].name, "fileDescription": db_description.value, "fileType": "db", "oldFileName": db_input.files[0].name};
    console.log(file);

    if(uploaded_dbs.length == 0){
        let new_div = document.querySelector(".no-db-files");
        new_div.remove();
    }

    uploaded_dbs.push(file);

    let new_div = document.createElement("div");
    let new_div_wrapper = document.createElement("div");
    let loading_div = document.createElement("div");
    let loading_text = document.createElement("p");
    new_div.classList.add("db");
    new_div_wrapper.classList.add("db-wrapper");
    loading_div.classList.add("loading-div");
    loading_text.classList.add("loading-text");
    loading_text.textContent = "0%";
    loading_div.appendChild(loading_text);
    let icon = document.createElement("i");
    icon.classList.add("bx", "bxs-file-blank", "db-icon");
    let p1 = document.createElement("p");
    p1.textContent = "File: " + db_input.files[0].name;
    let p2 = document.createElement("p");   
    p2.textContent = "File Description: " + db_description.value;
    new_div.appendChild(icon);
    new_div.appendChild(p1);
    new_div.appendChild(p2);
    new_div_wrapper.appendChild(loading_div);
    new_div_wrapper.appendChild(new_div);
    dbs_list.appendChild(new_div_wrapper);

    let form_data = new FormData();
    form_data.append("files[]", db_input.files[0]);
    form_data.append("file", JSON.stringify(file));
    let response = await makeRequest("POST", "/upload_db", form_data, loading_div, loading_text);

    loading_div.remove();
    let loaded_icon_div = document.createElement("div");
    let loaded_icon = document.createElement("i");
    loaded_icon_div.classList.add("loaded-icon");
    loaded_icon.classList.add("bx", "bxs-check-square");
    loaded_icon_div.appendChild(loaded_icon);
    new_div_wrapper.prepend(loaded_icon_div);

    db_description.value = null;
    let db_selected_files = document.querySelectorAll(".db-selected-files");
    db_selected_files.forEach(function (item) {
        item.remove();
    });
    db_input.value = null;
    uploading = false;
});

let prepare_button = document.querySelector(".prepare-button");
prepare_button.addEventListener("click", async function (e) {
    e.preventDefault();

    if(uploading== true){
        let overlay = document.querySelector("#uploading-overlay");
        let popup = document.querySelector("#uploading-popup");
        overlay.style.display = "block";
        popup.style.display = "block";
        return;
    }

    let overlay = document.querySelector("#overlay");
    let popup = document.querySelector("#popup");
    overlay.style.display = "block";
    popup.style.display = "block";

    let response = await fetch("/prepare_chatbot", {
        method: "POST",
    });
    let data = await response.json();
    
    let loader = document.querySelector(".loader");
    let popup_preparing_text = document.querySelector(".popup-preparing-text");
    loader.style.display = "none";
    popup_preparing_text.style.display = "none";

    let popup_response_text = document.querySelector(".popup-response-text");
    popup_response_text.textContent = data.message;
    popup_response_text.style.display = "block"

    let popup_button = document.querySelector(".popup-button");
    popup_button.style.display = "block";
});

let popup_button = document.querySelector(".popup-button");
popup_button.addEventListener("click", function(e) {
    e.preventDefault();

    let overlay = document.querySelector("#overlay");
    let popup = document.querySelector("#popup");
    overlay.style.display = "none";
    popup.style.display = "none";

    let loader = document.querySelector(".loader");
    let popup_preparing_text = document.querySelector(".popup-preparing-text");
    loader.style.display = "block";
    popup_preparing_text.style.display = "block";

    let popup_response_text = document.querySelector(".popup-response-text");
    popup_response_text.style.display = "none";

    let popup_button = document.querySelector(".popup-button");
    popup_button.style.display = "none";
})

let uploading_popup_button = document.querySelector(".uploading-popup-button");
uploading_popup_button.addEventListener("click", function(e) {
    e.preventDefault();

    let overlay = document.querySelector("#uploading-overlay");
    let popup = document.querySelector("#uploading-popup");
    overlay.style.display = "none";
    popup.style.display = "none";
})

