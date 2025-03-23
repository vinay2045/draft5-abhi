/**
 * Carousel Management Script
 * Handles CRUD operations for carousel items directly with base64 encoded images
 */

// Global variables
let carouselItems = [];
let currentItemId = null;
let originalImageData = null;
let deleteItemId = null;

// DOM elements - initialized in DOMContentLoaded
let carouselModal;
let modalTitle;
let carouselForm;
let imagePreview;
let imageSizeControls;
let addCarouselBtn;
let saveCarouselBtn;
let reorderBtn;
let saveOrderBtn;
let confirmDeleteBtn;
let imageUpload;
let carouselItemsList;
let reorderList;
let carouselItemsTable;
let sortableItems;
let confirmModal;
let reorderModal;
let dragDropArea;

// Placeholder image for when no image is provided
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing carousel admin');
    
    // Initialize DOM element references
    carouselModal = document.getElementById('carouselModal');
    modalTitle = document.getElementById('modalTitle');
    carouselForm = document.getElementById('carouselForm');
    imagePreview = document.getElementById('imagePreview');
    imageSizeControls = document.getElementById('imageSizeControls');
    addCarouselBtn = document.getElementById('addCarouselBtn');
    saveCarouselBtn = document.getElementById('saveCarouselBtn');
    reorderBtn = document.getElementById('reorderBtn');
    saveOrderBtn = document.getElementById('saveOrderBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    imageUpload = document.getElementById('imageUpload');
    carouselItemsList = document.getElementById('carouselItems');
    reorderList = document.getElementById('reorderList');
    carouselItemsTable = document.getElementById('carouselItemsTable');
    sortableItems = document.getElementById('sortableItems');
    confirmModal = document.getElementById('confirmModal');
    reorderModal = document.getElementById('reorderModal');
    dragDropArea = document.getElementById('dragDropArea');
    
    console.log('DOM elements initialized:', {
        carouselModal: !!carouselModal,
        modalTitle: !!modalTitle,
        carouselForm: !!carouselForm,
        imagePreview: !!imagePreview,
        imageSizeControls: !!imageSizeControls,
        addCarouselBtn: !!addCarouselBtn,
        saveCarouselBtn: !!saveCarouselBtn,
        reorderBtn: !!reorderBtn,
        saveOrderBtn: !!saveOrderBtn,
        confirmDeleteBtn: !!confirmDeleteBtn,
        imageUpload: !!imageUpload,
        carouselItemsList: !!carouselItemsList,
        reorderList: !!reorderList,
        carouselItemsTable: !!carouselItemsTable,
        sortableItems: !!sortableItems,
        confirmModal: !!confirmModal,
        reorderModal: !!reorderModal,
        dragDropArea: !!dragDropArea
    });
    
    // Set up event listeners
    addEventListeners();
    
    // Load carousel items
    loadCarouselItems();
    
    // Setup drag & drop for image upload
    setupDragDrop();
    
    // Add other event listeners
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            hideModal(carouselModal);
            
            // Hide other modals if they exist
            const reorderModal = document.getElementById('reorderModal');
            const confirmModal = document.getElementById('confirmModal');
            
            if (reorderModal) hideModal(reorderModal);
            if (confirmModal) hideModal(confirmModal);
        });
    });
    
    // Reorder button
    if (reorderBtn) {
        reorderBtn.addEventListener('click', showReorderModal);
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCarouselItem);
    }
    
    // Image upload
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Set up form reset when modal is closed
    if (carouselModal) {
        carouselModal.addEventListener('click', function(e) {
            if (e.target === carouselModal || e.target.classList.contains('modal-backdrop')) {
                hideModal(carouselModal);
            }
        });
    }
    
    // Reset image button
    const resetImageBtn = document.getElementById('resetImageBtn');
    if (resetImageBtn) {
        resetImageBtn.addEventListener('click', resetImage);
    }
    
    console.log('Carousel admin initialization complete');
});

// Load carousel items from API
async function loadCarouselItems() {
    try {
        showTableLoading();
        console.log('Loading carousel items from API...');
        
        const response = await window.AdminAuth.apiRequest('/api/carousel/all', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Carousel items loaded:', response);
        
        if (Array.isArray(response)) {
            carouselItems = response; 
        } else {
            console.warn('Invalid carousel items response:', response);
            carouselItems = [];
        }
        
        renderCarouselItemsTable();
    } catch (error) {
        console.error('Error loading carousel items:', error);
        showToast(`Failed to load: ${error.message || 'Unknown error'}`, 'error');
        renderEmptyTable('Failed to load carousel items. Please try again.');
    }
}

// Render carousel items table
function renderCarouselItemsTable() {
    if (!carouselItemsTable) {
        console.error('Carousel items table not found');
        return;
    }
    
    if (!carouselItems || carouselItems.length === 0) {
        renderEmptyTable('No carousel items found. Add your first carousel item by clicking the "Add New Item" button.');
        return;
    }
    
    // Sort items by order
    carouselItems.sort((a, b) => a.order - b.order);
    
    // Add a summary row at the top of the table
    const tableHeader = document.querySelector('#carouselItemsTable thead');
    if (tableHeader) {
        // Remove any existing summary
        const existingSummary = document.querySelector('.carousel-summary');
        if (existingSummary) {
            existingSummary.remove();
        }
        
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'mb-2 text-right carousel-summary';
        summaryDiv.innerHTML = `<strong>Total items: ${carouselItems.length}</strong> (Order ranges from 0 to ${carouselItems.length - 1})`;
        
        // Insert before the table
        if (tableHeader.parentNode) {
            tableHeader.parentNode.insertBefore(summaryDiv, tableHeader);
        }
    }
    
    let tableBody = '';
    
    carouselItems.forEach((item, index) => {
        tableBody += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="table-image">
                        <img src="${item.image || placeholderImage}" alt="${item.title}" onerror="this.src='${placeholderImage}'">
                    </div>
                </td>
                <td>${item.title}</td>
                <td>${item.heading}</td>
                <td>
                    <span class="badge ${item.active ? 'bg-success' : 'bg-secondary'}">
                        ${item.active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-primary edit-item" data-id="${item._id}">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button type="button" class="btn btn-secondary preview-item" data-id="${item._id}">
                            <i class='bx bx-show'></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-item" data-id="${item._id}">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    carouselItemsTable.querySelector('tbody').innerHTML = tableBody;
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-item').forEach(button => {
        button.addEventListener('click', () => editCarouselItem(button.dataset.id));
    });
    
    document.querySelectorAll('.preview-item').forEach(button => {
        button.addEventListener('click', () => previewCarouselItem(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-item').forEach(button => {
        button.addEventListener('click', () => showDeleteConfirmation(button.dataset.id));
    });
}

// Show loading state in table
function showTableLoading() {
    if (!carouselItemsTable) return;
    
    carouselItemsTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-spinner" style="margin: 20px auto;"></div>
                <p>Loading carousel items...</p>
            </td>
        </tr>
    `;
}

// Render empty table with message
function renderEmptyTable(message) {
    if (!carouselItemsTable) return;
    
    carouselItemsTable.querySelector('tbody').innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <p>${message}</p>
            </td>
        </tr>
    `;
}

// Initialize event listeners
function addEventListeners() {
    console.log('Setting up event listeners');
    
    // Add carousel button
    if (addCarouselBtn) {
        console.log('Found add carousel button');
        addCarouselBtn.addEventListener('click', () => showCarouselModal());
    } else {
        console.error('Add carousel button not found');
    }
    
    // Save carousel button - with debug logging
    if (saveCarouselBtn) {
        console.log('Found save carousel button');
        
        // Remove any existing event listeners first
        const newSaveBtn = saveCarouselBtn.cloneNode(true);
        saveCarouselBtn.parentNode.replaceChild(newSaveBtn, saveCarouselBtn);
        saveCarouselBtn = newSaveBtn;
        
        // Add the new event listener with explicit preventDefault
        saveCarouselBtn.addEventListener('click', function(e) {
            console.log('Save button clicked');
            e.preventDefault();
            saveCarouselItem(e);
        });
        } else {
        console.error('Save carousel button not found');
    }
    
    // Save order button
    if (saveOrderBtn) {
        console.log('Found save order button');
        saveOrderBtn.addEventListener('click', saveItemsOrder);
        } else {
        console.error('Save order button not found');
    }
    
    // Add form preview listener
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        console.log('Found image URL input, adding change listener');
        imageUrlInput.addEventListener('change', function() {
            console.log('Image URL changed');
            displayImage(this.value, 0, 0);
        });
    } else {
        console.error('Image URL input not found');
    }
    
    // Image resize listener
    const resizeBtn = document.getElementById('resizeImageBtn');
    if (resizeBtn) {
        console.log('Found resize button');
        resizeBtn.addEventListener('click', resizeImage);
    } else {
        console.error('Resize button not found');
    }
    
    console.log('Event listeners setup complete');
}

// Setup drag & drop functionality
function setupDragDrop() {
    if (!dragDropArea) {
        console.error('Drag & drop area not found');
        dragDropArea = document.getElementById('dragDropArea');
        if (!dragDropArea) {
            console.error('Could not find drag & drop area even with getElementById');
            return;
        }
    }
    
    if (!imageUpload) {
        console.error('Image upload element not found');
        imageUpload = document.getElementById('imageUpload');
        if (!imageUpload) {
            console.error('Could not find image upload element even with getElementById');
            return;
        }
    }
    
    console.log('Setting up drag & drop functionality');
    
    // Click to browse files
    const browseLink = dragDropArea.querySelector('.browse-link');
    if (browseLink) {
        // Remove any existing event listeners by cloning and replacing
        const newBrowseLink = browseLink.cloneNode(true);
        if (browseLink.parentNode) {
            browseLink.parentNode.replaceChild(newBrowseLink, browseLink);
        }
        
        newBrowseLink.addEventListener('click', (e) => {
            console.log('Browse link clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent the dragDropArea click event
            imageUpload.click();
        });
    } else {
        console.error('Browse link not found in drag & drop area');
    }
    
    // Remove any existing event listeners by cloning and replacing
    const newDragDropArea = dragDropArea.cloneNode(true);
    if (dragDropArea.parentNode) {
        dragDropArea.parentNode.replaceChild(newDragDropArea, dragDropArea);
    }
    dragDropArea = newDragDropArea;
    
    // Re-add browse link event listener after cloning
    const newBrowseLink = dragDropArea.querySelector('.browse-link');
    if (newBrowseLink) {
        newBrowseLink.addEventListener('click', (e) => {
            console.log('Browse link clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent the dragDropArea click event
            imageUpload.click();
        });
    }
    
    dragDropArea.addEventListener('click', () => {
        console.log('Drag & drop area clicked');
        imageUpload.click();
    });
    
    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Add active class when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            console.log('File dragged over');
            dragDropArea.classList.add('active');
        }, false);
    });
    
    // Remove active class when drag leaves
    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            console.log('File drag left or dropped');
            dragDropArea.classList.remove('active');
        }, false);
    });
    
    // Handle dropped files
    dragDropArea.addEventListener('drop', (e) => {
        console.log('File dropped');
        const files = e.dataTransfer.files;
        if (files.length) {
            // Update the file input with the dropped file
            imageUpload.files = files;
            
            // Show the user that the file was accepted
            const fileName = files[0]?.name || 'Unknown file';
            dragDropArea.innerHTML = `
                <i class='bx bx-check-circle' style="font-size: 2rem; margin-bottom: 10px; color: #28a745;"></i>
                <p>File selected: ${fileName}</p>
                <p class="small text-muted">Click here to choose a different file</p>
            `;
            
            // Process the file
            handleImageUpload({ target: { files } });
        }
    }, false);
    
    // Make sure the image upload input has its event listener
    imageUpload.addEventListener('change', handleImageUpload);
    
    console.log('Drag & drop setup complete');
}

// Handle image upload by converting to base64
function handleImageUpload(e) {
    const file = e.target?.files?.[0];
    if (!file) {
        console.error('No file selected');
        return;
    }
    
    console.log('Handling image upload:', file.name, file.type, `${(file.size / 1024).toFixed(2)} KB`);
    
    // Update the drag area to show the selected file
    if (dragDropArea) {
        const fileName = file.name;
        dragDropArea.innerHTML = `
            <i class='bx bx-check-circle' style="font-size: 2rem; margin-bottom: 10px; color: #28a745;"></i>
            <p>File selected: ${fileName}</p>
            <p class="small text-muted">Click here to choose a different file</p>
        `;
    }
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file (JPG, PNG, GIF)', 'error');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
    }
    
    // Show loading state in image preview
    if (imagePreview) {
        imagePreview.innerHTML = `
            <div style="text-align: center; color: #6c757d;">
                <div class="loading-spinner" style="margin: 20px auto;"></div>
                <p>Processing image...</p>
            </div>
        `;
    }
    
    // Convert to base64
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Store original image data for reset
            originalImageData = {
                src: e.target.result,
                width: img.width,
                height: img.height
            };
            
            console.log('Image loaded with dimensions:', img.width, 'x', img.height);
            
            // Display image and size controls
            displayImage(e.target.result, img.width, img.height);
            
            // Set image url field
            const imageUrlInput = document.getElementById('imageUrl');
            if (imageUrlInput) {
                imageUrlInput.value = e.target.result;
                console.log('Image URL set in form');
            } else {
                console.error('Image URL input not found');
            }
            
            showToast('Image uploaded successfully', 'success');
        };
        
        img.onerror = function() {
            console.error('Failed to process image');
            showToast('Failed to process image. Please try another file.', 'error');
            
            if (imagePreview) {
                imagePreview.innerHTML = `
                    <div style="text-align: center; color: #dc3545;">
                        <i class='bx bx-error-circle' style="font-size: 3rem;"></i>
                        <p>Failed to process image</p>
                    </div>
                `;
            }
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function(error) {
        console.error('Error reading file:', error);
        showToast('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Display image preview and show size controls
function displayImage(src, width, height) {
    if (!imagePreview) return;
    
    // Default dimensions if not provided
    const defaultWidth = 800;
    const defaultHeight = 450;
    
    // Create a new image element
    const img = new Image();
    
    // Set up onload handler
    img.onload = function() {
        // Use the loaded image's dimensions if width/height not provided
        const imgWidth = width || img.width || defaultWidth;
        const imgHeight = height || img.height || defaultHeight;
        
        // Set image preview
        imagePreview.innerHTML = '';
        imagePreview.appendChild(img);
        
        // Show image size controls if they exist
        if (imageSizeControls) {
            imageSizeControls.style.display = 'block';
        }
        
        // Set width and height inputs if they exist
        const imageWidthInput = document.getElementById('imageWidth');
        const imageHeightInput = document.getElementById('imageHeight');
        
        if (imageWidthInput) {
            imageWidthInput.value = imgWidth;
        }
        
        if (imageHeightInput) {
            imageHeightInput.value = imgHeight;
        }
        
        // Update original image data for reset functionality
        originalImageData = {
            src: src,
            width: imgWidth,
            height: imgHeight
        };
        
        console.log('Image displayed successfully with dimensions:', imgWidth, 'x', imgHeight);
    };
    
    // Set error handler
    img.onerror = function() {
        console.error('Failed to load image:', src);
        
        // Set fallback image
        imagePreview.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
                <i class='bx bx-image' style="font-size: 3rem;"></i>
                <p>Failed to load image</p>
            </div>
        `;
        
        // Hide size controls
        if (imageSizeControls) {
            imageSizeControls.style.display = 'none';
        }
    };
    
    // Set alt and max-height for better display
    img.alt = 'Preview';
    img.style.maxHeight = '300px';
    
    // Set the source last (this triggers the load)
    img.src = src;
}

// Resize the image
function resizeImage() {
    if (!imagePreview) return;
    
    const img = imagePreview.querySelector('img');
    if (!img) return;
    
    const imageWidthInput = document.getElementById('imageWidth');
    const imageHeightInput = document.getElementById('imageHeight');
    
    if (!imageWidthInput || !imageHeightInput) {
        showToast('Image size controls not found', 'error');
        return;
    }
    
    const width = parseInt(imageWidthInput.value);
    const height = parseInt(imageHeightInput.value);
    
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        showToast('Please enter valid dimensions', 'error');
        return;
    }
    
    // Create a canvas to resize the image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    
    // Get the resized image as a data URL
    const resizedImage = canvas.toDataURL('image/jpeg', 0.85);
    
    // Update the preview and form value
    img.src = resizedImage;
    
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        imageUrlInput.value = resizedImage;
    }
    
    showToast('Image resized successfully', 'success');
}

// Reset the image to original size
function resetImage() {
    if (!originalImageData || !imagePreview) return;
    
    // Reset the image to original
    imagePreview.innerHTML = `<img src="${originalImageData.src}" alt="Preview">`;
    
    // Reset dimension inputs
    const imageWidthInput = document.getElementById('imageWidth');
    const imageHeightInput = document.getElementById('imageHeight');
    
    if (imageWidthInput && originalImageData.width) {
        imageWidthInput.value = originalImageData.width;
    }
    
    if (imageHeightInput && originalImageData.height) {
        imageHeightInput.value = originalImageData.height;
    }
    
    // Reset the form value
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        imageUrlInput.value = originalImageData.src;
    }
    
    showToast('Image reset to original size', 'success');
}

// Show carousel modal for add/edit
function showCarouselModal(itemId = null) {
    console.log('Opening carousel modal', itemId ? 'Edit mode' : 'Add mode');
    
    if (!carouselModal) {
        console.error('Carousel modal element not found');
        alert('Error: Could not open modal. Please refresh the page and try again.');
        return;
    }
    
    if (!modalTitle) {
        console.error('Modal title element not found');
        modalTitle = document.querySelector('#carouselModal .modal-header h5');
        if (!modalTitle) {
            console.error('Could not find modal title even with querySelector');
            return;
        }
    }
    
    modalTitle.textContent = itemId ? 'Edit Carousel Item' : 'Add New Item';
    currentItemId = itemId;
    
    // Reset form
    if (carouselForm) {
        carouselForm.reset();
    } else {
        console.error('Carousel form not found');
        carouselForm = document.getElementById('carouselForm');
        if (!carouselForm) {
            console.error('Could not find carousel form even with getElementById');
            return;
        }
    }
    
    if (!imagePreview) {
        console.error('Image preview element not found');
        imagePreview = document.getElementById('imagePreview');
    }
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    if (!imageSizeControls) {
        console.error('Image size controls not found');
        imageSizeControls = document.getElementById('imageSizeControls');
    }
    
    if (imageSizeControls) {
        imageSizeControls.style.display = 'none';
    }
    
    originalImageData = null;
    
    // Reset the drag-drop area if it exists
    if (dragDropArea) {
        dragDropArea.innerHTML = `
            <i class='bx bx-cloud-upload' style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Drag & drop an image here or <span class="browse-link">browse</span></p>
            <p class="small text-muted">Max file size: 2MB | Supported formats: JPG, PNG, GIF</p>
        `;
    } else {
        console.error('Drag drop area not found');
        dragDropArea = document.getElementById('dragDropArea');
    }
    
    // Check for required form fields
    const titleInput = document.getElementById('title');
    const headingInput = document.getElementById('heading');
    const subheadingInput = document.getElementById('subheading');
    const tagsInput = document.getElementById('tags');
    const orderInput = document.getElementById('order');
    const activeInput = document.getElementById('active');
    const imageUrlInput = document.getElementById('imageUrl');
    const carouselIdInput = document.getElementById('carouselId');
    
    // Get total number of slides
    const totalSlides = carouselItems.length;
    
    // Log which elements we found
    console.log('Form elements found:', {
        titleInput: !!titleInput,
        headingInput: !!headingInput,
        subheadingInput: !!subheadingInput,
        tagsInput: !!tagsInput,
        orderInput: !!orderInput,
        activeInput: !!activeInput,
        imageUrlInput: !!imageUrlInput,
        carouselIdInput: !!carouselIdInput,
        totalSlides
    });
    
    // Set hidden ID field
    if (carouselIdInput) {
        carouselIdInput.value = itemId || '';
    }
    
    // Update the order field label to show total slides
    const orderLabel = document.querySelector('label[for="order"]');
    if (orderLabel) {
        orderLabel.textContent = `Order (0-${totalSlides}${itemId ? '' : ' - new item'})`;
    }
    
    if (itemId) {
        // Edit mode - populate form with item data
        const item = carouselItems.find(item => item._id === itemId);
        console.log('Editing item:', item);
        
        if (item) {
            if (titleInput) titleInput.value = item.title || '';
            if (headingInput) headingInput.value = item.heading || '';
            if (subheadingInput) subheadingInput.value = item.subheading || '';
            if (tagsInput) tagsInput.value = item.tags?.join(', ') || '';
            if (orderInput) orderInput.value = item.order || 0;
            if (activeInput) activeInput.checked = item.active ?? true;
            if (imageUrlInput) imageUrlInput.value = item.image || '';
            
            // Show image preview if available
            if (item.image && imagePreview) {
                displayImage(item.image, 0, 0); // Width and height will be updated when image loads
                
                // Load image to get dimensions
                const img = new Image();
                img.onload = function() {
                    if (document.getElementById('imageWidth')) {
                        document.getElementById('imageWidth').value = img.width;
                    }
                    if (document.getElementById('imageHeight')) {
                        document.getElementById('imageHeight').value = img.height;
                    }
                    
                    originalImageData = {
                        src: item.image,
                        width: img.width,
                        height: img.height
                    };
                };
                img.onerror = function() {
                    // If image fails to load, use placeholder
                    img.src = placeholderImage;
                };
                img.src = item.image;
            }
        } else {
            console.error('Item not found:', itemId);
        }
    } else {
        // Set placeholder image for new items
        if (imageUrlInput) {
            imageUrlInput.value = placeholderImage;
        }
        if (imagePreview) {
            displayImage(placeholderImage, 320, 180);
        }
        
        // For new items, suggest the last position (end of carousel)
        if (orderInput) {
            orderInput.value = totalSlides;
        }
    }
    
    // Ensure event listeners are set up for the browse link
    setupDragDrop();
    
    // Force reflow to ensure CSS transitions work
    carouselModal.offsetHeight;
    
    showModal(carouselModal);
    
    // Double check modal visibility
    setTimeout(() => {
        if (!carouselModal.classList.contains('show')) {
            console.log('Modal not showing, attempting to fix...');
            carouselModal.classList.add('show');
        }
    }, 100);
}

// Save carousel item (create or update)
async function saveCarouselItem(e) {
    if (e) e.preventDefault(); // Prevent form submission
    
    console.log('saveCarouselItem function called');
    
    try {
        // Get form elements
        const titleInput = document.getElementById('title');
        const headingInput = document.getElementById('heading');
        const subheadingInput = document.getElementById('subheading');
        const imageUrlInput = document.getElementById('imageUrl');
        const tagsInput = document.getElementById('tags');
        const orderInput = document.getElementById('order');
        const activeInput = document.getElementById('active');
        
        if (!titleInput || !headingInput || !subheadingInput) {
            console.error('Required form elements not found');
            showToast('Form elements not found. Please refresh the page.', 'error');
            return;
        }
        
        // Validate form
        const title = titleInput.value.trim();
        const heading = headingInput.value.trim();
        const subheading = subheadingInput.value.trim();
        const image = imageUrlInput?.value.trim() || placeholderImage;
        const tagsInputValue = tagsInput?.value.trim() || '';
        const order = parseInt(orderInput?.value || '0') || 0;
        const active = activeInput?.checked || false;
        
        console.log('Form values:', {
            title, heading, subheading, 
            image: image.substring(0, 30) + '...', // Don't log the entire base64 string
            tagsInputValue, order, active,
            currentItemId
        });
        
        if (!title || !heading || !subheading) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Parse tags
        const tags = tagsInputValue ? tagsInputValue.split(',').map(tag => tag.trim()) : [];
        
        // Prepare data
        const data = {
            title,
            heading,
            subheading,
            image,
            tags,
            order,
            active
        };
        
        console.log(`Preparing to ${currentItemId ? 'update' : 'create'} carousel item`);
        
        // Determine if creating or updating
        let endpoint, method;
        if (currentItemId) {
            endpoint = `/api/carousel/${currentItemId}`;
            method = 'PUT';
            console.log(`Updating carousel item ${currentItemId}`);
        } else {
            endpoint = '/api/carousel';
            method = 'POST';
            console.log('Creating new carousel item');
        }
        
        // Sanitize data to ensure clean JSON
        const sanitizedData = {
            title: data.title,
            heading: data.heading,
            subheading: data.subheading,
            image: data.image,
            tags: Array.isArray(data.tags) ? data.tags : [],
            order: typeof data.order === 'number' ? data.order : parseInt(data.order) || 0,
            active: Boolean(data.active)
        };
        
        // Log size for debugging
        const imageLength = sanitizedData.image ? sanitizedData.image.length : 0;
        console.log(`Image data length: ${imageLength} characters`);
        
        // Log all data fields except image (too large)
        console.log('Sending data:', {
            title: sanitizedData.title,
            heading: sanitizedData.heading,
            subheading: sanitizedData.subheading,
            imageLength,
            tags: sanitizedData.tags,
            order: sanitizedData.order,
            active: sanitizedData.active
        });
        
        // Save to API
        try {
            console.log(`Sending ${method} request to ${endpoint}`);
            
            // Don't stringify the data here, let the API request function handle it
            const response = await window.AdminAuth.apiRequest(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: sanitizedData // Send the object directly, not JSON string
            });
            
            console.log('API response:', response);
            
            // Hide modal and reload data
            hideModal(carouselModal);
            showToast(currentItemId ? 'Carousel item updated successfully' : 'New carousel item added successfully', 'success');
            
            // Reload carousel items
            await loadCarouselItems();
            
        } catch (apiError) {
            console.error('API Error:', apiError);
            showToast(`API Error: ${apiError.message || 'Unknown error'}`, 'error');
            throw apiError;
        }
        
    } catch (error) {
        console.error('Error saving carousel item:', error);
        showToast(`Failed to save: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Edit carousel item
function editCarouselItem(itemId) {
    if (!itemId) {
        console.error('No item ID provided for editing');
        return;
    }
    
    console.log('Editing carousel item:', itemId);
    showCarouselModal(itemId);
}

// Preview carousel item
function previewCarouselItem(itemId) {
    if (!itemId) {
        console.error('No item ID provided for preview');
        return;
    }
    
    console.log('Previewing carousel item:', itemId);
    
    const item = carouselItems.find(item => item._id === itemId);
    if (!item) {
        showToast('Item not found', 'error');
        return;
    }
    
    // Show a modal with preview
    const previewHTML = `
        <div class="carousel-preview">
            <h3>${item.title}</h3>
            <div class="preview-image">
                <img src="${item.image || placeholderImage}" alt="${item.title}" 
                     onerror="this.src='${placeholderImage}'" style="max-width: 100%;">
            </div>
            <div class="preview-content mt-3">
                <h4>${item.heading}</h4>
                <p>${item.subheading}</p>
                <p><strong>Order:</strong> ${item.order}</p>
                <p><strong>Status:</strong> ${item.active ? 'Active' : 'Inactive'}</p>
                <p><strong>Tags:</strong> ${item.tags.join(', ') || 'None'}</p>
            </div>
        </div>
    `;
    
    // Use a custom modal for preview
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title">Carousel Item Preview</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="modal-body">
            ${previewHTML}
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary close-modal">Close</button>
            <button type="button" class="btn btn-primary edit-preview" data-id="${item._id}">Edit Item</button>
        </div>
    `;
    
    // Get or create preview modal
    let previewModal = document.getElementById('previewModal');
    if (!previewModal) {
        previewModal = document.createElement('div');
        previewModal.id = 'previewModal';
        previewModal.className = 'modal fade';
        previewModal.innerHTML = '<div class="modal-dialog modal-lg"><div class="modal-content"></div></div>';
        document.body.appendChild(previewModal);
    }
    
    previewModal.querySelector('.modal-content').replaceWith(modalContent);
    
    // Add event listeners
    previewModal.querySelector('.close-modal').addEventListener('click', () => {
        hideModal(previewModal);
    });
    
    previewModal.querySelector('.edit-preview').addEventListener('click', () => {
        hideModal(previewModal);
        showCarouselModal(item._id);
    });
    
    // Show the modal
    showModal(previewModal);
}

// Show delete confirmation modal
function showDeleteConfirmation(itemId) {
    deleteItemId = itemId;
    showModal(confirmModal);
}

// Delete carousel item
async function deleteCarouselItem() {
    if (!deleteItemId) {
        console.error('No delete item ID set');
        return;
    }
    
    try {
        console.log('Deleting carousel item:', deleteItemId);
        
        const response = await window.AdminAuth.apiRequest(`/api/carousel/${deleteItemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response:', response);
        
        // Hide confirmation modal
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            hideModal(confirmModal);
        }
        
            showToast('Carousel item deleted successfully', 'success');
            
        // Reload carousel items
        await loadCarouselItems();
        
    } catch (error) {
        console.error('Error deleting carousel item:', error);
        showToast(`Failed to delete: ${error.message || 'Unknown error'}`, 'error');
    }
    
    // Reset delete item ID
    deleteItemId = null;
}

// Show reorder modal
function showReorderModal() {
    if (carouselItems.length < 2) {
        showToast('You need at least two items to reorder', 'info');
        return;
    }
    
    // Populate sortable list
    sortableItems.innerHTML = '';
    
    carouselItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'sortable-item';
        listItem.dataset.id = item._id;
        
        listItem.innerHTML = `
            <div class="handle">
                <i class='bx bx-menu'></i>
            </div>
            <div class="item-image">
                <img src="${item.image || placeholderImage}" alt="${item.title}" onerror="this.src='${placeholderImage}'">
            </div>
            <div class="item-info">
                <h5>${item.title}</h5>
                <p>${item.heading}</p>
            </div>
            <div class="item-status">
                <span class="badge ${item.active ? 'bg-success' : 'bg-secondary'}">
                    ${item.active ? 'Active' : 'Inactive'}
                </span>
            </div>
        `;
        
        sortableItems.appendChild(listItem);
    });
    
    // Initialize sortable
    if (typeof Sortable !== 'undefined') {
        new Sortable(sortableItems, {
            animation: 150,
            handle: '.handle',
            ghostClass: 'sortable-ghost',
            dragClass: 'dragging'
        });
    } else {
        console.warn('Sortable library not loaded');
    }
    
    showModal(reorderModal);
}

// Save reordered carousel items
async function saveItemsOrder() {
    try {
        if (!sortableItems) {
            console.error('Sortable items element not found');
            return;
        }
        
        // Get all items
        const itemElements = sortableItems.querySelectorAll('li');
        if (itemElements.length === 0) {
            showToast('No items to reorder', 'error');
            return;
        }
        
        // Create ordered array of item ids
        const items = Array.from(itemElements).map((element, index) => {
            return {
                id: element.getAttribute('data-id'),
                order: index
            };
        });
        
        console.log('Saving carousel order:', items);
        
        // Save to API
        try {
            const response = await window.AdminAuth.apiRequest('/api/carousel-order', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            
            console.log('Order update response:', response);
            
            // Hide modal and reload data
            const reorderModal = document.getElementById('reorderModal');
            if (reorderModal) hideModal(reorderModal);
            
            showToast('Carousel order updated successfully', 'success');
            
            // Reload carousel items
            await loadCarouselItems();
        } catch (apiError) {
            console.error('API error when saving order:', apiError);
            showToast(`API Error: ${apiError.message || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        console.error('Error saving carousel items order:', error);
        showToast(`Failed to update order: ${error.message || 'Unknown error'}`, 'error');
    }
}

// Show a modal
function showModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide a modal
function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Set message
    toastMessage.textContent = message;
    
    // Set type
    toast.className = 'toast';
    toast.classList.add(`toast-${type}`);
    
    // Set icon
    const toastIcon = toast.querySelector('.toast-icon');
    if (toastIcon) {
        toastIcon.className = 'bx toast-icon';
        
        switch (type) {
            case 'success':
                toastIcon.classList.add('bx-check-circle');
                break;
            case 'error':
                toastIcon.classList.add('bx-x-circle');
                break;
            case 'warning':
                toastIcon.classList.add('bx-error');
                break;
            default:
                toastIcon.classList.add('bx-info-circle');
        }
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Animate progress bar
    const progressBar = toast.querySelector('.toast-progress-bar');
    if (progressBar) {
        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 100);
    }
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 