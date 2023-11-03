const catalogDiv = document.getElementById('catalog');
const cartContainer = document.getElementById('cart');
let products = [];
let categoryFilter = '';
let skuToProductMap = {};
let cartItems = [];

const whatsappNumber = "SEU_NUMERO_DE_WHATSAPP";

function createSizeGrid(product) {
    const sizeGridContainer = document.createElement('div');
    sizeGridContainer.classList.add('size-grid-container');
    const sizeGrid = document.createElement('div');
    sizeGrid.classList.add('table-responsive');

    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-sm', 'size-grid');
    table.style.maxWidth = '100%';
    const headerRow = table.insertRow(0);

    product.sizes.forEach((sizeObj, index) => {
        const cell = headerRow.insertCell(index);
        cell.textContent = sizeObj.size;
        cell.classList.add('fw-bold');
    });

    const quantityRow = table.insertRow(1);

    product.sizes.forEach((sizeObj, index) => {
        const cell = quantityRow.insertCell(index);
        cell.classList.add('text-center');

        const inputGroup = document.createElement('div');
        inputGroup.classList.add('input-group', 'mb-3');

        const quantityInput = document.createElement('input');
        quantityInput.classList.add('form-control', 'text-center');
        quantityInput.type = 'number';
        quantityInput.min = 0;
        quantityInput.max = sizeObj.stock;
        quantityInput.value = '0';
        quantityInput.dataset.productSku = product.sku;

        const inputGroupText = document.createElement('span');
        inputGroupText.classList.add('input-group-text');
        inputGroupText.textContent = 'Qtd';

        const quantityMessage = document.createElement('div');
        quantityMessage.classList.add('alert', 'alert-danger', 'mt-2');
        quantityMessage.textContent = 'Quantidade máxima atingida.';
        quantityMessage.style.display = 'none';

        inputGroup.appendChild(quantityInput);
        inputGroup.appendChild(inputGroupText);
        cell.appendChild(inputGroup);
        cell.appendChild(quantityMessage);

        quantityInput.addEventListener('change', () => {
            const selectedQuantity = parseInt(quantityInput.value);

            if (selectedQuantity > sizeObj.stock) {
                quantityMessage.style.display = 'block';
                quantityInput.value = sizeObj.stock;
            } else {
                quantityMessage.style.display = 'none';
            }
        });
    });

    sizeGrid.appendChild(table);
    sizeGridContainer.appendChild(sizeGrid);

    return sizeGridContainer;
}

function renderCatalog(products) {
    catalogDiv.innerHTML = '';

    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();
    const favoriteFilter = false;

    const filteredProducts = products.filter(product => {
        if (favoriteFilter && !product.isFavorite) {
            return false;
        }
        if (categoryFilter && product.category !== categoryFilter) {
            return false;
        }
        if (searchInput) {
            if (
                !product.ref.toLowerCase().includes(searchInput) &&
                !product.description.toLowerCase().includes(searchInput) &&
                !product.category.toLowerCase().includes(searchInput)
            ) {
                return false;
            }
        }
        return true;
    });

    filteredProducts.forEach((product, index) => {
        const col = document.createElement('div');
        col.classList.add('col-md-4', 'mb-4');

        const card = document.createElement('div');
        card.classList.add('card', 'h-100');
        const sizes = product.sizes.map(sizeObj => sizeObj.size).join(', ');
        card.innerHTML = `
        <div class="card-image" style="position: relative;">
            <img src="imagens/${product.image}" class="card-img-top" alt="${product.description}">
        </div>
        <div class="card-body">
            <h5 class="card-title">${product.description}</h5>
            <p class="card-text">Ref: ${product.ref}</p>
            <p class="card-text">Cor: ${product.color}</p>
            <p class="card-text">${product.category}</p>
            <p class="card-text">${product.composition}</p>
            <div class="sizes-section">
                <p class="card-text">Tamanhos Disponíveis: ${sizes}</p>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary add-to-cart" data-index="${index}">Adicionar ao Carrinho</button>
            <button class="btn btn-success send-whatsapp" data-index="${index}">Enviar via WhatsApp</button>
        </div>
        `;

        col.appendChild(card);
        catalogDiv.appendChild(col);

        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', () => {
                addToCart(button);
            });
        });

        const sendWhatsappButtons = document.querySelectorAll('.send-whatsapp');
        sendWhatsappButtons.forEach(button => {
            button.addEventListener('click', () => {
                sendWhatsApp(button);
            });
        });
    });
}

function addToCart(button) {
    const productIndex = parseInt(button.getAttribute('data-index'));
    const product = products[productIndex];

    const cartItem = cartItems.find(item => item.product.sku === product.sku);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cartItems.push({ product, quantity: 1 });
    }

    updateCartDisplay();
}

function importCSV(file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            products = [];
            skuToProductMap = {};

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.length === 0) {
                    break;
                }

                const [ref, description, category, color, composition, sku, stock, size, image] = line.split(';');
                const existingProduct = products.find(product => product.image === image);

                if (!existingProduct) {
                    const product = {
                        ref,
                        description,
                        category,
                        color,
                        composition,
                        image,
                        sizes: [],
                        isFavorite: false,
                        sku,
                    };

                    skuToProductMap[sku] = product;

                    const sizeObj = {
                        size,
                        stock: parseInt(stock),
                    };

                    product.sizes.push(sizeObj);

                    products.push(product);
                } else {
                    const existingSize = existingProduct.sizes.find(existingSize => existingSize.size === size);
                    if (!existingSize) {
                        const sizeObj = {
                            size,
                            stock: parseInt(stock),
                        };
                        existingProduct.sizes.push(sizeObj);
                    }
                }
            }

            renderCatalog(products);
        });
}

function sendWhatsApp(button) {
    const productIndex = parseInt(button.getAttribute('data-index'));
    const product = products[productIndex];
    const selectedSize = getSelectedSize(product);

    if (selectedSize) {
        const ref = product.ref;
        const description = product.description;
        sendWhatsAppMessage(ref, description, selectedSize);
    } else {
        alert('Selecione um tamanho antes de enviar via WhatsApp.');
    }
}

function getSelectedSize(product) {
    const sizeInputs = document.querySelectorAll(`input[data-product-sku="${product.sku}`);
    for (const sizeInput of sizeInputs) {
        if (sizeInput.value > 0) {
            return sizeInput.value;
        }
    }
    return null;
}

function generateWhatsAppMessage(ref, description, size) {
    const message = `Olá, tenho interesse no seguinte produto:\n\n`;
    return `${message}Ref: ${ref}\nDescrição: ${description}\nTamanho: ${size}\n\n`;
}

function sendWhatsAppMessage(ref, description, size) {
    const message = generateWhatsAppMessage(ref, description, size);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
}

importCSV('products.csv');
