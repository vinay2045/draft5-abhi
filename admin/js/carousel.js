/**
 * Carousel Management Script
 * Handles CRUD operations for carousel items directly with base64 encoded images
 */

// DOM elements
const carouselItemsTable = document.getElementById('carouselItemsTable');
const carouselForm = document.getElementById('carouselForm');
const carouselModal = document.getElementById('carouselModal');
const reorderModal = document.getElementById('reorderModal');
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const saveCarouselBtn = document.getElementById('saveCarouselBtn');
const addCarouselBtn = document.getElementById('addCarouselBtn');
const reorderBtn = document.getElementById('reorderBtn');
const saveOrderBtn = document.getElementById('saveOrderBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const sortableItems = document.getElementById('sortableItems');
const dragDropArea = document.getElementById('dragDropArea');
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const imageSizeControls = document.getElementById('imageSizeControls');

// Global variables
let carouselItems = [];
let currentItemId = null;
let originalImageData = null;
let deleteItemId = null;

// Base64 encoded placeholder image for when images are missing
const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgUGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load carousel items
    loadCarouselItems();
    
    // Add event listeners
    addEventListeners();
    
    // Setup drag & drop for image upload
    setupDragDrop();
});

// Load carousel items from API
async function loadCarouselItems() {
    try {
        showTableLoading();
        
        const response = await apiRequest('/carousel/all', 'GET');
        carouselItems = response || [];
        
        renderCarouselItemsTable();
    } catch (error) {
        console.error('Error loading carousel items:', error);
        showToast('Failed to load carousel items', 'error');
        renderEmptyTable('Failed to load carousel items. Please try again.');
    }
}

// Render carousel items table
function renderCarouselItemsTable() {
    if (!carouselItemsTable) return;
    
    if (carouselItems.length === 0) {
        renderEmptyTable('No carousel items found. Add your first carousel item by clicking the "Add New Item" button.');
        return;
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

// Add event listeners
function addEventListeners() {
    // Add new item button
    if (addCarouselBtn) {
        addCarouselBtn.addEventListener('click', () => showCarouselModal());
    }
    
    // Save carousel item button
    if (saveCarouselBtn) {
        saveCarouselBtn.addEventListener('click', saveCarouselItem);
    }
    
    // Reorder button
    if (reorderBtn) {
        reorderBtn.addEventListener('click', showReorderModal);
    }
    
    // Save order button
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveItemsOrder);
    }
    
    // Confirm delete button
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCarouselItem);
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            hideModal(carouselModal);
            hideModal(reorderModal);
            hideModal(confirmModal);
        });
    });
    
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
    
    // Image resize buttons
    if (document.getElementById('resizeImageBtn')) {
        document.getElementById('resizeImageBtn').addEventListener('click', resizeImage);
    }
    
    if (document.getElementById('resetImageBtn')) {
        document.getElementById('resetImageBtn').addEventListener('click', resetImage);
    }
}

// Setup drag & drop functionality
function setupDragDrop() {
    if (!dragDropArea || !imageUpload) return;
    
    // Click to browse files
    dragDropArea.addEventListener('click', () => {
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
            dragDropArea.classList.add('active');
        }, false);
    });
    
    // Remove active class when drag leaves
    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            dragDropArea.classList.remove('active');
        }, false);
    });
    
    // Handle dropped files
    dragDropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            imageUpload.files = files;
            handleImageUpload({ target: { files } });
        }
    }, false);
}

// Handle image upload by converting to base64
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should be less than 2MB', 'error');
        return;
    }
    
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
            
            // Display image and size controls
            displayImage(e.target.result, img.width, img.height);
            
            // Set image url field
            document.getElementById('imageUrl').value = e.target.result;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Display image preview and show size controls
function displayImage(src, width, height) {
    if (!imagePreview || !imageSizeControls) return;
    
    // Display image
    imagePreview.innerHTML = `<img src="${src}" alt="Preview">`;
    
    // Show image size controls
    imageSizeControls.style.display = 'block';
    
    // Set width and height inputs
    document.getElementById('imageWidth').value = width;
    document.getElementById('imageHeight').value = height;
}

// Resize the image
function resizeImage() {
    if (!imagePreview) return;
    
    const img = imagePreview.querySelector('img');
    if (!img) return;
    
    const width = parseInt(document.getElementById('imageWidth').value);
    const height = parseInt(document.getElementById('imageHeight').value);
    
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
    document.getElementById('imageUrl').value = resizedImage;
    
    showToast('Image resized successfully', 'success');
}

// Reset the image to original size
function resetImage() {
    if (!originalImageData || !imagePreview) return;
    
    // Reset the image to original
    imagePreview.innerHTML = `<img src="${originalImageData.src}" alt="Preview">`;
    
    // Reset dimension inputs
    document.getElementById('imageWidth').value = originalImageData.width;
    document.getElementById('imageHeight').value = originalImageData.height;
    
    // Reset the form value
    document.getElementById('imageUrl').value = originalImageData.src;
    
    showToast('Image reset to original size', 'success');
}

// Show carousel modal for add/edit
function showCarouselModal(itemId = null) {
    modalTitle.textContent = itemId ? 'Edit Carousel Item' : 'Add New Item';
    currentItemId = itemId;
    
    // Reset form
    carouselForm.reset();
    imagePreview.innerHTML = '';
    imageSizeControls.style.display = 'none';
    originalImageData = null;
    
    // Hidden fields
    document.getElementById('carouselId').value = itemId || '';
    
    if (itemId) {
        // Edit mode - populate form with item data
        const item = carouselItems.find(item => item._id === itemId);
        if (item) {
            document.getElementById('title').value = item.title || '';
            document.getElementById('heading').value = item.heading || '';
            document.getElementById('subheading').value = item.subheading || '';
            document.getElementById('tags').value = item.tags?.join(', ') || '';
            document.getElementById('order').value = item.order || 0;
            document.getElementById('active').checked = item.active ?? true;
            document.getElementById('imageUrl').value = item.image || '';
            
            // Show image preview if available
            if (item.image) {
                displayImage(item.image, 0, 0); // Width and height will be updated when image loads
                
                // Load image to get dimensions
                const img = new Image();
                img.onload = function() {
                    document.getElementById('imageWidth').value = img.width;
                    document.getElementById('imageHeight').value = img.height;
                    
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
        }
    } else {
        // Set placeholder image for new items
        document.getElementById('imageUrl').value = placeholderImage;
        displayImage(placeholderImage, 320, 180);
    }
    
    showModal(carouselModal);
}

// Save carousel item (create or update)
async function saveCarouselItem() {
    try {
        // Validate form
        const title = document.getElementById('title').value.trim();
        const heading = document.getElementById('heading').value.trim();
        const subheading = document.getElementById('subheading').value.trim();
        const image = document.getElementById('imageUrl').value.trim() || placeholderImage;
        const tagsInput = document.getElementById('tags').value.trim();
        const order = parseInt(document.getElementById('order').value) || 0;
        const active = document.getElementById('active').checked;
        
        if (!title || !heading || !subheading) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        // Parse tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
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
        
        // Determine if creating or updating
        const method = currentItemId ? 'PUT' : 'POST';
        const endpoint = currentItemId 
            ? `/carousel/${currentItemId}` 
            : '/carousel';
        
        // Save to API
        const response = await apiRequest(endpoint, method, data);
        
        // Hide modal and reload data
        hideModal(carouselModal);
        showToast(currentItemId ? 'Carousel item updated successfully' : 'New carousel item added successfully', 'success');
        
        // Reload carousel items
        await loadCarouselItems();
        
    } catch (error) {
        console.error('Error saving carousel item:', error);
        showToast('Failed to save carousel item', 'error');
    }
}

// Edit carousel item
function editCarouselItem(itemId) {
    showCarouselModal(itemId);
}

// Preview carousel item
function previewCarouselItem(itemId) {
    const item = carouselItems.find(item => item._id === itemId);
    if (!item) return;
    
    // Open preview in new tab/window
    window.open('/', '_blank');
}

// Show delete confirmation modal
function showDeleteConfirmation(itemId) {
    deleteItemId = itemId;
    showModal(confirmModal);
}

// Delete carousel item
async function deleteCarouselItem() {
    if (!deleteItemId) return;
    
    try {
        await apiRequest(`/carousel/${deleteItemId}`, 'DELETE');
        
        hideModal(confirmModal);
        showToast('Carousel item deleted successfully', 'success');
        
        // Reload carousel items
        await loadCarouselItems();
        
    } catch (error) {
        console.error('Error deleting carousel item:', error);
        showToast('Failed to delete carousel item', 'error');
    }
    
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

// Save items order
async function saveItemsOrder() {
    try {
        const listItems = sortableItems.querySelectorAll('.sortable-item');
        
        if (listItems.length === 0) {
            showToast('No items to reorder', 'error');
            return;
        }
        
        // Get ordered item IDs
        const items = Array.from(listItems).map((item, index) => {
            return {
                id: item.dataset.id,
                order: index
            };
        });
        
        // Send to API
        await apiRequest('/carousel/order/update', 'PUT', { items });
        
        hideModal(reorderModal);
        showToast('Carousel items reordered successfully', 'success');
        
        // Reload carousel items
        await loadCarouselItems();
        
    } catch (error) {
        console.error('Error reordering items:', error);
        showToast('Failed to save new order', 'error');
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