// ============================================================================
// STORAGE CLASS - Handles all localStorage operations
// ============================================================================
class Storage {
    static KEYS = {
        USERS: 'socializers_users',
        CURRENT_USER: 'socializers_current_user',
        USER_POSTS: 'socializers_user_posts',
        SHARED_POSTS: 'socializers_shared_posts',
        COMMENTS: 'socializers_comments'
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
// USER CLASS - Handles user data and authentication with SQL Database
// ============================================================================
class User {
    constructor(userData) {
        this.id = userData.id || Date.now();
        this.firstName = userData.firstName || '';
        this.lastName = userData.lastName || '';
        this.email = userData.email || '';
        this.password = userData.password || '';
        this.birthday = userData.birthday || '';
        this.gender = userData.gender || '';
        this.avatar = userData.avatar || `https://picsum.photos/seed/user${this.id}/50/50`;
        this.createdAt = userData.createdAt || new Date().toISOString();
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    get displayName() {
        return this.fullName || this.email.split('@')[0];
    }

    static async getCurrentUser() {
        try {
            const users = await Database.getAllUsers();
            const currentUserId = localStorage.getItem('socializers_current_user_id');
            
            if (!currentUserId) return null;
            
            return users.find(user => user.id === parseInt(currentUserId));
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            return null;
        }
    }

    static async setCurrentUser(user) {
        try {
            localStorage.setItem('socializers_current_user_id', user.id.toString());
            console.log('✅ User set as current:', user.displayName);
        } catch (error) {
            console.error('❌ Error setting current user:', error);
        }
    }

    static async logout() {
        console.log('🚪 User.logout() called');
        
        try {
            // Clear current session from localStorage
            localStorage.removeItem('socializers_current_user_id');
            console.log('✅ User session cleared from localStorage');
            
            // Clear database (removes all data including demo accounts)
            await Database.clearAll();
            console.log('✅ All database data cleared');
            
            // Reinitialize database for fresh start
            await Database.init();
            console.log('✅ Database reinitialized');
            
            // Reinitialize demo users (will create fresh demo accounts)
            await User.initializeDemoUsers();
            console.log('✅ Demo users reinitialized');
            
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    }

    static async clearAllData() {
        try {
            console.log('🧹 Clearing all application data...');
            
            // Check if Database is available before using it
            if (typeof Database !== 'undefined') {
                // Clear database
                await Database.clearAll();
            } else {
                console.warn('⚠️ Database class not available, skipping database clear');
            }
            
            // Clear localStorage
            localStorage.clear();
            
            // Clear any app state
            if (window.app) {
                window.app.currentUser = null;
                window.app.posts = [];
                window.app.sharedPosts = [];
            }
            
            console.log('✅ All data cleared successfully');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
        }
    }

    static async authenticate(email, password) {
        try {
            const user = await Database.getUserByEmail(email);
            return user && user.password === password ? user : null;
        } catch (error) {
            console.error('❌ Error during authentication:', error);
            return null;
        }
    }

    static async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await Database.getUserByEmail(userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            
            const newUser = new User(userData);
            await Database.addUser(newUser);
            return newUser;
        } catch (error) {
            console.error('❌ Error during registration:', error);
            throw error;
        }
    }

    static async initializeDemoUsers() {
        try {
            const existingUsers = await Database.getAllUsers();
            if (existingUsers && existingUsers.length > 0) {
                console.log('📝 Users already exist in database, skipping demo initialization');
                console.log(`✅ Found ${existingUsers.length} existing users`);
                return;
            }
            
            console.log('ℹ️ No users found - creating demo users for testing');
            
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
                await this.register(userData);
            }
            
            console.log('✅ Demo users created successfully');
            console.log('📝 Available test accounts:');
            console.log('  - john.doe@example.com / password123');
            console.log('  - jane.smith@example.com / password123');
            console.log('  - test@example.com / test123');
        } catch (error) {
            console.error('❌ Error checking/creating demo users:', error);
        }
    }

    static async restartApp() {
        try {
            console.log('🔄 Restarting application...');
            
            // Clear all data
            await User.clearAllData();
            
            // Reinitialize database
            await Database.init();
            
            // Reinitialize app
            await this.init();
            
            console.log('✅ Application restarted successfully');
            
        } catch (error) {
            console.error('❌ Error restarting app:', error);
        }
    }
}

// ============================================================================
// POST CLASS - Handles post operations with SQL Database
// ============================================================================
class Post {
    constructor(postData) {
        this.id = postData.id || Date.now();
        this.author = postData.author || 'Anonymous';
        this.avatar = postData.avatar || 'https://picsum.photos/seed/anonymous/50/50';
        this.content = postData.content || '';
        this.image = postData.image || '';
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
        return this.shares;
    }

    static async getAllPosts() {
        try {
            return await Database.getAllPosts();
        } catch (error) {
            console.error('❌ Error getting posts:', error);
            return [];
        }
    }

    static async savePost(postData) {
        try {
            const newPost = new Post(postData);
            await Database.addPost(newPost);
            console.log('✅ Post saved to database:', newPost.id);
            return newPost;
        } catch (error) {
            console.error('❌ Error saving post:', error);
            throw error;
        }
    }

    static async saveAllPosts(posts) {
        try {
            for (const post of posts) {
                await Database.updatePost(post);
            }
            console.log('✅ All posts saved to database');
        } catch (error) {
            console.error('❌ Error saving posts:', error);
        }
    }

    static async getUserPosts(author) {
        try {
            return await Database.getUserPosts(author);
        } catch (error) {
            console.error('❌ Error getting user posts:', error);
            return [];
        }
    }
}

// ============================================================================
// SHARED POST CLASS - Handles shared post operations
// ============================================================================
class SharedPost {
    constructor(sharedPostData) {
        this.id = sharedPostData.id || Date.now();
        this.sharedBy = sharedPostData.sharedBy || 'Anonymous';
        this.sharedByAvatar = sharedPostData.sharedByAvatar || 'https://picsum.photos/seed/anonymous/50/50';
        this.shareComment = sharedPostData.shareComment || '';
        this.originalPostId = sharedPostData.originalPostId;
        this.originalAuthor = sharedPostData.originalAuthor || 'Anonymous';
        this.originalAvatar = sharedPostData.originalAvatar || 'https://picsum.photos/seed/anonymous/50/50';
        this.originalContent = sharedPostData.originalContent || '';
        this.originalImage = sharedPostData.originalImage || '';
        this.originalTime = sharedPostData.originalTime || 'Just now';
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
// COMMENT CLASS - Handles comment operations with SQL Database
// ============================================================================
class Comment {
    constructor(commentData) {
        this.id = commentData.id || Date.now();
        this.postId = commentData.postId;
        this.author = commentData.author;
        this.authorAvatar = commentData.authorAvatar;
        this.content = commentData.content;
        this.parentId = commentData.parentId || null;
        this.likes = commentData.likes || 0;
        this.time = commentData.time || 'Just now';
        this.liked = commentData.liked || false;
        this.replies = commentData.replies || [];
    }

    like() {
        this.liked = !this.liked;
        this.likes += this.liked ? 1 : -1;
        return this.liked;
    }

    addReply(reply) {
        this.replies.push(reply);
        return this.replies;
    }

    static async getAllComments() {
        try {
            return await Database.getAllComments();
        } catch (error) {
            console.error('❌ Error getting comments:', error);
            return [];
        }
    }

    static async getCommentsByPostId(postId) {
        try {
            const comments = await Database.getCommentsByPostId(postId);
            return comments.map(comment => new Comment(comment));
        } catch (error) {
            console.error('❌ Error getting comments by post ID:', error);
            return [];
        }
    }

    static async saveComment(commentData) {
        try {
            const newComment = new Comment(commentData);
            await Database.addComment(newComment);
            console.log('✅ Comment saved to database:', newComment.id);
            return newComment;
        } catch (error) {
            console.error('❌ Error saving comment:', error);
            throw error;
        }
    }

    static async saveAllComments(comments) {
        try {
            for (const comment of comments) {
                await Database.updateComment(comment);
            }
            console.log('✅ All comments saved to database');
        } catch (error) {
            console.error('❌ Error saving comments:', error);
        }
    }

    static async getThreadedComments(postId) {
        try {
            const comments = await this.getCommentsByPostId(postId);
            const threaded = [];
            const commentMap = new Map();

            // First pass: create map of all comments
            comments.forEach(comment => {
                commentMap.set(comment.id, { ...comment, replies: [] });
            });

            // Second pass: build thread structure
            comments.forEach(comment => {
                if (comment.parentId) {
                    const parent = commentMap.get(comment.parentId);
                    if (parent) {
                        parent.replies.push(commentMap.get(comment.id));
                    }
                } else {
                    threaded.push(commentMap.get(comment.id));
                }
            });

            return threaded;
        } catch (error) {
            console.error('❌ Error getting threaded comments:', error);
            return [];
        }
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
            navProfileImg: document.querySelector('.nav-profile img'),
            navProfileName: document.querySelector('.nav-profile span'),
            postProfileImg: document.querySelector('.post-profile-img'),
            profileCardImg: document.querySelector('.profile-card-img'),
            profileCardName: document.querySelector('.profile-card h3')
        };
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
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
            ${onConfirm ? 
                `<div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button class="modal-cancel" style="padding: 10px 20px; border: 1px solid #dddfe2; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="modal-confirm" style="padding: 10px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer;">${confirmText}</button>
                </div>` 
            : ''}
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

        // Return modal for focus handling
        return modalOverlay;
    }

    static updateProfileUI(user) {
        if (!user) {
            console.warn('updateProfileUI called with null user');
            return;
        }
        
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
                <button class="action-btn" onclick="app.handleComment(${post.id})">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-btn" onclick="app.handleShare(this.closest('.post'))">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
            <div class="comments-section" style="display: none;">
                <div class="comments-list"></div>
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
                <button class="action-btn" onclick="app.handleComment(${post.id})">
                    <i class="fas fa-comment"></i> Comment
                </button>
                <button class="action-btn" onclick="app.handleShare(this.closest('.post'))">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
            <div class="comments-section" style="display: none;">
                <div class="comments-list"></div>
            </div>
        `;
    }

    static renderComments(postId, container) {
        console.log('renderComments called for postId:', postId);
        console.log('Container:', container);
        
        const comments = Comment.getThreadedComments(postId);
        console.log('Comments found:', comments);
        
        if (comments.length === 0) {
            container.innerHTML = `
                <p style="color: #65676b; font-size: 14px;">No comments yet. Be the first to comment!</p>
            `;
            console.log('No comments found, showing placeholder');
            return;
        }

        console.log('Rendering comments...');
        container.innerHTML = '';
        comments.forEach(comment => {
            console.log('Rendering comment:', comment);
            this.renderComment(comment, container, 0);
        });
        
        console.log('Comments rendered successfully');
    }

    static renderComment(comment, container, level = 0) {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            ${level > 0 ? `margin-left: ${level * 40}px;` : ''}
        `;

        commentElement.innerHTML = `
            <img src="${comment.authorAvatar}" alt="${comment.author}" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;">
            <div style="flex: 1;">
                <div style="background-color: #f0f2f5; padding: 8px 12px; border-radius: 18px;">
                    <strong style="color: #385898;">${comment.author}</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px; line-height: 1.4;">${comment.content}</p>
                </div>
                <div style="font-size: 12px; color: #65676b; margin-top: 4px; display: flex; align-items: center; gap: 15px;">
                    <span>${comment.time}</span>
                    <button class="comment-like-btn" onclick="app.handleCommentLike(${comment.id}, this)" style="background: none; border: none; color: #65676b; cursor: pointer; font-size: 12px;">
                        <i class="${comment.liked ? 'fas' : 'far'} fa-thumbs-up"></i> ${comment.likes > 0 ? comment.likes : 'Like'}
                    </button>
                    <button class="comment-reply-btn" onclick="app.showCommentReplyModal(${comment.id}, '${comment.author.replace(/'/g, "\\'")}', this)" style="background: none; border: none; color: #65676b; cursor: pointer; font-size: 12px;">
                        Reply
                    </button>
                </div>
            </div>
        `;

        container.appendChild(commentElement);

        // Render replies
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
                this.renderComment(reply, container, level + 1);
            });
        }
    }

    static showCommentModal(postId, postAuthor) {
        console.log('showCommentModal called with postId:', postId);
        
        // Create modal with simpler approach
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

        // Create title
        const title = document.createElement('h2');
        title.textContent = 'Write a Comment';
        title.style.cssText = 'margin: 0 0 20px 0;';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background: none; border: none; font-size: 24px; cursor: pointer; position: absolute; top: 15px; right: 15px;';

        // Create textarea
        const textarea = document.createElement('textarea');
        textarea.id = 'commentContent';
        textarea.placeholder = 'Write a comment...';
        textarea.style.cssText = `
            width: 100%;
            min-height: 80px;
            padding: 10px;
            border: 1px solid #dddfe2;
            border-radius: 8px;
            resize: vertical;
            outline: none;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.4;
            box-sizing: border-box;
        `;

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = 'padding: 10px 20px; border: 1px solid #dddfe2; background: white; border-radius: 6px; cursor: pointer;';

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Post Comment';
        confirmBtn.style.cssText = 'padding: 10px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer;';

        // Assemble modal
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(textarea);
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Focus on textarea immediately
        setTimeout(() => {
            textarea.focus();
            textarea.select();
            console.log('Textarea focused and selected');
        }, 50);

        // Event listeners
        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            this.submitComment(postId);
            closeModal();
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Prevent default form submission
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.submitComment(postId);
                closeModal();
            }
        });

        console.log('Modal created and attached to DOM');
    }

    static async submitComment(postId) {
        const content = document.getElementById('commentContent').value.trim();
        
        if (!content) {
            this.showNotification('Please write a comment before posting!', 'error');
            return;
        }

        const currentUser = await User.getCurrentUser();
        if (!currentUser) return;

        try {
            const newComment = await Comment.saveComment({
                postId: postId,
                author: currentUser.displayName,
                authorAvatar: currentUser.avatar,
                content: content
            });

            // Update post comment count
            const posts = await Post.getAllPosts();
            const post = posts.find(p => p.id === postId);
            if (post) {
                post.comment();
                await Post.saveAllPosts(posts);
            }

            this.showNotification('Comment posted successfully!', 'success');
            
            // Refresh comments
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                const commentsSection = postElement.querySelector('.comments-section');
                if (commentsSection) {
                    const commentsList = commentsSection.querySelector('.comments-list');
                    if (commentsList) {
                        await this.renderComments(postId, commentsList);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error submitting comment:', error);
            this.showNotification('Error posting comment', 'error');
        }
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
    }

    async init() {
        try {
            console.log('🚀 Initializing SocialMediaApp...');
            
            // Check if Database is available
            if (typeof Database === 'undefined') {
                console.error('❌ Database class is not available');
                throw new Error('Database class not available');
            }
            
            // Initialize database if not already initialized
            if (!Database.db) {
                await Database.init();
                console.log('✅ Database initialized in SocialMediaApp');
            }
            
            // Initialize demo users only if no users exist
            await User.initializeDemoUsers();
            
            // Load current user
            this.currentUser = await User.getCurrentUser();
            if (this.currentUser) {
                console.log('✅ Current user loaded:', this.currentUser.displayName);
            } else {
                console.log('ℹ️ No current user - showing login state');
            }
            
            // Initialize UI elements
            UI.initializeElements();
            
            // Load posts
            await this.loadPosts();
            
            // Update UI with current user
            if (this.currentUser) {
                UI.updateProfileUI(this.currentUser);
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ SocialMediaApp initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing SocialMediaApp:', error);
            UI.showNotification('Error initializing application', 'error');
        }
    }

    async initializeMainApp() {
        try {
            // Initialize UI elements
            UI.initializeElements();
            
            // Load data (should be empty)
            await this.loadPosts();
            
            // Update UI with current user
            UI.updateProfileUI(this.currentUser);
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ SocialMediaApp initialized successfully');
            console.log('📝 Available commands:');
            console.log('  - window.app.handleComment(postId)');
            console.log('  - window.app.UI.renderComments(postId, container)');
            console.log('  - window.restartApp() - Restart application');
            
        } catch (error) {
            console.error('❌ Error initializing SocialMediaApp:', error);
            UI.showNotification('Error initializing application', 'error');
        }
    }

    async loadPosts() {
        try {
            this.posts = await Post.getAllPosts();
            this.sharedPosts = await SharedPost.getAll();
            console.log('✅ Posts loaded:', this.posts.length, 'Shared posts:', this.sharedPosts.length);
        } catch (error) {
            console.error('❌ Error loading posts:', error);
            this.posts = [];
            this.sharedPosts = [];
        }
    }

    setupEventListeners() {
        const { postInput, postOptions, actionButtons, addFriendButtons, navLinks, menuItems } = UI.elements;
        
        // Post input click to open creation modal
        if (postInput) {
            postInput.addEventListener('click', () => {
                this.showCreatePostModal();
            });
        }
        
        // Post options
        postOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.handlePostOption(e);
            });
        });
        
        // Action buttons (like, comment, share)
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleAction(e);
            });
        });
        
        // Add friend buttons
        addFriendButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleAddFriend(e);
            });
        });
        
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavigation(e);
            });
        });
        
        // Menu items
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuNavigation(e);
            });
        });
    }

    renderPosts() {
        const postsContainer = document.querySelector('.posts-container');
        if (!postsContainer) return;

        postsContainer.innerHTML = '';

        // Combine and sort posts
        const allPosts = [...this.posts, ...this.sharedPosts];
        const sortedPosts = this.sortPosts(allPosts);

        sortedPosts.forEach(post => {
            UI.renderPost(post, postsContainer);
        });
    }

    sortPosts(posts) {
        return posts.sort((a, b) => {
            // Current user's posts come first
            const aIsCurrentUser = a.author === this.currentUser.displayName;
            const bIsCurrentUser = b.author === this.currentUser.displayName;
            
            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (!aIsCurrentUser && bIsCurrentUser) return 1;
            
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
        `;

        UI.showModal('Create Post', content, () => {
            this.createPost();
        }, 'Post');
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

        UI.showNotification('Post published successfully!', 'success');
        this.loadPosts();
        this.renderPosts();
    }

    handleLike(button) {
        const post = button.closest('.post');
        const postId = parseInt(post.dataset.postId);
        const currentPost = this.posts.find(p => p.id === postId);
        
        if (currentPost) {
            const liked = currentPost.like();
            Post.saveAllPosts(this.posts);
            
            // Update button UI
            const icon = button.querySelector('i');
            if (liked) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                button.style.color = '#1877f2';
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                button.style.color = '#65676b';
            }
            
            // Update stats
            const statsContainer = post.querySelector('.post-stats');
            const likesSpan = statsContainer.querySelector('span');
            if (likesSpan) {
                likesSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${currentPost.likes}`;
            }
        }
    }

    handleComment(postId) {
        console.log('handleComment called with postId:', postId);
        
        // Find the post element
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (!postElement) {
            console.error('Post element not found for postId:', postId);
            return;
        }
        
        console.log('Post element found:', postElement);
        
        // Toggle comments section
        let commentsSection = postElement.querySelector('.comments-section');
        console.log('Comments section found:', commentsSection);
        
        if (!commentsSection) {
            console.error('Comments section not found in post element');
            return;
        }
        
        console.log('Current display style:', commentsSection.style.display);
        
        if (commentsSection.style.display === 'none' || commentsSection.style.display === '') {
            console.log('Showing comments section');
            commentsSection.style.display = 'block';
            const commentsList = commentsSection.querySelector('.comments-list');
            console.log('Comments list found:', commentsList);
            
            if (commentsList) {
                UI.renderComments(postId, commentsList);
            } else {
                console.error('Comments list not found');
            }
        } else {
            console.log('Hiding comments section');
            commentsSection.style.display = 'none';
        }
    }

    handleCommentLike(commentId, button) {
        const allComments = Comment.getAllComments();
        const comment = allComments.find(c => c.id === commentId);
        
        if (!comment) return;

        const liked = comment.like();
        Comment.saveAllComments(allComments);

        // Update button UI
        const icon = button.querySelector('i');
        if (liked) {
            icon.classList.remove('far');
            icon.classList.add('fas');
            button.innerHTML = `<i class="fas fa-thumbs-up"></i> ${comment.likes}`;
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
            button.innerHTML = `<i class="far fa-thumbs-up"></i> ${comment.likes}`;
        }
    }

    showCommentReplyModal(parentId, parentAuthor, button) {
        UI.showCommentReplyModal(parentId, parentAuthor, button);
    }

    handleShare(post) {
        const postId = parseInt(post.dataset.postId);
        const originalPost = this.posts.find(p => p.id === postId);
        
        if (!originalPost) {
            UI.showNotification('Post not found', 'error');
            return;
        }

        const content = `
            <div style="margin-bottom: 15px;">
                <textarea id="shareComment" placeholder="Share your thoughts..." style="width: 100%; min-height: 80px; padding: 10px; border: 1px solid #dddfe2; border-radius: 8px; resize: vertical; outline: none; font-family: inherit;"></textarea>
            </div>
        `;

        UI.showModal('Share Post', content, () => {
            this.confirmShare(originalPost);
        }, 'Share Post');
    }

    confirmShare(originalPost) {
        const shareComment = document.getElementById('shareComment').value.trim();
        
        const newSharedPost = SharedPost.saveSharedPost({
            sharedBy: this.currentUser.displayName,
            sharedByAvatar: this.currentUser.avatar,
            shareComment: shareComment,
            originalPostId: originalPost.id,
            originalAuthor: originalPost.author,
            originalAvatar: originalPost.avatar,
            originalContent: originalPost.content,
            originalImage: originalPost.image,
            originalTime: originalPost.time
        });

        // Increment original post share count
        originalPost.share();
        Post.saveAllPosts(this.posts);

        UI.showNotification('Post shared successfully!', 'success');
        this.loadPosts();
        this.renderPosts();
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
                this.handleComment(post.dataset.postId);
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
            UI.showNotification('Friend request cancelled!');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const link = e.currentTarget;
        
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const iconClass = link.querySelector('i').className;
        
        const navActions = {
            'fa-home': () => {
                this.renderPosts();
            },
            'fa-user-friends': () => UI.showNotification('Friends page coming soon!'),
            'fa-bell': () => UI.showNotification('Notifications coming soon!'),
            'fa-envelope': () => UI.showNotification('Messages coming soon!')
        };
        
        for (const [icon, action] of Object.entries(navActions)) {
            if (iconClass.includes(icon)) {
                action();
                break;
            }
        }
        
        if (!Object.keys(navActions).find(key => iconClass.includes(key))) {
            UI.showNotification(`Navigating to ${iconClass} section`);
        }
    }

    handleMenuNavigation(e) {
        e.preventDefault();
        const item = e.currentTarget;
        
        // Remove active class from all items
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const itemText = item.textContent.trim();
        
        const menuActions = {
            'Home': () => {
                this.renderPosts();
            },
            'Profile': () => window.location.href = 'profile.html',
            'Friends': () => UI.showNotification('Friends page coming soon!'),
            'Photos': () => UI.showNotification('Photos page coming soon!'),
            'Videos': () => UI.showNotification('Videos page coming soon!'),
            'Events': () => UI.showNotification('Events page coming soon!'),
            'Games': () => UI.showNotification('Games page coming soon!')
        };
        
        if (menuActions[itemText]) {
            menuActions[itemText]();
        } else {
            UI.showNotification(`Loading ${itemText} page`);
        }
    }

    logout() {
        console.log('🚪 Logout method called');
        
        if (confirm('Are you sure you want to logout?')) {
            console.log('✅ User confirmed logout');
            
            try {
                User.logout();
                console.log('✅ User logged out from storage');
                
                // Clear any app state
                this.currentUser = null;
                this.posts = [];
                this.sharedPosts = [];
                
                console.log('✅ Redirecting to login page');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('❌ Error during logout:', error);
                alert('Error during logout. Please try again.');
            }
        } else {
            console.log('❌ User cancelled logout');
        }
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
// Add global debug function
window.testClick = () => {
    console.log('🧪 Test click function called');
    console.log('Active element:', document.activeElement);
    console.log('Clicks should work now');
    
    // Test if we can click on body
    document.body.addEventListener('click', (e) => {
        console.log('✅ Body clicked at:', e.target);
        console.log('Event type:', e.type);
    });
};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Social Media App...');
    
    // Check if we're on an auth page (login or register)
    const isAuthPage = window.location.pathname.includes('login.html') || 
                      window.location.pathname.includes('register.html');
    
    if (isAuthPage) {
        console.log('🔐 Auth page detected - skipping main app initialization');
        return;
    }
    
    try {
        // Check if Database class is available
        if (typeof Database === 'undefined') {
            console.error('❌ Database class is not defined. Check that database.js loaded properly.');
            alert('Database initialization failed: Database class not found. Please refresh the page.');
            return;
        }
        
        // Check if UI class is available
        if (typeof UI === 'undefined') {
            console.error('❌ UI class is not defined.');
            alert('UI initialization failed: UI class not found. Please refresh the page.');
            return;
        }
        
        // Initialize database first (don't clear data on normal startup)
        await Database.init();
        console.log('✅ Database initialized');
        
        // Initialize demo users only if no users exist
        await User.initializeDemoUsers();
        
        // Load current user
        const currentUser = await User.getCurrentUser();
        if (!currentUser) {
            console.log('ℹ️ No user logged in - ready for login or registration');
        } else {
            console.log('✅ Current user found:', currentUser.displayName);
        }
        
        // Initialize UI elements
        UI.initializeElements();
        
        // Create and initialize app
        const app = new SocialMediaApp();
        
        // Initialize app
        await app.init();
        
        // Make app globally available
        window.app = app;
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
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
    if (confirm('Are you sure you want to logout?')) {
        if (window.app) {
            window.app.logout();
        } else {
            User.logout();
        }
        window.location.href = 'login.html';
    }
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    const profileMenu = document.getElementById('profileMenu');
    const navProfile = document.querySelector('.nav-profile');
    
    if (profileMenu && navProfile && !navProfile.contains(e.target)) {
        profileMenu.style.display = 'none';
    }
});

// Add global restart function
window.restartApp = async () => {
    await app.restartApp();
};

console.log('✅ App initialized successfully');
console.log('📝 Available commands:');
console.log('  - window.app.handleComment(postId)');
console.log('  - window.app.UI.renderComments(postId, container)');
console.log('  - window.restartApp() - Restart application');
