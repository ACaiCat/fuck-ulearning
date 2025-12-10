// ==UserScript==
// @name         优校园自动挂课做题
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  优校园自动挂课做题脚本，需要DeepSeek API密钥
// @author       Cai
// @match        https://ua.ulearning.cn/learnCourse/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      api.deepseek.com
// @connect      deepseek.com
// ==/UserScript==

(function () {
  ("use strict");

  // 存储API密钥
  let apiKey = GM_getValue("deepseek_api_key", "");

  // 注册菜单
  GM_registerMenuCommand("🔑 设置DeepSeek API密钥", showConfigPanel);

  // 显示配置面板
  function showConfigPanel() {
    // 移除已有的面板
    const oldPanel = document.getElementById("deepseek-config-panel");
    if (oldPanel) oldPanel.remove();

    // 创建面板
    const panel = document.createElement("div");
    panel.id = "deepseek-config-panel";
    panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 999999;
            min-width: 300px;
            font-family: Arial, sans-serif;
        `;

    // 标题
    const title = document.createElement("h3");
    title.textContent = "DeepSeek API密钥";
    title.style.margin = "0 0 15px 0";
    title.style.color = "#333";

    // 输入框
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "请输入您的DeepSeek API密钥";
    input.value = apiKey;
    input.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        `;

    // 按钮容器
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = "display: flex; gap: 10px;";

    // 保存按钮
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "保存";
    saveBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    saveBtn.onclick = () => {
      apiKey = input.value.trim();
      GM_setValue("deepseek_api_key", apiKey);
      alert("API密钥已保存！");
      panel.remove();
    };

    // 取消按钮
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "取消";
    cancelBtn.style.cssText = `
            flex: 1;
            padding: 8px;
            background: #f44336;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    cancelBtn.onclick = () => panel.remove();

    // 显示当前密钥状态
    const status = document.createElement("div");
    status.textContent = apiKey ? "✅ 已配置密钥" : "❌ 未配置密钥";
    status.style.cssText = "font-size: 12px; color: #666; margin-top: 10px;";

    // 组装面板
    panel.appendChild(title);
    panel.appendChild(input);
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    panel.appendChild(buttonContainer);
    panel.appendChild(status);

    // 添加遮罩
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999998;
        `;
    overlay.onclick = () => {
      panel.remove();
      overlay.remove();
    };

    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // 聚焦输入框
    input.focus();
  }

  // 在页面右上角添加一个小图标，点击可快速打开配置
  function addQuickAccessIcon() {
    const icon = document.createElement("div");
    icon.innerHTML = "🔑";
    icon.title = "配置DeepSeek API密钥";
    icon.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            padding: 5px 10px;
            border-radius: 15px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 99999;
            font-size: 14px;
            border: 1px solid #ddd;
        `;
    icon.onclick = showConfigPanel;
    document.body.appendChild(icon);
  }

  // 页面加载完成后添加图标
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addQuickAccessIcon);
  } else {
    addQuickAccessIcon();
  }

  // 获取API密钥的函数（供其他脚本使用）
  window.getDeepSeekApiKey = function () {
    return apiKey;
  };

  // sleep函数
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 检测视频进度
  function checkVideoProgress() {
    // 查找所有进度元素
    const progressElements = document.querySelectorAll(".video-progress");
    progressElements.forEach((element, index) => {
      // 查找进度文本
      const textSpan = element.querySelector(".text span");
      if (!textSpan) return;
      const text = textSpan.textContent.trim();
      if (text === "已看完" || text === "finished") {
        if (!element.hasAttribute("data-completed")) {
          element.setAttribute("data-completed", "true");
          onVideoComplete(index, element);
        }
        return;
      }
    });
  }

  // 视频完成时的回调函数
  async function onVideoComplete(videoIndex, element) {
    console.log(`🎬 视频 ${videoIndex + 1} 已完成观看!`, element);
    await sleep(1000); // 等待1秒
    await nextPage();
  }

  async function nextPage() {
    await sleep(500); // 等待500ms再尝试点击

    const nextButton = document.querySelector(
      "#aiPanel > div.page-control-area > div > div.next-page-btn.cursor"
    );


    nextButton.click();
    await sleep(1000);

    // 检查并处理离开确认弹窗
    const sureLeave = document.querySelector(
    "#alertModal > div > div > div.modal-body > div:nth-child(2) > div.modal-operation > button.btn-hollow"
    );

    if (sureLeave) {
    await sleep(500);
    sureLeave.click();
    await sleep(1000);
    }
  }

  function autoPlayVideos() {
    // 获取页面中所有视频元素
    const videos = document.querySelectorAll("video");

    // 遍历每个视频
    videos.forEach((video) => {
      // 如果视频已暂停且不是结束状态
      if (video.paused && !video.ended) {
        // 尝试播放视频
        video.play().catch((error) => {
          // 如果播放失败，静默处理（不显示错误）
          console.log("视频自动播放失败:", error.message);
        });
      }
    });
  }

  function checkIsSummaryPage() {
    var title = document.querySelector(
      "body > div.header > div > div.course-title.small"
    );

    if (title.textContent == "主要内容") {
      setTimeout(() => {
        nextPage();
      }, 1500);
    }
  }

  async function answerQuestion(question, answers) {
    console.log(`正在答题: ${question.title}`);
    console.log(`选择的答案: ${answers}`);

    // 依次点击每个答案选项
    for (const answer of answers) {
      const choice = question.choices.find((item) => item.option === answer);
      if (choice && choice.selector) {
        choice.selector.click();
        console.log(`已选择: ${answer}`);
      } else {
        console.warn(`未找到选项: ${answer}`);
      }
    }
  }

  async function getAnswerFrom(question) {
    const apiUrl = "https://api.deepseek.com/chat/completions";
    const prompt = `请仔细分析以下题目并给出准确答案：

题目类型：${question.type}
题目：${question.title}
选项：${question.choices
      .map((item) => {
        return item.option + "." + item.optionText;
      })
      .join(" | ")}

请严格按照以下要求回答：
1. 单选题：只返回选项字母（A、B、C)
2. 多选题：返回选项字母，用逗号分隔（A,B,C）
3. 判断题：返回"A"或"B"

请直接给出答案，不要有任何解释和额外文字。`;

    const data = {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
    };
    console.log("DeepSeek API Payload:", data);

    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        url: apiUrl,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        data: JSON.stringify(data),
        timeout: 30000,
        onload: (response) => {
          try {
            const apiResponse = JSON.parse(response.responseText);

            if (response.status >= 200 && response.status < 300) {
              if (apiResponse.choices && apiResponse.choices.length > 0) {
                const answer = apiResponse.choices[0].message.content.trim();
                const options = answer.split(",").map((opt) => opt.trim());
                resolve({
                  code: 200,
                  data: {
                    option: options,
                  },
                  msg: "success",
                });
              } else {
                console.warn("API返回数据格式异常:", apiResponse);
                resolve({
                  code: 500,
                  msg: "API返回格式错误: 缺少choices字段或为空数组",
                });
              }
            } else {
              // HTTP状态码错误
              const errorMsg =
                apiResponse.error?.message ||
                apiResponse.msg ||
                response.statusText;
              resolve({
                code: response.status,
                msg: `HTTP ${response.status}: ${errorMsg}`,
              });
            }
          } catch (e) {
            console.error("解析API响应失败:", e);
            resolve({
              code: 500,
              msg: `解析响应失败: ${e.message}`,
            });
          }
        },
        onerror: (error) => {
          console.error("请求DeepSeek API网络错误:", error);
          resolve({
            code: 500,
            msg: `网络请求失败: ${error.error || "未知网络错误"}`,
          });
        },
        ontimeout: () => {
          console.error("请求DeepSeek API超时");
          resolve({
            code: 408,
            msg: "请求超时(30秒)",
          });
        },
        onabort: () => {
          console.error("请求DeepSeek API被中止");
          resolve({
            code: 499,
            msg: "请求被中止",
          });
        },
      });
    });
  }

  async function checkUnitTest() {

    var titleElement = document.querySelector(
      "body > div.header > div > div.course-title.small"
    );

    if (!titleElement || titleElement.textContent != "单元小测") {
      return;
    }

    console.log("检测到单元小测，开始处理...");

    var questions = [];

    var qs = document.querySelectorAll(
      "[id^=question] > div.split-screen-wrapper"
    );

    qs.forEach(function (e) {
      var type = e.querySelector(
        "div.question-title-wrapper > div.question-title-scroller > div.question-title-text.not-IE > span.question-type-tag"
      ).textContent;
      var title = e.querySelector(
        "div.question-title-wrapper > div.question-title-scroller > div.question-title-text.not-IE > span.question-title-html[class*=question-type-]  > p"
      ).textContent;
      var choices = [];

      if (type === "判断题") {
        choices.push({
          option: "A",
          optionText: "正确",
          selector: e.querySelector(
            "div.question-body-wrapper > div > .right-btn"
          ),
        });
        choices.push({
          option: "B",
          optionText: "错误",
          selector: e.querySelector(
            "div.question-body-wrapper > div > .wrong-btn"
          ),
        });
      } else {
        var choicesElement = e.querySelectorAll("[id^=choice]");

        choicesElement.forEach(function (c) {
          var optionElement = c.querySelector("div.option");
          var optionTextElement = c.querySelector(
            "div.content-wrapper > div > div"
          );
          choices.push({
            option: optionElement.textContent.replace(".", ""),
            optionText: optionTextElement.textContent,
            selector: optionElement,
          });
        });
      }
      questions.push({
        title: title,
        type: type,
        choices: choices,
      });
    });

    console.log(`共发现 ${questions.length} 道题目`);

    // 依次处理每道题目，添加延迟避免请求过快
    for (let i = 0; i < questions.length; i++) {
      console.log(`正在处理第 ${i + 1} 题...`);
      const question = questions[i];

      try {
        const result = await getAnswerFrom(question);

        if (result.code === 200) {
          console.log(`第 ${i + 1} 题答案: ${result.data.option.join(",")}`);
          await answerQuestion(question, result.data.option);
        } else {
          console.error(`第 ${i + 1} 题获取答案失败:`, result.msg);
        }
      } catch (error) {
        console.error(`第 ${i + 1} 题处理出错:`, error);
      }
    }

    console.log("所有题目处理完成，准备提交...");

    await sleep(2000); 

    const submitButton = document.querySelector(
      "[id^=pageElement] > div > div > div.question-operation-area > button"
    );

    submitButton.click();
    console.log("已提交答案");
    await sleep(5000);
    await nextPage();
  }

  // 主要循环
  setInterval(async () => {
    try {
      await checkVideoProgress();
      await autoPlayVideos();
      await checkIsSummaryPage();
      await checkUnitTest();
    } catch (error) {
      console.error("主循环执行出错:", error);
    }
  }, 5000);
})();
