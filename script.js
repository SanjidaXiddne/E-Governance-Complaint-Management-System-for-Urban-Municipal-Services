// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {

    // Professional Sidebar Toggler with Animation
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggler = document.querySelector('#sidebar-toggler');

    if (sidebarToggler) {
        sidebarToggler.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('collapsed');
            
            // Add smooth transition effect
            sidebar.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    }

    // Initialize map display
    initializeMapDisplay();

    // Initialize real maps
    initializeRealMaps();

    // Check user authentication on page load
    checkUserAuthentication();

    // Initialize Bootstrap Components
    initializeBootstrapComponents();

    // Initialize Professional Features
    initializeProfessionalFeatures();

    // Initialize Charts for Admin Reporting
    initializeCharts();

    // Add fade-in animation to cards
    addFadeInAnimations();

    // Add enter key validation for login forms
    addEnterKeyValidation();
});

// Role-Based Authentication System
function checkUserAuthentication() {
    const currentPage = window.location.pathname.split('/').pop();
    const userRole = sessionStorage.getItem('userRole');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    // Allow access to login, signup, and forgot-password pages
    if (['login.html', 'signup.html', 'forgot-password.html', 'index.html', ''].includes(currentPage)) {
        return;
    }

    // Check if user is logged in
    if (!isLoggedIn || !userRole) {
        redirectToLogin('Please log in to access this page');
        return;
    }

    // Role-based page access control
    const rolePermissions = {
        'citizen': ['citizen-dashboard.html', 'citizen-new-complaint.html', 'citizen-complaint-detail.html'],
        'officer': ['officer-dashboard.html', 'officer-complaint-detail.html'],
        'supervisor': ['supervisor-dashboard.html'],
        'technician': ['technician-dashboard.html'],
        'admin': ['admin-dashboard.html', 'admin-user-management.html', 'admin-reporting.html']
    };

    // Check if current page is allowed for user's role
    if (!rolePermissions[userRole] || !rolePermissions[userRole].includes(currentPage)) {
        redirectToLogin('Access denied. You do not have permission to view this page.');
        return;
    }
}

function redirectToLogin(message) {
    if (message) {
        sessionStorage.setItem('loginMessage', message);
    }
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Login Functions for Different Roles
function loginAsCitizen() {
    // For UI demo - no validation required, just proceed to dashboard
    sessionStorage.setItem('userRole', 'citizen');
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', 'রহিম উদ্দিন');
    sessionStorage.setItem('userEmail', 'citizen@demo.com');
    
    showAlert('Login successful! Redirecting to dashboard...', 'success');
    setTimeout(() => {
        window.location.href = 'citizen-dashboard.html';
    }, 1000);
}

function loginAsOfficer() {
    // For UI demo - no validation required, just proceed to dashboard
    sessionStorage.setItem('userRole', 'officer');
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', 'অফিসার নাসির আহমেদ');
    sessionStorage.setItem('userEmail', 'officer@demo.com');
    sessionStorage.setItem('officerId', 'officer001');
    
    showAlert('Officer login successful! Redirecting to dashboard...', 'success');
    setTimeout(() => {
        window.location.href = 'officer-dashboard.html';
    }, 1000);
}

function loginAsAdmin() {
    // For UI demo - no validation required, just proceed to dashboard
    sessionStorage.setItem('userRole', 'admin');
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', 'প্রশাসক');
    sessionStorage.setItem('userEmail', 'admin@demo.com');
    
    showAlert('Admin login successful! Redirecting to dashboard...', 'success');
    setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
    }, 1000);
}

// Logout function
function logout() {
    sessionStorage.clear();
    localStorage.clear();
    showAlert('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Enhanced validation wrapper functions to prevent empty submissions
function validateAndLoginCitizen() {
    const form = document.querySelector('#citizen-tab .tab-pane');
    const emailInput = document.getElementById('citizenEmail');
    const passwordInput = document.getElementById('citizenPassword');
    
    // Reset any previous styling
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
    
    let isValid = true;
    
    // Validate email field
    if (!emailInput.value || emailInput.value.trim().length === 0) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    }
    
    // Validate password field
    if (!passwordInput.value || passwordInput.value.trim().length === 0) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // If validation passes, proceed with login
    loginAsCitizen();
}

function validateAndLoginOfficer() {
    const emailInput = document.getElementById('officerEmail');
    const passwordInput = document.getElementById('officerPassword');
    const officerIdInput = document.getElementById('officerId');
    
    // Reset any previous styling
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
    officerIdInput.classList.remove('is-invalid');
    
    let isValid = true;
    
    // Validate all required fields
    if (!emailInput.value || emailInput.value.trim().length === 0) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!passwordInput.value || passwordInput.value.trim().length === 0) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!officerIdInput.value || officerIdInput.value.trim().length === 0) {
        officerIdInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // If validation passes, proceed with login
    loginAsOfficer();
}

function validateAndLoginAdmin() {
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const codeInput = document.getElementById('adminCode');
    
    // Reset any previous styling
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
    codeInput.classList.remove('is-invalid');
    
    let isValid = true;
    
    // Validate all required fields
    if (!emailInput.value || emailInput.value.trim().length === 0) {
        emailInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!passwordInput.value || passwordInput.value.trim().length === 0) {
        passwordInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!codeInput.value || codeInput.value.trim().length === 0) {
        codeInput.classList.add('is-invalid');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // If validation passes, proceed with login
    loginAsAdmin();
}

// Add enter key validation for login forms
function addEnterKeyValidation() {
    // Citizen login form
    const citizenEmail = document.getElementById('citizenEmail');
    const citizenPassword = document.getElementById('citizenPassword');
    
    if (citizenEmail && citizenPassword) {
        [citizenEmail, citizenPassword].forEach(input => {
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    validateAndLoginCitizen();
                }
            });
        });
    }
    
    // Officer login form
    const officerEmail = document.getElementById('officerEmail');
    const officerPassword = document.getElementById('officerPassword');
    const officerId = document.getElementById('officerId');
    
    if (officerEmail && officerPassword && officerId) {
        [officerEmail, officerPassword, officerId].forEach(input => {
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    validateAndLoginOfficer();
                }
            });
        });
    }
    
    // Admin login form
    const adminEmail = document.getElementById('adminEmail');
    const adminPassword = document.getElementById('adminPassword');
    const adminCode = document.getElementById('adminCode');
    
    if (adminEmail && adminPassword && adminCode) {
        [adminEmail, adminPassword, adminCode].forEach(input => {
            input.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    validateAndLoginAdmin();
                }
            });
        });
    }
}

// Enhanced Alert System
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show custom-alert`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv) {
            alertDiv.remove();
        }
    }, 5000);
}

// Password toggle functionality
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = passwordField.nextElementSibling.querySelector('i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Initialize Bootstrap Components
function initializeBootstrapComponents() {
    // Initialize Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Professional Features
function initializeProfessionalFeatures() {
    // Real-time search functionality
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="Search"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Add search loading state
            const parent = this.closest('.input-group');
            if (parent) {
                const icon = parent.querySelector('.fa-search');
                if (icon && this.value.length > 0) {
                    icon.className = 'fas fa-spinner fa-spin';
                    setTimeout(() => {
                        icon.className = 'fas fa-search';
                    }, 1000);
                }
            }
        });
    });

    // Professional table interactions
    initializeTableFeatures();

    // Enhanced form validation
    initializeFormValidation();

    // Professional notifications
    initializeNotifications();
}

// Table Features
function initializeTableFeatures() {
    // Select all checkbox functionality
    const selectAllCheckbox = document.querySelector('#selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                updateRowSelection(checkbox.closest('tr'), this.checked);
            });
        });
    }

    // Individual row selection
    const rowCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateRowSelection(this.closest('tr'), this.checked);
        });
    });

    // Row hover effects
    const tableRows = document.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(4px)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
}

// Update row selection appearance
function updateRowSelection(row, isSelected) {
    if (isSelected) {
        row.classList.add('table-active');
        row.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
    } else {
        row.classList.remove('table-active');
        row.style.backgroundColor = '';
    }
}

// Form Validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Add custom validation styling
                const invalidInputs = form.querySelectorAll(':invalid');
                invalidInputs.forEach(input => {
                    input.classList.add('is-invalid');
                    input.addEventListener('input', function() {
                        if (this.checkValidity()) {
                            this.classList.remove('is-invalid');
                            this.classList.add('is-valid');
                        }
                    });
                });
            }
            form.classList.add('was-validated');
        });
    });
}

// Professional Notifications
function initializeNotifications() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
}

// Fade-in Animations
function addFadeInAnimations() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Chart.js Initialization for Admin Reporting Page
function initializeCharts() {
    const ctxBar = document.getElementById('complaintsByCategoryChart');
    if (ctxBar) {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Potholes', 'Waste Mgmt', 'Streetlight', 'Water Leakage', 'Parks', 'Public Nuisance'],
                datasets: [{
                    label: '# of Complaints',
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: [
                        'rgba(37, 99, 235, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(236, 72, 153, 0.8)'
                    ],
                    borderColor: [
                        'rgba(37, 99, 235, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(139, 92, 246, 1)',
                        'rgba(236, 72, 153, 1)'
                    ],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    const ctxLine = document.getElementById('complaintsOverTimeChart');
    if (ctxLine) {
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
                datasets: [{
                    label: 'Complaints Received',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: true,
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    const ctxPie = document.getElementById('complaintStatusDistributionChart');
    if (ctxPie) {
        new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Resolved', 'In Progress', 'New'],
                datasets: [{
                    label: 'Complaint Status',
                    data: [300, 50, 100],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(37, 99, 235, 0.8)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(37, 99, 235, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
}

// Password Toggle Functionality
function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordField.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Professional Loading States
function showLoading(element) {
    const originalContent = element.innerHTML;
    element.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
    element.disabled = true;
    
    return function hideLoading() {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Professional Toast Notifications
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
}

// Map Display Initialization
function initializeMapDisplay() {
    const bangladeshMap = document.getElementById('bangladesh-map');
    const mapFallback = document.querySelector('.map-fallback');
    
    if (bangladeshMap) {
        // Check if image loads successfully
        bangladeshMap.onload = function() {
            console.log('Bangladesh map loaded successfully');
            this.style.display = 'block';
            if (mapFallback) {
                mapFallback.style.display = 'none';
            }
        };
        
        bangladeshMap.onerror = function() {
            console.log('Bangladesh map failed to load, showing fallback');
            this.style.display = 'none';
            if (mapFallback) {
                mapFallback.style.display = 'flex';
            }
        };
        
        // Force check if image is already loaded (cached)
        if (bangladeshMap.complete) {
            if (bangladeshMap.naturalWidth > 0) {
                bangladeshMap.onload();
            } else {
                bangladeshMap.onerror();
            }
        }
    }
    
    // Initialize map placeholders
    const mapPlaceholders = document.querySelectorAll('#map-placeholder');
    mapPlaceholders.forEach(placeholder => {
        // Add hover effect
        placeholder.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        });
        
        placeholder.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
}

// Map interaction functions
function openMapSelector() {
    showAlert('🗺️ Interactive map integration coming soon! This will allow you to select the exact location of your complaint.', 'info');
    
    // Simulate map opening animation
    const placeholder = document.getElementById('map-placeholder');
    if (placeholder) {
        placeholder.style.transform = 'scale(0.95)';
        setTimeout(() => {
            placeholder.style.transform = 'scale(1)';
        }, 200);
    }
}

function viewOnMap() {
    showAlert('🔍 Map view feature will open the exact location with detailed markers and surrounding landmarks.', 'info');
}

function getDirections() {
    showAlert('🧭 Navigation feature will provide step-by-step directions to the complaint location.', 'info');
}

function trackComplaint() {
    showAlert('📍 Real-time complaint tracking on map will show the current status and assigned officer location.', 'info');
}

// Real Map Implementation with Leaflet
let complaintMap = null;
let selectedMarker = null;
let complaintLocationMap = null;

function initializeRealMaps() {
    // Initialize map for citizen complaint form
    if (document.getElementById('map')) {
        initializeComplaintSelectionMap();
    }
    
    // Initialize map for officer complaint detail
    if (document.getElementById('complaint-map')) {
        initializeComplaintLocationMap();
    }
}

function initializeComplaintSelectionMap() {
    // Default to Dhaka, Bangladesh
    const dhakaLat = 23.8103;
    const dhakaLng = 90.4125;
    
    complaintMap = L.map('map').setView([dhakaLat, dhakaLng], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(complaintMap);
    
    // Add click event to select location
    complaintMap.on('click', function(e) {
        selectLocationOnMap(e.latlng.lat, e.latlng.lng, 'Selected Location');
    });
    
    // Try to get user's current location on initial load
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Center map on user location
            complaintMap.setView([userLat, userLng], 15);
            
        }, function(error) {
            console.log('Geolocation error:', error);
        });
    }
}

function selectLocationOnMap(lat, lng, locationName = 'Selected Location') {
    // Remove previous marker
    if (selectedMarker) {
        complaintMap.removeLayer(selectedMarker);
    }
    
    // Add new marker
    selectedMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(complaintMap);
    
    // Store coordinates
    document.getElementById('selectedLat').value = lat;
    document.getElementById('selectedLng').value = lng;
    
    // Show selected location info
    updateSelectedLocationDisplay(lat, lng);
    
    // Show clear button
    const clearBtn = document.getElementById('clearLocationBtn');
    if (clearBtn) {
        clearBtn.style.display = 'inline-block';
    }
    
    // Reverse geocode to get address
    reverseGeocode(lat, lng);
    
    // Show confirmation popup
    selectedMarker.bindPopup(`
        <div class="text-center">
            <i class="fas fa-map-marker-alt text-danger mb-2"></i><br>
            <strong>${locationName}</strong><br>
            <small>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}</small><br>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="clearSelectedLocation()">
                <i class="fas fa-times me-1"></i>Remove
            </button>
        </div>
    `).openPopup();
    
    showAlert('📍 Location selected successfully!', 'success');
}

function useMyLocation() {
    if (navigator.geolocation) {
        // Show loading state
        const btn = event.target;
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Getting Location...';
        btn.disabled = true;
        
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Center map on user location
            complaintMap.setView([userLat, userLng], 17);
            
            // Select this location
            selectLocationOnMap(userLat, userLng, 'My Current Location');
            
            // Restore button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            
            showAlert('📍 Your current location has been selected!', 'success');
            
        }, function(error) {
            // Restore button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            
            let errorMessage = 'Could not get your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Location access was denied. Please allow location access and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
                    break;
            }
            showAlert(errorMessage, 'error');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
    } else {
        showAlert('Geolocation is not supported by this browser.', 'error');
    }
}

function clearSelectedLocation() {
    // Remove marker from map
    if (selectedMarker) {
        complaintMap.removeLayer(selectedMarker);
        selectedMarker = null;
    }
    
    // Clear form fields
    document.getElementById('selectedLat').value = '';
    document.getElementById('selectedLng').value = '';
    document.getElementById('selectedAddress').value = '';
    
    // Hide location info and clear button
    const locationInfo = document.getElementById('selectedLocationInfo');
    const clearBtn = document.getElementById('clearLocationBtn');
    
    if (locationInfo) {
        locationInfo.style.display = 'none';
    }
    
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    
    showAlert('📍 Location selection cleared', 'info');
}

function updateSelectedLocationDisplay(lat, lng) {
    const locationInfo = document.getElementById('selectedLocationInfo');
    const locationText = document.getElementById('selectedLocationText');
    
    if (locationInfo && locationText) {
        locationText.innerHTML = `
            <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
            <span id="addressText"><i class="fas fa-spinner fa-spin"></i> Getting address...</span>
        `;
        locationInfo.style.display = 'block';
    }
}

function initializeComplaintLocationMap() {
    // Sample complaint location (near central library in Dhaka)
    const complaintLat = 23.7285;
    const complaintLng = 90.3842;
    
    complaintLocationMap = L.map('complaint-map').setView([complaintLat, complaintLng], 16);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(complaintLocationMap);
    
    // Add complaint location marker
    const complaintMarker = L.marker([complaintLat, complaintLng], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(complaintLocationMap);
    
    complaintMarker.bindPopup(`
        <div class="text-center">
            <i class="fas fa-exclamation-triangle text-warning mb-2"></i><br>
            <strong>Complaint Location</strong><br>
            <small>Near Central Library</small><br>
            <small class="text-muted">Lat: ${complaintLat}<br>Lng: ${complaintLng}</small>
        </div>
    `).openPopup();
}

function reverseGeocode(lat, lng) {
    // Simple reverse geocoding using Nominatim (OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.display_name) {
                document.getElementById('selectedAddress').value = data.display_name;
                
                // Update display
                const addressText = document.getElementById('addressText');
                if (addressText) {
                    addressText.innerHTML = `<strong>Address:</strong> ${data.display_name}`;
                }
            }
        })
        .catch(error => {
            console.log('Reverse geocoding error:', error);
            const addressText = document.getElementById('addressText');
            if (addressText) {
                addressText.innerHTML = '<strong>Address:</strong> Unable to get address';
            }
        });
}

function centerOnComplaint() {
    if (complaintLocationMap) {
        const complaintLat = 23.7285;
        const complaintLng = 90.3842;
        complaintLocationMap.setView([complaintLat, complaintLng], 18);
        showAlert('🎯 Centered on complaint location', 'success');
    }
}

function getDirectionsToComplaint() {
    const complaintLat = 23.7285;
    const complaintLng = 90.3842;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Open directions in external map application
            const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userLat}%2C${userLng}%3B${complaintLat}%2C${complaintLng}`;
            window.open(directionsUrl, '_blank');
        }, function(error) {
            // Fallback: open map centered on complaint location
            const fallbackUrl = `https://www.openstreetmap.org/?mlat=${complaintLat}&mlon=${complaintLng}&zoom=16`;
            window.open(fallbackUrl, '_blank');
            showAlert('Could not get your location. Opening complaint location instead.', 'info');
        });
    } else {
        const fallbackUrl = `https://www.openstreetmap.org/?mlat=${complaintLat}&mlon=${complaintLng}&zoom=16`;
        window.open(fallbackUrl, '_blank');
        showAlert('Geolocation not supported. Opening complaint location instead.', 'info');
    }
}

// User Management Functions
function editUser(userId) {
    showAlert(`📝 Edit user ${userId} functionality will be implemented soon!`, 'info');
}

function deleteUser(userId, userName) {
    if (confirm(`⚠️ Are you sure you want to delete the account for "${userName}"?\n\nThis action cannot be undone.`)) {
        // Simulate account deletion
        showAlert(`🗑️ Account for "${userName}" has been deleted successfully.`, 'success');
        
        // Here you would typically make an API call to delete the user
        // For demo purposes, we'll just show a confirmation
        console.log(`Deleting user: ${userId} - ${userName}`);
    }
}

function activateUser(userId) {
    if (confirm(`✅ Are you sure you want to activate this suspended account?`)) {
        showAlert(`✅ User account ${userId} has been activated successfully.`, 'success');
        
        // Here you would typically make an API call to activate the user
        console.log(`Activating user: ${userId}`);
    }
}
