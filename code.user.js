// ==UserScript==
// @name         天使动漫 ASMR 版发帖辅助
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  天使动漫 ASMR 版发帖辅助
// @author       Aoba Xu
// @match        https://www.tsdm39.net/forum.php?mod=post&action=newthread&fid=581
// @match        https://www.tsdm39.net/forum.php?mod=post&action=newthread&fid=612
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tsdm39.net
// @grant        GM_xmlhttpRequest
// @connect      www.dlsite.com
// @require      https://cdn.bootcdn.net/ajax/libs/moment.js/2.29.3/moment.min.js
// ==/UserScript==

(function() {
    'use strict';
    let titleTemplate = (rjCode, title, releaseDate, resolution, fileFormat) => `[DLsite自购][${rjCode}][${releaseDate}]${title}[${resolution}][${fileFormat}]`;
    let bodyTemplate = (rjCode, coverUrl, title, circle, cv, releaseDate, resolution, fileFormat, tags, fileSize, introduction, trackList) => `[free]
购买原地址 Original Site：[url]https://www.dlsite.com/maniax/work/=/product_id/${rjCode}.html[/url]
封面 Cover：
[img]${coverUrl}[/img]
[hr]
专辑信息 Album Information

标题 Title：${title}
社团名 Circle：${circle}
声优 CV：${cv}
发售日 Released Date：${releaseDate}
解析度 Resolution：${resolution}
文件格式 File Format：${fileFormat}
分类 Genre：${tags}
文件容量 File Size：${fileSize}

`
/*
[spoiler=介绍原文 Introduction (Japanese)]
${introduction}
[/spoiler]
[hr]
[spoiler=曲目表 Track List]
${trackList}
[/spoiler]
*/
+ `
[hr]
本贴转载规则:
Rules of Reshare
1. 转载时标注本贴地址和用户名。
1. Provide URL of this page and username when reshare to other site.
2. 禁止商业使用。
2. Non commercial usage.

[/free]
下载链接：
`;
    document.getElementById("postbox").insertAdjacentHTML("afterbegin", `<div class="pbt cl"><div class="z"><span><input type="text" id="rj-number" style="min-width: " class="px" title="RJ号" placeholder="RJ号"/></span></div><div class="z"><span><input type="text" id="resolution" class="px" title="解析度，格式：96kHz/24bit 或 320kbps" placeholder="解析度，格式：96kHz/24bit（无损） 或 320kbps（有损）"/></span></div><button type="button" class="pn pnc" id="gen-post">生成</button></div>`);
    let rjBox = document.getElementById("rj-number");
    let resolutionBox = document.getElementById("resolution");
    let genPostButton = document.getElementById("gen-post");
    let postArea = document.getElementById("e_textarea");
    let titleBox = document.getElementById("subject");
    let fid = new URLSearchParams(location.search).get("fid");
    let parser = new DOMParser();
    let keys = {
        "zh-cn": [
            "贩卖日",
            "声优",
            "年龄指定",
            "文件形式",
            "分类",
            "文件容量"
        ],
        "ja-jp": [
            "販売日",
            "声優",
            "年齢指定",
            "ファイル形式",
            "ジャンル",
            "ファイル容量"
        ],
        "zh-tw": [
            "販賣日",
            "聲優",
            "年齡指定",
            "檔案形式",
            "分類",
            "檔案容量"
        ]
    };
    let nsfwKey = {
        "zh-cn": "18禁",
        "ja-jp": "18禁",
        "zh-tw": "18禁"
    };
    let dateKey = {
        "zh-cn": "YYYY年MM月DD日",
        "ja-jp": "YYYY年MM月DD日",
        "zh-tw": "YYYY年MM月DD日"
    };
    genPostButton.addEventListener("click", () => {
        if (! /(RJ)?\d{6}/i.test(rjBox.value)) {
            alert("未输入 RJ 号！");
            return;
        }
        let noResolution = false;
        if (! /((\d{2,3}(\.\d{1,3})?khz\/(24|16|20|32|8)bit)|(\d{2,3}kbps))/i.test(resolutionBox.value)) {
            alert("未输入解析度或非标准格式！无解析度将进行根据文件格式自动假设（极其不准确），此操作会导致评分下降请注意！");
            noResolution = true;
        }
        genPostButton.disabled = true;
        genPostButton.innerText = "生成中";
        GM_xmlhttpRequest({
            url: `https://www.dlsite.com/maniax/work/=/product_id/${rjBox.value}.html`,
            onload: (r) => {
                let doc = parser.parseFromString(r.responseText, "text/html");
                console.log(doc);
                let title = doc.getElementById("work_name").innerText;
                let circle = doc.querySelector("#work_maker .maker_name a").innerText;
                let coverUrl = doc.querySelector(".product-slider-data div").dataset.src;
                let infoMap = new Map();
                Array.from(doc.querySelector("#work_outline tbody").children).forEach(x => infoMap.set(x.children[0].innerText, x.children[1]));
                let lang = doc.documentElement.lang;
                if (fid !== "612" && infoMap.get(keys[lang][2]).innerText.trim() === nsfwKey[lang]) {
                    alert("本板块不允许发 R18，将为你自动跳转至 R18 板块");
                    location.href = "/forum.php?mod=post&action=newthread&fid=612";
                }
                let cv = Array.from(infoMap.get(keys[lang][1]).children).map(x => x.innerText).join("/");
                let releaseDate = moment(infoMap.get(keys[lang][0]).innerText.trim(), dateKey[lang]);
                let fileFormat = Array.from(infoMap.get(keys[lang][3]).children[0].children).map(x => x.innerText).join("");
                let fileFormatSingle = infoMap.get(keys[lang][3]).children[0].children[0].innerText.trim();
                let tags = Array.from(infoMap.get(keys[lang][4]).querySelectorAll("a")).map(x => x.innerText).join(" ");
                let fileSize = infoMap.get(keys[lang][5]).innerText.trim();
                let resolution = resolutionBox.value;
                if (noResolution) {
                    resolution = /(wav|flac|ape|tak)/i.test(fileFormat) ? "44.1kHz/16bit" : "320kbps";
                }
                //(rjCode, coverUrl, title, circle, cv, releaseDate, resolution, fileFormat, tags, fileSize, introduction, trackList)
                postArea.value = bodyTemplate(rjBox.value, coverUrl, title, circle, cv, releaseDate.format("YYYY.MM.DD"), resolution, fileFormat, tags, fileSize, undefined, undefined);
                //(rjCode, title, releaseDate, resolution, fileFormat)
                titleBox.value = titleTemplate(rjBox.value, title, releaseDate.format("YYMMDD"), resolution, fileFormatSingle);
                genPostButton.disabled = undefined;
                genPostButton.innerText = "生成";
            }
        })
    })
})();
