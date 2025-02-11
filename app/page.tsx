"use client";
import { useEffect, useState, useRef } from "react";
import { lines } from "./data";

const QUESTION = "Password: Hello World";
const CORRECT_ANSWER = "Hello World"; 


function Home() {
  const scrollRef = useRef<HTMLDivElement>(null)

  // ========== Animation Parameters ==========
  const typingSpeed = 50; // Typing speed
  const cursorBlinkSpeed = 500; // Cursor blink interval
  const finalPauseBeforeFading = 1500; // Waiting time after all lines are printed
  const fadeInterval = 10; // Interval between each character fading out
  const fadeDuration = 2000; // Transition duration from opaque to transparent


  const [currentLine, setCurrentLine] = useState(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [linesDisplay, setLinesDisplay] = useState<string[]>([]);
  const [phase, setPhase] = useState<"typing" | "waiting" | "fading" | "done">("typing");

  // fade out state
  const [fadeOutIndex, setFadeOutIndex] = useState(0);
  const [removedChars, setRemovedChars] = useState<string[]>([]);

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
  // let cursor blink
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, cursorBlinkSpeed);
    return () => clearInterval(cursorTimer);
  }, []);

  // ------------------------------
  // scroll to bottom when new line added
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
  // typing logic
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
          // current line is fully typed
          const fullLine = currentLineText;
          setLinesDisplay((prev) => [...prev, fullLine]);

          // wait for pause duration
          const timer = setTimeout(() => {
            setCurrentLine((prev) => prev + 1);
            setTypedIndex(0); // reset typedIndex
          }, lines[currentLine].pause);
          return () => clearTimeout(timer);
        }
      } else {
        setPhase("waiting");
      }
    }
  }, [phase, currentLine, typedIndex, lines]);

  // ------------------------------
  // fading after all lines are printed
  useEffect(() => {
    if (phase === "waiting") {
      const timer = setTimeout(() => {
        setPhase("fading");
      }, finalPauseBeforeFading);
      return () => clearTimeout(timer);
    }
  }, [phase, finalPauseBeforeFading]);

  // ------------------------------
  // calculate the current line with typing effect
  const getCurrentLinePartial = () => {
    if (phase === "typing") {
      if (currentLine < lines.length) {
        const text = lines[currentLine].text;
        if (typedIndex >= text.length) {
          return ""; // fully typed this line, cursor should be at the next line
        }
        return text.slice(0, typedIndex) + (showCursor ? "_" : "");
      } else {
        return showCursor ? "_" : "";
      }
    }
    return "";
  };

  // ------------------------------
  // combine all lines and current line with typing effect
  const combinedTextArray = [
    ...linesDisplay.map((line) => line + "\n"),
    getCurrentLinePartial(),
  ]
    .join("")
    .split("");

  // ------------------------------
  // fading out effect
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
  // fading out effect: remove characters
  useEffect(() => {
    if (phase === "fading" && fadeOutIndex > 0) {
      const indexToFade = fadeOutIndex - 1;
      const timer = setTimeout(() => {
        setRemovedChars((prev) => [...prev, String(indexToFade)]);
      }, fadeDuration);
      return () => clearTimeout(timer);
    }
  }, [phase, fadeOutIndex, fadeDuration]);


  return (
    <div className="min-h-screen bg-black p-8">
      {
        phase !== "done" && (
          <div
          ref={scrollRef}
          className="text-white text-xl leading-8 whitespace-pre-wrap overflow-y-auto max-h-[80vh] w-full px-4 border border-gray-600 rounded-md content"
          style={{
            padding: "16px",
            height: "80vh",
            paddingBottom: "80px",
          }}
        >
          {(phase === "fading") ? (
            // fading phase: show all text with fading out effect
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
            // typing/waiting phase: show current line with typing effect
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



export default function App() {
  const [userInput, setUserInput] = useState("");

  // deal with user input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUserInput(value);
  };

  // verify user input
  const isAuthenticated = userInput === CORRECT_ANSWER.toLowerCase();

  // if user input is correct, show the home page
  if (isAuthenticated) {
    return <Home />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="p-6 rounded-lg shadow-lg w-96" style={{ backgroundColor: "#2b2d37" }}>
        <h1 className="text-2xl font-bold mb-4 text-center">{QUESTION}</h1>
        <input
          type="text"
          className="w-full p-2 text-black rounded-md"
          placeholder="input answer"
          value={userInput}
          onChange={handleInputChange} 
        />
      </div>
    </div>
  );
}
