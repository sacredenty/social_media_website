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
    static DB_VERSION = 2; // Increment version to trigger schema update
    static db = null;

    static async init() {
        return new Promise((resolve, reject) => {
            console.log('🗄️ Database.init() called');
            
            if (this.db) {
                resolve(this.db);
                return;
            }

            console.log('🔄 Initializing database...');
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION); // Increment version to trigger schema update

            request.onerror = () => {
                console.error('❌ Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed...');
                this.db = event.target.result;

                // Create object stores if they don't exist
                this.createObjectStores();
                
                console.log('✅ Database schema upgraded');
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

    static async getPendingRequests(userId) {
        try {
            const allRequests = await this.getAllFriendRequests();
            return allRequests.filter(request => 
                (request.toUserId === userId && request.status === 'pending') ||
                (request.fromUserId === userId && request.status === 'pending')
            );
        } catch (error) {
            console.error('❌ Error getting pending requests:', error);
            return [];
        }
    }

    static async getRequestsByUsers(fromUserId, toUserId) {
        try {
            const allRequests = await this.getAllFriendRequests();
            return allRequests.filter(request => 
                (request.fromUserId === fromUserId && request.toUserId === toUserId) ||
                (request.fromUserId === toUserId && request.toUserId === fromUserId)
            );
        } catch (error) {
            console.error('❌ Error getting requests by users:', error);
            return [];
        }
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

// ============================================================================
// ENHANCED PERSISTENCE - Backup and Restore Functionality
// ============================================================================

class EnhancedDatabase {
    static BACKUP_KEY = 'socializers_db_backup';
    static AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    // Initialize enhanced persistence features
    static async init() {
        console.log('🔄 Initializing enhanced persistence...');
        
        // Restore from backup if available
        await this.restoreFromBackup();
        
        // Start auto-backup
        this.startAutoBackup();
        
        // Add event listeners for data changes
        this.addDataChangeListeners();
        
        console.log('✅ Enhanced persistence initialized');
    }
    
    // Export all data from IndexedDB
    static async exportAllData() {
        try {
            console.log('📤 Exporting all data...');
            
            const data = {
                users: await Database.getAllUsers(),
                posts: await Database.getAllPosts(),
                comments: await Database.getAllComments(),
                friendRequests: await Database.getAllFriendRequests(),
                friendships: await Database.getAllFriendships(),
                sharedPosts: await Database.getAllSharedPosts(),
                timestamp: new Date().toISOString(),
                version: Database.DB_VERSION
            };
            
            console.log('✅ Data exported successfully:', {
                users: data.users.length,
                posts: data.posts.length,
                comments: data.comments.length,
                friendRequests: data.friendRequests.length,
                friendships: data.friendships.length,
                sharedPosts: data.sharedPosts.length
            });
            
            return data;
        } catch (error) {
            console.error('❌ Error exporting data:', error);
            return null;
        }
    }
    
    // Backup data to localStorage
    static async backupToLocalStorage() {
        try {
            console.log('💾 Backing up to localStorage...');
            
            const data = await this.exportAllData();
            if (!data) {
                throw new Error('Failed to export data');
            }
            
            const backupString = JSON.stringify(data);
            const sizeInBytes = new Blob([backupString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            // Check localStorage quota
            const availableSpace = this.getAvailableLocalStorageSpace();
            if (sizeInBytes > availableSpace) {
                console.warn('⚠️ Backup data too large for localStorage');
                return false;
            }
            
            localStorage.setItem(this.BACKUP_KEY, backupString);
            
            console.log('✅ Backup completed successfully:', {
                size: `${sizeInKB} KB`,
                timestamp: data.timestamp
            });
            
            return true;
        } catch (error) {
            console.error('❌ Error backing up to localStorage:', error);
            return false;
        }
    }
    
    // Restore data from localStorage
    static async restoreFromBackup() {
        try {
            console.log('📥 Restoring from localStorage backup...');
            
            const backupString = localStorage.getItem(this.BACKUP_KEY);
            if (!backupString) {
                console.log('ℹ️ No backup found in localStorage');
                return false;
            }
            
            const backupData = JSON.parse(backupString);
            console.log('📋 Backup data found:', {
                timestamp: backupData.timestamp,
                version: backupData.version,
                users: backupData.users?.length || 0,
                posts: backupData.posts?.length || 0
            });
            
            // Check if backup is newer than current data
            const shouldRestore = await this.shouldRestoreFromBackup(backupData);
            if (!shouldRestore) {
                console.log('ℹ️ Current data is newer than backup, skipping restore');
                return false;
            }
            
            // Clear existing data
            await this.clearAllData();
            
            // Import backup data
            await this.importAllData(backupData);
            
            console.log('✅ Restore completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error restoring from backup:', error);
            return false;
        }
    }
    
    // Import data to IndexedDB
    static async importAllData(data) {
        try {
            console.log('📥 Importing data to IndexedDB...');
            
            const operations = [];
            
            // Import users
            if (data.users?.length > 0) {
                operations.push(...data.users.map(user => Database.addUser(user)));
            }
            
            // Import posts
            if (data.posts?.length > 0) {
                operations.push(...data.posts.map(post => Database.addPost(post)));
            }
            
            // Import comments
            if (data.comments?.length > 0) {
                operations.push(...data.comments.map(comment => Database.addComment(comment)));
            }
            
            // Import friend requests
            if (data.friendRequests?.length > 0) {
                operations.push(...data.friendRequests.map(request => Database.addFriendRequest(request)));
            }
            
            // Import friendships
            if (data.friendships?.length > 0) {
                operations.push(...data.friendships.map(friendship => Database.addFriendship(friendship)));
            }
            
            // Import shared posts
            if (data.sharedPosts?.length > 0) {
                operations.push(...data.sharedPosts.map(sharedPost => Database.addSharedPost(sharedPost)));
            }
            
            // Wait for all operations to complete
            await Promise.all(operations);
            
            console.log('✅ Data import completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Error importing data:', error);
            return false;
        }
    }
    
    // Clear all data from IndexedDB
    static async clearAllData() {
        try {
            console.log('🗑️ Clearing all data from IndexedDB...');
            
            const stores = ['users', 'posts', 'comments', 'friendRequests', 'friendships', 'sharedPosts'];
            const operations = stores.map(store => Database.clear(store));
            
            await Promise.all(operations);
            
            console.log('✅ All data cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Error clearing data:', error);
            return false;
        }
    }
    
    // Check if should restore from backup
    static async shouldRestoreFromBackup(backupData) {
        try {
            // If no current data, restore from backup
            const currentUsers = await Database.getAllUsers();
            if (currentUsers.length === 0) {
                return true;
            }
            
            // If backup is newer, restore
            const backupTime = new Date(backupData.timestamp);
            const currentTime = new Date();
            
            // If backup is from last 24 hours, don't restore (to prevent overwriting recent changes)
            const hoursDiff = (currentTime - backupTime) / (1000 * 60 * 60);
            if (hoursDiff < 24) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error checking restore condition:', error);
            return false;
        }
    }
    
    // Get available localStorage space
    static getAvailableLocalStorageSpace() {
        try {
            const testKey = 'test_space';
            const testData = 'x'.repeat(1024); // 1KB test data
            let totalSize = 0;
            
            // Test localStorage capacity
            try {
                while (true) {
                    localStorage.setItem(testKey + totalSize, testData);
                    totalSize += 1024;
                    if (totalSize > 5 * 1024 * 1024) break; // Stop after 5MB
                }
            } catch (e) {
                // Storage quota exceeded
            }
            
            // Clean up test data
            for (let i = 0; i < totalSize; i += 1024) {
                localStorage.removeItem(testKey + i);
            }
            
            return totalSize;
        } catch (error) {
            console.error('❌ Error checking localStorage space:', error);
            return 0;
        }
    }
    
    // Start auto-backup
    static startAutoBackup() {
        console.log('⏰ Starting auto-backup every 5 minutes...');
        
        setInterval(async () => {
            try {
                await this.backupToLocalStorage();
            } catch (error) {
                console.error('❌ Auto-backup failed:', error);
            }
        }, this.AUTO_BACKUP_INTERVAL);
    }
    
    // Add data change listeners
    static addDataChangeListeners() {
        console.log('👂 Adding data change listeners...');
        
        // Override Database methods to trigger backups
        const originalMethods = {
            addUser: Database.addUser.bind(Database),
            addPost: Database.addPost.bind(Database),
            addComment: Database.addComment.bind(Database),
            addFriendRequest: Database.addFriendRequest.bind(Database),
            addFriendship: Database.addFriendship.bind(Database),
            addSharedPost: Database.addSharedPost.bind(Database),
            deletePost: Database.deletePost.bind(Database),
            deleteFriendRequest: Database.deleteFriendRequest.bind(Database),
            deleteFriendship: Database.deleteFriendship.bind(Database)
        };
        
        // Override methods to trigger backup after changes
        Database.addUser = async (...args) => {
            const result = await originalMethods.addUser(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.addPost = async (...args) => {
            const result = await originalMethods.addPost(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.addComment = async (...args) => {
            const result = await originalMethods.addComment(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.addFriendRequest = async (...args) => {
            const result = await originalMethods.addFriendRequest(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.addFriendship = async (...args) => {
            const result = await originalMethods.addFriendship(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.addSharedPost = async (...args) => {
            const result = await originalMethods.addSharedPost(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.deletePost = async (...args) => {
            const result = await originalMethods.deletePost(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.deleteFriendRequest = async (...args) => {
            const result = await originalMethods.deleteFriendRequest(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        Database.deleteFriendship = async (...args) => {
            const result = await originalMethods.deleteFriendship(...args);
            setTimeout(() => this.backupToLocalStorage(), 1000);
            return result;
        };
        
        console.log('✅ Data change listeners added');
    }
    
    // Manual backup trigger
    static async manualBackup() {
        console.log('🔧 Manual backup triggered...');
        return await this.backupToLocalStorage();
    }
    
    // Manual restore trigger
    static async manualRestore() {
        console.log('🔧 Manual restore triggered...');
        return await this.restoreFromBackup();
    }
    
    // Get backup info
    static getBackupInfo() {
        try {
            const backupString = localStorage.getItem(this.BACKUP_KEY);
            if (!backupString) {
                return null;
            }
            
            const backupData = JSON.parse(backupString);
            const sizeInBytes = new Blob([backupString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return {
                timestamp: backupData.timestamp,
                version: backupData.version,
                size: `${sizeInKB} KB`,
                users: backupData.users?.length || 0,
                posts: backupData.posts?.length || 0,
                comments: backupData.comments?.length || 0,
                friendRequests: backupData.friendRequests?.length || 0,
                friendships: backupData.friendships?.length || 0,
                sharedPosts: backupData.sharedPosts?.length || 0
            };
        } catch (error) {
            console.error('❌ Error getting backup info:', error);
            return null;
        }
    }
    
    // Clear backup
    static clearBackup() {
        try {
            localStorage.removeItem(this.BACKUP_KEY);
            console.log('✅ Backup cleared');
            return true;
        } catch (error) {
            console.error('❌ Error clearing backup:', error);
            return false;
        }
    }
}

// Initialize enhanced persistence when Database is ready
if (typeof window !== 'undefined') {
    // Add initialization after Database.init()
    const originalInit = Database.init.bind(Database);
    Database.init = async () => {
        const result = await originalInit();
        if (result) {
            await EnhancedDatabase.init();
        }
        return result;
    };
    
    // Add global functions for testing
    window.enhancedBackup = () => EnhancedDatabase.manualBackup();
    window.enhancedRestore = () => EnhancedDatabase.manualRestore();
    window.getBackupInfo = () => EnhancedDatabase.getBackupInfo();
    window.clearBackup = () => EnhancedDatabase.clearBackup();
    
    console.log('🔄 Enhanced persistence functions available:');
    console.log('  - window.enhancedBackup() - Manual backup');
    console.log('  - window.enhancedRestore() - Manual restore');
    console.log('  - window.getBackupInfo() - Get backup information');
    console.log('  - window.clearBackup() - Clear backup');
}

} else {
    console.log('🗄️ Database class loaded (non-browser environment)');
}
