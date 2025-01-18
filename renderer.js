const fs = require("fs");
const path = require("path");
const { shell } = require("electron");

const linkContainer = document.getElementById("link-container");
const linkForm = document.getElementById("link-form");
const categorySelect = document.getElementById("category");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
// JSON path
const linksFilePath = path.join(__dirname, "links.json");

const loadLinks = () => {
    try {
        const data = JSON.parse(fs.readFileSync(linksFilePath, "utf-8"));
        // 既存のリンクをクリア
        linkContainer.innerHTML = "";
        const rowDiv = document.createElement("div");
        rowDiv.className = "my-row";
        data.forEach((category, categoryIndex) => {
            const colDiv = document.createElement("div");
            colDiv.className = "category-card";
            colDiv.dataset.index = categoryIndex;
            const categoryDiv = document.createElement("div");
            categoryDiv.className = "link-card border p-3 rounded shadow-sm bg-light";
            const categoryTitle = document.createElement("h2");
            categoryTitle.textContent = category.category;
            categoryDiv.appendChild(categoryTitle);
            const linkList = document.createElement("ul");
            linkList.className = "list-group";
            category.links.forEach((link, linkIndex) => {
                const listItem = document.createElement("li");
                listItem.className = "list-group-item";
                const linkRow = document.createElement("div");
                linkRow.className = "d-flex justify-content-between align-items-center";
                // 名前部分
                const linkElement = document.createElement("a");
                linkElement.textContent = link.name;
                linkElement.className = "text-primary";
                linkElement.setAttribute("style", "text-decoration:none;");
                linkElement.href = link.url;
                linkElement.addEventListener("click", (event) => {
                    event.preventDefault();
                    shell.openExternal(link.url);
                });
                // トグル用SVG（初期は+）
                const toggleSvg = document.createElement("i");
                toggleSvg.className = "bi bi-plus-square";
                toggleSvg.style.cursor = "pointer";
                // URL部分（初期は非表示）
                const linkUrl = document.createElement("div");
                linkUrl.textContent = link.url;
                linkUrl.className = "text-muted mt-2";
                linkUrl.style.display = "none";
                // SVGにクリックイベントを設定
                toggleSvg.addEventListener("click", () => {
                    const isOpen = linkUrl.style.display === "none";
                    linkUrl.style.display = isOpen ? "block" : "none";
                    listItem.setAttribute("data-open", isOpen);
                    toggleSvg.setAttribute(
                        "class",
                        isOpen ? "bi bi-x-square" : "bi bi-plus-square"
                    );
                });
                linkRow.appendChild(linkElement);
                linkRow.appendChild(toggleSvg);
                listItem.appendChild(linkRow);
                listItem.appendChild(linkUrl);
                linkList.appendChild(listItem);
            });
            categoryDiv.appendChild(linkList);
            colDiv.appendChild(categoryDiv);
            rowDiv.appendChild(colDiv);
            // 再描画を強制
            rowDiv.style.display = "none";
            rowDiv.offsetHeight; // DOMリフローをトリガー
            rowDiv.style.display = "";
            initLinkSortable(linkList, category, data);
        });

        linkContainer.appendChild(rowDiv);
        initCategorySortable(rowDiv, data);
    } catch (error) {
        console.error("Error loading links:", error);
    }
};
// リンク用の Sortable 初期化関数
const initLinkSortable = (linkList, category, data) => {
    new Sortable(linkList, {
        animation: 150,
        filter: "a, .text-muted",
        group: "links",
        preventOnFilter: false,
        onEnd: (evt) => {
            const movedLink = category.links.splice(evt.oldIndex, 1)[0];
            category.links.splice(evt.newIndex, 0, movedLink);
            saveAndReload(data);
        },
    });
};
// カテゴリ用の Sortable 初期化関数
const initCategorySortable = (rowDiv, data) => {
    new Sortable(rowDiv, {
        animation: 150,
        filter: "a, .text-muted", // リンクや非表示部分を除外
        preventOnFilter: false, // フィルタされた要素のデフォルト動作を許可
        onEnd: (evt) => {
            const movedCategory = data.splice(evt.oldIndex, 1)[0];
            data.splice(evt.newIndex, 0, movedCategory);
            // 更新されたデータを保存
            saveAndReload(data);
        },
    });
};
const saveAndReload = (updatedData) => {
    try {
        fs.writeFileSync(linksFilePath, JSON.stringify(updatedData, null, 2));
        loadLinks(); // 更新されたデータで再描画
    } catch (error) {
        console.error("Error saving updated order:", error);
    }
};
const loadCategories = () => {
    try {
        const data = JSON.parse(fs.readFileSync(linksFilePath, "utf-8"));
        categorySelect.innerHTML = ""; // 既存の選択肢をクリア
        data.forEach((category) => {
            const option = document.createElement("option");
            option.value = category.category;
            option.textContent = category.category;
            categorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
};
linkForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formModal = bootstrap.Modal.getInstance(
        document.getElementById("formModal")
    );
    const category = categorySelect.value;
    const name = nameInput.value;
    const url = urlInput.value;

    try {
        const data = JSON.parse(fs.readFileSync(linksFilePath, "utf-8"));
        const categoryIndex = data.findIndex(
            (cat) => cat.category === category
        );
        if (categoryIndex !== -1) {
            data[categoryIndex].links.push({ name, url });
        } else {
            data.push({ category, links: [{ name, url }] });
        }
        // JSONをファイルに書き込み
        fs.writeFileSync(linksFilePath, JSON.stringify(data, null, 2));
        linkForm.reset();
        // Modal閉じてリンク集を再読み込み
        formModal.hide();
        loadLinks();
    } catch (error) {
        console.error("Error saving link:", error);
    }
});

// 初期リンクの読み込み
loadLinks();
loadCategories();
