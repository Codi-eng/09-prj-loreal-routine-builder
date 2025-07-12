/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

// Cloudflare Worker API endpoint for OpenAI requests
const API_URL = "https://fancy-dew-f84c.rneha2729.workers.dev/";

// Store selected products
let selectedProducts = [];

// Store chat conversation history
let messages = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, index) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button onclick="selectProduct(${index})">Select</button>
      </div>
    </div>
  `
    )
    .join("");
}

/* Select a product and add it to the selectedProducts array */
window.selectProduct = async function (index) {
  const products = await loadProducts();
  const product = products[index];
  // Only add if not already selected
  if (!selectedProducts.some((p) => p.name === product.name)) {
    selectedProducts.push(product);
    updateSelectedProducts();
  }
};

/* Update the selected products list in the UI */
function updateSelectedProducts() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product">
        <span>${product.name} (${product.brand})</span>
      </div>
    `
    )
    .join("");
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  // Filter products by selected category
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Generate routine when button is clicked */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.textContent = "Please select products first!";
    return;
  }

  // Add a message to the chat history asking for a routine
  messages.push({
    role: "user",
    content: `Can you generate a routine for these products: ${selectedProducts
      .map((p) => p.name)
      .join(", ")}?`,
  });

  chatWindow.textContent = "Generating your routine...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const result = await response.json();
    const replyText = result.choices[0].message.content;

    messages.push({ role: "assistant", content: replyText });
    chatWindow.textContent = replyText;
  } catch (error) {
    chatWindow.textContent = "Sorry, something went wrong. Please try again.";
  }
});

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput").value;

  // Add user's message to chat history
  messages.push({ role: "user", content: userInput });

  chatWindow.textContent = "Thinking...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) throw new Error("Network response was not ok");

    const result = await response.json();
    const replyText = result.choices[0].message.content;

    messages.push({ role: "assistant", content: replyText });
    chatWindow.textContent = replyText;
  } catch (error) {
    chatWindow.textContent = "Sorry, something went wrong. Please try again.";
  }

  // Clear input
  document.getElementById("userInput").value = "";
});
