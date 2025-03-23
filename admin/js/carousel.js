/**
 * Carousel Management Script
 * Handles CRUD operations for carousel items
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (window.AdminAuth) {
        window.AdminAuth.checkAuth();
    } else {
        console.error('Auth utilities not found!');
        window.location.href = '/admin/login.html';
        return;
    }

    // Initialize UI elements
    initializeSidebar();
    setupUserInfo();
    
    // Load carousel items
    fetchCarouselItems();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    // Sidebar toggler
    const sidebarToggler = document.querySelector('.sidebar-toggler');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Store user preference
            const isSidebarCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar_collapsed', isSidebarCollapsed);
        });
    }
    
    // Check saved state
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Handle submenu toggles
    const submenuToggles = document.querySelectorAll('.menu-item.has-submenu > a');
    
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.parentElement;
            parent.classList.toggle('open');
        });
    });
    
    // Set active menu item based on current page
    setActiveMenuItem();
}

/**
 * Set up user info in sidebar
 */
function setupUserInfo() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    
    const currentUser = window.AdminAuth.getCurrentUser();
    if (currentUser) {
        const userName = userInfo.querySelector('h5');
        const userRole = userInfo.querySelector('p');
        
        if (userName) {
            userName.textContent = currentUser.name || currentUser.username;
        }
        
        if (userRole) {
            userRole.textContent = currentUser.role || 'Administrator';
        }
    }
}

/**
 * Set active menu item based on current URL
 */
function setActiveMenuItem() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link && link.getAttribute('href')) {
            const linkPath = link.getAttribute('href');
            if (currentPath.endsWith(linkPath)) {
                item.classList.add('active');
                
                // If in submenu, open parent
                const parentSubmenu = item.closest('.submenu');
                if (parentSubmenu) {
                    const parentItem = parentSubmenu.closest('.menu-item');
                    if (parentItem) {
                        parentItem.classList.add('open');
                    }
                }
            } else {
                item.classList.remove('active');
            }
        }
    });
}

/**
 * Setup all event listeners for carousel management
 */
function setupEventListeners() {
    // Add new carousel item button
    const addBtn = document.getElementById('addCarouselBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    // Save button in modal
    const saveBtn = document.getElementById('saveCarouselBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCarouselItem);
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Image upload preview
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Confirm delete button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCarouselItem);
    }
}

/**
 * Fetch all carousel items from the API
 */
async function fetchCarouselItems() {
    const tableBody = document.querySelector('#carouselItemsTable tbody');
    if (!tableBody) return;
    
    try {
        // Show loading state
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="loading-spinner" style="margin: 20px auto;"></div>
                    <p>Loading carousel items...</p>
                </td>
            </tr>
        `;
        
        // Fetch carousel items
        const response = await window.AdminAuth.apiRequest('/carousel/all');
        const carouselItems = response.data || [];
        
        // If no carousel items
        if (!carouselItems || carouselItems.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <p>No carousel items found. Add your first item.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Render carousel items
        tableBody.innerHTML = '';
        
        carouselItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Create status badge
            const statusBadge = item.active
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-secondary">Inactive</span>';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="table-image">
                        <img src="${item.image}" alt="${item.title}">
                    </div>
                </td>
                <td>${item.title}</td>
                <td>${item.heading}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-primary edit-btn" data-id="${item._id}">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${item._id}">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners for edit and delete buttons
        addTableButtonListeners();
        
    } catch (error) {
        console.error('Error fetching carousel items:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="alert alert-danger">
                        <p>Error loading carousel items: ${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Add event listeners to table buttons
 */
function addTableButtonListeners() {
    // Edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openEditModal(id);
        });
    });
    
    // Delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            openDeleteConfirmation(id);
        });
    });
}

/**
 * Open modal for adding a new carousel item
 */
function openAddModal() {
    // Reset form
    document.getElementById('carouselForm').reset();
    document.getElementById('carouselId').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    
    // Set modal title
    document.getElementById('modalTitle').textContent = 'Add Carousel Item';
    
    // Open modal
    document.getElementById('carouselModal').classList.add('show');
}

/**
 * Open modal for editing a carousel item
 */
async function openEditModal(id) {
    try {
        // Fetch carousel item details
        const response = await window.AdminAuth.apiRequest(`/carousel/${id}`);
        const item = response.data;
        
        if (!item) {
            showToast('Item not found', 'error');
            return;
        }
        
        // Fill form with item details
        document.getElementById('carouselId').value = item._id;
        document.getElementById('title').value = item.title || '';
        document.getElementById('heading').value = item.heading || '';
        document.getElementById('subheading').value = item.subheading || '';
        document.getElementById('imageUrl').value = item.image || '';
        document.getElementById('order').value = item.order || 0;
        document.getElementById('active').checked = item.active !== false;
        
        // Handle tags
        if (item.tags && Array.isArray(item.tags)) {
            document.getElementById('tags').value = item.tags.join(', ');
        } else {
            document.getElementById('tags').value = '';
        }
        
        // Show image preview
        const previewContainer = document.getElementById('imagePreview');
        if (item.image) {
            previewContainer.innerHTML = `
                <img src="${item.image}" alt="Preview" style="max-width: 100%; max-height: 150px;">
            `;
        } else {
            previewContainer.innerHTML = '';
        }
        
        // Set modal title
        document.getElementById('modalTitle').textContent = 'Edit Carousel Item';
        
        // Open modal
        document.getElementById('carouselModal').classList.add('show');
        
    } catch (error) {
        console.error('Error fetching carousel item:', error);
        showToast('Failed to load item details', 'error');
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteConfirmation(id) {
    // Store ID in the confirm delete button
    document.getElementById('confirmDeleteBtn').setAttribute('data-id', id);
    
    // Show confirmation modal
    document.getElementById('confirmModal').classList.add('show');
}

/**
 * Close any open modal
 */
function closeModal() {
    document.getElementById('carouselModal').classList.remove('show');
    document.getElementById('confirmModal').classList.remove('show');
}

/**
 * Handle image upload and preview
 */
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(event) {
        const previewContainer = document.getElementById('imagePreview');
        previewContainer.innerHTML = `
            <img src="${event.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px;">
        `;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Save carousel item (create new or update existing)
 */
async function saveCarouselItem() {
    try {
        // Validate form
        const form = document.getElementById('carouselForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Gather form data
        const id = document.getElementById('carouselId').value;
        
        const itemData = {
            title: document.getElementById('title').value,
            heading: document.getElementById('heading').value,
            subheading: document.getElementById('subheading').value,
            image: document.getElementById('imageUrl').value,
            order: document.getElementById('order').value || undefined,
            active: document.getElementById('active').checked
        };
        
        // Handle tags
        const tagsInput = document.getElementById('tags').value;
        if (tagsInput) {
            itemData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        } else {
            itemData.tags = [];
        }
        
        // Handle image upload if present
        const imageFile = document.getElementById('imageUpload').files[0];
        if (imageFile) {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', imageFile);
            
            // Upload the image first
            const uploadResponse = await window.AdminAuth.apiRequest('/upload', {
                method: 'POST',
                body: formData,
                headers: {} // Let the browser set content-type with boundary
            });
            
            if (uploadResponse.success && uploadResponse.fileUrl) {
                itemData.image = uploadResponse.fileUrl;
            } else {
                throw new Error('Failed to upload image');
            }
        }
        
        let response;
        
        // Create new or update existing
        if (id) {
            // Update existing
            response = await window.AdminAuth.apiRequest(`/carousel/${id}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
            
            if (response.success) {
                showToast('Carousel item updated successfully', 'success');
            }
        } else {
            // Create new
            response = await window.AdminAuth.apiRequest('/carousel', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
            
            if (response.success) {
                showToast('Carousel item created successfully', 'success');
            }
        }
        
        // Close modal and refresh list
        closeModal();
        fetchCarouselItems();
        
    } catch (error) {
        console.error('Error saving carousel item:', error);
        showToast(`Failed to save: ${error.message}`, 'error');
    }
}

/**
 * Delete a carousel item
 */
async function deleteCarouselItem() {
    const id = this.getAttribute('data-id');
    
    try {
        const response = await window.AdminAuth.apiRequest(`/carousel/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('Carousel item deleted successfully', 'success');
            
            // Close modal and refresh list
            closeModal();
            fetchCarouselItems();
        } else {
            throw new Error(response.message || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting carousel item:', error);
        showToast(`Failed to delete: ${error.message}`, 'error');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Create toast element if not exists
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.classList.add('toast-container');
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
} 