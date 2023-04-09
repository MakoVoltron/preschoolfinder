document.addEventListener('submit', submitForm);
function submitForm(e) {
    const form = e.target;
    
    if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation()
    } else {
        e.target.submit()
    }
    form.classList.add('was-validated')
}