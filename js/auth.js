// إدارة المصادقة
function isAdminLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

function loginAdmin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('adminLoggedIn', 'true');
        return true;
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
}
