const dropdowns = document.querySelectorAll(".dropdown-container"),
  inputLanguageDropdown = document.querySelector("#input-language"),
  outputLanguageDropdown = document.querySelector("#output-language");

function populateDropdown(dropdown, options) {
  dropdown.querySelector("ul").innerHTML = "";
  options.forEach((option) => {
    const li = document.createElement("li");
    const title = option.name + " (" + option.native + ")";
    li.innerHTML = title;
    li.dataset.value = option.code;
    li.classList.add("option");
    dropdown.querySelector("ul").appendChild(li);
  });
}

function showAlert(message, dur = 3000, color = "red") {
  Toastify({
    text: message,
    duration: dur,
    newWindow: true,
    close: true,
    gravity: "bottom",
    position: "left",
    stopOnFocus: true,
    style: {
      background: color,
    },
  }).showToast();
}

function copyText() {
  if (!outputTextElem.value) {
    showAlert("Nothing to copy");
    return;
  }
  navigator.clipboard.writeText(outputTextElem.value);
  showAlert("Text copied to clipboard", 3000, "green");
}

populateDropdown(inputLanguageDropdown, languages);
populateDropdown(outputLanguageDropdown, languages);

dropdowns.forEach((dropdown) => {
  dropdown.addEventListener("click", (e) => {
    dropdown.classList.toggle("active");
  });

  dropdown.querySelectorAll(".option").forEach((item) => {
    item.addEventListener("click", (e) => {
      //remove active class from current dropdowns
      dropdown.querySelectorAll(".option").forEach((item) => {
        item.classList.remove("active");
      });
      item.classList.add("active");
      const selected = dropdown.querySelector(".selected");
      selected.innerHTML = item.innerHTML;
      selected.dataset.value = item.dataset.value;
    });
  });
});
document.addEventListener("click", (e) => {
  dropdowns.forEach((dropdown) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });
});

const swapBtn = document.querySelector(".swap-position"),
  inputLanguage = inputLanguageDropdown.querySelector(".selected"),
  outputLanguage = outputLanguageDropdown.querySelector(".selected"),
  inputTextElem = document.querySelector("#input-text"),
  outputTextElem = document.querySelector("#output-text"),
  translatebtn = document.querySelector("#translatebtn"),
  inputchars = document.getElementById("input-chars");

swapBtn.addEventListener("click", (e) => {
  const temp = inputLanguage.innerHTML;
  inputLanguage.innerHTML = outputLanguage.innerHTML;
  outputLanguage.innerHTML = temp;

  const tempValue = inputLanguage.dataset.value;
  inputLanguage.dataset.value = outputLanguage.dataset.value;
  outputLanguage.dataset.value = tempValue;

  //swap text
  const tempInputText = inputTextElem.value;
  inputTextElem.value = outputTextElem.value;
  outputTextElem.value = tempInputText;
});

translatebtn.addEventListener("click", () => {
  if (inputTextElem.value === "") {
    Toastify({
      text: "Please enter text",
      duration: 3000,
      newWindow: true,
      close: true,
      gravity: "bottom",
      position: "left",
      stopOnFocus: true,
      style: {
        background: "red",
      },
    }).showToast();
  } else {
    translate();
  }
});

let toastCount = 0;
const maxToastCount = 5;

inputTextElem.addEventListener("paste", (e) => {
  setTimeout(() => {
    var num = inputTextElem.value;
    inputchars.innerHTML = num.length;

    const maxLimit = 500;

    if (num.length >= maxLimit) {
      inputTextElem.value = num.substring(0, maxLimit);

      if (toastCount < maxToastCount) {
        Toastify({
          text: "Maximum limit of translation text reached!",
          duration: 3000,
          newWindow: true,
          close: true,
          gravity: "bottom",
          position: "left",
          stopOnFocus: true,
          style: {
            background: "red",
          },
        }).showToast();

        toastCount++;

        setTimeout(() => {
          toastCount = 0;
        }, 4000);
      }
    }
  }, 0);
});

inputTextElem.addEventListener("input", () => {
  var num = inputTextElem.value;
  inputchars.innerHTML = num.length;

  const maxLimit = 500;

  if (num.length > maxLimit) {
    inputTextElem.value = num.substring(0, maxLimit);

    if (toastCount < maxToastCount) {
      Toastify({
        text: "Maximum limit of translation text reached!",
        duration: 3000,
        newWindow: true,
        close: true,
        gravity: "bottom",
        position: "left",
        stopOnFocus: true,
        style: {
          background: "red",
        },
      }).showToast();

      toastCount++;

      setTimeout(() => {
        toastCount = 0;
      }, 4000);
    }
  }
});
async function translate() {
  const inputText = inputTextElem.value;
  const targetLanguage = outputLanguage.dataset.value;
  const sourceLanguage = inputLanguage.dataset.value;

  translatebtn.classList.add("inprogress");
  translatebtn.innerHTML = "Translation in progress please wait!";

  try {
    await fetch("http://127.0.0.1:8000/translate", {
      method: "POST",
      body: JSON.stringify({
        text: inputText,
        target_language: targetLanguage,
        source_language: sourceLanguage,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((res) => {
        if (!res.ok) {
          translatebtn.classList.remove("inprogress");
          translatebtn.innerHTML = "Translate";

          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        translatebtn.classList.remove("inprogress");
        translatebtn.innerHTML = "Translate";
        console.log(data);
        outputTextElem.value = data.translated_text;
      })
      .catch((error) => {
        translatebtn.classList.remove("inprogress");
        translatebtn.innerHTML = "Translate";
        Toastify({
          text: error + ". Server is down, please try again later",
          duration: 3000,
          newWindow: true,
          close: true,
          gravity: "bottom",
          position: "left",
          stopOnFocus: true,
          style: {
            background: "red",
          },
        }).showToast();
        console.error("Error:", error);
      });
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

const speachInputFeildBTN = document.getElementById("speachInputFeildBTN");

const speechLanguageCodes = {
  en: "en-US",
  fr: "en-US",
  de: "en-US",
  es: "en-US",
  hi: "hi-IN",
  ta: "hi-IN",
  te: "hi-IN",
  bn: "hi-IN",
  mr: "hi-IN",
  ja: "ja-JP",
  ru: "ru-RU",
};

const speachInputFeild = () => {
  const text = document.getElementById("input-text").value;
  const sourceLanguage = inputLanguage.dataset.value;

  // console.log(text, sourceLanguage);

  try {
    const targetLanguage = speechLanguageCodes[sourceLanguage];
    if (targetLanguage) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLanguage;

      // Get the voices available
      const voices = window.speechSynthesis.getVoices();
      console.log(voices)
      
      // Find the voice you want to use (you may need to adjust this)
      // const desiredVoice = voices.find(voice => voice.name === voices[1]);

      // Set the desired voice
      utterance.voice = voices[1];


      window.speechSynthesis.speak(utterance);
    } else {
      console.log("Language code not found in speechLanguageCodes");
    }
  } catch (error) {
    console.log(error);
  }
};

const outputInputFeild = () => {
  const text = document.getElementById("output-text").value;
  const sourceLanguage = outputLanguage.dataset.value;

  // console.log(text, sourceLanguage);

  try {
    const targetLanguage = speechLanguageCodes[sourceLanguage];
    if (targetLanguage) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = targetLanguage;

      window.speechSynthesis.speak(utterance);
    } else {
      console.log("Language code not found in speechLanguageCodes");
    }
  } catch (error) {
    console.log(error);
  }
};
