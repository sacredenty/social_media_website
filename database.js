// ============================================================================
// DATABASE CLASS - SQL Database Management
// ============================================================================
console.log('🗄️ Database.js loading...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
    console.log('🗄️ Browser environment detected');
} else {
    console.log('🗄️ Non-browser environment detected');
}

class Database {
    static DB_NAME = 'socializers_db';
    static DB_VERSION = 1;
    static db = null;

    static async init() {
        return new Promise((resolve, reject) => {
            console.log('🗄️ Database.init() called');
            
            if (this.db) {
                console.log('✅ Database already initialized');
                resolve(this.db);
                return;
            }
            
            console.log('🔄 Opening database...');
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('❌ Database failed to open');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database opened successfully');
                console.log('🗄️ Database name:', this.DB_NAME);
                console.log('🗄️ Database version:', this.DB_VERSION);
                console.log('🗄️ Object stores:', Array.from(this.db.objectStoreNames));
                
                // Check database persistence
                this.checkPersistence();
                
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed');
                this.db = event.target.result;
                console.log('🗄️ Creating object stores...');
                this.createObjectStores();
            };
        });
    }

    static async checkPersistence() {
        try {
            console.log('🔍 Checking database persistence...');
            
            // Check if we can access existing data
            const users = await this.getAllUsers();
            const posts = await this.getAllPosts();
            const comments = await this.getAllComments();
            
            console.log('📊 Database contents:');
            console.log(`  - Users: ${users.length}`);
            console.log(`  - Posts: ${posts.length}`);
            console.log(`  - Comments: ${comments.length}`);
            
            // Log some sample data to verify persistence
            if (users.length > 0) {
                console.log('👤 Sample users found:', users.slice(0, 2).map(u => u.email));
            }
            
            if (posts.length > 0) {
                console.log('📝 Sample posts found:', posts.slice(0, 2).map(p => p.content.substring(0, 50) + '...'));
            }
            
        } catch (error) {
            console.error('❌ Error checking database persistence:', error);
        }
    }

    static createObjectStores() {
        if (!this.db.objectStoreNames.contains('users')) {
            const userStore = this.db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('firstName', 'firstName');
            userStore.createIndex('lastName', 'lastName');
            console.log('✅ Users store created');
        }

        if (!this.db.objectStoreNames.contains('posts')) {
            const postStore = this.db.createObjectStore('posts', { keyPath: 'id', autoIncrement: true });
            postStore.createIndex('author', 'author');
            postStore.createIndex('time', 'time');
            postStore.createIndex('postId', 'id');
            console.log('✅ Posts store created');
        }

        if (!this.db.objectStoreNames.contains('comments')) {
            const commentStore = this.db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
            commentStore.createIndex('postId', 'postId');
            commentStore.createIndex('author', 'author');
            commentStore.createIndex('time', 'time');
            commentStore.createIndex('parentId', 'parentId');
            console.log('✅ Comments store created');
        }

        if (!this.db.objectStoreNames.contains('sharedPosts')) {
            const sharedPostStore = this.db.createObjectStore('sharedPosts', { keyPath: 'id', autoIncrement: true });
            sharedPostStore.createIndex('sharedBy', 'sharedBy');
            sharedPostStore.createIndex('originalPostId', 'originalPostId');
            console.log('✅ Shared posts store created');
        }

        if (!this.db.objectStoreNames.contains('friendRequests')) {
            const friendRequestStore = this.db.createObjectStore('friendRequests', { keyPath: 'id', autoIncrement: true });
            friendRequestStore.createIndex('fromUserId', 'fromUserId');
            friendRequestStore.createIndex('toUserId', 'toUserId');
            friendRequestStore.createIndex('status', 'status');
            console.log('✅ Friend requests store created');
        }

        if (!this.db.objectStoreNames.contains('friendships')) {
            const friendshipStore = this.db.createObjectStore('friendships', { keyPath: 'id', autoIncrement: true });
            friendshipStore.createIndex('userId', 'userId');
            friendshipStore.createIndex('friendId', 'friendId');
            console.log('✅ Friendships store created');
        }
    }

    // Generic CRUD operations
    static async add(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('❌ Database not initialized. Call Database.init() first.');
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => {
                console.log(`✅ Data added to ${storeName}:`, data);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`❌ Error adding to ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    static async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async getAll(storeName, indexName = null, indexValue = null) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                console.error('❌ Database not initialized. Call Database.init() first.');
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && indexValue) {
                const index = store.index(indexName);
                request = index.getAll(indexValue);
            } else {
                request = store.getAll();
            }
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    static async update(storeName, id, data) {
        return new Promise((resolve, reject) => {
            console.log('🔄 Database.update called:', { storeName, id, data });
            console.log('🔍 ID type:', typeof id);
            console.log('🔍 ID value:', id);
            console.log('🔍 Data type:', typeof data);
            console.log('🔍 Data is null/undefined:', data == null);
            console.log('🔍 Data is plain object:', data && data.constructor === Object);
            
            // Validate inputs
            if (id == null || id === undefined) {
                console.error('❌ Invalid ID:', id);
                reject(new Error('Invalid ID: ID cannot be null or undefined'));
                return;
            }
            
            if (data == null || data === undefined) {
                console.error('❌ Invalid data:', data);
                reject(new Error('Invalid data: data cannot be null or undefined'));
                return;
            }
            
            // Check for any non-serializable properties
            for (const [key, value] of Object.entries(data)) {
                console.log(`🔍 Checking property ${key}:`, value, typeof value);
                
                if (typeof value === 'function') {
                    console.error('❌ Function found in data:', key);
                    reject(new Error(`Cannot save function property: ${key}`));
                    return;
                }
                if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                    if (value.constructor !== Object) {
                        console.error('❌ Non-plain object found:', key, value.constructor.name);
                        reject(new Error(`Cannot save non-plain object: ${key}`));
                        return;
                    }
                }
            }
            
            console.log('🔄 Creating transaction...');
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // For autoIncrement stores (like posts), the approach is different
            // For new records: put(data) - autoIncrement generates the key
            // For existing records: put(data) where data contains the keyPath property
            let request;
            if (storeName === 'posts') {
                // For posts store with autoIncrement and keyPath 'id'
                // We need to include the id in the data and use put(data) only
                const dataWithId = { ...data, id: id };
                console.log('📝 Posts store: using put(dataWithId) where dataWithId.id =', id);
                console.log('📝 DataWithId:', dataWithId);
                request = store.put(dataWithId);
            } else if (!data.hasOwnProperty('id')) {
                console.log('📝 Using put(data, id) for store:', storeName);
                request = store.put(data, id);
            } else {
                console.log('📝 Using put(data) for store:', storeName);
                request = store.put(data);
            }
            
            request.onsuccess = () => {
                console.log('✅ Database update successful:', id);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error('❌ Database update error:', request.error);
                console.error('❌ Error name:', request.error.name);
                console.error('❌ Error message:', request.error.message);
                reject(request.error);
            };
        });
    }

    static async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    static async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // User-specific operations
    static async addUser(userData) {
        return this.add('users', userData);
    }

    static async getUserByEmail(email) {
        const users = await this.getAll('users', 'email', email);
        return users.length > 0 ? users[0] : null;
    }

    static async getUserById(id) {
        return this.get('users', id);
    }

    static async getAllUsers() {
        return this.getAll('users');
    }

    static async updateUser(userData) {
        return this.update('users', userData);
    }

    static async deleteUser(id) {
        return this.delete('users', id);
    }

    // Post-specific operations
    static async addPost(postData) {
        return this.add('posts', postData);
    }

    static async getPostById(id) {
        return this.get('posts', id);
    }

    static async getAllPosts() {
        return this.getAll('posts');
    }

    static async updatePost(postData, id) {
        return this.update('posts', id, postData);
    }

    static async deletePost(id) {
        return this.delete('posts', id);
    }

    static async getUserPosts(author) {
        return this.getAll('posts', 'author', author);
    }

    // Comment-specific operations
    static async addComment(commentData) {
        return this.add('comments', commentData);
    }

    static async getCommentById(id) {
        return this.get('comments', id);
    }

    static async getAllComments() {
        return this.getAll('comments');
    }

    static async getCommentsByPostId(postId) {
        return this.getAll('comments', 'postId', postId);
    }

    static async updateComment(commentData) {
        return this.update('comments', commentData);
    }

    static async deleteComment(id) {
        return this.delete('comments', id);
    }

    // Shared post operations
    static async addSharedPost(sharedPostData) {
        return this.add('sharedPosts', sharedPostData);
    }

    static async getAllSharedPosts() {
        return this.getAll('sharedPosts');
    }

    static async updateSharedPost(sharedPostData) {
        return this.update('sharedPosts', sharedPostData);
    }

    static async deleteSharedPost(id) {
        return this.delete('sharedPosts', id);
    }

    // Utility methods
    static async clearAll() {
        try {
            await this.clear('users');
            await this.clear('posts');
            await this.clear('comments');
            await this.clear('sharedPosts');
            console.log('✅ All database tables cleared');
        } catch (error) {
            console.error('❌ Error clearing database:', error);
        }
    }

    static async addFriendRequest(friendRequest) {
        return this.add('friendRequests', friendRequest);
    }

    static async getFriendRequest(id) {
        return this.get('friendRequests', id);
    }

    static async getAllFriendRequests() {
        return this.getAll('friendRequests');
    }

    static async updateFriendRequest(friendRequest) {
        return this.update('friendRequests', friendRequest.id, friendRequest);
    }

    static async deleteFriendRequest(id) {
        return this.delete('friendRequests', id);
    }

    static async addFriendship(friendship) {
        return this.add('friendships', friendship);
    }

    static async getAllFriendships() {
        return this.getAll('friendships');
    }

    static async deleteFriendship(userId, friendId) {
        const friendships = await this.getAllFriendships();
        const toDelete = friendships.find(f => 
            (f.userId === userId && f.friendId === friendId) ||
            (f.userId === friendId && f.friendId === userId)
        );
        if (toDelete) {
            return this.delete('friendships', toDelete.id);
        }
    }

    static async exportData() {
        const data = {
            users: await this.getAllUsers(),
            posts: await this.getAllPosts(),
            comments: await this.getAllComments(),
            sharedPosts: await this.getAllSharedPosts()
        };
        console.log('📊 Database export:', data);
        return data;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Database;
}

// Confirm Database class is available in browser
if (typeof window !== 'undefined') {
    console.log('🗄️ Database class loaded and available in window scope');
    // Ensure Database is available globally
    window.Database = Database;
    
    // Add global persistence test function
    window.testDatabasePersistence = async function() {
        console.log('🧪 Testing database persistence...');
        try {
            await Database.init();
            
            // Test data
            const testData = {
                test: 'persistence',
                timestamp: new Date().toISOString(),
                random: Math.random()
            };
            
            // Save test data
            await Database.add('posts', {
                author: 'Persistence Test',
                content: `Test at ${testData.timestamp}`,
                time: 'Just now',
                testData: testData
            });
            
            console.log('✅ Test data saved');
            
            // Retrieve test data
            const posts = await Database.getAllPosts();
            const testPosts = posts.filter(p => p.author === 'Persistence Test');
            
            console.log('📊 Found test posts:', testPosts.length);
            if (testPosts.length > 0) {
                console.log('✅ Database persistence confirmed - test data found');
                return true;
            } else {
                console.log('❌ Database persistence failed - test data not found');
                return false;
            }
        } catch (error) {
            console.error('❌ Error testing persistence:', error);
            return false;
        }
    };
    
    // Add global debugging function
window.debugUsers = async function() {
    try {
        await Database.init();
        const users = await Database.getAllUsers();
        console.log('👥 All users in database:');
        users.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.displayName}, Password: ${user.password}`);
        });
        return users;
    } catch (error) {
        console.error('❌ Error debugging users:', error);
        return [];
    }
};

console.log('🧪 Debug function available: window.debugUsers()');
console.log('🧪 Persistence test function available: window.testDatabasePersistence()');
} else {
    console.log('🗄️ Database class loaded (non-browser environment)');
}
