"use client";
import { useState } from "react";
import Home from "./page"; // 你的原始 Home 组件

// ========== 问题和答案 ==========
const QUESTION = "What is the secret code?";
const CORRECT_ANSWER = "memory"; // 你可以修改这个答案

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = () => {
    if (userInput.trim().toLowerCase() === CORRECT_ANSWER.toLowerCase()) {
      setIsAuthenticated(true);
    } else {
      setErrorMessage("Incorrect answer, please try again.");
    }
  };

  if (isAuthenticated) {
    return <Home />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-4 text-center">{QUESTION}</h1>
        <input
          type="text"
          className="w-full p-2 mb-3 text-black rounded-md"
          placeholder="Enter the answer"
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setErrorMessage("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md"
          onClick={handleSubmit}
        >
          Submit
        </button>
        {errorMessage && <p className="text-red-500 mt-2 text-center">{errorMessage}</p>}
      </div>
    </div>
  );
}
