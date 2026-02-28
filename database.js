// ============================================================================
// DATABASE CLASS - SQL Database Management
// ============================================================================
console.log('🗄️ Database.js loaded');
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
                this.createObjectStores();
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                console.log('🔄 Database upgrade needed');
                this.db = event.target.result;
                this.createObjectStores();
            };
        });
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
            sharedPostStore.createIndex('time', 'time');
            console.log('✅ Shared posts store created');
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
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data, id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
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

    static async updatePost(postData) {
        return this.update('posts', postData);
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
