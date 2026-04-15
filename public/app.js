const MENU_CATEGORIES = [
  {
    title: "Холодные закуски",
    items: [
      "Домашние соленья",
      "Ассорти сыров",
      "Мясное ассорти",
      "Рулетики из кабачков",
      "Овощной букет",
      "Рулетики из баклажан",
      "Сельдь",
      "Лосось",
      "Бабагануш с орехами пекан",
      "Тартар из лосося",
      "Тартар из говядины с эспумой из пармезана"
    ]
  },
  {
    title: "Горячие закуски",
    items: [
      "Долма с соусом джа-джик",
      "Обжаренный сулугуни",
      "Запеченный язык с грибами и картофелем",
      "Мозговая косточка",
      "Хрустящие креветки"
    ]
  },
  {
    title: "Салаты",
    items: [
      "Цезарь с курицей",
      "Цезарь с креветками",
      "Салат с тунцом от шефа",
      "Салат с копченым тунцом и манго",
      "Азия",
      "Ачик чук с базиликом",
      "Ташкент",
      "Салат с халуми",
      "Салат с баклажанами",
      "Салат Бахор",
      "Салат с уткой",
      "Салат с языком",
      "Зеленый салат с лососем"
    ]
  },
  {
    title: "Роллы",
    items: [
      "Каппа маки",
      "Сяке маки",
      "Текка маки",
      "Филадельфия классическая",
      "Тайгер Ролл",
      "Микадо Ролл",
      "Ролл Омар Хайям",
      "Сакура Краб",
      "Ролл Тартар Магуро",
      "Ролл Блэк Джек",
      "Ролл Запеченный Лосось",
      "Филадельфия Карамель"
    ]
  },
  {
    title: "Супы",
    items: [
      "Том ям",
      "Крем-суп из грибов",
      "Балык-шурпа",
      "Солянка",
      "Угра-ош",
      "Лагман",
      "Султан-шурпа",
      "Харчо"
    ]
  },
  {
    title: "Горячие блюда",
    items: [
      "Плов Ташкентский с бараниной",
      "Плов Праздничный с телятиной",
      "Рис Жасмин с нежной телятиной",
      "Курочка по-восточному",
      "Казан кабоб",
      "Жаркое по-таежному с грибами",
      "Чучвара жареная",
      "Чучвара отварная",
      "Гедза",
      "Хинкали с бараниной",
      "Хинкали с говядиной и свининой",
      "Хинкали со шпинатом и креветкой",
      "Манты с телятиной",
      "Хинкали патара с курицей и грибами",
      "Хинкали патара с телятиной",
      "Жареный лагман с морепродуктами с пастой том ям",
      "Сливочно-трюфельный лагман с грибами"
    ]
  }
];

const form = document.querySelector("#menu-form");
const guestsContainer = document.querySelector("#guests");
const addGuestButton = document.querySelector("#add-guest");
const statusNode = document.querySelector("#status");

let guestCounter = 0;

function createGuestCard() {
  guestCounter += 1;

  const card = document.createElement("section");
  card.className = "guest-card";
  card.dataset.guestId = String(guestCounter);

  const title = document.createElement("h2");
  title.textContent = `Гость ${guestCounter}`;
  card.appendChild(title);

  const nameLabel = document.createElement("label");
  const nameSpan = document.createElement("span");
  nameSpan.textContent = "Имя гостя";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.required = true;
  nameInput.placeholder = "Например, Анна Иванова";
  nameInput.dataset.role = "guest-name";
  nameLabel.appendChild(nameSpan);
  nameLabel.appendChild(nameInput);
  card.appendChild(nameLabel);

  for (const category of MENU_CATEGORIES) {
    const categoryBlock = document.createElement("fieldset");
    categoryBlock.className = "category";
    const legend = document.createElement("legend");
    legend.textContent = category.title;
    categoryBlock.appendChild(legend);

    const grid = document.createElement("div");
    grid.className = "options-grid";

    for (const item of category.items) {
      const optionLabel = document.createElement("label");
      optionLabel.className = "check";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item;
      checkbox.dataset.category = category.title;
      const text = document.createElement("span");
      text.textContent = item;
      optionLabel.appendChild(checkbox);
      optionLabel.appendChild(text);
      grid.appendChild(optionLabel);
    }

    categoryBlock.appendChild(grid);
    card.appendChild(categoryBlock);
  }

  if (guestCounter > 1) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-guest";
    removeButton.textContent = "Удалить гостя";
    removeButton.addEventListener("click", () => {
      card.remove();
      updateGuestTitles();
    });
    card.appendChild(removeButton);
  }

  guestsContainer.appendChild(card);
}

function updateGuestTitles() {
  const cards = guestsContainer.querySelectorAll(".guest-card");
  let index = 1;
  for (const card of cards) {
    const titleNode = card.querySelector("h2");
    titleNode.textContent = `Гость ${index}`;
    index += 1;
  }
}

function collectGuestSelections(guestCard) {
  const categories = {};
  for (const category of MENU_CATEGORIES) {
    categories[category.title] = [];
  }

  const checkboxes = guestCard.querySelectorAll("input[type='checkbox']");
  for (const checkbox of checkboxes) {
    if (checkbox.checked) {
      categories[checkbox.dataset.category].push(checkbox.value);
    }
  }

  return categories;
}

addGuestButton.addEventListener("click", () => {
  createGuestCard();
  updateGuestTitles();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusNode.textContent = "Отправляем...";

  const guestCards = guestsContainer.querySelectorAll(".guest-card");
  const guests = [];

  for (const card of guestCards) {
    const guestNameInput = card.querySelector("[data-role='guest-name']");
    const guestName = guestNameInput.value.trim();
    const selections = collectGuestSelections(card);
    const hasAnySelection = Object.values(selections).some((list) => list.length > 0);

    if (!guestName || !hasAnySelection) {
      statusNode.textContent = "Укажите имя и выберите хотя бы одно блюдо для каждого гостя.";
      return;
    }

    guests.push({ guestName, selections });
  }

  const formData = new FormData(form);
  const payload = {
    comment: (formData.get("comment") || "").toString().trim(),
    guests
  };

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Не удалось отправить форму.");
    }

    form.reset();
    guestsContainer.innerHTML = "";
    guestCounter = 0;
    createGuestCard();
    statusNode.textContent = "Спасибо! Ваш выбор отправлен.";
  } catch (error) {
    statusNode.textContent = `Ошибка: ${error.message}`;
  }
});

createGuestCard();
