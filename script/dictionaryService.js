import { GameConfig } from './config.js';
import { WordUtils } from './wordUtils.js';

export const DictionaryService = {
    words: [],
    isLoaded: false,
    
    loadDictionary() {
      return fetch(GameConfig.DICTIONARY_URL)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok for French words');
          }
          return response.json();
        })
        .then(words => {
          this.words = words.map(word => WordUtils.normalize(word));
          console.log(`Loaded ${this.words.length} French words`);
          this.isLoaded = true;
          return this.words;
        })
        .catch(error => {
          console.error('Error loading French words:', error);
          return [];
        });
    },
    
    isValidWord(word) {
      if (!this.isLoaded) {
        console.warn("Dictionary not yet loaded");
        return Promise.resolve(false);
      }
      
      const normalizedWord = WordUtils.normalize(word);
      console.log(`Checking if "${normalizedWord}" is valid`);
      
      const isValid = this.words.includes(normalizedWord);
      console.log(`Word "${normalizedWord}" is valid: ${isValid}`);
      
      return Promise.resolve(isValid);
    },
    
    getRandomWord(maxLength = 12) {
      if (this.words.length === 0) {
        console.error("No words available in dictionary");
        return GameConfig.DEFAULT_WORD;
      }
      
      const eligibleWords = this.words.filter(word => word.length <= maxLength);
      
      if (eligibleWords.length === 0) {
        console.warn(`No words with ${maxLength} letters or less, using default word`);
        return GameConfig.DEFAULT_WORD;
      }
      
      return eligibleWords[Math.floor(Math.random() * eligibleWords.length)];
    }
  };
  