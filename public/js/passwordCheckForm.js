
let password_Form = document.getElementById('password-form')
let confirmPassword_Form = document.getElementById('password-form-confirm');
let passMsg_Form = document.querySelector('.password-form-feedback');
let confirmPassMsg_Form = document.querySelector('.password-form-confirm-feedback');

function checkPasswordForm() {
    
    if (password_Form.value.length != 0) {
        if (password_Form.value.length > 5) {
            passMsg_Form.style.display = 'block';
            passMsg_Form.textContent = "Looks good!"
            passMsg_Form.classList.remove('invalid-feedback');
            passMsg_Form.classList.add('valid-feedback');

            if (password_Form.value == confirmPassword_Form.value) {
                console.log("Passwords are matching")
                passMsg_Form.style.display = 'block';
                confirmPassMsg_Form.style.display = 'block'
                confirmPassMsg_Form.textContent = 'Looks good!'
                confirmPassMsg_Form.classList.remove('invalid-feedback')
                confirmPassMsg_Form.classList.add('valid-feedback')
                return
            } 
            
            if (confirmPassword_Form.value.length == 0) {
                console.log('type your password')
                console.log(confirmPassword.value.length)
                confirmPassMsg_Form.style.display = 'block';
                confirmPassMsg_Form.classList.remove('valid-feedback')
                confirmPassMsg_Form.classList.add('invalid-feedback')
                confirmPassMsg_Form.textContent = 'Confirm your password!'
            } else {
                console.log("Passwords are not matching")
                // passMsg_Form.style.display = 'none';
                confirmPassMsg_Form.style.display = 'block';
                confirmPassMsg_Form.classList.remove('valid-feedback')
                confirmPassMsg_Form.classList.add('invalid-feedback')
                confirmPassMsg_Form.textContent = 'Passwords are not matching!'
            }
        } else {
            passMsg_Form.textContent = "Your password must be at least 6 characters."
            passMsg_Form.classList.add('invalid-feedback');
            passMsg_Form.style.display = 'block';
        }

    }
}

[password_Form, confirmPassword_Form].forEach(el => {
    el.addEventListener('change', checkPasswordForm)
})



password_Form.addEventListener('change', function() {
    confirmPassword_Form.value = "";
})

password_Form.addEventListener("keydown", function(e) {
    passMsg_Form.style.display = 'none';

    if (event.which === 8) {
        confirmPassMsg_Form.style.display = 'none';
        password_Form.value = "";
        confirmPassword_Form.value = "";
    }
})