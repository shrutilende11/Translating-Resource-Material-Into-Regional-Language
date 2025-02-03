const dropZone = document.querySelector("#drop-zone");
const inputElement = document.querySelector("input");
const video = document.querySelector("#video");
let p = document.querySelector("#p");

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

function isFileValid(file) {
  const allowedExtensions = ["mp4", "mkv"];
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
    video.style = "display:block;";
    p.style = "display: none";
    const reader = new FileReader();
    reader.readAsDataURL(clickFile);
    reader.onloadend = function () {
      const result = reader.result;
      let src = this.result;
      video.src = src;
      video.alt = clickFile.name;
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
  video.style = "display:block;";
  let file = e.dataTransfer.files[0];

  if (file && isFileValid(file)) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      e.preventDefault();
      p.style = "display: none";
      let src = this.result;
      video.src = src;
      video.alt = file.name;
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
  inputchars = document.getElementById("input-chars"),
  translated_video = document.getElementById("translated_video");

swapBtn.addEventListener("click", (e) => {
  const temp = inputLanguage.innerHTML;
  inputLanguage.innerHTML = outputLanguage.innerHTML;
  outputLanguage.innerHTML = temp;

  const tempValue = inputLanguage.dataset.value;
  inputLanguage.dataset.value = outputLanguage.dataset.value;
  outputLanguage.dataset.value = tempValue;
});

translatebtn.addEventListener("click", async (e) => {
  e.preventDefault();
  await translate();
});

async function translate() {
  const inputLanguageCode = inputLanguage.dataset.value;
  const outputLanguageCode = outputLanguage.dataset.value;
  const videofile = inputElement.files[0];

  console.log(videofile, inputLanguageCode, outputLanguageCode);

  translatebtn.classList.add("inprogress");
  translatebtn.innerHTML = "Translation in progress please wait!";

  if (!videofile || !isFileValid(videofile)) {
    showAlert("Invalid file format. Please upload a JPG or PNG file.");
    return;
  }

  const formData = new FormData();
  formData.append("video", videofile);
  formData.append("target_language", outputLanguageCode);
  formData.append("source_language", inputLanguageCode);

  translated_video.src = "";

  console.log(formData);

  await fetch("http://localhost:8000/video-translate", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      translated_video.src = data.temp_output_path;
      showAlert(
        "If you are getting random translation please check the image quality or the source language is selected properly! If translation is good please ignore this message.",
        10000,
        "#ff5e00"
      );
    })
    .catch((error) => {
      console.log(error);
      translatebtn.classList.remove("inprogress");
      translatebtn.innerHTML = "Upload and Translate";

      console.error("Error during translation:", error);
      showAlert("Error during translation. Please try again.");
    });

  translatebtn.classList.remove("inprogress");
  translatebtn.innerHTML = "Upload and Translate";
}
