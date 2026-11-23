// Стартовая дата: «день номер 0». Месяцы в JS считаются с нуля: 0 = январь!
// Поэтому new Date(2026, 0, 1) — это 1 января 2026, 00:00 по местному времени.
const START_DATE = new Date(2026, 0, 1);

function getQuoteIndex(date, quotesCount) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const milisec = today - START_DATE;
  const dayPassed = Math.round(milisec / (24 * 60 * 60 * 1000));
  
  return dayPassed % quotesCount; 
}

// async-функция — как async в C#: внутри можно писать await и «ждать» результат.
async function showQuoteOfTheDay() {
  const quoteEl = document.getElementById("quote");
  const dateEl = document.getElementById("date");

  try {
    // fetch скачивает файл. Похоже на HttpClient.GetAsync в C# или requests.get в Python.
    const response = await fetch("quotes.json");
    const quotes = await response.json(); // превращаем текст JSON в массив строк

    const today = new Date();
    const index = getQuoteIndex(today, quotes.length);

    quoteEl.textContent = quotes[index];
    dateEl.textContent = today.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    quoteEl.textContent = "Не удалось загрузить надпись 😔";
    console.error(error);
  }
}

showQuoteOfTheDay();
