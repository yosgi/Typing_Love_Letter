"use client";
import { useEffect, useState, useRef } from "react";
import { lines } from "./data";


export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null)

  // ========== 动画参数 ==========
  const typingSpeed = 50; // 打字速度
  const cursorBlinkSpeed = 500; // 光标闪烁间隔
  const finalPauseBeforeFading = 1500; // 全部行打印完后的等待时间
  const fadeInterval = 10; // 淡出时，每隔多少毫秒让下一个字符开始淡出
  const fadeDuration = 2000; // 从不透明到透明的过渡时长

  // ========== React 状态 ==========
  const [currentLine, setCurrentLine] = useState(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [linesDisplay, setLinesDisplay] = useState<string[]>([]);
  const [phase, setPhase] = useState<"typing" | "waiting" | "fading" | "done">("typing");

  // 淡出相关状态
  const [fadeOutIndex, setFadeOutIndex] = useState(0);
  const [removedChars, setRemovedChars] = useState<string[]>([]);

  // 光标闪烁状态
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    fetch("/api/flag")
      .then((res) => res.json())
      .then((data) => {
        setPhase(data.status === "read" ? "done" : "typing");
      });
  }, []);

  const markAsRead = () => {
    fetch("/api/flag", { method: "POST" })
      .then(() => {
        setPhase("done");
      });
  };

  // ------------------------------
  // 让光标每隔 cursorBlinkSpeed 毫秒闪烁
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, cursorBlinkSpeed);
    return () => clearInterval(cursorTimer);
  }, []);

  // ------------------------------
  // 当文本更新时自动滚动到底部
  useEffect(() => {
    if (phase !== "done" && phase !== "fading" && scrollRef.current) {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }
  }, [linesDisplay, typedIndex, fadeOutIndex,phase]);

  // ------------------------------
  // 逐行打字逻辑
  useEffect(() => {
    if (phase === "typing") {
      if (currentLine < lines.length) {
        const currentLineText = lines[currentLine].text;
        if (typedIndex < currentLineText.length) {
          const timer = setTimeout(() => {
            setTypedIndex((prev) => prev + 1);
          }, typingSpeed);
          return () => clearTimeout(timer);
        } else {
          // 当前行打字完成
          const fullLine = currentLineText;
          setLinesDisplay((prev) => [...prev, fullLine]);

          // 等待该行的 pause 毫秒后，开始下一行
          const timer = setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setTypedIndex(0); // 重置 typedIndex
          }, lines[currentLine].pause);
          return () => clearTimeout(timer);
        }
      } else {
        setPhase("waiting");
      }
    }
  }, [phase, currentLine, typedIndex, lines]);

  // ------------------------------
  // 等待后进入 fading 阶段
  useEffect(() => {
    if (phase === "waiting") {
      const timer = setTimeout(() => {
        setPhase("fading");
      }, finalPauseBeforeFading);
      return () => clearTimeout(timer);
    }
  }, [phase, finalPauseBeforeFading]);

  // ------------------------------
  // 计算“当前行未完成”的部分文本（用于 typing 阶段显示，并带光标）
  const getCurrentLinePartial = () => {
    if (phase === "typing") {
      if (currentLine < lines.length) {
        const text = lines[currentLine].text;
        if (typedIndex >= text.length) {
          return ""; // 当前行已完成，则光标将出现在下一行
        }
        return text.slice(0, typedIndex) + (showCursor ? "_" : "");
      } else {
        return showCursor ? "_" : "";
      }
    }
    return "";
  };

  // ------------------------------
  // 当进入 fading 阶段时，将所有文本拼接成字符数组，用于逐个淡出
  const combinedTextArray = [
    ...linesDisplay.map((line) => line + "\n"),
    getCurrentLinePartial(),
  ]
    .join("")
    .split("");

  // ------------------------------
  // 淡出逻辑：依次增加 fadeOutIndex，从而触发字符的淡出
  useEffect(() => {
    if (phase === "fading") {
      if (fadeOutIndex < combinedTextArray.length) {
        const timer = setTimeout(() => {
          setFadeOutIndex((prev) => prev + 1);
        }, fadeInterval);
        return () => clearTimeout(timer);
      } else {
        setPhase("done");
        markAsRead();
      }
    }
  }, [phase, fadeOutIndex, combinedTextArray.length, fadeInterval]);

  // ------------------------------
  // 在字符达到淡出动画的时间后，从 DOM 中移除（标记为 removed）
  useEffect(() => {
    if (phase === "fading" && fadeOutIndex > 0) {
      const indexToFade = fadeOutIndex - 1;
      const timer = setTimeout(() => {
        setRemovedChars((prev) => [...prev, String(indexToFade)]);
      }, fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [phase, fadeOutIndex, fadeDuration]);

  // ------------------------------
  // 渲染部分：根据不同阶段渲染不同效果
  return (
    <div className="min-h-screen bg-black p-8">
      {
        phase !== "done" && (
          <div
          ref={scrollRef}
          className="text-white text-xl leading-8 whitespace-pre-wrap overflow-y-auto max-h-[80vh] w-full px-4 border border-gray-600 rounded-md"
          style={{
            padding: "16px",
            height: "80vh",
            paddingBottom: "80px",
          }}
        >
          {(phase === "fading") ? (
            // fading 阶段：逐个字符淡出
            combinedTextArray.map((char, i) => {
              if (char === "\n") return <br key={i} />;
              if (removedChars.includes(String(i))) return null;
              const charFading = i < fadeOutIndex && phase === "fading";
              return (
                <span
                  key={i}
                  className="inline-block transition-opacity"
                  style={{
                    transitionDuration: `${fadeDuration}ms`,
                    opacity: charFading  ? 0 : 1,
                  }}
                >
                  {char}
                </span>
              );
            })
          ) : (
            // typing/waiting 阶段：按行显示文本，并显示当前行的打字效果
            [...linesDisplay, getCurrentLinePartial() || (showCursor ? "_" : " ")].map((line, index) => (
              <div key={index}>{line}</div>
            ))
          )}
        </div>
        )
      }
      {
        phase === "done" && (
          <div className="text-white text-xl leading-8 whitespace-pre-wrap overflow-y-auto max-h-[80vh] w-full px-4  border-gray-600 rounded-md text-center">
            Best wishes to you
          </div>
        )
      }
     
    </div>
  );
}
