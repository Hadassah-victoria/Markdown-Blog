// Global variables
let posts = [];
let currentPost = null;

// DOM elements
const coverPage = document.getElementById('coverPage');
const mainApp = document.getElementById('mainApp');
const postsList = document.getElementById('postsList');
const titleInput = document.getElementById('titleInput');
const editorTextarea = document.getElementById('editorTextarea');
const previewContent = document.getElementById('previewContent');

// Start the application
function startApp() {
    coverPage.style.display = 'none';
    mainApp.style.display = 'block';
    loadPosts();
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Auto-save and preview update
    titleInput.addEventListener('input', updatePreview);
    editorTextarea.addEventListener('input', updatePreview);

    // Debounce the auto-save
    let saveTimeout;
    function debouncedSave() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (currentPost) {
                saveCurrentPost();
            }
        }, 2000);
    }

    titleInput.addEventListener('input', debouncedSave);
    editorTextarea.addEventListener('input', debouncedSave);
}

// Load posts from localStorage
function loadPosts() {
    const savedPosts = localStorage.getItem('markdown-blog-posts');
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
    }
    renderPostsList();
}

// Save posts to localStorage
function savePosts() {
    localStorage.setItem('markdown-blog-posts', JSON.stringify(posts));
}

// Render posts list
function renderPostsList() {
    if (posts.length === 0) {
        postsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <p>No posts yet</p>
                        <small>Start writing your first blog post!</small>
                    </div>
                `;
        return;
    }

    postsList.innerHTML = posts.map(post => `
                <div class="post-item ${currentPost && currentPost.id === post.id ? 'active' : ''}" 
                     onclick="loadPost('${post.id}')">
                    <div class="post-title">${post.title || 'Untitled Post'}</div>
                    <div class="post-meta">
                        <span>${formatDate(post.updatedAt)}</span>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePost(event, '${post.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

// Create new post
function createNewPost() {
    currentPost = null;
    titleInput.value = '';
    editorTextarea.value = '';
    updatePreview();
    renderPostsList();
}

// Load a post
function loadPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        currentPost = post;
        titleInput.value = post.title;
        editorTextarea.value = post.content;
        updatePreview();
        renderPostsList();
    }
}

// Save current post
function saveCurrentPost(event) {
    const title = titleInput.value.trim();
    const content = editorTextarea.value;

    if (!title) {
        alert('Please enter a title for your post.');
        return;
    }

    const now = new Date().toISOString();

    if (currentPost) {
        // Update existing post
        currentPost.title = title;
        currentPost.content = content;
        currentPost.updatedAt = now;
    } else {
        // Create new post
        currentPost = {
            id: Date.now().toString(),
            title: title,
            content: content,
            createdAt: now,
            updatedAt: now
        };
        posts.push(currentPost);
    }

    savePosts();
    renderPostsList();

     // Show success message (safely)
    if (event && event.target) {
        const btn = event.target.closest('button');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
            }, 2000);
        }
    }
}




// Delete post
function deletePost(event, postId) {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this post?')) {
        posts = posts.filter(p => p.id !== postId);
        savePosts();

        if (currentPost && currentPost.id === postId) {
            createNewPost();
        } else {
            renderPostsList();
        }
    }
}

// Update preview
function updatePreview() {
    const title = titleInput.value;
    const content = editorTextarea.value;

    if (!title && !content) {
        previewContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-eye"></i>
                        <p>Preview will appear here</p>
                        <small>Start typing in the editor to see your markdown rendered</small>
                    </div>
                `;
        return;
    }

    let html = '';

    if (title) {
        html += `<h1 class="border-bottom pb-2 mb-4">${DOMPurify.sanitize(title)}</h1>`;
    }

    if (content) {
        try {
            const markdownHtml = marked.parse(content);
            html += DOMPurify.sanitize(markdownHtml);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            html += '<p class="text-danger">Error rendering markdown</p>';
        }
    }

    previewContent.innerHTML = `<div class="markdown-content">${html}</div>`;
}

// Initialize marked options
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}