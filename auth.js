// Authentication JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔍 Auth page loaded');
    
    // Check if Database class is available
    if (typeof Database === 'undefined') {
        console.error('❌ Database class is not defined. Check that database.js loaded properly.');
        alert('Database initialization failed: Database class not found. Please refresh the page.');
        return;
    }
    
    // Check if User class is available
    if (typeof User === 'undefined') {
        console.error('❌ User class is not defined. Check that app-oop-fixed.js loaded properly.');
        alert('User class not found. Please refresh the page.');
        return;
    }
    
    // Initialize database first
    try {
        await Database.init();
        console.log('✅ Database initialized in auth.js');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        alert('Database initialization failed. Please refresh the page.');
        return;
    }
    
    initializeAuth();
});

function initializeAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('regPassword');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Initialize demo users if database is empty
    initializeDemoUsers();
}

// Initialize demo users for testing
async function initializeDemoUsers() {
    try {
        const existingUsers = await Database.getAllUsers();
        
        if (existingUsers.length === 0) {
            console.log('📝 Creating demo users for testing...');
            
            const demoUsers = [
                {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'password123',
                    birthday: '1990-01-15',
                    gender: 'male'
                },
                {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane.smith@example.com',
                    password: 'password123',
                    birthday: '1992-05-22',
                    gender: 'female'
                },
                {
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    password: 'test123',
                    birthday: '1995-08-10',
                    gender: 'male'
                }
            ];
            
            for (const userData of demoUsers) {
                await User.register(userData);
            }
            
            console.log('✅ Demo users created successfully');
            console.log('📝 Available test accounts:');
            console.log('  - john.doe@example.com / password123');
            console.log('  - jane.smith@example.com / password123');
            console.log('  - test@example.com / test123');
        }
    } catch (error) {
        console.error('❌ Error creating demo users:', error);
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('🔐 Login attempt:', { email, password: '***' });
    
    // Show loading state
    const form = e.target;
    form.classList.add('loading');
    
    try {
        // Ensure database is initialized
        if (!Database.db) {
            console.log('🔄 Initializing database for login...');
            await Database.init();
        }
        
        console.log('🔍 Authenticating user...');
        // Use Database class for authentication
        const user = await User.authenticate(email, password);
        
        console.log('🔍 Authentication result:', user ? user.displayName : 'null');
        
        form.classList.remove('loading');
        
        if (user) {
            console.log('✅ User authenticated, setting as current user...');
            // Set current user
            await User.setCurrentUser(user);
            
            // Verify the user was set correctly
            const verifyUser = await User.getCurrentUser();
            console.log('✅ Verification - Current user after setting:', verifyUser ? verifyUser.displayName : 'null');
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to main page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage('Invalid email or password. Please try again.', 'error');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        form.classList.remove('loading');
        showMessage('Login failed. Please try again.', 'error');
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const password = formData.get('password');
    const birthday = formData.get('birthday');
    const gender = formData.get('gender');
    
    console.log('📝 Registration attempt:', { firstName, lastName, email, birthday, gender });
    
    // Validate form
    if (!validateRegistrationForm(firstName, lastName, email, password, birthday, gender)) {
        return;
    }
    
    // Show loading state
    const form = e.target;
    form.classList.add('loading');
    
    try {
        // Ensure database is initialized
        if (!Database.db) {
            console.log('🔄 Initializing database for registration...');
            await Database.init();
        }
        
        console.log('🔄 Calling User.register...');
        
        // Use User class for registration
        const newUser = await User.register({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            birthday: birthday,
            gender: gender
        });
        
        console.log('✅ User registered successfully:', newUser);
        
        form.classList.remove('loading');
        showMessage('Account created successfully! You can now log in.', 'success');
        
        // Redirect to login after successful registration
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        form.classList.remove('loading');
        showMessage(error.message || 'Error creating account. Please try again.', 'error');
    }
}

// Validate registration form
function validateRegistrationForm(firstName, lastName, email, password, birthday, gender) {
    // Clear previous messages
    clearMessages();
    
    let isValid = true;
    
    // Validate first name
    if (firstName.length < 2) {
        showMessage('First name must be at least 2 characters long.', 'error');
        isValid = false;
    }
    
    // Validate last name
    if (lastName.length < 2) {
        showMessage('Last name must be at least 2 characters long.', 'error');
        isValid = false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        isValid = false;
    }
    
    // Validate password
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        isValid = false;
    }
    
    // Validate birthday (must be at least 13 years old)
    const birthDate = new Date(birthday);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 13) {
        showMessage('You must be at least 13 years old to register.', 'error');
        isValid = false;
    }
    
    // Validate gender
    if (!gender) {
        showMessage('Please select your gender.', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Password strength checker
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthIndicator) {
        // Create strength indicator if it doesn't exist
        const indicator = document.createElement('div');
        indicator.id = 'passwordStrength';
        indicator.innerHTML = `
            <div class="password-strength">
                <div class="password-strength-bar" id="passwordStrengthBar"></div>
            </div>
            <div class="password-strength-text" id="passwordStrengthText"></div>
        `;
        e.target.parentNode.appendChild(indicator);
        return;
    }
    
    let strength = 0;
    let strengthLabel = '';
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    // Remove existing classes
    strengthBar.className = 'password-strength-bar';
    
    switch (strength) {
        case 0:
        case 1:
            strengthBar.classList.add('weak');
            strengthLabel = 'Weak password';
            break;
        case 2:
        case 3:
            strengthBar.classList.add('medium');
            strengthLabel = 'Medium strength';
            break;
        case 4:
            strengthBar.classList.add('strong');
            strengthLabel = 'Strong password';
            break;
    }
    
    strengthText.textContent = strengthLabel;
}

// Show message
function showMessage(message, type) {
    clearMessages();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    const form = document.querySelector('.auth-form');
    form.insertBefore(messageDiv, form.firstChild);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Clear messages
function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

// Forgot password functionality
async function handleForgotPassword() {
    const email = prompt('Enter your email address:');
    if (email) {
        try {
            const user = await Database.getUserByEmail(email);
            if (user) {
                showMessage(`Password reset link sent to ${email}`, 'success');
            } else {
                showMessage('No account found with this email address.', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showMessage('Error processing request. Please try again.', 'error');
        }
    }
}

// Social login handlers
function handleSocialLogin(provider) {
    showMessage(`${provider} login coming soon!`, 'info');
}

// Check if user is logged in
function checkAuthStatus() {
    const currentUser = localStorage.getItem('socializers_current_user');
    if (currentUser && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('socializers_current_user');
    window.location.href = 'login.html';
}

// Add forgot password handler
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleForgotPassword();
        });
    }
    
    // Check auth status
    checkAuthStatus();
});

// Form validation on input
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#fa383e';
            } else {
                this.style.borderColor = '#1c1e21';
            }
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Enter key to submit form
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const form = e.target.closest('form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});

// Auto-focus on first input
document.addEventListener('DOMContentLoaded', function() {
    const firstInput = document.querySelector('input[type="email"], input[type="text"]');
    if (firstInput) {
        firstInput.focus();
    }
});

// Remember me functionality
function toggleRememberMe() {
    const rememberCheckbox = document.getElementById('rememberMe');
    if (rememberCheckbox) {
        rememberCheckbox.addEventListener('change', function() {
            if (this.checked) {
                localStorage.setItem('socializers_remember_me', 'true');
            } else {
                localStorage.removeItem('socializers_remember_me');
            }
        });
    }
}

// Load remembered email
function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('socializers_remembered_email');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = rememberedEmail;
        }
    }
}

// Initialize remember me functionality
document.addEventListener('DOMContentLoaded', function() {
    toggleRememberMe();
    loadRememberedEmail();
});
