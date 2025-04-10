"use strict";

let secretWord = "";
const maxAttempts = 6;
let attempts = 0;
let gameOver = false;
let frenchWords = [];
let dictionaryLoaded = false;

const guessedWordElement = document.getElementById("guessed-word");
const attemptsElement = document.querySelector(".attempts");
const score = document.querySelector(".score");
const table = document.getElementById("word-grid");
const submitButton = document.getElementById("submit-button");

function loadDictionary() {
  return fetch('frenchWords.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok for French words');
      }
      return response.json();
    })
    .then(words => {
      frenchWords = words.map(word => 
        word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
      );
      console.log(`Loaded ${frenchWords.length} French words`);
      dictionaryLoaded = true;
      return frenchWords;
    })
    .catch(error => {
      console.error('Error loading French words:', error);
      return [];
    });
}

function isValidFrenchWord(word) {
  if (!dictionaryLoaded) {
    console.warn("Dictionary not yet loaded");
    return Promise.resolve(false);
  }
  
  const normalizedWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  console.log(`Checking if "${normalizedWord}" is valid`);
  
  const isValid = frenchWords.includes(normalizedWord);
  console.log(`Word "${normalizedWord}" is valid: ${isValid}`);
  
  return Promise.resolve(isValid);
}

function createGrid(wordLength) {
  table.innerHTML = "";
  if (!table) {
    console.error("Table element not found when creating grid");
    return;
  }
  
  console.log(`Creating grid with ${maxAttempts} rows and ${wordLength} columns`);

  for (let i = 0; i < maxAttempts; i++) {
    const row = table.insertRow();
    row.dataset.rowIndex = i;

    for (let j = 0; j < wordLength; j++) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.className = "letter-input";
      input.dataset.row = i;
      input.dataset.col = j;

      input.addEventListener("input", function (e) {
        this.value = this.value.toUpperCase();
        if (this.value.length === 1 && j < wordLength - 1) {
          const nextInput = row.cells[j + 1].querySelector("input");
          nextInput.focus();
        }
      });
      
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !gameOver) {
          checkGuess(parseInt(this.dataset.row));
        } else if (e.key === "Backspace" && this.value === "" && j > 0) {
          const prevInput = row.cells[j - 1].querySelector("input");
          prevInput.focus();
        }
      });

      cell.appendChild(input);
    }
  }

  enableRow(0);
  focusFirstCellInRow(0);
}

function focusFirstCellInRow(rowIndex) {
  setTimeout(() => {
    try {
      const row = table.rows[rowIndex];
      if (row) {
        const firstInput = row.cells[0].querySelector("input");
        if (firstInput) {
          firstInput.focus();
        } else {
          console.warn(`No input found in the first cell of row ${rowIndex}`);
        }
      } else {
        console.warn(`Row ${rowIndex} not found`);
      }
    } catch (e) {
      console.warn(`Could not focus first cell in row ${rowIndex}:`, e);
    }
  }, 100); // Delay to ensure the DOM is updated
}
function enableRow(rowIndex) {
  const rows = table.rows;
  for (let i = 0; i < rows.length; i++) {
    const inputs = rows[i].querySelectorAll("input");
    inputs.forEach((input) => {
      input.disabled = i !== rowIndex;
    });
  }
}

function getDailySecretWord() {
  const today = new Date().toISOString().split("T")[0];
  const saved = JSON.parse(
    localStorage.getItem("dailyWord") || '{"date":"","word":""}'
  );

  if (saved && saved.date === today && saved.word) {
    console.log("Using saved word from localStorage");
    return Promise.resolve(saved.word.toUpperCase());
  }

  return loadDictionary().then(() => {
    
    if (frenchWords.length === 0) {
      console.error("No words available in dictionary");
      return "JAVASCRIPT";
    }; 
    const eligibleWords = frenchWords.filter(word => word.length <= 12);

    if (eligibleWords.length === 0) {
      console.warn("No words with 12 letters or less, using default word");
      return "JAVASCRIPT";
    }
    
    const word = eligibleWords[Math.floor(Math.random() * eligibleWords.length)];
    localStorage.setItem(
      "dailyWord",
      JSON.stringify({ date: today, word })
    );
    
    console.log("Generated new word for today");
    return word;
  });
}

function refreshAtMidnight() {
  const now = new Date();
  const msUntilMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
    now.getTime();
  setTimeout(() => window.location.reload(), msUntilMidnight + 1000); // +1s to avoid timing issues
}

function updateWordLength(length) {
  const wordLengthElement = document.getElementById("word-length");
  if (wordLengthElement) {
    wordLengthElement.textContent = `Word length: ${length} letters`;
  }
}

function initializeGame() {
  loadDictionary()
    .then(() => getDailySecretWord())
    .then((word) => {
      secretWord = word;
      console.log("Today's word:", secretWord);
      updateWordLength(secretWord.length);
      createGrid(secretWord.length);
      updateAttempts();
    })
    .catch(error => {
      console.error("Error initializing game:", error);
      secretWord = "JAVASCRIPT";
      updateWordLength(secretWord.length);
      createGrid(secretWord.length);
      updateAttempts();
    });
}

async function checkGuess(rowIndex) {
  const row = table.rows[rowIndex];
  const inputs = row.querySelectorAll("input");
  let guess = "";
  
  inputs.forEach((input) => {
    guess += input.value;
  });
  
  guess = guess.toUpperCase();
  
  if (guess.length !== secretWord.length) {
    alert("Please fill in all the letters before submitting.");
    return;
  }
  
  const isValid = await isValidFrenchWord(guess);
  
  if (!isValid) {
    alert("This is not a valid French word. Please try again.");
    return;
  }
  
  const normalizedGuess = guess.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedSecret = secretWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let correct = 0;
  for (let i = 0; i < secretWord.length; i++) {
    const input = inputs[i];
    if (normalizedGuess[i] === normalizedSecret[i]) {
      input.classList.add("correct");
      correct++;
    } else if (normalizedSecret.includes(normalizedGuess[i])) {
      input.classList.add("present");
    } else {
      input.classList.add("absent");
    }
  }

  attempts++;
  updateAttempts();

  if (correct === secretWord.length) {
    alert("Congratulations! You've guessed the word!");
    gameOver = true;
    updateScore();
  } else if (attempts >= maxAttempts) {
    alert(`Game over! The word was ${secretWord}`);
    gameOver = true;
  } else {
    enableRow(rowIndex + 1);
    focusFirstCellInRow(rowIndex + 1);
  }
  
  saveGameState();
}

function updateAttempts() {
  attemptsElement.textContent = `Attempts left: ${maxAttempts - attempts}`;
}

function updateScore() {
  const baseScore = secretWord.length * 10;
  const attemptsBonus = (maxAttempts - attempts + 1) * 5;
  const totalScore = baseScore + attemptsBonus;

  const existingScore = parseInt(localStorage.getItem("totalScore") || "0");
  const newTotalScore = existingScore + totalScore;

  localStorage.setItem("totalScore", newTotalScore.toString());

  score.textContent = `Score: ${newTotalScore}`;
}

function saveGameState() {
  const gameState = {
    secretWord,
    attempts,
    gameOver,
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

// function loadGameState() {
//   const savedState = localStorage.getItem("gameState");
//   if (!savedState) return false;
  
//   try {
//     const state = JSON.parse(savedState);
//     secretWord = state.secretWord;
//     attempts = state.attempts;
//     gameOver = state.gameOver;
//     return true;
//   } catch (e) {
//     console.error("Error loading game state:", e);
//     return false;
//   }
// }

submitButton.addEventListener("click", function () {
  const activeRow = Array.from(table.rows).findIndex((row) => {
    return !row.querySelector("input").disabled;
  });
  
  if (activeRow !== -1 && !gameOver) {
    checkGuess(activeRow);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // const stateLoaded = loadGameState();
  
  // if (!stateLoaded) {
    initializeGame();
  // } else {
    updateWordLength(secretWord.length);
    updateAttempts();
    
  //   if (gameOver) {
  //     const inputs = table.querySelectorAll("input");
  //     inputs.forEach(input => input.disabled = true);
  //   } else {
  //     enableRow(attempts);
  //   }
  // }
  
  refreshAtMidnight();
  createGrid(secretWord.length);

  const savedScore = localStorage.getItem("totalScore") || "0";
  score.textContent = `Score: ${savedScore}`;
});