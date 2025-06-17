// Database reset utility
// This script can be executed from the browser console to reset the IndexedDB database
// when schema changes are needed

/**
 * Reset the StoryboardAI IndexedDB database
 * Call this function from the browser console when schema changes are needed
 */
export function resetDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('StoryboardAI');
    
    req.onsuccess = function() {
      console.log('🗑️ Database deleted successfully');
      localStorage.removeItem('storyboard_current_project');
      localStorage.removeItem('storyboard_projects');
      console.log('🧹 Local storage keys cleared');
      resolve(true);
    };
    
    req.onerror = function() {
      console.error('❌ Could not delete database');
      reject(new Error('Could not delete database'));
    };
    
    req.onblocked = function() {
      console.warn('⚠️ Database deletion was blocked - close other tabs that might be using it');
      reject(new Error('Database deletion was blocked'));
    };
  });
}

// Execute in browser console:
// import('/src/utils/dbReset.js').then(module => module.resetDatabase()).then(() => location.reload())

// Or for production build:
// fetch('/assets/dbReset.js').then(r => r.text()).then(code => eval(code)).then(() => resetDatabase()).then(() => location.reload())
