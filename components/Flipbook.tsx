"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PageFlip } from "page-flip";
import type { Hotspot } from "@/lib/issues";
import { playPageTurn, preloadPageTurn } from "@/lib/pageTurnSound";
import styles from "./Flipbook.module.css";

type Props = {
  pages: string[];
  hotspots?: Hotspot[];
  title: string;
  /** Shown at the left of the toolbar, e.g. the back button and issue name. */
  toolbarStart?: ReactNode;
};

/** Reads ?page=16 from the address bar, so article links can open the right page. */
function pageFromAddress(total: number): number {
  const requested = Number(new URLSearchParams(window.location.search).get("page"));
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.floor(requested), total);
}

/** Stops a press on a video or soundbite from also grabbing the page corner. */
function keepPressesInside(el: HTMLElement) {
  const stop = (e: Event) => e.stopPropagation();
  el.addEventListener("mousedown", stop);
  el.addEventListener("touchstart", stop, { passive: true });
}

type PageTools = {
  goTo: (page: number) => void;
  media: HTMLMediaElement[];
};

/**
 * Builds one magazine page: the page image, with its interactive pieces
 * placed on top. These are plain HTML elements because the flipbook library
 * moves the pages around itself.
 */
function buildPage(src: string, number: number, spots: Hotspot[], tools: PageTools): HTMLElement {
  const page = document.createElement("div");
  page.className = styles.page;

  const img = document.createElement("img");
  img.src = src;
  img.alt = `Page ${number}`;
  img.draggable = false;
  img.loading = number <= 4 ? "eager" : "lazy";
  img.className = styles.pageImage;
  page.appendChild(img);

  for (const spot of spots) {
    const { x, y, w, h } = spot.box;
    const place = (el: HTMLElement) => {
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.width = `${w}%`;
      el.style.height = `${h}%`;
    };

    if (spot.kind === "page") {
      // jumps within the magazine: the page turns, nothing new opens
      const a = document.createElement("a");
      a.href = `?page=${spot.to}`;
      a.className = styles.spot;
      a.setAttribute("aria-label", `Go to page ${spot.to}: ${spot.label}`);
      a.title = spot.label;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        tools.goTo(spot.to);
      });
      place(a);
      page.appendChild(a);
    }

    if (spot.kind === "link") {
      // a real link: site pages open normally, outside websites in a new tab
      const a = document.createElement("a");
      a.href = spot.href;
      a.className = styles.spot;
      a.setAttribute("aria-label", spot.label);
      a.title = spot.label;
      if (/^https?:\/\//.test(spot.href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      place(a);
      page.appendChild(a);
    }

    if (spot.kind === "video") {
      // the video plays right here on the page, inside its box
      const box = document.createElement("div");
      box.className = styles.videoBox;
      place(box);
      keepPressesInside(box);

      const video = document.createElement("video");
      video.src = spot.src;
      if (spot.poster) video.poster = spot.poster;
      video.preload = "metadata";
      video.playsInline = true;
      video.className = styles.video;
      video.setAttribute("aria-label", spot.label);
      tools.media.push(video);

      const play = document.createElement("button");
      play.type = "button";
      play.className = styles.playButton;
      play.setAttribute("aria-label", `Play video: ${spot.label}`);
      play.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
      play.addEventListener("click", () => {
        video.controls = true;
        play.hidden = true;
        void video.play();
      });
      video.addEventListener("ended", () => {
        video.controls = false;
        play.hidden = false;
      });

      box.append(video, play);
      page.appendChild(box);
    }

    if (spot.kind === "audio") {
      // a soundbite: a little round button that plays and pauses
      const audio = new Audio(spot.src);
      audio.preload = "none";
      tools.media.push(audio);

      const button = document.createElement("button");
      button.type = "button";
      button.className = styles.audioButton;
      button.setAttribute("aria-label", `Play soundbite: ${spot.label}`);
      button.setAttribute("aria-pressed", "false");
      button.title = spot.label;
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/></svg>';
      const setPlaying = (on: boolean) => {
        button.setAttribute("aria-pressed", String(on));
        button.classList.toggle(styles.playing, on);
      };
      button.addEventListener("click", () => {
        if (audio.paused) void audio.play();
        else audio.pause();
      });
      audio.addEventListener("play", () => setPlaying(true));
      audio.addEventListener("pause", () => setPlaying(false));
      audio.addEventListener("ended", () => setPlaying(false));

      place(button);
      keepPressesInside(button);
      page.appendChild(button);
    }
  }

  return page;
}

export default function Flipbook({ pages, hotspots = [], title, toolbarStart }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const soundOnRef = useRef(true);

  const [pageIndex, setPageIndex] = useState(0);
  const [landscape, setLandscape] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  // zoom: 1 is the normal flipbook; above 1 shows the open pages larger, to pan around
  const [zoom, setZoom] = useState(1);
  const [bookHeight, setBookHeight] = useState(600);
  const zoomRef = useRef<HTMLDivElement>(null);

  // Build the flipbook once the page is in the browser.
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    preloadPageTurn(); // so the first flip isn't silent while the sound loads
    const startPage = pageFromAddress(pages.length);
    setPageIndex(startPage - 1);

    let cancelled = false;
    const media: HTMLMediaElement[] = [];
    // page-flip removes its own element when destroyed, so we give it a fresh one
    const el = document.createElement("div");
    holder.appendChild(el);

    const tools: PageTools = {
      goTo: (page) => bookRef.current?.flip(page - 1),
      media,
    };
    const pageElements = pages.map((src, i) =>
      buildPage(src, i + 1, hotspots.filter((s) => s.page === i + 1), tools),
    );

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled) return;
      const book = new PageFlip(el, {
        width: 550, // one page, before scaling
        height: 712,
        size: "stretch",
        minWidth: 260,
        maxWidth: 1300,
        minHeight: 336,
        maxHeight: 1683,
        showCover: true, // the cover sits alone, like a real magazine
        usePortrait: true, // one page at a time on narrow screens
        flippingTime: 800,
        maxShadowOpacity: 0.5,
        mobileScrollSupport: false,
        startPage: startPage - 1,
      });

      book.on("flip", (e) => {
        setPageIndex(e.data);
        // turning the page stops anything that was playing
        for (const m of media) m.pause();
        if (soundOnRef.current) playPageTurn();
      });
      book.on("changeOrientation", (e) => setLandscape(e.data === "landscape"));
      book.on("init", () => setLandscape(book.getOrientation() === "landscape"));

      book.loadFromHTML(pageElements);
      bookRef.current = book;
    });

    return () => {
      cancelled = true;
      for (const m of media) m.pause();
      bookRef.current?.destroy();
      bookRef.current = null;
      el.remove();
    };
  }, [pages, hotspots]);

  const next = useCallback(() => bookRef.current?.flipNext(), []);
  const prev = useCallback(() => bookRef.current?.flipPrev(), []);

  // Arrow keys turn pages too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const toggleSound = () => {
    soundOnRef.current = !soundOnRef.current;
    setSoundOn(soundOnRef.current);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  };

  const changeZoom = (step: number) => {
    const h = holderRef.current?.getBoundingClientRect().height;
    if (h && zoom === 1) setBookHeight(h);
    setZoom((z) => Math.max(1, Math.min(3, Math.round((z + step) * 2) / 2)));
  };

  // Escape leaves the zoomed view
  useEffect(() => {
    if (zoom === 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  // drag to move around a zoomed page
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const onZoomDown = (e: React.PointerEvent) => {
    const el = zoomRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  };
  const onZoomMove = (e: React.PointerEvent) => {
    const el = zoomRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  };
  const onZoomUp = () => {
    drag.current = null;
  };

  // "page 1", or "pages 2 to 3" when two pages are open side by side
  const total = pages.length;
  const first = pageIndex + 1;
  const showsSpread = landscape && pageIndex > 0 && first < total;
  const pageLabel = showsSpread ? `pages ${first} to ${first + 1} of ${total}` : `page ${first} of ${total}`;
  const openPages = showsSpread ? [pageIndex, pageIndex + 1] : [pageIndex];

  return (
    <div ref={frameRef} className={styles.frame}>
      {/* one slim toolbar above the book, so the pages get as much room as possible */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarStart}>{toolbarStart}</div>

        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={prev} aria-label="Previous page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <span className={styles.counter} aria-live="polite">{pageLabel}</span>
          <button type="button" className={styles.control} onClick={next} aria-label="Next page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <button
            type="button"
            className={styles.control}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Turn page sound off" : "Turn page sound on"}
          >
            {soundOn ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4z" /><path d="M17 9l5 6M22 9l-5 6" /></svg>
            )}
          </button>
          <button type="button" className={styles.control} onClick={() => changeZoom(-0.5)} disabled={zoom === 1} aria-label="Zoom out">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M8 11h6M16 16l4 4" /></svg>
          </button>
          <span className={styles.zoomLabel} aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.control} onClick={() => changeZoom(0.5)} disabled={zoom === 3} aria-label="Zoom in">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M8 11h6M11 8v6M16 16l4 4" /></svg>
          </button>
          <button type="button" className={styles.control} onClick={toggleFullscreen} aria-label="Full screen">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      </div>

      <div className={styles.bookArea}>
        <div ref={holderRef} className={styles.book} aria-label={`${title}, flipbook`} />
        {zoom > 1 && (
          <div
            ref={zoomRef}
            className={styles.zoomView}
            onPointerDown={onZoomDown}
            onPointerMove={onZoomMove}
            onPointerUp={onZoomUp}
            onPointerCancel={onZoomUp}
            aria-label={`${pageLabel}, zoomed to ${Math.round(zoom * 100)}%. Drag to move around.`}
          >
            <div className={styles.zoomPages}>
              {openPages.map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={pages[i]} alt={`Page ${i + 1}`} draggable={false} style={{ height: bookHeight * zoom }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
