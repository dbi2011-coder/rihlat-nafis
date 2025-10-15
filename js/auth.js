// إدارة المصادقة
function isAdminLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

function loginAdmin(username, password) {
    if (username === 'عاصم البيشي' && password === '123') {
        localStorage.setItem('adminLoggedIn', 'true');
        return true;
    }
    return false;
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
}

