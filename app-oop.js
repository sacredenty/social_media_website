/**
 * Social Media App - OOP Implementation
 * Refactored for better maintainability and organization
 */

// ============================================================================
// STORAGE CLASS - Handles all localStorage operations
// ============================================================================
class Storage {
    static KEYS = {
        USERS: 'socializers_users',
        CURRENT_USER: 'socializers_current_user',
        USER_POSTS: 'socializers_user_posts',
        SHARED_POSTS: 'socializers_shared_posts'
    };

    static get(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Error getting ${key} from storage:`, error);
            return null;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in storage:`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from storage:`, error);
            return false;
        }
    }

    static clear() {
        try {
            Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}

// ============================================================================
// USER CLASS - Handles user operations and data
// ============================================================================
class User {
    constructor(userData) {
        this.id = userData.id;
        this.firstName = userData.firstName;
        this.lastName = userData.lastName;
        this.email = userData.email;
        this.password = userData.password;
        this.birthday = userData.birthday;
        this.gender = userData.gender;
        this.avatar = userData.avatar;
        this.createdAt = userData.createdAt || new Date().toISOString();
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    get displayName() {
        return this.fullName;
    }

    static getCurrentUser() {
        const userData = Storage.get(Storage.KEYS.CURRENT_USER);
        return userData ? new User(userData) : null;
    }

    static setCurrentUser(user) {
        return Storage.set(Storage.KEYS.CURRENT_USER, user);
    }

    static logout() {
        return Storage.remove(Storage.KEYS.CURRENT_USER);
    }

    static authenticate(email, password) {
        const users = Storage.get(Storage.KEYS.USERS) || [];
        return users.find(user => user.email === email && user.password === password);
    }

    static register(userData) {
        const users = Storage.get(Storage.KEYS.USERS) || [];
        
        // Check if user already exists
        if (users.some(user => user.email === userData.email)) {
            throw new Error('User with this email already exists');
        }

        const newUser = new User({
            ...userData,
            id: users.length + 1,
            avatar: `https://picsum.photos/seed/user${users.length + 1}/100/100`
        });

        users.push(newUser);
        Storage.set(Storage.KEYS.USERS, users);
        return newUser;
    }

    static initializeDemoUsers() {
        const existingUsers = Storage.get(Storage.KEYS.USERS);
        if (!existingUsers || existingUsers.length === 0) {
            const demoUsers = [
                new User({
                    id: 1,
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'password123',
                    birthday: '1990-01-15',
                    gender: 'male',
                    avatar: 'https://picsum.photos/seed/user1/100/100'
                }),
                new User({
                    id: 2,
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane.smith@example.com',
                    password: 'password123',
                    birthday: '1992-05-22',
                    gender: 'female',
                    avatar: 'https://picsum.photos/seed/user2/100/100'
                })
            ];
            Storage.set(Storage.KEYS.USERS, demoUsers);
        }
    }
}

// ============================================================================
// POST CLASS - Handles post operations and data
// ============================================================================
class Post {
    constructor(postData) {
        this.id = postData.id || Date.now();
        this.author = postData.author;
        this.avatar = postData.avatar;
        this.content = postData.content;
        this.image = postData.image || null;
        this.likes = postData.likes || 0;
        this.comments = postData.comments || 0;
        this.shares = postData.shares || 0;
        this.time = postData.time || 'Just now';
        this.liked = postData.liked || false;
        this.shared = postData.shared || false;
    }

    like() {
        this.liked = !this.liked;
        this.likes += this.liked ? 1 : -1;
        return this.liked;
    }

    comment() {
        this.comments++;
        return this.comments;
    }

    share() {
        this.shares++;
        this.shared = true;
        return this.shares;
    }

    static getAllPosts() {
        const userPosts = Storage.get(Storage.KEYS.USER_POSTS) || [];
        const defaultPosts = [
            new Post({
                id: 1,
                author: 'Jane Smith',
                avatar: 'https://picsum.photos/seed/user2/50/50',
                content: 'Just had an amazing day at the beach! The weather was perfect and the sunset was breathtaking. 🌅',
                image: 'https://picsum.photos/seed/beach/600/400',
                likes: 124,
                comments: 23,
                shares: 5,
                time: '2 hours ago'
            }),
            new Post({
                id: 2,
                author: 'Mike Johnson',
                avatar: 'https://picsum.photos/seed/user3/50/50',
                content: 'Excited to announce that I just started my new job as a Software Engineer at TechCorp! 🚀',
                likes: 89,
                comments: 15,
                shares: 3,
                time: '5 hours ago'
            })
        ];

        // Merge user posts with default posts
        const allPosts = [...userPosts, ...defaultPosts];
        return allPosts.map(post => new Post(post));
    }

    static savePost(postData) {
        const posts = Storage.get(Storage.KEYS.USER_POSTS) || [];
        const newPost = new Post(postData);
        posts.unshift(newPost);
        Storage.set(Storage.KEYS.USER_POSTS, posts);
        return newPost;
    }

    static saveAllPosts(posts) {
        Storage.set(Storage.KEYS.USER_POSTS, posts);
    }
}

// ============================================================================
// SHARED POST CLASS - Handles shared post operations
// ============================================================================
class SharedPost {
    constructor(sharedPostData) {
        this.id = sharedPostData.id || Date.now();
        this.originalPostId = sharedPostData.originalPostId;
        this.sharedBy = sharedPostData.sharedBy;
        this.sharedByAvatar = sharedPostData.sharedByAvatar;
        this.originalAuthor = sharedPostData.originalAuthor;
        this.originalAvatar = sharedPostData.originalAvatar;
        this.originalContent = sharedPostData.originalContent;
        this.originalImage = sharedPostData.originalImage;
        this.originalTime = sharedPostData.originalTime;
        this.shareComment = sharedPostData.shareComment;
        this.shareTime = sharedPostData.shareTime || 'Just now';
        this.likes = sharedPostData.likes || 0;
        this.comments = sharedPostData.comments || 0;
        this.shares = sharedPostData.shares || 0;
        this.liked = sharedPostData.liked || false;
    }

    static getAllSharedPosts() {
        return Storage.get(Storage.KEYS.SHARED_POSTS) || [];
    }

    static saveSharedPost(sharedPostData) {
        const sharedPosts = Storage.get(Storage.KEYS.SHARED_POSTS) || [];
        const newSharedPost = new SharedPost(sharedPostData);
        sharedPosts.unshift(newSharedPost);
        Storage.set(Storage.KEYS.SHARED_POSTS, sharedPosts);
        return newSharedPost;
    }

    static getAll() {
        const sharedPosts = Storage.get(Storage.KEYS.SHARED_POSTS) || [];
        return sharedPosts.map(post => new SharedPost(post));
    }
}

// ============================================================================
// UI CLASS - Handles DOM operations and user interface
// ============================================================================
class UI {
    static elements = {};

    static initializeElements() {
        this.elements = {
            postInput: document.querySelector('.post-input'),
            postOptions: document.querySelectorAll('.post-option'),
            actionButtons: document.querySelectorAll('.action-btn'),
            addFriendButtons: document.querySelectorAll('.add-friend-btn'),
            navLinks: document.querySelectorAll('.nav-link'),
            menuItems: document.querySelectorAll('.menu-item'),
            postsFeed: document.querySelector('.posts-feed'),
            navProfileImg: document.querySelector('.nav-profile img'),
            navProfileName: document.querySelector('.nav-profile span'),
            postProfileImg: document.querySelector('.post-profile-img'),
            profileCardImg: document.querySelector('.profile-card-img'),
            profileCardName: document.querySelector('.profile-card h3')
        };
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `${type}-notification`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: ${type === 'error' ? '#fa383e' : type === 'success' ? '#28a745' : '#333'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 300px;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    static showModal(title, content, onConfirm = null, confirmText = 'Confirm') {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background-color: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">${title}</h2>
                <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${onConfirm ? `
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button class="modal-cancel" style="padding: 10px 20px; border: 1px solid #dddfe2; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="modal-confirm" style="padding: 10px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer;">${confirmText}</button>
                </div>
            ` : ''}
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Event listeners
        const closeBtn = modalContent.querySelector('.modal-close');
        const cancelBtn = modalContent.querySelector('.modal-cancel');
        const confirmBtn = modalContent.querySelector('.modal-confirm');

        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };

        closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if (confirmBtn && onConfirm) {
            confirmBtn.addEventListener('click', () => {
                onConfirm();
                closeModal();
            });
        }

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        return modalOverlay;
    }

    static updateProfileUI(user) {
        if (this.elements.navProfileImg) this.elements.navProfileImg.src = user.avatar;
        if (this.elements.navProfileName) this.elements.navProfileName.textContent = user.displayName;
        if (this.elements.postProfileImg) this.elements.postProfileImg.src = user.avatar;
        if (this.elements.profileCardImg) this.elements.profileCardImg.src = user.avatar;
        if (this.elements.profileCardName) this.elements.profileCardName.textContent = user.displayName;
        if (this.elements.postInput) {
            this.elements.postInput.placeholder = `What's on your mind, ${user.firstName}?`;
        }
    }

    static renderPost(post, container) {
        const postElement = document.createElement('article');
        postElement.className = 'post';
        if (post.originalPostId) {
            postElement.className += ' shared-post';
        }
        postElement.dataset.postId = post.id;

        if (post.originalPostId) {
            postElement.innerHTML = this.renderSharedPostHTML(post);
        } else {
            postElement.innerHTML = this.renderOriginalPostHTML(post);
        }

        container.appendChild(postElement);
    }

    static renderOriginalPostHTML(post) {
        return `
            <div class="post-header">
                <img src="${post.avatar}" alt="Profile" class="post-author-img">
                <div class="post-author-info">
                    <h4>${post.author}</h4>
                    <p>${post.time} • <i class="fas fa-globe"></i></p>
                </div>
                <button class="post-menu"><i class="fas fa-ellipsis-h"></i></button>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
                ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            </div>
            <div class="post-stats">
                <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                <span><i class="fas fa-comment"></i> ${post.comments}</span>
                <span><i class="fas fa-share"></i> ${post.shares}</span>
            </div>
            <div class="post-actions">
                <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="app.handleLike(this)">
                    <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like
                </button>
                <button class="action-btn" onclick="app.handleComment(this.closest('.post'))">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-btn" onclick="app.handleShare(this.closest('.post'))">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        `;
    }

    static renderSharedPostHTML(post) {
        return `
            <div class="post-header">
                <img src="${post.sharedByAvatar}" alt="Profile" class="post-author-img">
                <div class="post-author-info">
                    <h4>${post.sharedBy}</h4>
                    <p>${post.shareTime} • <i class="fas fa-share"></i> Shared a post</p>
                </div>
                <button class="post-menu"><i class="fas fa-ellipsis-h"></i></button>
            </div>
            
            ${post.shareComment ? `<div class="share-comment"><p>${post.shareComment}</p></div>` : ''}
            
            <div class="shared-content">
                <div class="shared-post-header">
                    <img src="${post.originalAvatar}" alt="Profile" class="post-author-img">
                    <div class="post-author-info">
                        <h4>${post.originalAuthor}</h4>
                        <p>${post.originalTime} • <i class="fas fa-globe"></i></p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.originalContent}</p>
                    ${post.originalImage ? `<img src="${post.originalImage}" alt="Post image" class="post-image">` : ''}
                </div>
            </div>
            
            <div class="post-stats">
                <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                <span><i class="fas fa-comment"></i> ${post.comments}</span>
                <span><i class="fas fa-share"></i> ${post.shares}</span>
            </div>
            <div class="post-actions">
                <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="app.handleLike(this)">
                    <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like
                </button>
                <button class="action-btn" onclick="app.handleComment(this.closest('.post'))">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-btn" onclick="app.handleShare(this.closest('.post'))">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        `;
    }
}

// ============================================================================
// SOCIAL MEDIA APP CLASS - Main application controller
// ============================================================================
class SocialMediaApp {
    constructor() {
        this.currentUser = null;
        this.posts = [];
        this.sharedPosts = [];
        this.init();
    }

    async init() {
        try {
            // Initialize demo users
            User.initializeDemoUsers();
            
            // Load current user
            this.currentUser = User.getCurrentUser();
            
            if (!this.currentUser) {
                console.warn('No user logged in');
                return;
            }

            // Initialize UI elements
            UI.initializeElements();
            
            // Load data
            this.loadPosts();
            
            // Update UI
            this.updateUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Social Media App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            UI.showNotification('Error initializing application', 'error');
        }
    }

    loadPosts() {
        this.posts = Post.getAllPosts();
        this.sharedPosts = SharedPost.getAll();
    }

    updateUI() {
        UI.updateProfileUI(this.currentUser);
        this.renderPosts();
    }

    setupEventListeners() {
        const { postInput, postOptions, actionButtons, addFriendButtons, navLinks, menuItems } = UI.elements;

        // Post input click
        if (postInput) {
            postInput.addEventListener('click', () => this.showCreatePostModal());
            postInput.addEventListener('focus', function() {
                this.placeholder = "Share your thoughts with the world...";
            });
        }

        // Post options
        postOptions.forEach(option => {
            option.addEventListener('click', (e) => this.handlePostOption(e));
        });

        // Action buttons
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAction(e));
        });

        // Add friend buttons
        addFriendButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleAddFriend(e));
        });

        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Menu items
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleMenuNavigation(e));
        });
    }

    renderPosts() {
        const { postsFeed } = UI.elements;
        if (!postsFeed) return;

        postsFeed.innerHTML = '';

        // Combine and sort posts
        const allPosts = [...this.sharedPosts, ...this.posts];
        this.sortPosts(allPosts);

        // Render each post
        allPosts.forEach(post => {
            UI.renderPost(post, postsFeed);
        });
    }

    sortPosts(posts) {
        posts.sort((a, b) => {
            // User posts come first
            const aIsUserPost = a.author === this.currentUser.displayName && !a.originalPostId;
            const bIsUserPost = b.author === this.currentUser.displayName && !b.originalPostId;
            
            if (aIsUserPost && !bIsUserPost) return -1;
            if (!aIsUserPost && bIsUserPost) return 1;
            
            // Shared posts come next
            const aIsShared = !!a.originalPostId;
            const bIsShared = !!b.originalPostId;
            
            if (aIsShared && !bIsShared) return -1;
            if (!aIsShared && bIsShared) return 1;
            
            // For same type, sort by time
            if (a.time === 'Just now' && b.time !== 'Just now') return -1;
            if (a.time !== 'Just now' && b.time === 'Just now') return 1;
            
            return 0;
        });
    }

    showCreatePostModal() {
        const content = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <img src="${this.currentUser.avatar}" alt="${this.currentUser.displayName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                <div>
                    <strong>${this.currentUser.displayName}</strong>
                    <p style="margin: 0; color: #65676b; font-size: 14px;">
                        <i class="fas fa-globe"></i> Public
                    </p>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <textarea id="postContent" placeholder="What's on your mind, ${this.currentUser.firstName}?" style="width: 100%; min-height: 120px; padding: 15px; border: none; outline: none; font-size: 16px; resize: vertical; font-family: inherit;"></textarea>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 10px;">
                    <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;">
                        <i class="fas fa-image" style="color: #42b72a;"></i>
                    </button>
                    <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;">
                        <i class="fas fa-user-tag" style="color: #1877f2;"></i>
                    </button>
                    <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;">
                        <i class="fas fa-smile" style="color: #f0b429;"></i>
                    </button>
                    <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;">
                        <i class="fas fa-map-marker-alt" style="color: #f5533d;"></i>
                    </button>
                </div>
            </div>
        `;

        UI.showModal('Create Post', content, () => this.createPost(), 'Post');
    }

    createPost() {
        const content = document.getElementById('postContent').value.trim();
        
        if (!content) {
            UI.showNotification('Please write something before posting!', 'error');
            return;
        }

        const newPost = Post.savePost({
            author: this.currentUser.displayName,
            avatar: this.currentUser.avatar,
            content: content
        });

        this.loadPosts();
        this.renderPosts();
        UI.showNotification('Post published successfully!', 'success');
    }

    handleLike(button) {
        const post = button.closest('.post');
        const icon = button.querySelector('i');
        const statsContainer = post.querySelector('.post-stats');
        const likesSpan = statsContainer.querySelector('span');
        
        if (icon.classList.contains('fas')) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.style.color = '#65676b';
            this.updateLikesCount(likesSpan, -1);
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.style.color = '#1877f2';
            this.updateLikesCount(likesSpan, 1);
            
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
        }
    }

    updateLikesCount(likesSpan, change) {
        const currentText = likesSpan.textContent;
        const currentCount = parseInt(currentText.match(/\d+/)[0]);
        const newCount = Math.max(0, currentCount + change);
        likesSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${newCount}`;
    }

    handleComment(post) {
        // Implementation for comment functionality
        UI.showNotification('Comment feature coming soon!', 'info');
    }

    handleShare(post) {
        const postId = parseInt(post.dataset.postId);
        const originalPost = this.posts.find(p => p.id === postId);
        
        if (!originalPost) {
            UI.showNotification('Post not found', 'error');
            return;
        }
        
        if (originalPost.shared) {
            UI.showNotification('You have already shared this post!', 'error');
            return;
        }

        this.showShareModal(originalPost);
    }

    showShareModal(post) {
        const content = `
            <div style="border: 1px solid #e4e6eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <img src="${post.avatar}" alt="${post.author}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                    <div>
                        <strong>${post.author}</strong>
                        <p style="margin: 0; color: #65676b; font-size: 12px;">${post.time}</p>
                    </div>
                </div>
                <p style="margin: 10px 0;">${post.content}</p>
                ${post.image ? `<img src="${post.image}" alt="Post image" style="width: 100%; border-radius: 8px;">` : ''}
            </div>
            
            <div style="margin-bottom: 15px;">
                <textarea id="shareComment" placeholder="Say something about this..." style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #dddfe2; border-radius: 8px; resize: vertical; outline: none;"></textarea>
            </div>
        `;

        UI.showModal('Share Post', content, () => this.confirmShare(post), 'Share Post');
    }

    confirmShare(post) {
        const shareComment = document.getElementById('shareComment').value.trim();
        
        const sharedPost = SharedPost.saveSharedPost({
            originalPostId: post.id,
            sharedBy: this.currentUser.displayName,
            sharedByAvatar: this.currentUser.avatar,
            originalAuthor: post.author,
            originalAvatar: post.avatar,
            originalContent: post.content,
            originalImage: post.image,
            originalTime: post.time,
            shareComment: shareComment
        });

        // Update original post
        post.share();
        Post.saveAllPosts(this.posts);

        this.loadPosts();
        this.renderPosts();
        UI.showNotification('Post shared successfully!', 'success');
    }

    handlePostOption(e) {
        const option = e.currentTarget;
        const optionText = option.textContent.trim();
        
        const messages = {
            'Live Video': 'Live video feature coming soon!',
            'Photo/Video': 'Photo upload feature coming soon!',
            'Feeling/Activity': 'Feeling feature coming soon!'
        };
        
        UI.showNotification(messages[optionText] || 'Feature coming soon!', 'info');
    }

    handleAction(e) {
        const button = e.currentTarget;
        const action = button.textContent.trim();
        const post = button.closest('.post');
        
        switch (action) {
            case 'Like':
                this.handleLike(button);
                break;
            case 'Comment':
                this.handleComment(post);
                break;
            case 'Share':
                this.handleShare(post);
                break;
        }
    }

    handleAddFriend(e) {
        const button = e.currentTarget;
        
        if (button.textContent === 'Add Friend') {
            button.textContent = 'Friend Request Sent';
            button.style.backgroundColor = '#e4e6eb';
            button.style.color = '#1c1e21';
            UI.showNotification('Friend request sent!');
        } else if (button.textContent === 'Friend Request Sent') {
            button.textContent = 'Cancel Request';
        } else if (button.textContent === 'Cancel Request') {
            button.textContent = 'Add Friend';
            button.style.backgroundColor = '#1877f2';
            button.style.color = 'white';
            UI.showNotification('Friend request cancelled');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const link = e.currentTarget;
        
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const iconClass = link.querySelector('i').className;
        
        const navigation = {
            'fa-home': () => window.location.href = 'index.html',
            'fa-user-friends': () => UI.showNotification('Friends page coming soon!'),
            'fa-bell': () => UI.showNotification('Notifications coming soon!'),
            'fa-envelope': () => UI.showNotification('Messages coming soon!')
        };
        
        for (const [icon, action] of Object.entries(navigation)) {
            if (iconClass.includes(icon)) {
                action();
                break;
            }
        }
    }

    handleMenuNavigation(e) {
        e.preventDefault();
        const item = e.currentTarget;
        
        // Remove active class from all items
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const itemText = item.textContent.trim();
        
        const navigation = {
            'Home': () => window.location.href = 'index.html',
            'Profile': () => window.location.href = 'profile.html',
            'Friends': () => UI.showNotification('Friends page coming soon!'),
            'Photos': () => UI.showNotification('Photos page coming soon!'),
            'Videos': () => UI.showNotification('Videos page coming soon!'),
            'Events': () => UI.showNotification('Events page coming soon!'),
            'Games': () => UI.showNotification('Games page coming soon!')
        };
        
        navigation[itemText] || UI.showNotification(`Loading ${itemText} page`);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            User.logout();
            window.location.href = 'login.html';
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
let app;

document.addEventListener('DOMContentLoaded', function() {
    app = new SocialMediaApp();
});

// Global functions for inline event handlers
function showProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function logout() {
    if (app) app.logout();
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    const profileMenu = document.getElementById('profileMenu');
    const navProfile = document.querySelector('.nav-profile');
    
    if (profileMenu && navProfile && !navProfile.contains(e.target)) {
        profileMenu.style.display = 'none';
    }
});
