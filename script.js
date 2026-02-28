// DOM Elements
const postInput = document.querySelector('.post-input');
const postOptions = document.querySelectorAll('.post-option');
const actionButtons = document.querySelectorAll('.action-btn');
const addFriendButtons = document.querySelectorAll('.add-friend-btn');
const navLinks = document.querySelectorAll('.nav-link');
const menuItems = document.querySelectorAll('.menu-item');

// Load current user from localStorage
function loadCurrentUser() {
    const userData = localStorage.getItem('socializers_current_user');
    if (userData) {
        const user = JSON.parse(userData);
        return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar
        };
    }
    // Fallback to demo user
    return {
        id: 1,
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        avatar: 'https://picsum.photos/seed/user1/50/50'
    };
}

let currentUser = loadCurrentUser();

let posts = [
    {
        id: 1,
        author: 'Jane Smith',
        avatar: 'https://picsum.photos/seed/user2/50/50',
        content: 'Just had an amazing day at the beach! The weather was perfect and the sunset was breathtaking. 🌅',
        image: 'https://picsum.photos/seed/beach/600/400',
        likes: 124,
        comments: 23,
        shares: 5,
        time: '2 hours ago',
        liked: false,
        shared: false
    },
    {
        id: 2,
        author: 'Mike Johnson',
        avatar: 'https://picsum.photos/seed/user3/50/50',
        content: 'Excited to announce that I just started my new job as a Software Engineer at TechCorp! 🚀',
        image: null,
        likes: 89,
        comments: 15,
        shares: 3,
        time: '5 hours ago',
        liked: false,
        shared: false
    }
];

// Shared posts storage
let sharedPosts = JSON.parse(localStorage.getItem('socializers_shared_posts')) || [];

// Load user posts from localStorage
function loadUserPosts() {
    const savedPosts = localStorage.getItem('socializers_user_posts');
    if (savedPosts) {
        const userPosts = JSON.parse(savedPosts);
        // Merge with default posts, avoiding duplicates
        userPosts.forEach(savedPost => {
            if (!posts.find(p => p.id === savedPost.id)) {
                posts.push(savedPost);
            }
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateUIWithCurrentUser();
    loadUserPosts();
    initializeEventListeners();
    loadPosts();
});

// Update UI with current user data
function updateUIWithCurrentUser() {
    // Update navigation profile
    const navProfileImg = document.querySelector('.nav-profile img');
    const navProfileName = document.querySelector('.nav-profile span');
    const postProfileImg = document.querySelector('.post-profile-img');
    const postInput = document.querySelector('.post-input');
    
    if (navProfileImg) navProfileImg.src = currentUser.avatar;
    if (navProfileName) navProfileName.textContent = currentUser.name;
    if (postProfileImg) postProfileImg.src = currentUser.avatar;
    if (postInput) postInput.placeholder = `What's on your mind, ${currentUser.firstName}?`;
    
    // Update post input blur event
    if (postInput) {
        postInput.addEventListener('blur', function() {
            this.placeholder = `What's on your mind, ${currentUser.firstName}?`;
        });
    }
    
    // Update profile card in right sidebar
    const profileCardImg = document.querySelector('.profile-card-img');
    const profileCardName = document.querySelector('.profile-card h3');
    
    if (profileCardImg) profileCardImg.src = currentUser.avatar;
    if (profileCardName) profileCardName.textContent = currentUser.name;
}

// Event Listeners
function initializeEventListeners() {
    // Post input click to open creation modal
    if (postInput) {
        postInput.addEventListener('click', function() {
            showCreatePostModal();
        });
        
        postInput.addEventListener('focus', function() {
            this.placeholder = "Share your thoughts with the world...";
        });
    }
    
    // Post options
    postOptions.forEach(option => {
        option.addEventListener('click', handlePostOption);
    });
    
    // Action buttons (like, comment, share)
    actionButtons.forEach(button => {
        button.addEventListener('click', handleAction);
    });
    
    // Add friend buttons
    addFriendButtons.forEach(button => {
        button.addEventListener('click', handleAddFriend);
    });
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Menu items
    menuItems.forEach(item => {
        item.addEventListener('click', handleMenuNavigation);
    });
}

// Show create post modal
function showCreatePostModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
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
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">Create Post</h2>
            <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <img src="${currentUser.avatar}" alt="${currentUser.name}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
            <div>
                <strong>${currentUser.name}</strong>
                <p style="margin: 0; color: #65676b; font-size: 14px;">
                    <i class="fas fa-globe"></i> Public
                </p>
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <textarea id="postContent" placeholder="What's on your mind, ${currentUser.firstName}?" style="width: 100%; min-height: 120px; padding: 15px; border: none; outline: none; font-size: 16px; resize: vertical; font-family: inherit;"></textarea>
        </div>
        
        <div style="border: 1px solid #e4e6eb; border-radius: 8px; padding: 10px; margin-bottom: 15px;">
            <div style="display: flex; gap: 10px; align-items: center;">
                <i class="fas fa-image" style="color: #42b72a;"></i>
                <span>Add photos/videos</span>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 10px;">
                <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f2f5'" onmouseout="this.style.backgroundColor='transparent'">
                    <i class="fas fa-image" style="color: #42b72a;"></i>
                </button>
                <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f2f5'" onmouseout="this.style.backgroundColor='transparent'">
                    <i class="fas fa-user-tag" style="color: #1877f2;"></i>
                </button>
                <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f2f5'" onmouseout="this.style.backgroundColor='transparent'">
                    <i class="fas fa-smile" style="color: #f0b429;"></i>
                </button>
                <button style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f0f2f5'" onmouseout="this.style.backgroundColor='transparent'">
                    <i class="fas fa-map-marker-alt" style="color: #f5533d;"></i>
                </button>
            </div>
            
            <button id="postButton" onclick="createPost(this)" style="padding: 8px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#166fe5'" onmouseover="this.style.backgroundColor='#1877f2'">
                Post
            </button>
        </div>
    `;
    
    modalOverlay.className = 'modal-overlay';
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Focus on textarea
    setTimeout(() => {
        document.getElementById('postContent').focus();
    }, 100);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
    
    // Handle Enter key to post
    document.getElementById('postContent').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            createPost(document.getElementById('postButton'));
        }
    });
}

// Create post function
function createPost(button) {
    const content = document.getElementById('postContent').value.trim();
    
    if (!content) {
        showNotification('Please write something before posting!');
        return;
    }
    
    // Create new post
    const newPost = {
        id: Date.now(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        content: content,
        image: null,
        likes: 0,
        comments: 0,
        shares: 0,
        time: 'Just now',
        liked: false,
        shared: false
    };
    
    // Add to posts array (at beginning)
    posts.unshift(newPost);
    
    // Save to localStorage
    localStorage.setItem('socializers_user_posts', JSON.stringify(posts));
    
    // Close modal
    button.closest('.modal-overlay').remove();
    
    // Show success notification
    showNotification('Post published successfully!');
    
    // Reload posts to show the new post
    loadPosts();
}
function handlePostOption(e) {
    const option = e.currentTarget;
    const optionText = option.textContent.trim();
    
    switch(optionText) {
        case 'Live Video':
            showNotification('Live video feature coming soon!');
            break;
        case 'Photo/Video':
            showNotification('Photo upload feature coming soon!');
            break;
        case 'Feeling/Activity':
            showNotification('Feeling feature coming soon!');
            break;
    }
}

// Handle post actions (like, comment, share)
function handleAction(e) {
    const button = e.currentTarget;
    const action = button.textContent.trim();
    const post = button.closest('.post');
    
    switch(action) {
        case 'Like':
            handleLike(button, post);
            break;
        case 'Comment':
            handleComment(post);
            break;
        case 'Share':
            handleShare(post);
            break;
    }
}

// Handle like functionality
function handleLike(button) {
    const post = button.closest('.post');
    const icon = button.querySelector('i');
    const statsContainer = post.querySelector('.post-stats');
    const likesSpan = statsContainer.querySelector('span');
    
    if (icon.classList.contains('fas')) {
        // Unlike
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.style.color = '#65676b';
        updateLikesCount(likesSpan, -1);
    } else {
        // Like
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.style.color = '#1877f2';
        updateLikesCount(likesSpan, 1);
        
        // Add animation
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);
    }
}

// Update likes count
function updateLikesCount(likesSpan, change) {
    const currentText = likesSpan.textContent;
    const currentCount = parseInt(currentText.match(/\d+/)[0]);
    const newCount = Math.max(0, currentCount + change);
    likesSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${newCount}`;
}

// Handle comment
function handleComment(post) {
    const commentSection = post.querySelector('.comments-section');
    if (commentSection) {
        commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
    } else {
        createCommentSection(post);
    }
}

// Create comment section
function createCommentSection(post) {
    const commentSection = document.createElement('div');
    commentSection.className = 'comments-section';
    commentSection.style.cssText = 'padding: 15px; border-top: 1px solid #e4e6eb; display: block;';
    
    commentSection.innerHTML = `
        <div class="comment-input-area" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <img src="${currentUser.avatar}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%;">
            <input type="text" placeholder="Write a comment..." class="comment-input" style="flex: 1; padding: 8px 12px; border: 1px solid #e4e6eb; border-radius: 18px; outline: none;">
        </div>
        <div class="comments-list" style="margin-top: 10px;">
            <p style="color: #65676b; font-size: 14px;">No comments yet. Be the first to comment!</p>
        </div>
    `;
    
    post.appendChild(commentSection);
    
    // Focus on comment input
    const commentInput = commentSection.querySelector('.comment-input');
    commentInput.focus();
    
    // Handle comment submission
    commentInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitComment(this, commentSection);
        }
    });
}

// Submit comment
function submitComment(input, commentSection) {
    const commentText = input.value.trim();
    if (commentText) {
        const commentsList = commentSection.querySelector('.comments-list');
        const comment = document.createElement('div');
        comment.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; padding: 8px 0;';
        
        comment.innerHTML = `
            <img src="${currentUser.avatar}" alt="Profile" style="width: 32px; height: 32px; border-radius: 50%;">
            <div style="flex: 1;">
                <div style="background-color: #f0f2f5; padding: 8px 12px; border-radius: 18px;">
                    <strong>${currentUser.name}</strong>
                    <p style="margin: 4px 0 0 0; font-size: 14px;">${commentText}</p>
                </div>
                <div style="font-size: 12px; color: #65676b; margin-top: 4px;">
                    <span>Just now</span>
                    <button style="background: none; border: none; color: #65676b; margin-left: 10px; cursor: pointer;">Like</button>
                    <button style="background: none; border: none; color: #65676b; margin-left: 10px; cursor: pointer;">Reply</button>
                </div>
            </div>
        `;
        
        if (commentsList.querySelector('p')) {
            commentsList.innerHTML = '';
        }
        
        commentsList.appendChild(comment);
        input.value = '';
        
        // Update comment count
        const post = commentSection.closest('.post');
        const statsContainer = post.querySelector('.post-stats');
        const commentsSpan = statsContainer.querySelectorAll('span')[1];
        const currentCount = parseInt(commentsSpan.textContent.match(/\d+/)[0]);
        commentsSpan.innerHTML = `<i class="fas fa-comment"></i> ${currentCount + 1}`;
    }
}

// Handle share
function handleShare(post) {
    const postId = parseInt(post.dataset.postId);
    const originalPost = posts.find(p => p.id === postId);
    
    if (!originalPost) return;
    
    // Check if already shared
    if (originalPost.shared) {
        showNotification('You have already shared this post!');
        return;
    }
    
    // Create share modal
    showShareModal(originalPost);
}

// Show share modal
function showShareModal(post) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
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
    
    // Create modal content
    const modalContent = document.createElement('div');
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
            <h2 style="margin: 0;">Share Post</h2>
            <button onclick="this.closest('.modal-overlay').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
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
        
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="this.closest('.modal-overlay').remove()" style="padding: 10px 20px; border: 1px solid #dddfe2; background: white; border-radius: 6px; cursor: pointer;">Cancel</button>
            <button onclick="confirmShare(${post.id}, this)" style="padding: 10px 20px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer;">Share Post</button>
        </div>
    `;
    
    modalOverlay.className = 'modal-overlay';
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            modalOverlay.remove();
        }
    });
}

// Confirm share
function confirmShare(postId, button) {
    const shareComment = document.getElementById('shareComment').value.trim();
    const originalPost = posts.find(p => p.id === postId);
    
    if (!originalPost) return;
    
    // Create shared post
    const sharedPost = {
        id: Date.now(),
        originalPostId: postId,
        sharedBy: currentUser.name,
        sharedByAvatar: currentUser.avatar,
        originalAuthor: originalPost.author,
        originalAvatar: originalPost.avatar,
        originalContent: originalPost.content,
        originalImage: originalPost.image,
        originalTime: originalPost.time,
        shareComment: shareComment,
        shareTime: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false
    };
    
    // Add to shared posts
    sharedPosts.unshift(sharedPost);
    localStorage.setItem('socializers_shared_posts', JSON.stringify(sharedPosts));
    
    // Update original post
    originalPost.shared = true;
    originalPost.shares++;
    
    // Close modal
    button.closest('.modal-overlay').remove();
    
    // Show success notification
    showNotification('Post shared successfully!');
    
    // Reload posts to show the shared post
    loadPosts();
}

// Handle add friend
function handleAddFriend(e) {
    const button = e.currentTarget;
    
    if (button.textContent === 'Add Friend') {
        button.textContent = 'Friend Request Sent';
        button.style.backgroundColor = '#e4e6eb';
        button.style.color = '#1c1e21';
        showNotification('Friend request sent!');
    } else if (button.textContent === 'Friend Request Sent') {
        button.textContent = 'Cancel Request';
        button.style.backgroundColor = '#e4e6eb';
        button.style.color = '#1c1e21';
    } else if (button.textContent === 'Cancel Request') {
        button.textContent = 'Add Friend';
        button.style.backgroundColor = '#1877f2';
        button.style.color = 'white';
        showNotification('Friend request cancelled');
    }
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const link = e.currentTarget;
    
    // Remove active class from all links
    navLinks.forEach(l => l.classList.remove('active'));
    
    // Add active class to clicked link
    link.classList.add('active');
    
    const iconClass = link.querySelector('i').className;
    
    // Navigate based on icon
    if (iconClass.includes('fa-home')) {
        window.location.href = 'index.html';
    } else if (iconClass.includes('fa-user-friends')) {
        showNotification('Friends page coming soon!');
    } else if (iconClass.includes('fa-bell')) {
        showNotification('Notifications coming soon!');
    } else if (iconClass.includes('fa-envelope')) {
        showNotification('Messages coming soon!');
    } else {
        showNotification(`Navigating to ${iconClass} section`);
    }
}

// Handle menu navigation
function handleMenuNavigation(e) {
    e.preventDefault();
    const item = e.currentTarget;
    
    // Remove active class from all items
    menuItems.forEach(i => i.classList.remove('active'));
    
    // Add active class to clicked item
    item.classList.add('active');
    
    const itemText = item.textContent.trim();
    
    // Navigate based on menu item
    if (itemText.includes('Home')) {
        window.location.href = 'index.html';
    } else if (itemText.includes('Profile')) {
        window.location.href = 'profile.html';
    } else if (itemText.includes('Friends')) {
        showNotification('Friends page coming soon!');
    } else if (itemText.includes('Photos')) {
        showNotification('Photos page coming soon!');
    } else if (itemText.includes('Videos')) {
        showNotification('Videos page coming soon!');
    } else if (itemText.includes('Events')) {
        showNotification('Events page coming soon!');
    } else if (itemText.includes('Games')) {
        showNotification('Games page coming soon!');
    } else {
        showNotification(`Loading ${itemText} page`);
    }
}

// Show profile menu
function showProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu.style.display === 'none') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

// Go to profile
function goToProfile() {
    window.location.href = 'profile.html';
    document.getElementById('profileMenu').style.display = 'none';
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('socializers_current_user');
        window.location.href = 'login.html';
    }
    document.getElementById('profileMenu').style.display = 'none';
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    const profileMenu = document.getElementById('profileMenu');
    const navProfile = document.querySelector('.nav-profile');
    
    if (profileMenu && navProfile && !navProfile.contains(e.target)) {
        profileMenu.style.display = 'none';
    }
});

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: #333;
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
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Load posts (for future dynamic loading)
function loadPosts() {
    const postsFeed = document.querySelector('.posts-feed');
    if (!postsFeed) return;
    
    // Clear existing posts
    postsFeed.innerHTML = '';
    
    // Combine original posts and shared posts
    const allPosts = [...sharedPosts, ...posts];
    
    // Sort posts: user posts first, then shared posts, then others
    allPosts.sort((a, b) => {
        // User posts (current user) come first
        const aIsUserPost = a.author === currentUser.name && !a.originalPostId;
        const bIsUserPost = b.author === currentUser.name && !b.originalPostId;
        
        if (aIsUserPost && !bIsUserPost) return -1;
        if (!aIsUserPost && bIsUserPost) return 1;
        
        // Shared posts come next
        const aIsShared = !!a.originalPostId;
        const bIsShared = !!b.originalPostId;
        
        if (aIsShared && !bIsShared) return -1;
        if (!aIsShared && bIsShared) return 1;
        
        // For same type, sort by time (newest first)
        if (a.time === 'Just now' && b.time !== 'Just now') return -1;
        if (a.time !== 'Just now' && b.time === 'Just now') return 1;
        
        return 0; // Keep original order for demo
    });
    
    // Render each post
    allPosts.forEach(post => {
        if (post.originalPostId) {
            // This is a shared post
            renderSharedPost(post, postsFeed);
        } else {
            // This is an original post
            renderOriginalPost(post, postsFeed);
        }
    });
    
    // Add data attributes to existing posts for share functionality
    document.querySelectorAll('.post').forEach((postElement, index) => {
        const post = allPosts[index];
        if (post && !post.originalPostId) {
            postElement.dataset.postId = post.id;
        }
    });
    
    console.log('Posts loaded successfully');
}

// Render original post
function renderOriginalPost(post, container) {
    const postElement = document.createElement('article');
    postElement.className = 'post';
    postElement.dataset.postId = post.id;
    
    postElement.innerHTML = `
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
            <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="handleLike(this)">
                <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like
            </button>
            <button class="action-btn" onclick="handleComment(this.closest('.post'))">
                <i class="fas fa-comment"></i> Comment
            </button>
            <button class="action-btn" onclick="handleShare(this.closest('.post'))">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
    `;
    
    container.appendChild(postElement);
}

// Render shared post
function renderSharedPost(post, container) {
    const postElement = document.createElement('article');
    postElement.className = 'post shared-post';
    
    postElement.innerHTML = `
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
            <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="handleLike(this)">
                <i class="${post.liked ? 'fas' : 'far'} fa-thumbs-up"></i> Like
            </button>
            <button class="action-btn" onclick="handleComment(this.closest('.post'))">
                <i class="fas fa-comment"></i> Comment
            </button>
            <button class="action-btn" onclick="handleShare(this.closest('.post'))">
                <i class="fas fa-share"></i> Share
            </button>
        </div>
    `;
    
    container.appendChild(postElement);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Search functionality
const searchInput = document.querySelector('.nav-search input');
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    if (query.length > 2) {
        // In a real app, this would trigger a search API call
        console.log('Searching for:', query);
    }
});

// Story interactions
const storyItems = document.querySelectorAll('.story-item:not(.create-story)');
storyItems.forEach(story => {
    story.addEventListener('click', function() {
        const authorName = this.querySelector('span').textContent;
        showNotification(`Viewing ${authorName}'s story`);
    });
});

// Create story functionality
const createStory = document.querySelector('.create-story');
createStory.addEventListener('click', function() {
    showNotification('Create story feature coming soon! You\'ll be able to share photos and videos that disappear after 24 hours.');
});

// Post menu functionality
const postMenus = document.querySelectorAll('.post-menu');
postMenus.forEach(menu => {
    menu.addEventListener('click', function(e) {
        e.stopPropagation();
        showNotification('Post options menu coming soon! You\'ll be able to edit, delete, or report posts.');
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        searchInput.blur();
        searchInput.value = '';
    }
});

// Auto-save draft functionality
let postDraft = '';
setInterval(() => {
    if (postInput.value && postInput.value !== postDraft) {
        postDraft = postInput.value;
        console.log('Draft saved:', postDraft);
    }
}, 5000);
