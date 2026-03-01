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
            const currentUserId = localStorage.getItem('socializers_current_user_id');
            console.log('🔍 Looking for current user with ID:', currentUserId);
            
            if (!currentUserId) {
                console.log('ℹ️ No current user ID found in localStorage');
                return null;
            }
            
            const users = await Database.getAllUsers();
            console.log('👥 Available users in database:', users.length);
            
            // Try both string and number comparison
            let userData = users.find(user => user.id == currentUserId);
            
            if (!userData) {
                console.log('❌ No user found with ID:', currentUserId);
                console.log('🔍 Available user IDs:', users.map(u => ({ id: u.id, email: u.email })));
                return null;
            }
            
            // Create a proper User object to ensure getters work
            const currentUser = new User(userData);
            console.log('✅ Current user found:', currentUser.displayName);
            return currentUser;
        } catch (error) {
            console.error('❌ Error getting current user:', error);
            return null;
        }
    }

    static async setCurrentUser(user) {
        try {
            console.log('🔄 Setting current user:', user);
            console.log('🆔 User ID type:', typeof user.id, 'User ID value:', user.id);
            
            localStorage.setItem('socializers_current_user_id', user.id.toString());
            console.log('✅ User ID stored in localStorage:', user.id.toString());
            console.log('✅ User set as current:', user.displayName);
        } catch (error) {
            console.error('❌ Error setting current user:', error);
        }
    }

    static async logout() {
        console.log('🚪 User.logout() called');
        
        try {
            // Clear current session from localStorage only
            localStorage.removeItem('socializers_current_user_id');
            console.log('✅ User session cleared from localStorage');
            
            // DON'T clear database - preserve all users and their content
            console.log('ℹ️ Preserving all user data during logout');
            
            // DON'T reinitialize database - keep existing data
            // DON'T reinitialize demo users - keep existing users
            
            console.log('✅ Logout completed (user data preserved)');
            
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    }

    static async clearAllData() {
        try {
            console.log('🧹 WARNING: Clearing ALL application data including users, posts, and comments!');
            console.log('⚠️ This will delete ALL user accounts and content permanently!');
            
            // Check if Database is available before using it
            if (typeof Database !== 'undefined') {
                // Clear database - DESTRUCTIVE OPERATION
                await Database.clearAll();
                console.log('❌ All database data cleared - all users deleted');
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
            
            console.log('❌ ALL DATA CLEARED - Application reset to factory state');
        } catch (error) {
            console.error('❌ Error clearing data:', error);
        }
    }

    static async authenticate(email, password) {
        try {
            console.log('🔍 Authenticating user:', email);
            
            // Ensure database is initialized
            if (!Database.db) {
                console.log('🔄 Database not initialized in authenticate, initializing now...');
                await Database.init();
            }
            
            console.log('🔍 Looking up user by email:', email);
            const user = await Database.getUserByEmail(email);
            
            console.log('🔍 User lookup result:', user ? `Found: ${user.displayName}` : 'Not found');
            
            if (!user) {
                console.log('❌ Authentication failed: User not found');
                return null;
            }
            
            console.log('🔍 Checking password match...');
            const passwordMatch = user.password === password;
            console.log('🔍 Password match result:', passwordMatch ? 'Match' : 'No match');
            
            if (!passwordMatch) {
                console.log('❌ Authentication failed: Incorrect password');
                return null;
            }
            
            console.log('✅ Authentication successful for:', user.displayName);
            return user;
        } catch (error) {
            console.error('❌ Error during authentication:', error);
            return null;
        }
    }

    static async register(userData) {
        try {
            console.log('🔄 User.register called with:', userData);
            
            // Ensure database is initialized
            if (!Database.db) {
                console.log('🔄 Database not initialized, initializing now...');
                await Database.init();
            }
            
            // Check if user already exists
            console.log('🔍 Checking if user already exists:', userData.email);
            const existingUser = await Database.getUserByEmail(userData.email);
            if (existingUser) {
                console.log('❌ User already exists:', existingUser);
                throw new Error('User with this email already exists');
            }
            
            console.log('✅ User does not exist, creating new user...');
            const newUser = new User(userData);
            console.log('👤 New user object created:', newUser);
            
            console.log('💾 Saving user to database...');
            const result = await Database.addUser(newUser);
            console.log('✅ User saved to database with ID:', result);
            
            // Verify the user was actually saved
            const savedUser = await Database.getUserByEmail(userData.email);
            if (savedUser) {
                console.log('✅ User verification successful - user was saved:', savedUser);
            } else {
                console.error('❌ User verification failed - user was not saved!');
            }
            
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
            
            // Don't clear user data - preserve all users and their content
            console.log('ℹ️ Preserving user data during restart');
            
            // Reinitialize database (won't clear existing data)
            await Database.init();
            
            // Reinitialize app state only
            await this.init();
            
            console.log('✅ Application restarted successfully (user data preserved)');
            
        } catch (error) {
            console.error('❌ Error restarting app:', error);
        }
    }
}

// Make Search class globally available
// window.Search = Search;
// console.log('✅ Search class made globally available:', typeof window.Search);

// Add test function for debugging
window.testSearch = (query) => {
    console.log('🧪 Testing search with:', query);
    if (typeof Search !== 'undefined') {
        Search.performSearch(query);
    } else {
        console.error('❌ Search class not available');
    }
}

// ============================================================================
// SEARCH CLASS - Handles search functionality
// ============================================================================
class Search {
    static searchTimeout = null;
    static searchResults = [];

    static async performSearch(query) {
        if (!query || query.trim().length < 2) {
            this.hideResults();
            return;
        }

        try {
            this.showLoading();
            
            // Search for users, posts, and friends
            const [users, posts, friends] = await Promise.all([
                this.searchUsers(query),
                this.searchPosts(query),
                this.searchFriends(query)
            ]);

            this.searchResults = [...users, ...posts, ...friends];
            this.displayResults(this.searchResults);
        } catch (error) {
            console.error('❌ Error performing search:', error);
            this.showError();
        }
    }

    static async searchUsers(query) {
        try {
            const allUsers = await Database.getAllUsers();
            const currentUser = await User.getCurrentUser();
            
            return allUsers
                .filter(user => 
                    user.id !== currentUser.id &&
                    (user.displayName?.toLowerCase().includes(query.toLowerCase()) ||
                     user.firstName?.toLowerCase().includes(query.toLowerCase()) ||
                     user.lastName?.toLowerCase().includes(query.toLowerCase()) ||
                     user.email?.toLowerCase().includes(query.toLowerCase()))
                )
                .slice(0, 3)
                .map(user => ({
                    type: 'user',
                    id: user.id,
                    title: user.displayName || user.email,
                    subtitle: user.email,
                    avatar: user.avatar,
                    data: user
                }));
        } catch (error) {
            console.error('❌ Error searching users:', error);
            return [];
        }
    }

    static async searchPosts(query) {
        try {
            const allPosts = await Post.getAllPosts();
            
            return allPosts
                .filter(post => 
                    post.content?.toLowerCase().includes(query.toLowerCase()) ||
                    post.author?.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 5)
                .map(post => ({
                    type: 'post',
                    id: post.id,
                    title: `Post by ${post.author}`,
                    subtitle: post.time,
                    content: post.content,
                    avatar: post.avatar,
                    data: post
                }));
        } catch (error) {
            console.error('❌ Error searching posts:', error);
            return [];
        }
    }

    static async searchFriends(query) {
        try {
            const currentUser = await User.getCurrentUser();
            if (!currentUser) return [];
            
            const friends = await Friend.getFriends(currentUser.id);
            
            return friends
                .filter(friend => 
                    friend.displayName?.toLowerCase().includes(query.toLowerCase()) ||
                    friend.firstName?.toLowerCase().includes(query.toLowerCase()) ||
                    friend.lastName?.toLowerCase().includes(query.toLowerCase()) ||
                    friend.email?.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 2)
                .map(friend => ({
                    type: 'friend',
                    id: friend.id,
                    title: friend.displayName || friend.email,
                    subtitle: 'Friend',
                    avatar: friend.avatar,
                    data: friend
                }));
        } catch (error) {
            console.error('❌ Error searching friends:', error);
            return [];
        }
    }

    static displayResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!resultsContainer) {
            console.error('❌ Search results container not found!');
            return;
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <p>No results found</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = results.map(result => this.createResultItem(result)).join('');
        }
        
        resultsContainer.classList.add('active');
    }

    static createResultItem(result) {
        const typeIcon = {
            user: 'fa-user',
            post: 'fa-file-alt',
            friend: 'fa-user-friends'
        };

        return `
            <div class="search-result-item" onclick="Search.handleResultClick('${result.type}', ${result.id})">
                <div class="search-result-header">
                    <img src="${result.avatar}" alt="${result.title}" class="search-result-avatar">
                    <div>
                        <div class="search-result-title">${result.title}</div>
                        <div class="search-result-subtitle">${result.subtitle}</div>
                    </div>
                    <span class="search-result-type">
                        <i class="fas ${typeIcon[result.type]}"></i> ${result.type}
                    </span>
                </div>
                ${result.content ? `<div class="search-result-content">${this.truncateText(result.content, 100)}</div>` : ''}
            </div>
        `;
    }

    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static handleResultClick(type, id) {
        this.hideResults();
        document.getElementById('searchInput').value = '';
        
        switch (type) {
            case 'user':
                window.location.href = `profile.html?userId=${id}`;
                break;
            case 'post':
                // Scroll to post and highlight it
                this.scrollToPost(id);
                break;
            case 'friend':
                window.location.href = `profile.html?userId=${id}`;
                break;
        }
    }

    static scrollToPost(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth' });
            postElement.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                postElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    static showLoading() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Searching...</p>
            </div>
        `;
        resultsContainer.classList.add('active');
    }

    static showError() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error searching. Please try again.</p>
            </div>
        `;
        resultsContainer.classList.add('active');
    }

    static hideResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.classList.remove('active');
    }

    static initializeSearch() {
        const searchInput = document.getElementById('searchInput');
        
        if (!searchInput) {
            console.error('❌ Search input not found!');
            return;
        }

        // Real-time search with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length >= 2) {
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300); // 300ms debounce
            } else {
                this.hideResults();
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search')) {
                this.hideResults();
            }
        });

        // Handle escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
                searchInput.blur();
            }
        });
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
                console.log('🔍 Processing post:', post);
                console.log('🔍 Post ID:', post.id);
                console.log('🔍 Post ID type:', typeof post.id);
                console.log('🔍 Post type:', typeof post);
                
                // Check for undefined post ID
                if (post.id == null || post.id === undefined) {
                    console.error('❌ Post ID is undefined, skipping post:', post);
                    continue;
                }
                
                // Check for undefined properties before creating postData
                if (!post || typeof post !== 'object') {
                    console.error('❌ Invalid post object:', post);
                    continue;
                }
                
                // Create a clean, minimal data object with only primitive values
                const postData = {};
                
                // Only add properties that exist and are primitive
                if (post.author !== undefined && post.author !== null) {
                    postData.author = String(post.author);
                }
                if (post.avatar !== undefined && post.avatar !== null) {
                    postData.avatar = String(post.avatar);
                }
                if (post.content !== undefined && post.content !== null) {
                    postData.content = String(post.content);
                }
                if (post.image !== undefined && post.image !== null) {
                    postData.image = String(post.image);
                }
                if (post.likes !== undefined && post.likes !== null) {
                    postData.likes = Number(post.likes) || 0;
                }
                if (post.comments !== undefined && post.comments !== null) {
                    postData.comments = Number(post.comments) || 0;
                }
                if (post.shares !== undefined && post.shares !== null) {
                    postData.shares = Number(post.shares) || 0;
                }
                if (post.time !== undefined && post.time !== null) {
                    postData.time = String(post.time);
                }
                if (post.liked !== undefined && post.liked !== null) {
                    postData.liked = Boolean(post.liked);
                }
                if (post.shared !== undefined && post.shared !== null) {
                    postData.shared = Boolean(post.shared);
                }
                
                console.log('💾 Attempting to save post data:', postData);
                console.log('🔍 Post data keys:', Object.keys(postData));
                console.log('🔍 Post data types:', Object.entries(postData).map(([key, value]) => `${key}: ${typeof value}`));
                
                await Database.updatePost(postData, post.id);
                console.log('✅ Post saved successfully:', post.id);
            }
            console.log('✅ All posts saved to database');
        } catch (error) {
            console.error('❌ Error saving posts:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
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
// FRIEND CLASS - Handles friend relationships and requests
// ============================================================================
class Friend {
    constructor(friendData) {
        this.id = friendData.id || Date.now();
        this.fromUserId = friendData.fromUserId;
        this.toUserId = friendData.toUserId;
        this.status = friendData.status || 'pending'; // pending, accepted, declined
        this.createdAt = friendData.createdAt || new Date().toISOString();
        this.respondedAt = friendData.respondedAt || null;
    }

    static async sendRequest(fromUserId, toUserId) {
        try {
            // Check if request already exists
            const existingRequests = await this.getRequestsByUsers(fromUserId, toUserId);
            if (existingRequests.length > 0) {
                throw new Error('Friend request already exists');
            }

            const friendRequest = new Friend({
                fromUserId,
                toUserId,
                status: 'pending'
            });

            const result = await Database.addFriendRequest(friendRequest);
            console.log('✅ Friend request sent:', result);
            return friendRequest;
        } catch (error) {
            console.error('❌ Error sending friend request:', error);
            throw error;
        }
    }

    static async acceptRequest(requestId) {
        try {
            const request = await Database.getFriendRequest(requestId);
            if (!request) {
                throw new Error('Friend request not found');
            }

            request.status = 'accepted';
            request.respondedAt = new Date().toISOString();
            await Database.updateFriendRequest(request);

            // Create friendship entries for both users
            await Database.addFriendship({
                userId: request.fromUserId,
                friendId: request.toUserId,
                createdAt: new Date().toISOString()
            });
            
            await Database.addFriendship({
                userId: request.toUserId,
                friendId: request.fromUserId,
                createdAt: new Date().toISOString()
            });

            console.log('✅ Friend request accepted');
            return request;
        } catch (error) {
            console.error('❌ Error accepting friend request:', error);
            throw error;
        }
    }

    static async declineRequest(requestId) {
        try {
            const request = await Database.getFriendRequest(requestId);
            if (!request) {
                throw new Error('Friend request not found');
            }

            request.status = 'declined';
            request.respondedAt = new Date().toISOString();
            await Database.updateFriendRequest(request);

            console.log('✅ Friend request declined');
            return request;
        } catch (error) {
            console.error('❌ Error declining friend request:', error);
            throw error;
        }
    }

    static async cancelRequest(requestId) {
        try {
            await Database.deleteFriendRequest(requestId);
            console.log('✅ Friend request cancelled');
        } catch (error) {
            console.error('❌ Error cancelling friend request:', error);
            throw error;
        }
    }

    static async getRequestsByUsers(fromUserId, toUserId) {
        try {
            const allRequests = await Database.getAllFriendRequests();
            return allRequests.filter(req => 
                (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
                (req.fromUserId === toUserId && req.toUserId === fromUserId)
            );
        } catch (error) {
            console.error('❌ Error getting requests:', error);
            return [];
        }
    }

    static async getPendingRequests(userId) {
        try {
            const allRequests = await Database.getAllFriendRequests();
            return allRequests.filter(req => 
                (req.toUserId === userId && req.status === 'pending') ||
                (req.fromUserId === userId && req.status === 'pending')
            );
        } catch (error) {
            console.error('❌ Error getting pending requests:', error);
            return [];
        }
    }

    static async getFriends(userId) {
        try {
            const friendships = await Database.getAllFriendships();
            const userFriendships = friendships.filter(friendship => 
                friendship.userId === userId
            );
            
            const friendIds = userFriendships.map(f => f.friendId);
            const allUsers = await Database.getAllUsers();
            
            return allUsers.filter(user => friendIds.includes(user.id));
        } catch (error) {
            console.error('❌ Error getting friends:', error);
            return [];
        }
    }

    static async areFriends(userId1, userId2) {
        try {
            const friendships = await Database.getAllFriendships();
            return friendships.some(f => 
                (f.userId === userId1 && f.friendId === userId2) ||
                (f.userId === userId2 && f.friendId === userId1)
            );
        } catch (error) {
            console.error('❌ Error checking friendship:', error);
            return false;
        }
    }
}
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
                // Convert Comment instance back to plain object for database storage
                const commentData = {
                    id: comment.id,
                    postId: comment.postId,
                    author: comment.author,
                    avatar: comment.avatar,
                    content: comment.content,
                    time: comment.time,
                    likes: comment.likes,
                    parentId: comment.parentId
                };
                await Database.updateComment(commentData);
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
            profileCardName: document.getElementById('profileCardName'),
            profileCardTitle: document.getElementById('profileCardTitle'),
            friendsCount: document.getElementById('friendsCount'),
            followersCount: document.getElementById('followersCount'),
            suggestionsList: document.getElementById('suggestionsList')
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
        
        console.log('👤 Updating profile UI for user:', user);
        console.log('🔍 navProfileName element:', this.elements.navProfileName);
        
        if (this.elements.navProfileImg) this.elements.navProfileImg.src = user.avatar;
        if (this.elements.navProfileName) {
            this.elements.navProfileName.textContent = user.displayName;
            console.log('✅ Updated nav profile name to:', user.displayName);
        } else {
            console.error('❌ navProfileName element not found!');
        }
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
        // Check if we should show the friend button (not for own posts)
        const showFriendButton = post.authorId && window.app && window.app.currentUser && post.authorId !== window.app.currentUser.id;
        
        return `
            <div class="post-header">
                <img src="${post.avatar}" alt="Profile" class="post-author-img">
                <div class="post-author-info">
                    <h4 data-author-id="${post.authorId || ''}">${post.author}</h4>
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
                ${showFriendButton ? `
                <button class="add-friend-btn" onclick="app.handleAddFriend(event)" data-author="${post.author}">
                    <i class="fas fa-user-plus"></i> Add Friend
                </button>
                ` : ''}
            </div>
            <div class="comments-section" style="display: none;">
                <div class="comments-list"></div>
            </div>
        `;
    }

    static renderSharedPostHTML(post) {
        // Check if we should show the friend button (not for own posts)
        const showFriendButton = post.originalAuthorId && window.app && window.app.currentUser && post.originalAuthorId !== window.app.currentUser.id;
        
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
                ${showFriendButton ? `
                <button class="add-friend-btn" onclick="app.handleAddFriend(event)" data-author="${post.originalAuthor}">
                    <i class="fas fa-user-plus"></i> Add Friend
                </button>
                ` : ''}
            </div>
            <div class="comments-section" style="display: none;">
                <div class="comments-list"></div>
            </div>
        `;
    }

    static async renderComments(postId, container) {
        console.log('renderComments called for postId:', postId);
        console.log('Container:', container);
        
        const comments = await Comment.getThreadedComments(postId);
        console.log('Comments found:', comments);
        console.log('Comments type:', typeof comments);
        console.log('Is comments an array?', Array.isArray(comments));
        
        if (!comments || comments.length === 0) {
            container.innerHTML = `
                <p style="color: #65676b; font-size: 14px;">No comments yet. Be the first to comment!</p>
            `;
            console.log('No comments found, showing placeholder');
        } else {
            container.innerHTML = '';
            comments.forEach(comment => {
                console.log('Rendering comment:', comment);
                this.renderComment(comment, container, 0);
            });
        }
        
        // Add comment input area at the bottom
        const commentInput = document.createElement('div');
        commentInput.className = 'comment-input-area';
        commentInput.style.cssText = `
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #e4e6eb;
        `;
        
        commentInput.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <img src="${window.app.currentUser.avatar || 'https://picsum.photos/seed/default/32/32'}" alt="Your avatar" style="width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;">
                <div style="flex: 1;">
                    <textarea 
                        id="commentInput-${postId}"
                        placeholder="Write a comment..." 
                        style="
                            width: 100%; 
                            min-height: 40px; 
                            padding: 8px 12px; 
                            border: 1px solid #dddfe2; 
                            border-radius: 18px; 
                            resize: none; 
                            outline: none; 
                            font-family: inherit; 
                            font-size: 14px; 
                            line-height: 1.4;
                            box-sizing: border-box;
                        "
                        onkeydown="if(event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); app.submitCommentFromInput(${postId}); }"
                    ></textarea>
                </div>
            </div>
        `;
        
        container.appendChild(commentInput);
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

    static async loadSuggestions() {
        try {
            console.log('🔍 Loading friend suggestions...');
            
            const currentUser = await User.getCurrentUser();
            if (!currentUser) {
                console.log('ℹ️ No current user found for suggestions');
                return;
            }

            // Get all users except current user
            const allUsers = await Database.getAllUsers();
            const suggestions = allUsers
                .filter(user => user.id !== currentUser.id)
                .slice(0, 5); // Limit to 5 suggestions

            this.renderSuggestions(suggestions);
        } catch (error) {
            console.error('❌ Error loading suggestions:', error);
        }
    }

    static renderSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('suggestionsList');
        if (!suggestionsContainer) {
            console.error('❌ Suggestions container not found!');
            return;
        }

        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<p style="padding: 10px; color: #65676b;">No suggestions available</p>';
            return;
        }

        suggestionsContainer.innerHTML = suggestions.map(user => `
            <div class="suggestion-item">
                <img src="${user.avatar}" alt="${user.displayName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">
                <div class="suggestion-info">
                    <h4>${user.displayName || user.email}</h4>
                    <p>Suggested for you</p>
                </div>
                <button class="add-friend-btn" onclick="app.handleAddFriend(${user.id})">Add Friend</button>
            </div>
        `).join('');
    }

    static async loadProfileStats() {
        try {
            console.log('📊 Loading profile stats...');
            
            const currentUser = await User.getCurrentUser();
            if (!currentUser) {
                console.log('ℹ️ No current user found for profile stats');
                return;
            }

            // Get friends count
            const friends = await Friend.getFriends(currentUser.id);
            const friendsCount = friends.length;

            // For followers, we'll use a simple count (in a real app, this would be a separate table)
            // For now, we'll simulate followers as friends count * 2 (just for demonstration)
            const followersCount = friendsCount * 2;

            // Update UI
            const friendsCountElement = document.getElementById('friendsCount');
            const followersCountElement = document.getElementById('followersCount');

            if (friendsCountElement) {
                friendsCountElement.textContent = friendsCount;
            }

            if (followersCountElement) {
                followersCountElement.textContent = followersCount > 999 ? 
                    `${(followersCount / 1000).toFixed(1)}K` : 
                    followersCount.toString();
            }

            console.log(`✅ Profile stats loaded: ${friendsCount} friends, ${followersCount} followers`);
        } catch (error) {
            console.error('❌ Error loading profile stats:', error);
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
            console.log('🔍 Loading current user...');
            this.currentUser = await User.getCurrentUser();
            if (this.currentUser) {
                console.log('✅ Current user loaded:', this.currentUser.displayName);
            } else {
                console.log('ℹ️ No current user found - redirecting to login');
                // Redirect to login page if no user is logged in
                window.location.href = 'login.html';
                return;
            }
            
            // Initialize UI elements
            UI.initializeElements();
            
            // Load posts
            await this.loadPosts();
            
            // Load friend suggestions
            await UI.loadSuggestions();
            
            // Load profile statistics
            await UI.loadProfileStats();
            
            // Update UI with current user
            if (this.currentUser) {
                UI.updateProfileUI(this.currentUser);
            }
            
            // Render posts after loading
            this.renderPosts();
            
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
            
            // Initialize search functionality
            Search.initializeSearch();
            
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
            console.log('🔄 Loading posts from database...');
            this.posts = await Post.getAllPosts();
            this.sharedPosts = await SharedPost.getAll();
            console.log('✅ Posts loaded:', this.posts.length, 'Shared posts:', this.sharedPosts.length);
            console.log('📊 Posts data:', this.posts);
            console.log('📊 Shared posts data:', this.sharedPosts);
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
        console.log('🎨 renderPosts() called');
        console.log('📊 Current posts array:', this.posts);
        console.log('📊 Current sharedPosts array:', this.sharedPosts);
        console.log('📊 Current user:', this.currentUser);
        
        const postsContainer = document.querySelector('.posts-container');
        if (!postsContainer) {
            console.log('❌ Posts container not found');
            return;
        }

        console.log('🧹 Clearing posts container');
        postsContainer.innerHTML = '';

        // Combine and sort posts
        const allPosts = [...this.posts, ...this.sharedPosts];
        const sortedPosts = this.sortPosts(allPosts);
        
        console.log('📊 Combined posts:', allPosts.length);
        console.log('📊 Sorted posts:', sortedPosts.length);

        sortedPosts.forEach((post, index) => {
            console.log(`🎨 Rendering post ${index + 1}:`, post);
            UI.renderPost(post, postsContainer);
        });
        
        console.log('✅ renderPosts() completed');
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
        const currentPostData = this.posts.find(p => p.id === postId);
        
        if (currentPostData) {
            // Convert plain object to Post instance to access methods
            const currentPost = new Post(currentPostData);
            const liked = currentPost.like();
            
            // Update the post data in the array
            const postIndex = this.posts.findIndex(p => p.id === postId);
            this.posts[postIndex] = currentPost;
            
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

    async handleComment(postId) {
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
                await UI.renderComments(postId, commentsList);
            } else {
                console.error('Comments list not found');
            }
        } else {
            console.log('Hiding comments section');
            commentsSection.style.display = 'none';
        }
    }

    async submitCommentFromInput(postId) {
        const inputElement = document.getElementById(`commentInput-${postId}`);
        const content = inputElement.value.trim();
        
        if (!content) {
            return; // Don't submit empty comments
        }

        try {
            const newComment = await Comment.saveComment({
                postId: postId,
                author: this.currentUser.displayName,
                authorAvatar: this.currentUser.avatar,
                content: content
            });

            // Update post comment count
            const posts = await Post.getAllPosts();
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                posts[postIndex].comments++;
                await Post.saveAllPosts(posts);
            }

            // Clear input and refresh comments
            inputElement.value = '';
            
            // Re-render comments
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const commentsList = postElement.querySelector('.comments-list');
            await UI.renderComments(postId, commentsList);

            // Update post stats
            const statsContainer = postElement.querySelector('.post-stats');
            const commentsSpan = statsContainer.querySelectorAll('span')[1];
            if (commentsSpan) {
                commentsSpan.innerHTML = `<i class="fas fa-comment"></i> ${posts[postIndex].comments}`;
            }

            UI.showNotification('Comment posted successfully!', 'success');
        } catch (error) {
            console.error('❌ Error posting comment:', error);
            UI.showNotification('Error posting comment', 'error');
        }
    }

    handleCommentLike(commentId, button) {
        const allComments = Comment.getAllComments();
        const commentData = allComments.find(c => c.id === commentId);
        
        if (!commentData) return;

        // Convert plain object to Comment instance to access methods
        const comment = new Comment(commentData);
        const liked = comment.like();
        
        // Update the comment data in the array
        const commentIndex = allComments.findIndex(c => c.id === commentId);
        allComments[commentIndex] = comment;
        
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

    async handleAddFriend(e) {
        let button = null;
        let targetUser = null;
        let targetUserId = null;

        if (!this.currentUser) {
            UI.showNotification('Please log in to add friends', 'error');
            return;
        }

        // Check if this is from suggestions (has user ID as parameter)
        if (typeof e === 'number') {
            targetUserId = e;
            console.log('🔍 Looking for user with ID:', targetUserId);
            const allUsers = await Database.getAllUsers();
            console.log('👥 Available users:', allUsers.map(u => ({ id: u.id, displayName: u.displayName })));
            
            // Convert plain objects to User instances to get displayName getter
            const userInstances = allUsers.map(userData => new User(userData));
            targetUser = userInstances.find(user => user.id === targetUserId);
            console.log('🎯 Found user:', targetUser);
            
            // Find the button for this user in suggestions
            const suggestionButtons = document.querySelectorAll('.add-friend-btn');
            button = Array.from(suggestionButtons).find(btn => 
                btn.getAttribute('onclick')?.includes(`app.handleAddFriend(${targetUserId})`)
            );
        } else {
            // This is from a post
            button = e.currentTarget;
            const postElement = button.closest('.post');
            
            if (!postElement) {
                UI.showNotification('Unable to identify user', 'error');
                return;
            }

            // Get the post author's user ID from data attribute
            const authorId = postElement.querySelector('.post-author-info h4')?.dataset.authorId;
            if (authorId) {
                targetUserId = parseInt(authorId);
                const allUsers = await Database.getAllUsers();
                targetUser = allUsers.find(user => user.id === targetUserId);
            } else {
                // Fallback to display name lookup
                const postAuthor = postElement.querySelector('.post-author-info h4')?.textContent;
                if (!postAuthor) {
                    UI.showNotification('Unable to identify user', 'error');
                    return;
                }
                
                const allUsers = await Database.getAllUsers();
                targetUser = allUsers.find(user => user.displayName === postAuthor);
                if (targetUser) {
                    targetUserId = targetUser.id;
                }
            }
        }
        
        if (!targetUser) {
            console.error('❌ Target user not found. TargetUserId:', targetUserId);
            console.error('❌ Available users:', allUsers.map(u => ({ id: u.id, displayName: u.displayName })));
            UI.showNotification('User not found', 'error');
            return;
        }

        console.log('🎯 Found target user:', targetUser);

        // Check if trying to add self
        if (targetUser.id === this.currentUser.id) {
            UI.showNotification('You cannot add yourself as a friend', 'error');
            return;
        }

        // Check current friendship status
        const areAlreadyFriends = await Friend.areFriends(this.currentUser.id, targetUser.id);
        if (areAlreadyFriends) {
            UI.showNotification('You are already friends with ' + targetUser.displayName, 'info');
            return;
        }

        try {
            // Check for existing requests
            const existingRequests = await Friend.getRequestsByUsers(this.currentUser.id, targetUser.id);
            const myRequest = existingRequests.find(req => req.fromUserId === this.currentUser.id);
            const theirRequest = existingRequests.find(req => req.fromUserId === targetUser.id);

            if (myRequest) {
                if (myRequest.status === 'pending') {
                    // Cancel my pending request
                    await Friend.cancelRequest(myRequest.id);
                    button.textContent = 'Add Friend';
                    button.style.backgroundColor = '#1877f2';
                    button.style.color = 'white';
                    UI.showNotification('Friend request cancelled!');
                }
            } else if (theirRequest && theirRequest.status === 'pending') {
                // Accept their request
                await Friend.acceptRequest(theirRequest.id);
                button.textContent = 'Friends';
                button.style.backgroundColor = '#e4e6eb';
                button.style.color = '#1c1e21';
                button.disabled = true;
                UI.showNotification('You are now friends with ' + targetUser.displayName + '!');
            } else {
                // Send new friend request
                await Friend.sendRequest(this.currentUser.id, targetUser.id);
                button.textContent = 'Cancel Request';
                button.style.backgroundColor = '#e4e6eb';
                button.style.color = '#1c1e21';
                UI.showNotification('Friend request sent to ' + targetUser.displayName + '!');
            }

        } catch (error) {
            console.error('❌ Error handling friend action:', error);
            UI.showNotification('Error: ' + error.message, 'error');
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
            'fa-user-friends': () => {
                window.location.href = 'friends.html';
            },
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
            'Friends': () => window.location.href = 'friends.html',
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
        console.log('🔍 Checking for logged in user...');
        const currentUser = await User.getCurrentUser();
        if (!currentUser) {
            console.log('ℹ️ No user logged in - redirecting to login page');
            window.location.href = 'login.html';
            return;
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
