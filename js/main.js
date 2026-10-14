// 未来創造建設株式会社 - main.js
(function () {
  "use strict";

  const header = document.querySelector(".header");
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("globalNav");
  const closeBtn = document.getElementById("navClose");
  const navLinks = nav.querySelectorAll(".nav__link");

  // ---------- ハンバーガーメニュー ----------
  function isNavOpen() {
    return nav.classList.contains("is-open");
  }

  function setNavOpen(isOpen) {
    toggle.setAttribute("aria-expanded", String(isOpen));
    nav.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("is-nav-open", isOpen);
  }

  // ☰ で開く → 閉じるボタンにフォーカス
  toggle.addEventListener("click", function () {
    setNavOpen(true);
    closeBtn.focus({ preventScroll: true });
  });

  // × で閉じる → ☰ にフォーカスを戻す
  closeBtn.addEventListener("click", function () {
    setNavOpen(false);
    toggle.focus({ preventScroll: true });
  });

  // メニュー内のリンクを押したら閉じる
  nav.querySelectorAll("a[href]").forEach(function (link) {
    link.addEventListener("click", function () {
      setNavOpen(false);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!isNavOpen()) return;

    // Esc キーで閉じる
    if (e.key === "Escape") {
      setNavOpen(false);
      toggle.focus({ preventScroll: true });
      return;
    }

    // Tab キーのフォーカスをメニュー内で循環させる
    if (e.key === "Tab") {
      const focusables = nav.querySelectorAll("a[href], button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // PC 幅に広げたときはメニュー状態をリセット
  window.matchMedia("(min-width: 1024px)").addEventListener("change", function (e) {
    if (e.matches) setNavOpen(false);
  });

  // ---------- ダミーリンク（準備中のページなど）はページ移動させない ----------
  document.querySelectorAll("[data-dummy-link]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  // ---------- 施工実績：カテゴリーで絞り込み ----------
  const filter = document.querySelector(".filter");
  if (filter) {
    const buttons = filter.querySelectorAll("button[data-cat]");
    const items = document.querySelectorAll(".works--list .works__item");
    const count = document.getElementById("filterCount");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        const cat = btn.getAttribute("data-cat");
        let shown = 0;
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        items.forEach(function (item) {
          const match = cat === "all" || item.getAttribute("data-cat") === cat;
          item.hidden = !match;
          if (match) shown++;
        });
        if (count) count.textContent = shown + "件の実績";
      });
    });
  }

  // ---------- お問い合わせフォーム（デモ：どこにも送信しない） ----------
  const form = document.getElementById("contactForm");
  if (form) setupContactForm(form);

  function setupContactForm(form) {
    const confirmBox = document.getElementById("formConfirm");
    const confirmList = document.getElementById("confirmList");
    const doneBox = document.getElementById("formDone");
    const errorSummary = document.getElementById("errorSummary");
    const message = form.elements.message;
    const messageCount = document.getElementById("messageCount");

    // 採用ページから来たときは「採用について」を選んだ状態にする
    const typeParam = new URLSearchParams(window.location.search).get("type");
    if (typeParam) {
      const preset = form.querySelector('input[name="type"][value="' + typeParam.replace(/[^a-z]/g, "") + '"]');
      if (preset) preset.checked = true;
    }

    // お問い合わせ内容の文字数カウント
    message.addEventListener("input", function () {
      messageCount.textContent = message.value.length + " / " + message.maxLength;
    });

    // 各項目の入力チェック（エラー文を返す。問題なければ空文字）
    const rules = {
      type: function () {
        return form.querySelector('input[name="type"]:checked') ? "" : "お問い合わせの種類を選択してください。";
      },
      message: function (v) {
        if (!v.trim()) return "お問い合わせ内容を入力してください。";
        return v.trim().length < 10 ? "お問い合わせ内容は10文字以上で入力してください。" : "";
      },
      name: function (v) { return v.trim() ? "" : "お名前を入力してください。"; },
      kana: function (v) {
        if (!v.trim()) return "フリガナを入力してください。";
        return /^[ァ-ヶー\s　]+$/.test(v.trim()) ? "" : "フリガナは全角カタカナで入力してください。";
      },
      email: function (v) {
        if (!v.trim()) return "メールアドレスを入力してください。";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "メールアドレスの形式が正しくありません。";
      },
      tel: function (v) {
        const digits = v.replace(/[-ー－\s]/g, "");
        if (!digits) return "電話番号を入力してください。";
        return /^0\d{9,10}$/.test(digits) ? "" : "電話番号は0から始まる10〜11桁の数字で入力してください。";
      },
      agree: function (_, el) { return el.checked ? "" : "内容をご確認のうえ、チェックを入れてください。"; }
    };

    // ラジオボタンのまとまり（RadioNodeList）は配列にそろえる
    function controlsOf(name) {
      const control = form.elements[name];
      return control.length && !control.tagName ? Array.prototype.slice.call(control) : [control];
    }

    function showError(name, msg) {
      const field = form.querySelector('[data-field="' + name + '"]');
      const error = document.getElementById("error-" + name);
      field.classList.toggle("is-error", Boolean(msg));
      error.textContent = msg;
      controlsOf(name).forEach(function (c) {
        c.setAttribute("aria-invalid", String(Boolean(msg)));
      });
    }

    function validate(name) {
      const el = form.elements[name];
      const msg = rules[name](el.value || "", el);
      showError(name, msg);
      return msg;
    }

    // 入力し終えた項目からチェック
    Object.keys(rules).forEach(function (name) {
      controlsOf(name).forEach(function (el) {
        el.addEventListener(el.type === "checkbox" || el.type === "radio" ? "change" : "blur", function () {
          validate(name);
        });
      });
    });

    function valueText(name) {
      const el = form.elements[name];
      if (el.tagName === "SELECT") return el.value ? el.options[el.selectedIndex].text : "";
      if (el.length && !el.tagName) {
        const checked = Array.prototype.find.call(el, function (r) { return r.checked; });
        return checked ? checked.parentElement.textContent.trim() : "";
      }
      return el.value.trim();
    }

    // エラー一覧のリンク先（ラジオは最初の選択肢）
    function anchorOf(name) {
      const first = controlsOf(name)[0];
      if (!first.id) first.id = "field-" + name;
      return first.id;
    }

    // 「入力内容を確認する」
    document.getElementById("toConfirm").addEventListener("click", function () {
      const errors = Object.keys(rules).map(function (name) {
        return { name: name, message: validate(name) };
      }).filter(function (e) { return e.message; });

      if (errors.length) {
        errorSummary.hidden = false;
        errorSummary.querySelector("ul").innerHTML = errors.map(function (e) {
          return '<li><a href="#' + anchorOf(e.name) + '">' + e.message + "</a></li>";
        }).join("");
        errorSummary.focus();
        return;
      }

      errorSummary.hidden = true;
      const rows = [
        ["お問い合わせの種類", valueText("type")],
        ["建物の用途", valueText("use") || "未選択"],
        ["ご検討の時期", valueText("timing") || "未選択"],
        ["お問い合わせ内容", valueText("message")],
        ["会社名・団体名", valueText("company") || "なし"],
        ["お名前", valueText("name") + "（" + valueText("kana") + "）"],
        ["メールアドレス", valueText("email")],
        ["電話番号", valueText("tel")]
      ];
      // 入力値は textContent で表示（HTML として解釈しない）
      confirmList.innerHTML = "";
      rows.forEach(function (row) {
        const wrap = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        wrap.className = "confirm__row";
        dt.textContent = row[0];
        dd.textContent = row[1];
        wrap.appendChild(dt);
        wrap.appendChild(dd);
        confirmList.appendChild(wrap);
      });

      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.focus();
      confirmBox.scrollIntoView({ block: "start" });
    });

    // 「修正する」
    document.getElementById("backToForm").addEventListener("click", function () {
      confirmBox.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ block: "start" });
      controlsOf("type")[0].focus({ preventScroll: true });
    });

    // 「送信する（デモ）」：送信はせず、完了メッセージだけを表示
    document.getElementById("finish").addEventListener("click", function () {
      confirmBox.hidden = true;
      doneBox.hidden = false;
      form.reset();
      messageCount.textContent = "0 / " + message.maxLength;
      doneBox.focus();
      doneBox.scrollIntoView({ block: "start" });
    });
  }

  // ---------- スクロール連動 ----------
  const pageTop = document.getElementById("pageTop");
  // ページ内リンク（#〜）だけを対象にする
  const sections = Array.prototype.map.call(navLinks, function (link) {
    const href = link.getAttribute("href");
    return href.charAt(0) === "#" ? document.querySelector(href) : null;
  });
  const hasInPageNav = sections.some(Boolean);

  // 表示中のセクションに対応するナビを強調（ナビにないセクションの間は強調しない）
  function updateCurrentNav() {
    if (!hasInPageNav) return; // 下層ページは HTML 側の aria-current で表示
    const line = window.scrollY + header.offsetHeight + window.innerHeight / 3;
    let current = -1;

    sections.forEach(function (section, i) {
      if (section && section.offsetTop <= line && section.offsetTop + section.offsetHeight > line) current = i;
    });

    navLinks.forEach(function (link, i) {
      const isCurrent = i === current;
      link.classList.toggle("is-current", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function onScroll() {
    if (pageTop) pageTop.classList.toggle("is-visible", window.scrollY > window.innerHeight / 2);
    updateCurrentNav();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
