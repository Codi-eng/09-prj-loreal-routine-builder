/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

// Cloudflare Worker API endpoint for OpenAI requests
const API_URL = "https://fancy-dew-f84c.rneha2729.workers.dev/";

// Load selected products from localStorage when the page loads
let selectedProducts = [];
const savedProducts = localStorage.getItem("selectedProducts");
if (savedProducts) {
  selectedProducts = JSON.parse(savedProducts);
  updateSelectedProducts();
}

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
// Students: The description will show when you hover over a product card.
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
        <div class="product-card${isSelected ? " selected" : ""}">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button onclick="selectProductByName('${
              product.name
            }')">Select</button>
          </div>
          <div class="product-description">
            ${product.description || "No description available."}
          </div>
        </div>
      `;
    })
    .join("");
}

/* Select a product by name and add it to the selectedProducts array */
window.selectProductByName = async function (name) {
  const products = await loadProducts();
  const product = products.find((p) => p.name === name);
  // Only add if not already selected
  if (product && !selectedProducts.some((p) => p.name === product.name)) {
    selectedProducts.push(product);
    updateSelectedProducts();
  }
  // Re-render products to update visual selection
  const selectedCategory = categoryFilter.value;
  const filteredProducts = products.filter(
    (p) => p.category === selectedCategory
  );
  displayProducts(filteredProducts);
};

/* Update the selected products list in the UI */
// This function displays each selected product and adds a remove button for each.
// Students: The remove button lets users delete products from their selection.
function updateSelectedProducts() {
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product, idx) => `
      <div class="selected-product">
        <span>${product.name} (${product.brand})</span>
        <button class="remove-btn" onclick="removeSelectedProduct(${idx})" title="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `
    )
    .join("");
  // Save to localStorage
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Remove a product from the selected list */
// Students: This function removes the product at the given index and updates the UI.
window.removeSelectedProduct = function (index) {
  selectedProducts.splice(index, 1);
  updateSelectedProducts();
};

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
