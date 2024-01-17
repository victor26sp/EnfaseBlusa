const catalogDiv = document.getElementById('catalog');
const cartContainer = document.getElementById('cart');
let products = [];
let categoryFilter = '';
let skuToProductMap = {}; // Mapeamento SKU para produtos
let cartItems = [];

const whatsappNumber = "5517982270013"; // Substitua pelo seu número de WhatsApp

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
        quantityInput.max = sizeObj.stock; // Defina o estoque máximo disponível
        quantityInput.value = '0';
        quantityInput.dataset.productSku = product.sku;
        quantityInput.dataset.productSizeIndex = index; // Adicione o índice do tamanho ao campo de quantidade

        const inputGroupText = document.createElement('span');
        inputGroupText.classList.add('input-group-text');
        inputGroupText.textContent = 'Qtd';

        const quantityMessage = document.createElement('div');
        quantityMessage.classList.add('alert', 'alert-danger', 'mt-2'); // Classes de alerta Bootstrap
        quantityMessage.textContent = 'Quantidade máxima atingida.';
        quantityMessage.style.display = 'none'; // Inicialmente, oculte a mensagem de erro

        inputGroup.appendChild(quantityInput);
        inputGroup.appendChild(inputGroupText);
        cell.appendChild(inputGroup);
        cell.appendChild(quantityMessage);

        // Adicione um evento de alteração ao campo de quantidade
        quantityInput.addEventListener('change', () => {
            const selectedQuantity = parseInt(quantityInput.value);

            if (selectedQuantity > sizeObj.stock) {
                // Se a quantidade selecionada for maior que o estoque, exiba a mensagem
                quantityMessage.style.display = 'block'; // Exiba a mensagem de erro
                quantityInput.value = sizeObj.stock;
            } else {
                quantityMessage.style.display = 'none'; // Oculte a mensagem de erro
            }
        });
    });

    sizeGrid.appendChild(table);
    sizeGridContainer.appendChild(sizeGrid);

    return sizeGridContainer;
}

function renderCatalog(products) {
    catalogDiv.innerHTML = '';

    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase(); // Obtenha o valor da barra de pesquisa e converta para minúsculas

    const favoriteFilter = false; // Adicione ou defina a lógica para o filtro de favoritos

    const filteredProducts = products.filter(product => {
        if (favoriteFilter && !product.isFavorite) {
            return false;
        }
        if (categoryFilter && product.category !== categoryFilter) {
            return false;
        }
        if (searchInput) {
            // Verifique se algum dos campos (ref, descrição ou grupo) contém o texto de pesquisa
            if (
                !product.ref.toLowerCase().includes(searchInput) &&
                !product.description.toLowerCase().includes(searchInput) &&
                !product.category.toLowerCase().includes(searchInput)
            ) {
                return false; // Não corresponde à pesquisa
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
                <!-- Adicione a grade de tamanhos aqui -->
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary add-to-cart" data-index="${index}">Adicionar ao Carrinho</button>
            <button class="btn btn-success send-whatsapp" data-index="${index}">Enviar via WhatsApp</button>
        </div>
        `;

        col.appendChild(card);
        catalogDiv.appendChild(col);

        // Adicione event listener para botões "Adicionar ao Carrinho"
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', () => {
                addToCart(button);
            });
        });

        // Adicione event listener para botões "Enviar via WhatsApp"
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

    // Verifique se o produto já está no carrinho
    const cartItem = cartItems.find(item => item.product.sku === product.sku);

    if (cartItem) {
        // Se o produto já estiver no carrinho, incremente a quantidade
        const sizeIndex = getSelectedSizeIndex(product, button);
        if (sizeIndex !== -1) {
            cartItem.sizes[sizeIndex].quantity++;
        } else {
            alert('Selecione um tamanho antes de adicionar ao carrinho.');
            return;
        }
    } else {
        // Se o produto não estiver no carrinho, adicione-o ao carrinho
        const sizeIndex = getSelectedSizeIndex(product, button);
        if (sizeIndex !== -1) {
            cartItems.push({ product, sizes: [initializeCartItemSize(product.sizes[sizeIndex])] });
        } else {
            alert('Selecione um tamanho antes de adicionar ao carrinho.');
            return;
        }
    }

    // Atualize a exibição do carrinho ou faça qualquer outra ação necessária
    updateCartDisplay();
}

function getSelectedSizeIndex(product, button) {
    const sizeInputs = document.querySelectorAll(`input[data-product-sku="${product.sku}"]`);
    const buttonIndex = parseInt(button.getAttribute('data-index'));

    for (let i = 0; i < sizeInputs.length; i++) {
        if (i === buttonIndex) {
            return i;
        }
    }
    return -1;
}

function initializeCartItemSize(size) {
    return { size, quantity: 1 };
}

function createCartItemElement(item) {
    const itemElement = document.createElement('li');
    itemElement.className = 'list-group-item d-flex justify-content-between align-items-center';
    itemElement.innerHTML = `${item.size.size} - ${item.quantity}x`;
    return itemElement;
}

function sendWhatsApp(button) {
    const productIndex = parseInt(button.getAttribute('data-index'));
    const product = products[productIndex];

    const sizeIndex = getSelectedSizeIndex(product, button);
    if (sizeIndex === -1) {
        alert('Selecione um tamanho antes de enviar via WhatsApp.');
        return;
    }

    const selectedSize = product.sizes[sizeIndex];
    const ref = product.ref;
    const description = product.description;
    sendWhatsAppMessage(ref, description);
}

function sendWhatsAppMessage(ref, description,) {
    const message = generateWhatsAppMessage(ref, description);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
}

function importCSV(file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            products = [];
            skuToProductMap = {}; // Limpe o mapeamento

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
                        sizes: [], // Inicialize um array vazio de tamanhos
                        isFavorite: false,
                        sku, // Adicione o SKU ao objeto do produto
                    };

                    // Adicione o produto ao mapeamento SKU
                    skuToProductMap[sku] = product;

                    // Crie um objeto de tamanho com tamanho e estoque correspondentes
                    const sizeObj = {
                        size,
                        stock: parseInt(stock),
                    };

                    // Adicione o objeto de tamanho ao array de tamanhos do produto
                    product.sizes.push(sizeObj);

                    products.push(product);
                } else {
                    // Verifique se já existe um tamanho com o mesmo nome e, se não, adicione-o
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

function generateWhatsAppMessage(ref, description, size) {
    const message = `Olá, tenho interesse no seguinte produto:\n\n`;
    return `${message}Ref: ${ref}\nDescrição: ${description}\nTamanho: ${size}\n\n`;
}

importCSV('products.csv');
