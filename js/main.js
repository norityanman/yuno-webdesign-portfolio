/* ================================================================
 * MAIN.JS
 * サイト全体のインタラクションをまとめたファイル。
 * 機能ごとに見出しコメントで区切っているので、
 * 修正したい機能の見出しを探して編集してください。
 * ================================================================ */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initHeaderNav();
  initHeaderScrollShadow();
  initFixedButton();
  initScrollReveal();
  initServiceParallax();
  initContactForm();
  initFooterYear();
});

/* ----------------------------------------------------------------
 * HEADER: ハンバーガーメニュー開閉
 * SPで #js-nav-toggle をクリックすると <body> に is-nav-open を付与/削除。
 * スタイルは scss/_header.scss 側の .is-nav-open 配下で定義。
 * ---------------------------------------------------------------- */
function initHeaderNav() {
  const toggleButton = document.getElementById("js-nav-toggle");
  const navLinks = document.querySelectorAll(".js-nav-link");

  if (!toggleButton) return;

  const closeNav = () => {
    document.body.classList.remove("is-nav-open");
    toggleButton.setAttribute("aria-expanded", "false");
  };

  toggleButton.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("is-nav-open");
    toggleButton.setAttribute("aria-expanded", String(isOpen));
  });

  // ナビ内のリンクをクリックしたら自動でメニューを閉じる（SP用）
  navLinks.forEach((link) => {
    link.addEventListener("click", closeNav);
  });
}

/* ----------------------------------------------------------------
 * HEADER: スクロール検知で影を付与
 * 少しでもスクロールしたら .header に is-scrolled を付けて
 * scss/_header.scss の box-shadow を発火させる。
 * ---------------------------------------------------------------- */
function initHeaderScrollShadow() {
  const header = document.getElementById("js-header");
  if (!header) return;

  const SCROLL_THRESHOLD = 10;

  const updateShadow = () => {
    header.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD);
  };

  updateShadow();
  window.addEventListener("scroll", updateShadow, { passive: true });
}

/* ----------------------------------------------------------------
 * FIXED BUTTON: 表示切り替え
 * ヒーロー(#top)を過ぎてスクロールしたら、右下の追従ボタンを表示する。
 * ---------------------------------------------------------------- */
function initFixedButton() {
  const fixedButton = document.getElementById("js-fixed-button");
  const hero = document.getElementById("top");
  if (!fixedButton || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      // ヒーローが画面外に出た(=見えなくなった)ら表示
      fixedButton.classList.toggle("is-visible", !entry.isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(hero);
}

/* ----------------------------------------------------------------
 * SCROLL ANIMATION: 要素が画面内に入ったらフェードインさせる
 * 対象: class="js-fade-up" が付いた要素すべて
 * 一度表示されたら監視を解除（何度もアニメーションし直さない）
 * ---------------------------------------------------------------- */
function initScrollReveal() {
  const targets = document.querySelectorAll(".js-fade-up");
  if (!targets.length) return;

  // 対応していない古いブラウザ用フォールバック：即表示
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------------
 * SERVICE: 帯写真の簡易パララックス
 * .js-parallax 内の画像を、スクロール量に応じてわずかに上下させる。
 * CUBEサイトの js_parallaxImage（GSAP ScrollTrigger）をCSSの
 * transformだけで簡易的に再現したもの。
 * ---------------------------------------------------------------- */
function initServiceParallax() {
  const wrap = document.querySelector(".js-parallax");
  const image = document.querySelector(".js-parallax-image");
  if (!wrap || !image) return;

  const PARALLAX_RATIO = 0.15;

  const update = () => {
    const rect = wrap.getBoundingClientRect();
    const viewportH = window.innerHeight;

    // 画面内にいる時だけ計算する（無駄なリフローを避ける）
    if (rect.bottom < 0 || rect.top > viewportH) return;

    const centerOffset = rect.top + rect.height / 2 - viewportH / 2;
    image.style.transform = `translateY(${(-centerOffset * PARALLAX_RATIO).toFixed(1)}px) scale(1.15)`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ----------------------------------------------------------------
 * CONTACT FORM: 非同期送信と結果表示
 * FormSubmitの応答を確認して、成功・失敗をフォーム下へ表示する。
 * ---------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById("js-contact-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      showContactStatus(form, "入力内容をご確認ください。送信されていません。", true);
      return;
    }

    const submitButton = form.querySelector(".contactForm__submit");
    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = "送信中...";

    try {
      const formData = Object.fromEntries(new FormData(form));
      const response = await fetch(form.action, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) {
        throw new Error(result?.message || `送信エラー: ${response.status}`);
      }

      form.reset();
      showContactStatus(form, "送信されました。お問い合わせありがとうございました。", false);
    } catch (error) {
      showContactStatus(form, "送信できませんでした。時間をおいて、もう一度お試しください。", true);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "送信する";
    }
  });
}

function showContactStatus(form, message, isError) {
  const status = form.querySelector(".contactForm__status");
  if (!status) return;

  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

/* ----------------------------------------------------------------
 * FOOTER: コピーライトの年号を自動更新
 * ---------------------------------------------------------------- */
function initFooterYear() {
  const yearEl = document.getElementById("js-year");
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
}
