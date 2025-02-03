const dropZone = document.querySelector("#drop-zone");
const inputElement = document.querySelector("input");
const img = document.querySelector("#img");
let p = document.querySelector("#p");

const dropdowns = document.querySelectorAll(".dropdown-container"),
  outputLanguageDropdown = document.querySelector("#output-language"),
  inputLanguageDropdown = document.querySelector("#input-language");

function populateDropdown(dropdown, options) {
  dropdown.querySelector("ul").innerHTML = "";
  options.forEach((option) => {
    const li = document.createElement("li");
    const title = option.name + " (" + option.native + ")";
    li.innerHTML = title;
    li.dataset.value = option.code;
    li.classList.add("option");
    dropdown.querySelector(".dropdown-menu").appendChild(li);
  });
}

function copyText() {
  if (!outputTextElem.value) {
    showAlert("Nothing to copy");
    return;
  }
  navigator.clipboard.writeText(outputTextElem.value);
  showAlert("Text copied to clipboard", 3000, "green");
}

populateDropdown(outputLanguageDropdown, languages);
populateDropdown(inputLanguageDropdown, languages);

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

function isFileValid(file) {
  const allowedExtensions = ["jpg", "jpeg", "png"];
  const extension = file.name.split(".").pop().toLowerCase();
  return allowedExtensions.includes(extension);
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

inputElement.addEventListener("change", function (e) {
  const clickFile = this.files[0];
  if (clickFile && isFileValid(clickFile)) {
    img.style = "display:block;";
    p.style = "display: none";
    const reader = new FileReader();
    reader.readAsDataURL(clickFile);
    reader.onloadend = function () {
      const result = reader.result;
      let src = this.result;
      img.src = src;
      img.alt = clickFile.name;
    };
  } else {
    showAlert("Invalid file format. Please upload a JPG or PNG file.");
    this.value = null;
  }
});

dropZone.addEventListener("click", () => inputElement.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  img.style = "display:block;";
  let file = e.dataTransfer.files[0];

  if (file && isFileValid(file)) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      e.preventDefault();
      p.style = "display: none";
      let src = this.result;
      img.src = src;
      img.alt = file.name;
    };
  } else {
    showAlert("Invalid file format. Please upload a JPG or PNG file.");
  }
});

const swapBtn = document.querySelector(".swap-position"),
  outputLanguage = outputLanguageDropdown.querySelector(".selected"),
  inputLanguage = inputLanguageDropdown.querySelector(".selected"),
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
});

translatebtn.addEventListener("click", () => {
  translate();
});

async function translate() {
  const inputLanguageCode = inputLanguage.dataset.value;
  const outputLanguageCode = outputLanguage.dataset.value;
  const imageFile = inputElement.files[0];

  if (!imageFile || !isFileValid(imageFile)) {
    showAlert("Invalid file format. Please upload a JPG or PNG file.");
    return;
  }

  translatebtn.classList.add("inprogress");
  translatebtn.innerHTML = "Translation in progress, please wait!";

  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("target_language", outputLanguageCode);
    formData.append("source_language", inputLanguageCode);

    await fetch("http://127.0.0.1:8000/image-translate", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data.result.translated_text);
        outputTextElem.value = data.result.translated_text;

        showAlert(
          "If you are getting random translation, please check the image quality or ensure the source language is selected properly. If the translation is good, please ignore this message.",
          10000,
          "#ff5e00"
        );

        translatebtn.classList.remove("inprogress");
        translatebtn.innerHTML = "Upload and Translate";
      })
      .catch((error) => {
        console.error("Error during translation:", error);
        showAlert("Error during translation. Please try again.");
      });
  } catch (error) {
    console.error("Error during translation:", error);
    showAlert("Error during translation. Please try again.");

    translatebtn.classList.remove("inprogress");
    translatebtn.innerHTML = "Upload and Translate";
  } finally {
    translatebtn.classList.remove("inprogress");
    translatebtn.innerHTML = "Upload and Translate";
  }
}
